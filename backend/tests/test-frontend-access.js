// Test if frontend can access bed management data
const axios = require('axios');

async function testFrontendAccess() {
  try {
    console.log('🌐 Testing frontend access to bed management...');
    
    // Test 1: Check if server is responding
    console.log('\n1. Testing server health...');
    try {
      const healthResponse = await axios.get('http://localhost:3000/health', { timeout: 5000 });
      console.log('✅ Server is responding');
    } catch (error) {
      console.log('⚠️ Health endpoint not available, but server might still work');
    }
    
    // Test 2: Try to access bed occupancy (this should work with proper headers)
    console.log('\n2. Testing bed occupancy endpoint...');
    try {
      const response = await axios.get('http://localhost:3000/api/beds/occupancy', {
        headers: {
          'X-Tenant-ID': 'tenant_1762083064503',
          'Authorization': 'Bearer dev-token-123',
          'X-App-ID': 'hospital_system',
          'X-API-Key': 'hospital-dev-key-123',
          'Origin': 'http://localhost:3001',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      
      console.log('✅ Bed occupancy endpoint accessible');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      console.log('❌ Bed occupancy endpoint failed:', error.response?.status, error.response?.data?.error || error.message);
    }
    
    // Test 3: Try department beds endpoint
    console.log('\n3. Testing department beds endpoint...');
    try {
      const response = await axios.get('http://localhost:3000/api/bed-management/departments/cardiology/beds', {
        headers: {
          'X-Tenant-ID': 'tenant_1762083064503',
          'Authorization': 'Bearer dev-token-123',
          'X-App-ID': 'hospital_system', 
          'X-API-Key': 'hospital-dev-key-123',
          'Origin': 'http://localhost:3001',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      
      console.log('✅ Department beds endpoint accessible');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      console.log('❌ Department beds endpoint failed:', error.response?.status, error.response?.data?.error || error.message);
    }
    
    console.log('\n🎯 Frontend access test complete');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFrontendAccess();