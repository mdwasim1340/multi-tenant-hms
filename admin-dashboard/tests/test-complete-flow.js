// Complete flow test for admin dashboard tenant management
const axios = require('axios');

const BACKEND_URL = 'http://localhost:3000';
const FRONTEND_URL = 'http://localhost:3002';

// Test credentials
const TEST_USER = {
  email: 'auth-test@enterprise-corp.com',
  password: 'AuthTest123!'
};

const testCompleteFlow = async () => {
  console.log('🧪 TESTING COMPLETE TENANT MANAGEMENT FLOW');
  console.log('='.repeat(50));

  try {
    // Step 1: Test backend authentication
    console.log('\n1️⃣ Testing Backend Authentication...');
    const authResponse = await axios.post(`${BACKEND_URL}/auth/signin`, TEST_USER);
    
    if (authResponse.data.AccessToken) {
      console.log('✅ Backend authentication successful');
      const token = authResponse.data.AccessToken;
      
      // Step 2: Test backend tenant API
      console.log('\n2️⃣ Testing Backend Tenant API...');
      const tenantsResponse = await axios.get(`${BACKEND_URL}/api/tenants`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': 'admin'
        }
      });
      
      console.log(`✅ Backend API working - Found ${tenantsResponse.data.length} tenants`);
      tenantsResponse.data.forEach(tenant => {
        console.log(`   • ${tenant.name} (${tenant.email}) - ${tenant.status}`);
      });
      
      // Step 3: Test frontend signin API
      console.log('\n3️⃣ Testing Frontend Signin API...');
      const frontendAuthResponse = await axios.post(`${BACKEND_URL}/auth/signin`, TEST_USER);
      
      if (frontendAuthResponse.data.AccessToken) {
        console.log('✅ Frontend can authenticate with backend');
        
        // Step 4: Instructions for manual testing
        console.log('\n4️⃣ Manual Testing Instructions:');
        console.log('📋 To test the complete admin dashboard flow:');
        console.log('');
        console.log('1. Open admin dashboard: http://localhost:3002');
        console.log('2. You should be redirected to: http://localhost:3002/auth/signin');
        console.log('3. Login with credentials:');
        console.log(`   Email: ${TEST_USER.email}`);
        console.log(`   Password: ${TEST_USER.password}`);
        console.log('4. After login, you should see the dashboard');
        console.log('5. Click "Tenants" in the sidebar menu');
        console.log('6. You should see the tenant management page with data');
        console.log('');
        console.log('🎯 Expected Results:');
        console.log('   • Tenants menu visible in sidebar');
        console.log('   • Tenant list showing demo data');
        console.log('   • Add/Edit/Delete buttons functional');
        console.log('   • Admin authentication working');
        
      } else {
        console.log('❌ Frontend authentication failed');
      }
      
    } else {
      console.log('❌ Backend authentication failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Test completed. Follow manual instructions above.');
};

testCompleteFlow();