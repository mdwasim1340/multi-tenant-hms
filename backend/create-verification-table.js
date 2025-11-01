const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function createVerificationTable() {
  const client = await pool.connect();
  try {
    console.log('🔧 Creating user_verification table...');
    
    // Check if table exists
    const checkTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_verification'
      );
    `);
    
    if (checkTable.rows[0].exists) {
      console.log('✅ user_verification table already exists');
      return;
    }
    
    // Create the table
    await client.query(`
      CREATE TABLE user_verification (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        expires_at TIMESTAMP NOT NULL DEFAULT (current_timestamp + interval '1 hour'),
        created_at TIMESTAMP NOT NULL DEFAULT current_timestamp
      );
    `);
    
    console.log('✅ user_verification table created successfully');
    
    // Create index for faster lookups
    await client.query(`
      CREATE INDEX idx_user_verification_email_code ON user_verification(email, code);
    `);
    
    console.log('✅ Index created for user_verification table');
    
  } catch (error) {
    console.error('❌ Error creating user_verification table:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createVerificationTable();