/**
 * Test Critical Allergies Endpoint Fix
 * 
 * Tests that the route ordering fix resolves the 500 error
 * when fetching critical allergies for a patient.
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test credentials
const TEST_EMAIL = 'admin@example.com';
const TEST_PASSWORD = 'Admin@123';

async function testCriticalAllergiesFix() {
  console.log('🧪 Testing Critical Allergies Endpoint Fix\n');

  try {
    // Step 1: Sign in
    console.log('1️⃣  Signing in...');
    const signInResponse = await axios.post(`${BASE_URL}/auth/signin`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    const token = signInResponse.data.token;
    const tenantId = signInResponse.data.user.tenant_id;
    console.log(`✅ Signed in successfully`);
    console.log(`   Tenant ID: ${tenantId}\n`);

    // Step 2: Get a patient ID (use first patient)
    console.log('2️⃣  Fetching patients...');
    const patientsResponse = await axios.get(`${BASE_URL}/api/patients`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId,
        'X-App-ID': 'hospital-management',
        'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-123'
      }
    });

    if (!patientsResponse.data.patients || patientsResponse.data.patients.length === 0) {
      console.log('⚠️  No patients found. Creating test patient...');
      
      const createResponse = await axios.post(`${BASE_URL}/api/patients`, {
        patient_number: `TEST-${Date.now()}`,
        first_name: 'Test',
        last_name: 'Patient',
        date_of_birth: '1990-01-01',
        gender: 'male',
        blood_type: 'O+',
        email: `test${Date.now()}@example.com`,
        phone: '1234567890'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
          'X-App-ID': 'hospital-management',
          'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-123'
        }
      });

      var patientId = createResponse.data.id;
      console.log(`✅ Created test patient with ID: ${patientId}\n`);
    } else {
      var patientId = patientsResponse.data.patients[0].id;
      console.log(`✅ Using existing patient with ID: ${patientId}\n`);
    }

    // Step 3: Test critical allergies endpoint (this was failing with 500)
    console.log('3️⃣  Testing critical allergies endpoint...');
    const allergiesResponse = await axios.get(
      `${BASE_URL}/api/medical-history/patient/${patientId}/critical-allergies`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
          'X-App-ID': 'hospital-management',
          'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-123'
        }
      }
    );

    console.log(`✅ Critical allergies endpoint working!`);
    console.log(`   Status: ${allergiesResponse.status}`);
    console.log(`   Response:`, JSON.stringify(allergiesResponse.data, null, 2));
    console.log(`   Found ${allergiesResponse.data.allergies?.length || 0} critical allergies\n`);

    // Step 4: Test patient summary endpoint (also has specific route)
    console.log('4️⃣  Testing patient summary endpoint...');
    const summaryResponse = await axios.get(
      `${BASE_URL}/api/medical-history/patient/${patientId}/summary`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
          'X-App-ID': 'hospital-management',
          'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-123'
        }
      }
    );

    console.log(`✅ Patient summary endpoint working!`);
    console.log(`   Status: ${summaryResponse.status}`);
    console.log(`   Summary:`, JSON.stringify(summaryResponse.data, null, 2));
    console.log();

    // Step 5: Test general patient history endpoint
    console.log('5️⃣  Testing general patient history endpoint...');
    const historyResponse = await axios.get(
      `${BASE_URL}/api/medical-history/patient/${patientId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
          'X-App-ID': 'hospital-management',
          'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-123'
        }
      }
    );

    console.log(`✅ General patient history endpoint working!`);
    console.log(`   Status: ${historyResponse.status}`);
    console.log(`   Found ${historyResponse.data.entries?.length || 0} entries\n`);

    console.log('🎉 All tests passed! Route ordering fix successful!\n');
    console.log('📋 Summary:');
    console.log('   ✅ Critical allergies endpoint: Working');
    console.log('   ✅ Patient summary endpoint: Working');
    console.log('   ✅ General patient history endpoint: Working');
    console.log('   ✅ No route conflicts detected\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Run the test
testCriticalAllergiesFix();
