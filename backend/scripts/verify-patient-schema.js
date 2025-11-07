const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function verifyPatientSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verifying patient schema across all tenants...\n');
    
    // Get all tenant schemas
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%'
      ORDER BY schema_name
    `);
    
    const tenantSchemas = schemasResult.rows.map(row => row.schema_name);
    let allValid = true;
    
    for (const schema of tenantSchemas) {
      await client.query(`SET search_path TO "${schema}"`);
      
      // Check tables exist
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = '${schema}' 
        AND table_name IN ('patients', 'custom_field_values', 'patient_files')
      `);
      
      const tables = tablesResult.rows.map(row => row.table_name);
      
      // Check indexes
      const indexesResult = await client.query(`
        SELECT COUNT(*) as count
        FROM pg_indexes 
        WHERE tablename = 'patients' 
        AND schemaname = '${schema}'
      `);
      
      const indexCount = parseInt(indexesResult.rows[0].count);
      
      // Check constraints
      const constraintsResult = await client.query(`
        SELECT COUNT(*) as count
        FROM information_schema.table_constraints 
        WHERE table_schema = '${schema}' 
        AND table_name = 'patients'
        AND constraint_type IN ('PRIMARY KEY', 'UNIQUE', 'CHECK')
      `);
      
      const constraintCount = parseInt(constraintsResult.rows[0].count);
      
      const isValid = tables.length === 3 && indexCount >= 8 && constraintCount >= 3;
      allValid = allValid && isValid;
      
      const status = isValid ? '✅' : '❌';
      console.log(`${status} ${schema}:`);
      console.log(`   Tables: ${tables.length}/3 (${tables.join(', ')})`);
      console.log(`   Indexes: ${indexCount} (expected >= 8)`);
      console.log(`   Constraints: ${constraintCount} (expected >= 3)`);
      console.log('');
    }
    
    if (allValid) {
      console.log('🎉 All tenant schemas are valid!\n');
      return true;
    } else {
      console.log('⚠️  Some tenant schemas have issues. Please review.\n');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Verification error:', error);
    return false;
  } finally {
    client.release();
    await pool.end();
  }
}

verifyPatientSchema()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  });
