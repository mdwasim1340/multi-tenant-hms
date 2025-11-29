// Debug frontend API calls to identify the issue
const axios = require('axios');

const BACKEND_URL = 'http://localhost:3000';
const FRONTEND_URL = 'http://localhost:3002';

// Test credentials
const TEST_USER = {
  email: 'auth-test@enterprise-corp.com',
  password: 'AuthTest123!'
};

const debugFrontendAPI = async () => {
  console.log('🔍 DEBUGGING FRONTEND API CALLS');
  console.log('='.repeat(50));

  try {
    // Step 1: Test direct backend API
    console.log('\n1️⃣ Testing Direct Backend API...');
    const authResponse = await axios.post(`${BACKEND_URL}/auth/signin`, TEST_USER);
    
    if (authResponse.data.AccessToken) {
      const token = authResponse.data.AccessToken;
      console.log('✅ Backend authentication successful');
      
      // Test direct tenant API call
      const tenantsResponse = await axios.get(`${BACKEND_URL}/api/tenants`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': 'admin'
        }
      });
      
      console.log(`✅ Direct API call successful - Found ${tenantsResponse.data.length} tenants`);
      tenantsResponse.data.forEach(tenant => {
        console.log(`   • ${tenant.name} (${tenant.id})`);
      });
      
      // Step 2: Test frontend API simulation
      console.log('\n2️⃣ Simulating Frontend API Call...');
      
      // Simulate the exact call that frontend makes
      const frontendSimulation = await axios.get(`${BACKEND_URL}/api/tenants`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': 'admin',
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ Frontend simulation successful - Found ${frontendSimulation.data.length} tenants`);
      
      // Step 3: Test with different headers
      console.log('\n3️⃣ Testing Different Header Combinations...');
      
      const headerTests = [
        { name: 'No X-Tenant-ID', headers: { 'Authorization': `Bearer ${token}` } },
        { name: 'Wrong Tenant ID', headers: { 'Authorization': `Bearer ${token}`, 'X-Tenant-ID': 'wrong' } },
        { name: 'No Authorization', headers: { 'X-Tenant-ID': 'admin' } },
        { name: 'Correct Headers', headers: { 'Authorization': `Bearer ${token}`, 'X-Tenant-ID': 'admin' } }
      ];
      
      for (const test of headerTests) {
        try {
          const response = await axios.get(`${BACKEND_URL}/api/tenants`, { headers: test.headers });
          console.log(`✅ ${test.name}: SUCCESS - ${response.data.length} tenants`);
        } catch (error) {
          console.log(`❌ ${test.name}: FAILED - ${error.response?.status} ${error.response?.data?.message || error.message}`);
        }
      }
      
      // Step 4: Check CORS
      console.log('\n4️⃣ Testing CORS Configuration...');
      try {
        const corsResponse = await axios.options(`${BACKEND_URL}/api/tenants`, {
          headers: {
            'Origin': 'http://localhost:3002',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'authorization,x-tenant-id'
          }
        });
        console.log('✅ CORS preflight successful');
      } catch (error) {
        console.log('❌ CORS preflight failed:', error.message);
      }
      
      // Step 5: Create a test tenant for frontend
      console.log('\n5️⃣ Creating Test Tenant for Frontend...');
      const testTenant = {
        id: 'frontend_test_' + Date.now(),
        name: 'Frontend Test Hospital',
        email: 'frontend@test.com',
        plan: 'premium',
        status: 'active'
      };
      
      try {
        await axios.post(`${BACKEND_URL}/api/tenants`, testTenant, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': 'admin',
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ Test tenant created for frontend testing');
      } catch (error) {
        console.log('❌ Failed to create test tenant:', error.response?.data?.message || error.message);
      }
      
      // Final verification
      const finalCheck = await axios.get(`${BACKEND_URL}/api/tenants`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': 'admin'
        }
      });
      
      console.log(`\n📊 Final tenant count: ${finalCheck.data.length}`);
      
    } else {
      console.log('❌ Backend authentication failed');
    }
    
  } catch (error) {
    console.error('❌ Debug test failed:', error.response?.data || error.message);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🎯 FRONTEND DEBUGGING INSTRUCTIONS:');
  console.log('1. Open browser to: http://localhost:3002/tenants');
  console.log('2. Open browser developer tools (F12)');
  console.log('3. Go to Network tab');
  console.log('4. Click "Re-login as Admin" button');
  console.log('5. Check network requests for /api/tenants');
  console.log('6. Verify request headers include:');
  console.log('   - Authorization: Bearer <token>');
  console.log('   - X-Tenant-ID: admin');
  console.log('7. Check response status and data');
  console.log('\n💡 If tenants still not loading:');
  console.log('   - Clear browser cache and cookies');
  console.log('   - Hard refresh (Ctrl+F5)');
  console.log('   - Check browser console for errors');
};

debugFrontendAPI();