const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'multitenant_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function checkTables() {
  try {
    console.log('🔍 Checking existing bed management tables...');
    
    // Check aajmin_polyclinic schema
    const tenantId = 'aajmin_polyclinic';
    await pool.query(`SET search_path TO "${tenantId}"`);
    
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = '${tenantId}' 
      AND table_name LIKE '%bed%'
      ORDER BY table_name
    `);
    
    console.log(`\nExisting bed-related tables in ${tenantId}:`);
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check beds table structure
    if (tablesResult.rows.some(row => row.table_name === 'beds')) {
      console.log('\n📋 Beds table structure:');
      const bedsStructure = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_schema = '${tenantId}' 
        AND table_name = 'beds'
        ORDER BY ordinal_position
      `);
      
      bedsStructure.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }
    
    // Check if enhanced tables exist
    const enhancedTables = [
      'bed_assignments',
      'bed_transfers', 
      'bed_maintenance',
      'bed_reservations',
      'bed_activity_log'
    ];
    
    console.log('\n🔍 Enhanced bed management tables status:');
    for (const tableName of enhancedTables) {
      const exists = tablesResult.rows.some(row => row.table_name === tableName);
      console.log(`  - ${tableName}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
  } finally {
    await pool.end();
  }
}

checkTables();