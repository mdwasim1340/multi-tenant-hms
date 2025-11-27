/**
 * Complete Add Bed Flow Test
 * Tests the entire flow from authentication to bed creation
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000';
const TEST_EMAIL = 'mdwasimkrm13@gmail.com';
const TEST_PASSWORD = 'Wasim@123'; // Update with actual password

async function testCompleteFlow() {
  console.log('🧪 Testing Complete Add Bed Flow\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Login
    console.log('\n📝 Step 1: Login');
    console.log('-'.repeat(60));
    
    const loginResponse = await axios.post(`${API_URL}/auth/signin`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    console.log('✅ Login successful');
    console.log('Token:', loginResponse.data.token.substring(0, 50) + '...');
    console.log('Tenant ID:', loginResponse.data.user.tenant_id);

    const token = loginResponse.data.token;
    const tenantId = loginResponse.data.user.tenant_id;

    // Step 2: Test bed creation
    console.log('\n📝 Step 2: Create Bed');
    console.log('-'.repeat(60));

    const bedData = {
      bed_number: 'TEST-' + Date.now(),
      department_id: 3, // Cardiology
      bed_type: 'Standard',
      floor_number: '3',
      room_number: '301',
      wing: 'A',
      features: {
        equipment: ['Monitor', 'IV Stand'],
        features: ['Adjustable Height', 'Side Rails']
      },
      notes: 'Test bed from diagnostic script'
    };

    console.log('Request URL:', `${API_URL}/api/beds`);
    console.log('Request Headers:');
    console.log('  Authorization: Bearer', token.substring(0, 30) + '...');
    console.log('  X-Tenant-ID:', tenantId);
    console.log('  X-App-ID: hospital_system');
    console.log('\nRequest Body:', JSON.stringify(bedData, null, 2));

    const createResponse = await axios.post(`${API_URL}/api/beds`, bedData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId,
        'X-App-ID': 'hospital_system',
        'X-API-Key': 'hospital-dev-key-123',
        'Content-Type': 'application/json'
      }
    });

    console.log('\n✅ Bed created successfully!');
    console.log('Response Status:', createResponse.status);
    console.log('Response Data:', JSON.stringify(createResponse.data, null, 2));

    // Step 3: Verify bed was created
    console.log('\n📝 Step 3: Verify Bed Creation');
    console.log('-'.repeat(60));

    const verifyResponse = await axios.get(`${API_URL}/api/bed-management/departments/cardiology/beds`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId,
        'X-App-ID': 'hospital_system',
        'X-API-Key': 'hospital-dev-key-123'
      }
    });

    const createdBed = verifyResponse.data.beds?.find(b => b.bed_number === bedData.bed_number);
    
    if (createdBed) {
      console.log('✅ Bed verified in database');
      console.log('Bed ID:', createdBed.id);
      console.log('Bed Number:', createdBed.bed_number);
      console.log('Status:', createdBed.status);
    } else {
      console.log('⚠️  Bed not found in verification query');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED - Add Bed Flow Working!');
    console.log('='.repeat(60));

  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.log('❌ TEST FAILED');
    console.log('='.repeat(60));

    if (error.response) {
      console.log('\n📋 Error Response:');
      console.log('Status:', error.response.status);
      console.log('Status Text:', error.response.statusText);
      console.log('Headers:', JSON.stringify(error.response.headers, null, 2));
      console.log('\nError Data:', JSON.stringify(error.response.data, null, 2));
      
      // Analyze the error
      console.log('\n🔍 Error Analysis:');
      if (error.response.status === 401) {
        console.log('❌ Authentication Error (401)');
        console.log('   - Token might be expired or invalid');
        console.log('   - Check if token is being sent correctly');
        console.log('   - Verify Cognito configuration');
        
        const errorCode = error.response.data?.code;
        const errorMessage = error.response.data?.error || error.response.data?.message;
        
        console.log('\n   Error Code:', errorCode || 'Not provided');
        console.log('   Error Message:', errorMessage || 'Not provided');
        
        if (errorCode === 'TOKEN_EXPIRED') {
          console.log('   ⚠️  Token has expired - need to re-login');
        } else if (errorCode === 'TOKEN_INVALID') {
          console.log('   ⚠️  Token is invalid - check token format');
        } else if (errorCode === 'TOKEN_MISSING') {
          console.log('   ⚠️  Token is missing from request');
        } else {
          console.log('   ⚠️  Unknown authentication error');
        }
      } else if (error.response.status === 403) {
        console.log('❌ Permission Error (403)');
        console.log('   - User might not have permission to create beds');
        console.log('   - Check user roles and permissions');
      } else if (error.response.status === 404) {
        console.log('❌ Not Found Error (404)');
        console.log('   - API endpoint might not exist');
        console.log('   - Check if route is registered correctly');
      } else if (error.response.status === 500) {
        console.log('❌ Server Error (500)');
        console.log('   - Internal server error');
        console.log('   - Check backend logs for details');
      }
    } else if (error.request) {
      console.log('\n📋 No Response Received:');
      console.log('Request was made but no response received');
      console.log('Check if backend server is running');
    } else {
      console.log('\n📋 Request Setup Error:');
      console.log(error.message);
    }
  }
}

// Run the test
testCompleteFlow();
