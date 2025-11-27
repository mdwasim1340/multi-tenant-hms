const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'multitenant_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function checkAllBedsTables() {
  try {
    console.log('🔍 Checking all beds tables in database...\n');
    
    // Find all beds tables across all schemas
    const result = await pool.query(`
      SELECT table_schema, table_name, 
             (SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
              FROM information_schema.columns c
              WHERE c.table_schema = t.table_schema 
              AND c.table_name = t.table_name) as columns
      FROM information_schema.tables t
      WHERE table_name = 'beds'
      ORDER BY table_schema
    `);
    
    console.log(`Found ${result.rows.length} beds table(s):\n`);
    
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. Schema: ${row.table_schema}`);
      console.log(`   Columns: ${row.columns}`);
      console.log('');
    });
    
    // Check which schema the service is using
    console.log('🔍 Checking current search_path...');
    const searchPath = await pool.query('SHOW search_path');
    console.log('Current search_path:', searchPath.rows[0].search_path);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
  }
}

checkAllBedsTables();