const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000';

// Test both users
const TEST_USERS = [
  {
    email: 'mdwasimkrm13@gmail.com',
    password: 'TempPassword123!' // You'll need to provide the correct password
  },
  {
    email: 'auth-test@enterprise-corp.com',
    password: 'AuthTest123!'
  }
];

const testUserAuthentication = async () => {
  console.log('🔐 TESTING USER AUTHENTICATION & TENANT ACCESS');
  console.log('='.repeat(60));

  for (const user of TEST_USERS) {
    try {
      console.log(`\n👤 Testing user: ${user.email}`);
      
      // Test authentication
      const authResponse = await axios.post(`${BASE_URL}/auth/signin`, user);
      
      if (authResponse.data.AccessToken) {
        console.log('✅ Authentication successful');
        const token = authResponse.data.AccessToken;
        
        // Decode token to check groups
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
        
        console.log('📋 Token details:');
        console.log(`   Username: ${payload.username || payload['cognito:username']}`);
        console.log(`   Groups: ${JSON.stringify(payload['cognito:groups'] || [])}`);
        console.log(`   Is Admin: ${payload['cognito:groups']?.includes('admin') ? 'YES' : 'NO'}`);
        
        // Test tenant API access
        console.log('\n🏥 Testing tenant API access...');
        const tenantsResponse = await axios.get(`${BASE_URL}/api/tenants`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': 'admin'
          }
        });
        
        console.log(`✅ Tenant API access successful - Found ${tenantsResponse.data.length} tenants`);
        tenantsResponse.data.forEach(tenant => {
          console.log(`   • ${tenant.name} (${tenant.email}) - ${tenant.status}`);
        });
        
      } else {
        console.log('❌ Authentication failed - no token received');
      }
      
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('Incorrect username or password')) {
        console.log('❌ Authentication failed - incorrect password');
        console.log('💡 Please update the password in the test or reset the user password');
      } else if (error.response?.status === 403) {
        console.log('❌ Access denied - user may not have admin privileges');
      } else {
        console.log('❌ Error:', error.response?.data?.message || error.message);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 Authentication test completed');
};

testUserAuthentication();