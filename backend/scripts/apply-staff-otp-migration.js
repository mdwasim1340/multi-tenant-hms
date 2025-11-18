const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function applyMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Applying staff OTP migration...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/1731970000000_add_metadata_to_user_verification.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Apply migration
    await client.query(migrationSQL);
    
    console.log('✅ Migration applied successfully!');
    console.log('');
    console.log('Changes made:');
    console.log('  - Added metadata column to user_verification table');
    console.log('  - Added index for email and type lookups');
    console.log('');
    console.log('New staff creation flow:');
    console.log('  1. POST /api/staff/initiate - Send OTP to email');
    console.log('  2. POST /api/staff/verify-otp - Verify OTP code');
    console.log('  3. POST /api/staff/complete - Create account with password');
    
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration().catch(console.error);
