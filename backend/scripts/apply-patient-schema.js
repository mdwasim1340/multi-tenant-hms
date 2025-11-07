const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function applyPatientSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting patient schema application...\n');
    
    // Read SQL file
    const sqlFile = path.join(__dirname, '../migrations/schemas/patient-schema.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
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
    
    // Apply schema to each tenant
    for (const schema of tenantSchemas) {
      console.log(`📦 Applying schema to: ${schema}`);
      
      try {
        // Set search path to tenant schema
        await client.query(`SET search_path TO "${schema}"`);
        
        // Execute SQL
        await client.query(sql);
        
        // Verify tables created
        const tablesResult = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = '${schema}' 
          AND table_name IN ('patients', 'custom_field_values', 'patient_files')
          ORDER BY table_name
        `);
        
        const tables = tablesResult.rows.map(row => row.table_name);
        
        if (tables.length === 3) {
          console.log(`   ✅ Success! Created tables: ${tables.join(', ')}\n`);
        } else {
          console.log(`   ⚠️  Warning: Only created ${tables.length}/3 tables\n`);
        }
        
      } catch (error) {
        console.error(`   ❌ Error applying to ${schema}:`, error.message);
        console.error('');
      }
    }
    
    console.log('🎉 Patient schema application complete!\n');
    
    // Summary
    console.log('📊 Verification Summary:');
    for (const schema of tenantSchemas) {
      await client.query(`SET search_path TO "${schema}"`);
      const countResult = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '${schema}' AND table_name = 'patients') as patients,
          (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '${schema}' AND table_name = 'custom_field_values') as custom_fields,
          (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '${schema}' AND table_name = 'patient_files') as files
      `);
      
      const counts = countResult.rows[0];
      const status = (counts.patients && counts.custom_fields && counts.files) ? '✅' : '❌';
      console.log(`   ${status} ${schema}: patients=${counts.patients}, custom_fields=${counts.custom_fields}, files=${counts.files}`);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
applyPatientSchema()
  .then(() => {
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
