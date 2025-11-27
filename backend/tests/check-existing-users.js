require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkUsers() {
  try {
    console.log('🔍 Checking existing users in database...\n');
    
    const result = await pool.query('SELECT id, name, email, tenant FROM users LIMIT 10');
    
    if (result.rows.length === 0) {
      console.log('❌ No users found in database');
    } else {
      console.log('✅ Users found:');
      result.rows.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (tenant: ${user.tenant})`);
      });
    }
    
    // Also check tenants
    console.log('\n🏥 Checking available tenants...');
    const tenants = await pool.query('SELECT id, name FROM tenants LIMIT 10');
    
    if (tenants.rows.length === 0) {
      console.log('❌ No tenants found');
    } else {
      console.log('✅ Tenants found:');
      tenants.rows.forEach((tenant, index) => {
        console.log(`${index + 1}. ${tenant.id} - ${tenant.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsers();