const http = require('http');

function testAPI(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': 'aajmin_polyclinic',
        'X-App-ID': 'hospital-management',
        'X-API-Key': 'hospital-dev-key-789',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function testPediatricAPI() {
  try {
    console.log('=== TESTING PEDIATRIC API ENDPOINTS ===');
    
    // Test server health
    console.log('\n1. Testing server health...');
    const healthResponse = await testAPI('/');
    console.log(`Status: ${healthResponse.statusCode}`);
    
    // Test Pediatrics Stats
    console.log('\n2. Testing Pediatrics Stats API...');
    const statsResponse = await testAPI('/api/bed-management/departments/pediatrics/stats');
    console.log(`Status: ${statsResponse.statusCode}`);
    console.log('Response:', statsResponse.body);
    
    // Test Pediatrics Beds
    console.log('\n3. Testing Pediatrics Beds API...');
    const bedsResponse = await testAPI('/api/bed-management/departments/pediatrics/beds');
    console.log(`Status: ${bedsResponse.statusCode}`);
    console.log('Response:', bedsResponse.body);
    
    // Test Maternity for comparison
    console.log('\n4. Testing Maternity Stats (for comparison)...');
    const maternityStatsResponse = await testAPI('/api/bed-management/departments/maternity/stats');
    console.log(`Status: ${maternityStatsResponse.statusCode}`);
    console.log('Response:', maternityStatsResponse.body);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testPediatricAPI();