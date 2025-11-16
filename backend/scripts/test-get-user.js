require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function testGetUser() {
  try {
    const email = 'test.integration@hospital.com';
    console.log('Testing getUserByEmail with:', email);
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    console.log('Result:', result.rows[0]);
    
    if (result.rows[0]) {
      console.log('✅ User found with ID:', result.rows[0].id);
    } else {
      console.log('❌ User not found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

testGetUser();
