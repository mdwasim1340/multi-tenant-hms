/**
 * Team Alpha - Apply Medical Records Migration
 * Apply medical records tables to all tenant schemas
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function applyMedicalRecordsMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🏥 Starting Medical Records Migration...\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/1731920000000_create_medical_records.sql');
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

    // Apply migration to each tenant schema
    let successCount = 0;
    let errorCount = 0;

    for (const schema of tenantSchemas) {
      try {
        console.log(`⚙️  Applying migration to ${schema}...`);
        
        // Set search path to tenant schema
        await client.query(`SET search_path TO "${schema}"`);
        
        // Execute migration
        await client.query(migrationSQL);
        
        // Verify tables were created
        const tablesResult = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = $1 
          AND table_name IN ('medical_records', 'record_attachments', 'diagnoses')
          ORDER BY table_name
        `, [schema]);
        
        const createdTables = tablesResult.rows.map(row => row.table_name);
        
        if (createdTables.length === 3) {
          console.log(`   ✅ Success! Created tables: ${createdTables.join(', ')}`);
          successCount++;
        } else {
          console.log(`   ⚠️  Warning: Only created ${createdTables.length}/3 tables`);
          errorCount++;
        }
        
      } catch (error) {
        console.error(`   ❌ Error applying to ${schema}:`, error.message);
        errorCount++;
      }
      
      console.log('');
    }

    // Summary
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}/${tenantSchemas.length}`);
    console.log(`   ❌ Failed: ${errorCount}/${tenantSchemas.length}`);
    console.log('');

    // Verify one schema in detail
    if (tenantSchemas.length > 0) {
      const sampleSchema = tenantSchemas[0];
      console.log(`🔍 Detailed verification for ${sampleSchema}:\n`);
      
      await client.query(`SET search_path TO "${sampleSchema}"`);
      
      // Check medical_records table
      const mrResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = $1 AND table_name = 'medical_records'
        ORDER BY ordinal_position
      `, [sampleSchema]);
      
      console.log(`   medical_records table (${mrResult.rows.length} columns):`);
      mrResult.rows.slice(0, 5).forEach(col => {
        console.log(`      - ${col.column_name}: ${col.data_type}`);
      });
      console.log(`      ... and ${mrResult.rows.length - 5} more columns`);
      console.log('');
      
      // Check indexes
      const indexResult = await client.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = $1 
        AND tablename IN ('medical_records', 'record_attachments', 'diagnoses')
        ORDER BY indexname
      `, [sampleSchema]);
      
      console.log(`   Indexes created (${indexResult.rows.length} total):`);
      indexResult.rows.forEach(idx => {
        console.log(`      - ${idx.indexname}`);
      });
      console.log('');
    }

    console.log('✅ Medical Records Migration Complete!\n');
    
    if (successCount === tenantSchemas.length) {
      console.log('🎉 All tenant schemas updated successfully!');
    } else {
      console.log('⚠️  Some schemas had errors. Please review the output above.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
applyMedicalRecordsMigration()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
