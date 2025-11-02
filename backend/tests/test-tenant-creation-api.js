const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000';

// Test credentials
const TEST_USER = {
  email: 'auth-test@enterprise-corp.com',
  password: 'AuthTest123!'
};

const testTenantCreation = async () => {
  console.log('🧪 TESTING TENANT CREATION API');
  console.log('='.repeat(50));

  try {
    // Step 1: Authenticate
    console.log('\n1️⃣ Authenticating...');
    const authResponse = await axios.post(`${BASE_URL}/auth/signin`, TEST_USER);
    
    if (!authResponse.data.AccessToken) {
      throw new Error('Authentication failed');
    }
    
    const token = authResponse.data.AccessToken;
    console.log('✅ Authentication successful');

    // Step 2: Test different tenant creation scenarios
    const testCases = [
      {
        name: 'Valid Complete Data',
        data: {
          id: 'test_complete_' + Date.now(),
          name: 'Complete Test Hospital',
          email: 'complete@test.com',
          plan: 'premium',
          status: 'active'
        }
      },
      {
        name: 'Missing ID (should auto-generate)',
        data: {
          name: 'Auto ID Hospital',
          email: 'autoid@test.com',
          plan: 'basic',
          status: 'active'
        }
      },
      {
        name: 'Missing Required Field (should fail)',
        data: {
          id: 'test_missing_' + Date.now(),
          name: 'Missing Email Hospital',
          // email missing
          plan: 'premium',
          status: 'active'
        }
      },
      {
        name: 'Complex Form Data (like from wizard)',
        data: {
          // Basic info
          name: 'Complex Form Hospital',
          email: 'complex@test.com',
          plan: 'enterprise',
          status: 'active',
          // Extra fields that should be ignored
          authProvider: 'cognito',
          mfaEnabled: true,
          sessionTimeout: '30',
          emailProvider: 'ses',
          storageProvider: 's3',
          apiRateLimit: '1000'
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n2️⃣ Testing: ${testCase.name}`);
      
      try {
        const response = await axios.post(`${BASE_URL}/api/tenants`, testCase.data, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': 'admin',
            'Content-Type': 'application/json'
          }
        });
        
        if (response.status === 201) {
          console.log(`✅ SUCCESS: ${response.data.message}`);
        } else {
          console.log(`⚠️ Unexpected status: ${response.status}`);
        }
        
      } catch (error) {
        if (testCase.name.includes('should fail')) {
          console.log(`✅ EXPECTED FAILURE: ${error.response?.data?.message || error.message}`);
        } else {
          console.log(`❌ UNEXPECTED FAILURE: ${error.response?.data?.message || error.message}`);
        }
      }
    }

    // Step 3: Verify tenants were created
    console.log('\n3️⃣ Verifying created tenants...');
    const listResponse = await axios.get(`${BASE_URL}/api/tenants`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': 'admin'
      }
    });
    
    console.log(`✅ Total tenants in database: ${listResponse.data.length}`);
    listResponse.data.forEach(tenant => {
      console.log(`   • ${tenant.name} (${tenant.id}) - ${tenant.status}`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Tenant creation API test completed');
};

testTenantCreation();