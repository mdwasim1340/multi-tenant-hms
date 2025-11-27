const axios = require('axios');

async function testPediatricAPICalls() {
  try {
    console.log('=== TESTING PEDIATRIC DEPARTMENT API CALLS ===');
    
    // Test the actual API endpoints that the frontend is calling
    const baseURL = 'http://localhost:3000';
    
    // You'll need to get a real token - for now let's simulate
    const headers = {
      'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjEifQ.eyJzdWIiOiJhZG1pbkBhYWptaW4uY29tIiwiZW1haWwiOiJhZG1pbkBhYWptaW4uY29tIiwidGVuYW50IjoiYWFqbWluX3BvbHljbGluaWMiLCJyb2xlIjoiQWRtaW4iLCJpYXQiOjE3MzI4MjE2MjEsImV4cCI6MTczMjgyNTIyMX0.example', // This would be a real token
      'X-Tenant-ID': 'aajmin_polyclinic',
      'X-App-ID': 'hospital-management',
      'X-API-Key': 'hospital-dev-key-789'
    };
    
    console.log('\n1. Testing Pediatric Department Stats API...');
    try {
      const statsResponse = await axios.get(`${baseURL}/api/bed-management/departments/pediatrics/stats`, { headers });
      console.log('Stats Response:', JSON.stringify(statsResponse.data, null, 2));
    } catch (error) {
      console.log('Stats API Error:', error.response?.data || error.message);
    }
    
    console.log('\n2. Testing Pediatric Department Beds API...');
    try {
      const bedsResponse = await axios.get(`${baseURL}/api/bed-management/departments/pediatrics/beds`, { headers });
      console.log('Beds Response:');
      console.log(`- Total beds returned: ${bedsResponse.data.beds?.length || 0}`);
      console.log(`- Pagination total: ${bedsResponse.data.pagination?.total || 0}`);
      
      if (bedsResponse.data.beds && bedsResponse.data.beds.length > 0) {
        console.log('First few beds:');
        bedsResponse.data.beds.slice(0, 5).forEach(bed => {
          console.log(`  - ${bed.bed_number}: ${bed.status} (category: ${bed.category_id})`);
        });
      }
    } catch (error) {
      console.log('Beds API Error:', error.response?.data || error.message);
    }
    
    console.log('\n3. Testing with direct database query simulation...');
    // This simulates what the API should be doing
    console.log('Expected query: SELECT * FROM beds WHERE category_id = 4');
    console.log('Expected result: Only Pediatric beds (category_id = 4)');
    
  } catch (error) {
    console.error('Test Error:', error.message);
  }
}

testPediatricAPICalls();