const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'multitenant_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function runMigration() {
  try {
    console.log('🚀 Running enhanced bed management migration...');
    
    // Read the migration file
    const migrationSQL = fs.readFileSync('./migrations/1732456789000_enhanced_bed_management_system.sql', 'utf8');
    
    // Get all tenant schemas
    const tenantResult = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%' OR schema_name = 'aajmin_polyclinic'
    `);
    
    console.log(`Found ${tenantResult.rows.length} tenant schemas`);
    
    // Apply migration to each tenant schema
    for (const row of tenantResult.rows) {
      const tenantId = row.schema_name;
      console.log(`  Applying migration to ${tenantId}...`);
      
      try {
        // Set search path to tenant schema
        await pool.query(`SET search_path TO "${tenantId}"`);
        
        // Execute migration
        await pool.query(migrationSQL);
        
        console.log(`  ✅ Migration applied to ${tenantId}`);
      } catch (error) {
        console.log(`  ❌ Error applying migration to ${tenantId}:`, error.message);
      }
    }
    
    console.log('✅ Enhanced bed management migration completed');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await pool.end();
  }
}

runMigration();