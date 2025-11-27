/**
 * Run Enhanced Bed Management Migration
 * Creates all necessary tables for the enhanced bed management system
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'multitenant_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Starting Enhanced Bed Management Migration...\n');
    
    // Check if beds table exists
    const bedsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'beds'
      );
    `);
    
    if (!bedsCheck.rows[0].exists) {
      // Migration 1: Create beds table
      console.log('📋 Step 1: Creating beds and departments tables...');
      const bedsTablePath = path.join(__dirname, 'migrations', '1732123456788_create_beds_table.sql');
      const bedsTableSQL = fs.readFileSync(bedsTablePath, 'utf8');
      
      await client.query('BEGIN');
      await client.query(bedsTableSQL);
      await client.query('COMMIT');
      
      console.log('✅ Beds and departments tables created');
    } else {
      console.log('✅ Beds table already exists, skipping step 1');
    }
    
    // Migration 2: Create enhanced bed management tables
    console.log('\n📋 Step 2: Creating transfer, discharge, and history tables...');
    const enhancedPath = path.join(__dirname, 'migrations', '1732123456789_enhanced_bed_management.sql');
    const enhancedSQL = fs.readFileSync(enhancedPath, 'utf8');
    
    await client.query('BEGIN');
    await client.query(enhancedSQL);
    await client.query('COMMIT');
    
    console.log('✅ Enhanced bed management tables created');
    
    console.log('\n🎉 Enhanced Bed Management Migration completed successfully!');
    console.log('\n📊 Created tables:');
    console.log('   Core Tables:');
    console.log('   - beds');
    console.log('   - departments');
    console.log('\n   Enhanced Tables:');
    console.log('   - bed_transfers');
    console.log('   - patient_discharges');
    console.log('   - bed_history');
    console.log('   - bed_assignments');
    console.log('   - housekeeping_tasks');
    console.log('   - follow_up_appointments');
    console.log('\n✅ All indexes and triggers created');
    console.log('\n💡 Next steps:');
    console.log('   1. Restart your backend server');
    console.log('   2. The bed management system is now ready to use!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    console.error('\n💡 Tip: Make sure PostgreSQL is running and the database exists');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
runMigration().catch(console.error);