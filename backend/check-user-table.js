require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkUserTable() {
  try {
    console.log('🔍 Checking user table structure...\n');
    
    // Check table structure
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('✅ User table columns:');
    columns.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });
    
    // Check users
    console.log('\n🔍 Checking existing users...');
    const users = await pool.query('SELECT * FROM users LIMIT 3');
    
    if (users.rows.length === 0) {
      console.log('❌ No users found');
    } else {
      console.log('✅ Users found:');
      users.rows.forEach((user, index) => {
        console.log(`${index + 1}.`, JSON.stringify(user, null, 2));
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUserTable();