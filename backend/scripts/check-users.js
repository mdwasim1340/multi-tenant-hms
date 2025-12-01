require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function checkUsers() {
  try {
    const result = await pool.query('SELECT email, name, tenant_id FROM users LIMIT 10');
    console.log('Users in database:');
    result.rows.forEach(row => {
      console.log(`  ${row.email} - ${row.name} - ${row.tenant_id}`);
    });
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

checkUsers();
