const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function checkTables() {
  const client = await pool.connect();
  try {
    await client.query('SET search_path TO demo_hospital_001');
    
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='demo_hospital_001' 
      ORDER BY table_name
    `);
    
    console.log('Tables in demo_hospital_001:');
    result.rows.forEach(t => console.log(`  - ${t.table_name}`));
    
  } finally {
    client.release();
    await pool.end();
  }
}

checkTables();
