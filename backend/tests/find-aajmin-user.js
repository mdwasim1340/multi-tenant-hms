require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function findAajminUser() {
  try {
    console.log('🔍 Looking for aajmin users...\n');
    
    const result = await pool.query(`
      SELECT * FROM users 
      WHERE tenant_id LIKE '%aajmin%' OR email LIKE '%aajmin%'
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No aajmin users found');
    } else {
      console.log('✅ Aajmin users found:');
      result.rows.forEach(user => {
        console.log(`- ${user.email} (tenant: ${user.tenant_id})`);
      });
    }
    
    // Also check all tenants
    console.log('\n🏥 All available tenants:');
    const tenants = await pool.query('SELECT * FROM tenants ORDER BY id');
    tenants.rows.forEach(t => {
      console.log(`- ${t.id}: ${t.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

findAajminUser();