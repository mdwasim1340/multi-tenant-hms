const axios = require('axios');

console.log('Testing backend API...\n');

async function test() {
  try {
    // Test 1: Server health
    console.log('1. Testing server health...');
    const health = await axios.get('http://localhost:3000/auth/signin');
    console.log('   ❌ Should have failed (no credentials)');
  } catch (error) {
    if (error.response) {
      console.log(`   ✅ Server responding: ${error.response.status}`);
    } else {
      console.log(`   ❌ Server not responding: ${error.message}`);
    }
  }
  
  // Test 2: Login
  console.log('\n2. Testing admin login...');
  try {
    const login = await axios.post('http://localhost:3000/auth/signin', {
      email: 'admin@autoid.com',
      password: 'password123'
    });
    console.log('   ✅ Login successful');
    console.log(`   Token: ${login.data.AuthenticationResult?.AccessToken?.substring(0, 20)}...`);
    
    const token = login.data.AuthenticationResult?.AccessToken || login.data.token;
    
    // Test 3: Get tenants
    console.log('\n3. Testing tenant list...');
    const tenants = await axios.get('http://localhost:3000/api/tenants', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': 'admin',
        'X-App-ID': 'admin-dashboard',
        'X-API-Key': 'admin-dev-key-456'
      }
    });
    console.log(`   ✅ Retrieved ${tenants.data.length || tenants.data.tenants?.length || 0} tenants`);
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.response?.data?.message || error.message}`);
  }
}

test().then(() => {
  console.log('\n✅ Tests complete');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ Test failed:', err.message);
  process.exit(1);
});
