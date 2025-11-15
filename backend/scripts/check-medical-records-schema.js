const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function checkSchema() {
  const client = await pool.connect();
  try {
    await client.query('SET search_path TO demo_hospital_001');
    
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name='medical_records' 
      ORDER BY ordinal_position
    `);
    
    console.log('Medical Records Columns:');
    result.rows.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));
    
  } finally {
    client.release();
    await pool.end();
  }
}

checkSchema();
