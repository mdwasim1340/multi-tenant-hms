const axios = require('axios');

async function testDepartmentBedsAPI() {
  try {
    console.log('🧪 Testing Department Beds API\n');
    
    // Test Emergency department beds
    const response = await axios.get('http://localhost:3000/api/bed-management/departments/Emergency/beds', {
      headers: {
        'X-Tenant-ID': 'aajmin_polyclinic',
        'Authorization': 'Bearer test-token',
        'X-App-ID': 'hospital-management',
        'X-API-Key': 'hospital-dev-key-789'
      }
    });
    
    console.log('API Response:', JSON.stringify(response.data, null, 2));
    console.log('Number of beds returned:', response.data.beds?.length || 0);
    
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
  }
}

testDepartmentBedsAPI();