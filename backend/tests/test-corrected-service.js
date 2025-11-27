// Test the corrected bed service logic
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'multitenant_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function testCorrectedService() {
  try {
    console.log('🧪 Testing corrected bed service logic...');
    
    const tenantId = 'tenant_1762083064503';
    await pool.query(`SET search_path TO "${tenantId}"`);
    
    // Simulate the corrected service logic
    console.log('\n1. Testing unit filtering for cardiology (should map to ICU):');
    const cardiologyBeds = await pool.query("SELECT * FROM beds WHERE unit ILIKE '%ICU%'");
    console.log(`Found ${cardiologyBeds.rows.length} beds for cardiology (mapped to ICU)`);
    
    console.log('\n2. Testing unit filtering for pediatrics:');
    const pediatricsBeds = await pool.query("SELECT * FROM beds WHERE unit ILIKE '%Pediatrics%'");
    console.log(`Found ${pediatricsBeds.rows.length} beds for pediatrics`);
    
    console.log('\n3. Testing unit filtering for general:');
    const generalBeds = await pool.query("SELECT * FROM beds WHERE unit ILIKE '%General%'");
    console.log(`Found ${generalBeds.rows.length} beds for general`);
    
    // Test occupancy calculation
    console.log('\n4. Testing occupancy calculation:');
    const occupancyResult = await pool.query(`
      SELECT
        unit,
        COUNT(*) as total_beds,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied_beds,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_beds
      FROM beds
      GROUP BY unit
      ORDER BY unit
    `);
    
    occupancyResult.rows.forEach(row => {
      const occupancyRate = row.total_beds > 0 ? (row.occupied_beds / row.total_beds * 100).toFixed(1) : 0;
      console.log(`  ${row.unit}: ${row.occupied_beds}/${row.total_beds} (${occupancyRate}% occupied)`);
    });
    
    await pool.end();
    console.log('\n✅ Corrected service test complete');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

testCorrectedService();