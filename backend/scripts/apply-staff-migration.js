/**
 * Apply Staff Management Migration to All Tenant Schemas
 * Team: Delta
 * Purpose: Create staff management tables in all existing tenant schemas
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function applyStaffMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting staff management tables migration...\n');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../migrations/1731761000000_create-staff-management-tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Get all tenant schemas
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%'
      ORDER BY schema_name
    `);

    const tenantSchemas = schemasResult.rows.map(row => row.schema_name);
    console.log(`📋 Found ${tenantSchemas.length} tenant schemas:\n`);
    tenantSchemas.forEach(schema => console.log(`   - ${schema}`));
    console.log('');

    if (tenantSchemas.length === 0) {
      console.log('⚠️  No tenant schemas found. Please create tenants first.');
      return;
    }

    // Apply migration to each tenant schema
    let successCount = 0;
    let errorCount = 0;

    for (const schema of tenantSchemas) {
      try {
        console.log(`📦 Applying migration to ${schema}...`);
        
        // Set search path to tenant schema
        await client.query(`SET search_path TO "${schema}", public`);
        
        // Execute migration SQL
        await client.query(migrationSQL);
        
        // Verify tables were created
        const tablesResult = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = $1 
          AND table_name LIKE '%staff%'
          ORDER BY table_name
        `, [schema]);
        
        const tables = tablesResult.rows.map(row => row.table_name);
        console.log(`   ✅ Created ${tables.length} tables: ${tables.join(', ')}`);
        
        successCount++;
      } catch (error) {
        console.error(`   ❌ Error in ${schema}:`, error.message);
        errorCount++;
      }
      console.log('');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${successCount} tenant schemas`);
    console.log(`❌ Failed: ${errorCount} tenant schemas`);
    console.log('='.repeat(60));

    // Verify one tenant schema
    if (tenantSchemas.length > 0) {
      const testSchema = tenantSchemas[0];
      console.log(`\n🔍 Verifying ${testSchema}...`);
      
      await client.query(`SET search_path TO "${testSchema}", public`);
      
      const verifyResult = await client.query(`
        SELECT 
          table_name,
          (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = $1 AND table_name = t.table_name) as column_count
        FROM information_schema.tables t
        WHERE table_schema = $1 
        AND table_name IN ('staff_profiles', 'staff_schedules', 'staff_credentials', 'staff_performance', 'staff_attendance', 'staff_payroll')
        ORDER BY table_name
      `, [testSchema]);
      
      console.log('\nTables created:');
      verifyResult.rows.forEach(row => {
        console.log(`   ✅ ${row.table_name} (${row.column_count} columns)`);
      });

      // Check indexes
      const indexResult = await client.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = $1 
        AND tablename LIKE '%staff%'
        ORDER BY indexname
      `, [testSchema]);
      
      console.log(`\n📊 Indexes created: ${indexResult.rows.length}`);
      indexResult.rows.slice(0, 5).forEach(row => {
        console.log(`   - ${row.indexname}`);
      });
      if (indexResult.rows.length > 5) {
        console.log(`   ... and ${indexResult.rows.length - 5} more`);
      }
    }

    console.log('\n✅ Staff management tables migration completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
applyStaffMigration()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
