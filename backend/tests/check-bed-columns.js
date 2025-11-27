const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'multitenant_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function checkColumns() {
  try {
    await pool.query(`SET search_path TO "tenant_1762083064503"`);
    
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'beds' AND table_schema = 'tenant_1762083064503'
      ORDER BY ordinal_position
    `);
    
    console.log('Bed table columns:');
    result.rows.forEach(col => console.log(`  - ${col.column_name} (${col.data_type})`));
    
    // Check if unit column exists
    const hasUnit = result.rows.some(col => col.column_name === 'unit');
    const hasDepartmentId = result.rows.some(col => col.column_name === 'department_id');
    
    console.log('\nColumn check:');
    console.log('  unit column exists:', hasUnit);
    console.log('  department_id column exists:', hasDepartmentId);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
  }
}

checkColumns();