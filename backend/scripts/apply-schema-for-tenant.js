const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const tenantId = process.argv[2]
if (!tenantId) {
  console.error('Missing tenantId argument')
  process.exit(1)
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

;(async () => {
  const client = await pool.connect()
  try {
    await client.query(`SET search_path TO "${tenantId}"`)
    const patientSql = fs.readFileSync(path.join(__dirname, '../migrations/schemas/patient-schema.sql'), 'utf8')
    await client.query(patientSql)
    const medSql = fs.readFileSync(path.join(__dirname, '../migrations/create-medical-records-schema.sql'), 'utf8')
    await client.query(medSql)
    const labSql = fs.readFileSync(path.join(__dirname, '../migrations/create-lab-tests-schema.sql'), 'utf8')
    await client.query(labSql)
    console.log(`Applied schemas to ${tenantId}`)
    process.exit(0)
  } catch (e) {
    console.error(e)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
})()
