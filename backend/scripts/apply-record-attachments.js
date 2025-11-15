/**
 * Team Alpha - Apply Record Attachments Migration
 * Add record_attachments table to all tenant schemas
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

async function applyRecordAttachmentsMigration() {
  const client = await pool.connect();
  
  try {
    console.log('📎 Starting Record Attachments Migration...\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/1731920100000_add_record_attachments.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Get all tenant schemas
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%'
      ORDER BY schema_name
    `);

    const tenantSchemas = schemasResult.rows.map(row => row.schema_name);
    console.log(`📋 Found ${tenantSchemas.length} tenant schemas\n`);

    // Apply migration to each tenant schema
    let successCount = 0;
    let errorCount = 0;

    for (const schema of tenantSchemas) {
      try {
        console.log(`⚙️  Applying to ${schema}...`);
        
        // Set search path to tenant schema
        await client.query(`SET search_path TO "${schema}"`);
        
        // Execute migration
        await client.query(migrationSQL);
        
        // Verify table was created
        const tableResult = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = $1 
          AND table_name = 'record_attachments'
        `, [schema]);
        
        if (tableResult.rows.length > 0) {
          console.log(`   ✅ Success!`);
          successCount++;
        } else {
          console.log(`   ⚠️  Warning: Table not found after creation`);
          errorCount++;
        }
        
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}/${tenantSchemas.length}`);
    console.log(`   ❌ Failed: ${errorCount}/${tenantSchemas.length}\n`);

    if (successCount > 0) {
      // Verify one schema in detail
      const sampleSchema = tenantSchemas[0];
      console.log(`🔍 Verification for ${sampleSchema}:\n`);
      
      await client.query(`SET search_path TO "${sampleSchema}"`);
      
      const columnsResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = $1 AND table_name = 'record_attachments'
        ORDER BY ordinal_position
      `, [sampleSchema]);
      
      console.log(`   record_attachments table (${columnsResult.rows.length} columns):`);
      columnsResult.rows.forEach(col => {
        console.log(`      - ${col.column_name}: ${col.data_type}`);
      });
      console.log('');
    }

    console.log('✅ Record Attachments Migration Complete!\n');
    
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
applyRecordAttachmentsMigration()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
