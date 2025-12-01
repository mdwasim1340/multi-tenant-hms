require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function check() {
  try {
    // Check invoices by tenant
    const invoices = await pool.query(`
      SELECT tenant_id, COUNT(*) as count, SUM(amount) as total 
      FROM invoices 
      GROUP BY tenant_id
    `);
    console.log('Invoices by tenant:');
    invoices.rows.forEach(row => {
      console.log(`  ${row.tenant_id}: ${row.count} invoices, total: ${row.total}`);
    });

    // Check users by tenant
    console.log('\nUsers by tenant:');
    const users = await pool.query(`
      SELECT tenant_id, COUNT(*) as count 
      FROM users 
      GROUP BY tenant_id
    `);
    users.rows.forEach(row => {
      console.log(`  ${row.tenant_id}: ${row.count} users`);
    });

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

check();
