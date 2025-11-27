// Simple test to check what's happening with bed data
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'multitenant_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function testBedData() {
  try {
    console.log('🔍 Testing bed data for cardiology department...');
    
    const tenantId = 'tenant_1762083064503';
    await pool.query(`SET search_path TO "${tenantId}"`);
    
    // Test 1: Get all beds
    console.log('\n1. All beds:');
    const allBeds = await pool.query('SELECT * FROM beds LIMIT 5');
    console.log('Total beds:', allBeds.rows.length);
    allBeds.rows.forEach(bed => {
      console.log(`  - ${bed.bed_number} (${bed.unit}) - Status: ${bed.status}`);
    });
    
    // Test 2: Get beds by unit (what cardiology should map to)
    console.log('\n2. Beds by unit:');
    const units = await pool.query('SELECT DISTINCT unit FROM beds ORDER BY unit');
    console.log('Available units:', units.rows.map(u => u.unit));
    
    // Test 3: Try to get cardiology beds
    console.log('\n3. Cardiology beds (if any):');
    const cardiologyBeds = await pool.query("SELECT * FROM beds WHERE unit ILIKE '%cardiology%'");
    console.log('Cardiology beds found:', cardiologyBeds.rows.length);
    
    // Test 4: Try ICU beds (we know these exist)
    console.log('\n4. ICU beds:');
    const icuBeds = await pool.query("SELECT * FROM beds WHERE unit ILIKE '%ICU%'");
    console.log('ICU beds found:', icuBeds.rows.length);
    icuBeds.rows.forEach(bed => {
      console.log(`  - ${bed.bed_number} - Status: ${bed.status}`);
    });
    
    await pool.end();
    console.log('\n✅ Bed data test complete');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

testBedData();