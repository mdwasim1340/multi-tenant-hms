const axios = require('axios');

async function testPediatricAPIEndpoints() {
  try {
    console.log('=== TESTING PEDIATRIC API ENDPOINTS ===');
    
    const baseURL = 'http://localhost:3000';
    
    // Get a real token by signing in first
    console.log('\n1. Getting authentication token...');
    
    const loginResponse = await axios.post(`${baseURL}/auth/signin`, {
      email: 'admin@aajmin.com',
      password: 'Admin@123'
    });
    
    const token = loginResponse.data.token;
    const tenantId = 'aajmin_polyclinic';
    
    console.log('✅ Authentication successful');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'X-Tenant-ID': tenantId,
      'X-App-ID': 'hospital-management',
      'X-API-Key': 'hospital-dev-key-789'
    };
    
    // Test Statistics API
    console.log('\n2. Testing Pediatric Department Stats API...');
    try {
      const statsResponse = await axios.get(`${baseURL}/api/bed-management/departments/pediatrics/stats`, { headers });
      console.log('✅ Stats API Response:');
      console.log(JSON.stringify(statsResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Stats API Error:', error.response?.data || error.message);
    }
    
    // Test Bed List API
    console.log('\n3. Testing Pediatric Department Beds API...');
    try {
      const bedsResponse = await axios.get(`${baseURL}/api/bed-management/departments/pediatrics/beds?limit=50`, { headers });
      console.log('✅ Beds API Response:');
      console.log(`- Total beds returned: ${bedsResponse.data.beds?.length || 0}`);
      console.log(`- Pagination total: ${bedsResponse.data.pagination?.total || 0}`);
      
      if (bedsResponse.data.beds && bedsResponse.data.beds.length > 0) {
        console.log('Beds found:');
        bedsResponse.data.beds.forEach(bed => {
          console.log(`  - ${bed.bed_number}: ${bed.status} (category: ${bed.category_id || 'N/A'})`);
        });
      } else {
        console.log('No beds returned');
      }
    } catch (error) {
      console.log('❌ Beds API Error:', error.response?.data || error.message);
    }
    
    // Test with different department for comparison
    console.log('\n4. Testing Maternity Department (for comparison)...');
    try {
      const maternityStatsResponse = await axios.get(`${baseURL}/api/bed-management/departments/maternity/stats`, { headers });
      console.log('✅ Maternity Stats:');
      console.log(`- Total: ${maternityStatsResponse.data.total_beds}`);
      console.log(`- Occupied: ${maternityStatsResponse.data.occupied_beds}`);
      console.log(`- Available: ${maternityStatsResponse.data.available_beds}`);
      
      const maternityBedsResponse = await axios.get(`${baseURL}/api/bed-management/departments/maternity/beds?limit=10`, { headers });
      console.log(`- Bed List Count: ${maternityBedsResponse.data.beds?.length || 0}`);
    } catch (error) {
      console.log('❌ Maternity API Error:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('Test Error:', error.response?.data || error.message);
  }
}

testPediatricAPIEndpoints();