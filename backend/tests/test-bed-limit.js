const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
});

async function test() {
  try {
    // Set tenant context
    await pool.query('SET search_path TO "aajmin_polyclinic", public');
    
    // Count total beds
    const countResult = await pool.query('SELECT COUNT(*) as total FROM beds WHERE is_active = true');
    console.log('Total active beds in database:', countResult.rows[0].total);
    
    // Get beds by unit
    const unitResult = await pool.query('SELECT unit, COUNT(*) as count FROM beds WHERE is_active = true GROUP BY unit ORDER BY unit');
    console.log('\nBeds by unit:');
    unitResult.rows.forEach(row => {
      console.log('  ' + row.unit + ': ' + row.count);
    });
    
    // Test query with limit 1000
    const bedsResult = await pool.query('SELECT id, bed_number, unit FROM beds WHERE is_active = true ORDER BY bed_number LIMIT 1000');
    console.log('\nBeds returned with LIMIT 1000:', bedsResult.rows.length);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

test();
