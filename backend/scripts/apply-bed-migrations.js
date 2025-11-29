/**
 * Apply Bed Management Migrations to Tenant Schemas
 * Run: node scripts/apply-bed-migrations.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

const migrations = [
  '1732000000000_create_departments_table.sql',
  '1732000100000_create_beds_table.sql',
  '1732000200000_create_bed_assignments_table.sql',
  '1732000300000_create_bed_transfers_table.sql',
];

async function applyMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting bed management migrations...\n');
    
    // Get all tenant schemas (including custom named ones)
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' 
         OR schema_name LIKE 'demo_%'
         OR schema_name = 'aajmin_polyclinic'
         OR schema_name LIKE 'test_complete_%'
      ORDER BY schema_name
    `);
    
    const tenantSchemas = schemasResult.rows.map(row => row.schema_name);
    
    if (tenantSchemas.length === 0) {
      console.log('⚠️  No tenant schemas found.');
      return;
    }
    
    console.log(`Found ${tenantSchemas.length} tenant schema(s)\n`);
    
    for (const schema of tenantSchemas) {
      console.log(`📋 Applying migrations to: ${schema}`);
      
      // Set search path
      await client.query(`SET search_path TO "${schema}"`);
      
      for (const migration of migrations) {
        const migrationPath = path.join(__dirname, '../migrations', migration);
        const sql = fs.readFileSync(migrationPath, 'utf8');
        
        try {
          await client.query(sql);
          console.log(`   ✅ ${migration}`);
        } catch (error) {
          console.log(`   ❌ ${migration}: ${error.message}`);
        }
      }
      
      console.log('');
    }
    
    console.log('✨ Migration application completed!\n');
    
    // Verify tables created
    console.log('📊 Verification:');
    for (const schema of tenantSchemas) {
      await client.query(`SET search_path TO "${schema}"`);
      const result = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = '${schema}' 
        AND table_name IN ('departments', 'beds', 'bed_assignments', 'bed_transfers')
        ORDER BY table_name
      `);
      console.log(`   ${schema}: ${result.rows.length}/4 tables created`);
    }
    
  } catch (error) {
    console.error('❌ Error applying migrations:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  applyMigrations()
    .then(() => {
      console.log('\n✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { applyMigrations };
