/**
 * Quick Test for Balance Reports API
 * 
 * Tests the profit-loss endpoint to verify it's working
 */

const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/balance-reports/profit-loss?start_date=2024-11-01&end_date=2024-11-30',
  method: 'GET',
  headers: {
    'X-Tenant-ID': 'aajmin_polyclinic',
    'X-App-ID': 'hospital-management',
    'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-123',
    'Content-Type': 'application/json',
    'Origin': 'http://localhost:3001'
  }
};

console.log('🧪 Testing Balance Reports API...\n');
console.log('Request:', options.method, `http://${options.hostname}:${options.port}${options.path}`);
console.log('Headers:', JSON.stringify(options.headers, null, 2));
console.log('');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
    
    if (res.statusCode === 200) {
      try {
        const json = JSON.parse(data);
        if (json.success) {
          console.log('\n✅ API is working!');
          if (json.warnings && json.warnings.length > 0) {
            console.log('⚠️  Warnings:', json.warnings);
          }
        } else {
          console.log('\n❌ API returned success: false');
        }
      } catch (e) {
        console.log('\n❌ Failed to parse JSON response');
      }
    } else if (res.statusCode === 401) {
      console.log('\n⚠️  Authentication required - this is expected without a valid JWT token');
      console.log('The API endpoint exists and is responding correctly.');
    } else if (res.statusCode === 500) {
      console.log('\n❌ Server error - check backend logs for details');
    } else {
      console.log('\n⚠️  Unexpected status code');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  if (error.code === 'ECONNREFUSED') {
    console.log('\n💡 Backend server is not running. Start it with: npm run dev');
  }
});

req.end();
