const { Pool } = require('pg');
const { BedService } = require('./src/services/bed-service');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'multitenant_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function testBedServiceDirect() {
  try {
    console.log('🧪 Testing Bed Service Directly...');
    
    // Set tenant schema
    const tenantId = 'tenant_1762083064503';
    await pool.query(`SET search_path TO "${tenantId}"`);
    
    const bedService = new BedService(pool);
    
    // Test 1: Get bed occupancy
    console.log('\n1. Testing getBedOccupancy...');
    const occupancy = await bedService.getBedOccupancy(tenantId);
    console.log('✅ Bed occupancy:', JSON.stringify(occupancy, null, 2));
    
    // Test 2: Get beds with cardiology filter
    console.log('\n2. Testing getBeds with cardiology unit filter...');
    const cardiologyBeds = await bedService.getBeds({
      unit: 'Cardiology',
      page: 1,
      limit: 10
    }, tenantId);
    console.log('✅ Cardiology beds:', JSON.stringify(cardiologyBeds, null, 2));
    
    // Test 3: Get beds with ICU filter
    console.log('\n3. Testing getBeds with ICU unit filter...');
    const icuBeds = await bedService.getBeds({
      unit: 'ICU',
      page: 1,
      limit: 10
    }, tenantId);
    console.log('✅ ICU beds:', JSON.stringify(icuBeds, null, 2));
    
    // Test 4: Check bed availability
    console.log('\n4. Testing checkBedAvailability...');
    const availability = await bedService.checkBedAvailability(tenantId);
    console.log('✅ Bed availability:', JSON.stringify(availability, null, 2));
    
    await pool.end();
    console.log('\n🎉 All service tests passed!');
    
  } catch (error) {
    console.error('❌ Service test failed:', error.message);
    console.error('Full error:', error);
    await pool.end();
    process.exit(1);
  }
}

testBedServiceDirect();