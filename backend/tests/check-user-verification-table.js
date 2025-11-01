const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

console.log('🔍 CHECKING USER_VERIFICATION TABLE');
console.log('===================================');

async function checkTable() {
  try {
    console.log('\n📋 Step 1: Checking if user_verification table exists...');
    
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_verification'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ user_verification table EXISTS');
      
      console.log('\n📋 Step 2: Checking table structure...');
      const structure = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'user_verification'
        ORDER BY ordinal_position;
      `);
      
      console.log('📊 Table structure:');
      structure.rows.forEach(row => {
        console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
      
      console.log('\n📋 Step 3: Testing INSERT operation...');
      try {
        await pool.query(
          'INSERT INTO user_verification (email, code, type) VALUES ($1, $2, $3)',
          ['test@example.com', 'TEST123', 'reset']
        );
        console.log('✅ INSERT operation: SUCCESS');
        
        // Clean up
        await pool.query('DELETE FROM user_verification WHERE email = $1', ['test@example.com']);
        console.log('✅ Cleanup: SUCCESS');
        
      } catch (insertError) {
        console.log('❌ INSERT operation: FAILED');
        console.log(`   Error: ${insertError.message}`);
      }
      
    } else {
      console.log('❌ user_verification table DOES NOT EXIST');
      console.log('\n💡 SOLUTION: Create the table with:');
      console.log(`
CREATE TABLE user_verification (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(10) NOT NULL,
  type VARCHAR(20) NOT NULL,
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '1 hour'),
  created_at TIMESTAMP DEFAULT NOW()
);
      `);
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTable();