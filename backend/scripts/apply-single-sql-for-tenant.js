const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const tenantId = process.argv[2]
const sqlPath = process.argv[3]
if (!tenantId || !sqlPath) {
  console.error('Usage: node apply-single-sql-for-tenant.js <tenantId> <relative-sql-path>')
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
    const sql = fs.readFileSync(path.join(__dirname, '..', sqlPath), 'utf8')
    await client.query(sql)
    console.log(`Applied ${sqlPath} to ${tenantId}`)
    process.exit(0)
  } catch (e) {
    console.error(e)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
})()
