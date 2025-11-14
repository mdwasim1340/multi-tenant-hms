/**
 * List all users in the database
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function listUsers() {
  try {
    console.log('📋 Listing all users in the database...\n');

    const result = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.tenant_id,
        t.name as tenant_name,
        u.status,
        u.created_at
      FROM users u
      LEFT JOIN tenants t ON u.tenant_id = t.id
      ORDER BY u.created_at DESC
    `);

    if (result.rows.length === 0) {
      console.log('No users found in the database.');
      return;
    }

    console.log(`Found ${result.rows.length} users:\n`);
    console.log('─'.repeat(120));
    console.log(
      'ID'.padEnd(5) +
      'Name'.padEnd(25) +
      'Email'.padEnd(35) +
      'Tenant'.padEnd(25) +
      'Status'.padEnd(10) +
      'Created'
    );
    console.log('─'.repeat(120));

    result.rows.forEach(user => {
      console.log(
        String(user.id).padEnd(5) +
        (user.name || '').padEnd(25) +
        (user.email || '').padEnd(35) +
        (user.tenant_name || user.tenant_id || '').padEnd(25) +
        (user.status || '').padEnd(10) +
        new Date(user.created_at).toLocaleDateString()
      );
    });

    console.log('─'.repeat(120));
    console.log(`\n✅ Total users: ${result.rows.length}`);

  } catch (error) {
    console.error('❌ Error listing users:', error.message);
  } finally {
    await pool.end();
  }
}

listUsers();
