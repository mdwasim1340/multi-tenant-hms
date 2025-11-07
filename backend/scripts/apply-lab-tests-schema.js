const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function applyLabTestsSchema() {
  const client = await pool.connect();
  
  try {
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%'
    `);
    
    const schemas = schemasResult.rows.map(row => row.schema_name);
    
    console.log(`Found ${schemas.length} tenant schemas`);
    
    for (const schema of schemas) {
      console.log(`\nApplying lab tests schema to: ${schema}`);
      
      await client.query(`SET search_path TO "${schema}"`);
      
      const fs = require('fs');
      const sql = fs.readFileSync(path.resolve(__dirname, '../migrations/create-lab-tests-schema.sql'), 'utf8');
      
      await client.query(sql);
      
      console.log(`✅ Lab tests schema applied to ${schema}`);
    }
    
    console.log('\n✅ All schemas updated successfully');
    
  } catch (error) {
    console.error('Error applying schema:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

applyLabTestsSchema();
