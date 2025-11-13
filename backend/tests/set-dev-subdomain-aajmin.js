require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT || 5432),
})

async function run() {
  const client = await pool.connect()
  try {
    console.log('🔧 Setting subdomain for Aajmin Polyclinic...')
    const find = await client.query(
      `SELECT id, name FROM public.tenants 
       WHERE LOWER(name) LIKE '%aajmin%polyclinic%' OR id LIKE 'aajmin%'
       ORDER BY id LIMIT 1`
    )
    if (find.rows.length === 0) {
      console.log('❌ Tenant not found. Please create tenant first.')
      return
    }
    const tenant = find.rows[0]
    const sub = 'aajminpolyclinic'
    await client.query(
      'UPDATE public.tenants SET subdomain = $1 WHERE id = $2',
      [sub, tenant.id]
    )
    console.log(`✅ Updated tenant '${tenant.name}' (${tenant.id}) with subdomain '${sub}'`)
  } catch (e) {
    console.error('❌ Failed to set subdomain:', e.message)
  } finally {
    client.release()
    await pool.end()
  }
}

run()
