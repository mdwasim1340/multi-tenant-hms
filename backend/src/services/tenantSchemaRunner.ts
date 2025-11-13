import pool from '../database'
import { createHash, randomBytes, createCipheriv } from 'crypto'
import fs from 'fs'
import path from 'path'

const files = [
  { file: 'migrations/schemas/patient-schema.sql', version: '1.0.0' },
  { file: 'migrations/schemas/appointment-schema.sql', version: '1.0.0' },
  { file: 'migrations/create-medical-records-schema.sql', version: '1.0.0' },
  { file: 'migrations/create-lab-tests-schema.sql', version: '1.0.0' },
]

const disallowedPatterns = [
  /DROP\s+SCHEMA/i,
  /ALTER\s+SYSTEM/i,
  /COPY\s+/i,
  /UNION\s+SELECT/i,
]

const whitelistDirs = ['migrations', 'migrations/schemas']

const ensureAuditTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.tenant_schema_audit (
      id SERIAL PRIMARY KEY,
      tenant_id VARCHAR(255) NOT NULL,
      schema_name VARCHAR(255) NOT NULL,
      file_name VARCHAR(500) NOT NULL,
      version VARCHAR(50) NOT NULL,
      checksum VARCHAR(128) NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(20) NOT NULL,
      error_encrypted BYTEA
    )
  `)
}

const sha256 = (input: string) => createHash('sha256').update(input).digest('hex')

const validateSql = (sql: string) => {
  for (const p of disallowedPatterns) {
    if (p.test(sql)) return false
  }
  return true
}

const encrypt = (text: string) => {
  const keyHex = process.env.SCHEMA_AUDIT_KEY || ''
  const key = Buffer.from(keyHex.padEnd(64, '0').slice(0, 64), 'hex')
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key.slice(0, 32), iv)
  const enc = Buffer.concat([cipher.update(Buffer.from(text, 'utf8')), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc])
}

const hasSuccessAudit = async (tenantId: string, fileName: string, version: string, checksum: string) => {
  const r = await pool.query(
    'SELECT 1 FROM public.tenant_schema_audit WHERE tenant_id=$1 AND file_name=$2 AND version=$3 AND checksum=$4 AND status=$5 LIMIT 1',
    [tenantId, fileName, version, checksum, 'success']
  )
  return r.rows.length > 0
}

const recordAudit = async (
  tenantId: string,
  schemaName: string,
  fileName: string,
  version: string,
  checksum: string,
  status: string,
  errorEncrypted?: Buffer
) => {
  await pool.query(
    'INSERT INTO public.tenant_schema_audit (tenant_id, schema_name, file_name, version, checksum, status, error_encrypted) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [tenantId, schemaName, fileName, version, checksum, status, errorEncrypted || null]
  )
}

export const runSchemaInitialization = async (tenantId: string) => {
  await ensureAuditTable()
  const client = await pool.connect()
  const results: Array<{ file: string; version: string; status: string; message?: string }> = []
  try {
    for (const f of files) {
      const rel = f.file.replace(/\\/g, '/')
      const dir = rel.split('/').slice(0, -1).join('/')
      if (!whitelistDirs.includes(dir)) {
        results.push({ file: f.file, version: f.version, status: 'skipped', message: 'Not whitelisted' })
        continue
      }
      const sqlPath = path.resolve(process.cwd(), rel)
      const sql = fs.readFileSync(sqlPath, 'utf8')
      const checksum = sha256(sql)
      const already = await hasSuccessAudit(tenantId, f.file, f.version, checksum)
      if (already) {
        results.push({ file: f.file, version: f.version, status: 'skipped', message: 'Already applied' })
        continue
      }
      if (!validateSql(sql)) {
        const enc = encrypt('validation_failed')
        await recordAudit(tenantId, tenantId, f.file, f.version, checksum, 'failure', enc)
        results.push({ file: f.file, version: f.version, status: 'failed', message: 'Validation failed' })
        continue
      }
      await client.query('BEGIN')
      try {
        await client.query(`SET search_path TO "${tenantId}"`)
        await client.query(sql)
        await client.query('COMMIT')
        await recordAudit(tenantId, tenantId, f.file, f.version, checksum, 'success')
        results.push({ file: f.file, version: f.version, status: 'success' })
      } catch (e: any) {
        await client.query('ROLLBACK')
        const msg = String(e && e.message ? e.message : '')
        if (msg.toLowerCase().includes('already exists')) {
          await recordAudit(tenantId, tenantId, f.file, f.version, checksum, 'success')
          results.push({ file: f.file, version: f.version, status: 'skipped', message: 'Already applied' })
        } else {
          const enc = encrypt(msg || 'error')
          await recordAudit(tenantId, tenantId, f.file, f.version, checksum, 'failure', enc)
          results.push({ file: f.file, version: f.version, status: 'failed', message: msg || 'Execution failed' })
        }
      }
    }
    return results
  } finally {
    client.release()
  }
}

const rollbackMap: Record<string, string[]> = {
  'migrations/schemas/patient-schema.sql': ['patient_files', 'custom_field_values', 'patients'],
  'migrations/schemas/appointment-schema.sql': ['appointment_reminders', 'doctor_time_off', 'doctor_schedules', 'appointments'],
  'migrations/create-medical-records-schema.sql': ['prescriptions', 'treatments', 'diagnoses', 'medical_records'],
  'migrations/create-lab-tests-schema.sql': ['lab_results', 'lab_tests', 'imaging_studies', 'lab_panels'],
}

export const rollbackSchemaFile = async (tenantId: string, fileName: string) => {
  const client = await pool.connect()
  try {
    const tables = rollbackMap[fileName] || []
    await client.query('BEGIN')
    await client.query(`SET search_path TO "${tenantId}"`)
    for (const t of tables) {
      await client.query(`DROP TABLE IF EXISTS ${t} CASCADE`)
    }
    await client.query('COMMIT')
    return { success: true, dropped: tables }
  } catch (e) {
    await client.query('ROLLBACK')
    return { success: false }
  } finally {
    client.release()
  }
}
