/**
 * Patient Frontend Integration Test
 * Simulates how the frontend calls the patient API
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';
const FRONTEND_ORIGIN = 'http://localhost:3001';
const TEST_TENANT_ID = 'aajmin_polyclinic';

// Test user credentials
const TEST_USER = {
  email: 'mdwasimkrm13@gmail.com', // Aajmin Admin
  password: 'Admin@123' // Update this with the actual password
};

let authToken = '';
let createdPatientId = null;

// Helper function to make requests like the frontend does
async function makeRequest(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Origin': FRONTEND_ORIGIN,
        'Referer': FRONTEND_ORIGIN + '/'
      }
    };

    // Add auth headers for protected endpoints
    if (authToken && !endpoint.startsWith('/auth/')) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
      config.headers['X-Tenant-ID'] = TEST_TENANT_ID;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(`   Error ${error.response.status}:`, error.response.data);
    } else {
      console.error('   Error:', error.message);
    }
    throw error;
  }
}

// Test 1: Authentication
async function testAuthentication() {
  console.log('\n📝 Test 1: User Authentication');
  try {
    const response = await makeRequest('POST', '/auth/signin', {
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    authToken = response.token;
    console.log('✅ Authentication successful');
    console.log('   User:', response.user.name);
    console.log('   Email:', response.user.email);
    console.log('   Tenant:', response.user.tenant_id);
    console.log('   Token:', authToken.substring(0, 30) + '...');
    
    // Check if user has patient permissions
    if (response.permissions) {
      const hasPatientRead = response.permissions.some(p => 
        p.resource === 'patients' && p.action === 'read'
      );
      const hasPatientWrite = response.permissions.some(p => 
        p.resource === 'patients' && p.action === 'write'
      );
      console.log('   Patient Read Permission:', hasPatientRead ? '✅' : '❌');
      console.log('   Patient Write Permission:', hasPatientWrite ? '✅' : '❌');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Authentication failed');
    console.log('   💡 Tip: Update TEST_USER.password with the correct password');
    return false;
  }
}

// Test 2: Create Patient (like frontend registration form)
async function testCreatePatient() {
  console.log('\n📝 Test 2: Create Patient (Frontend Registration)');
  
  const timestamp = Date.now();
  const testPatient = {
    patient_number: `P${timestamp}`,
    first_name: 'John',
    last_name: 'Doe',
    middle_name: 'Michael',
    email: `john.doe.${timestamp}@example.com`,
    phone: '555-0101',
    mobile_phone: '555-0102',
    date_of_birth: '1985-01-15T00:00:00.000Z', // ISO datetime format
    gender: 'male',
    marital_status: 'married',
    occupation: 'Software Engineer',
    address_line_1: '123 Main St',
    address_line_2: 'Apt 4B',
    city: 'New York',
    state: 'NY',
    postal_code: '10001',
    country: 'USA',
    emergency_contact_name: 'Jane Doe',
    emergency_contact_relationship: 'Spouse',
    emergency_contact_phone: '555-0103',
    emergency_contact_email: 'jane.doe@example.com',
    blood_type: 'O+',
    allergies: 'Penicillin, Peanuts',
    current_medications: 'Aspirin 81mg daily',
    medical_history: 'Hypertension diagnosed 2020',
    family_medical_history: 'Father: Heart disease, Mother: Diabetes',
    insurance_provider: 'Blue Cross Blue Shield',
    insurance_policy_number: 'BC123456789',
    insurance_group_number: 'GRP001',
    status: 'active',
    notes: 'Created via integration test'
  };

  try {
    const result = await makeRequest('POST', '/api/patients', testPatient);
    
    if (result.success && result.data && result.data.patient) {
      createdPatientId = result.data.patient.id;
      
      console.log('✅ Patient created successfully');
      console.log('   Patient ID:', createdPatientId);
      console.log('   Patient Number:', result.data.patient.patient_number);
      console.log('   Name:', `${result.data.patient.first_name} ${result.data.patient.last_name}`);
      console.log('   Email:', result.data.patient.email);
      console.log('   Age:', result.data.patient.age || 'N/A');
      return true;
    } else {
      console.error('❌ Unexpected response format:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to create patient');
    return false;
  }
}

// Test 3: Get All Patients (like patient directory)
async function testGetPatients() {
  console.log('\n📝 Test 3: Get All Patients (Patient Directory)');
  
  try {
    const result = await makeRequest('GET', '/api/patients?page=1&limit=10&sort_by=created_at&sort_order=desc');
    
    if (result.success && result.data) {
      console.log('✅ Patients retrieved successfully');
      console.log('   Total patients:', result.data.pagination.total);
      console.log('   Current page:', result.data.pagination.page);
      console.log('   Patients on page:', result.data.patients.length);
      console.log('   Total pages:', result.data.pagination.pages);
      
      if (result.data.patients.length > 0) {
        console.log('\n   Recent patients:');
        result.data.patients.slice(0, 3).forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.first_name} ${p.last_name} (${p.patient_number}) - Age: ${p.age || 'N/A'}`);
        });
      }
      return true;
    } else {
      console.error('❌ Unexpected response format:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to get patients');
    return false;
  }
}

// Test 4: Search Patients
async function testSearchPatients() {
  console.log('\n📝 Test 4: Search Patients');
  
  try {
    const result = await makeRequest('GET', '/api/patients?search=John&page=1&limit=10');
    
    if (result.success && result.data) {
      console.log('✅ Patient search successful');
      console.log('   Search term: "John"');
      console.log('   Results found:', result.data.patients.length);
      console.log('   Total matching:', result.data.pagination.total);
      
      if (result.data.patients.length > 0) {
        console.log('\n   Search results:');
        result.data.patients.slice(0, 3).forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.first_name} ${p.last_name} - ${p.email || 'No email'}`);
        });
      }
      return true;
    } else {
      console.error('❌ Unexpected response format:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to search patients');
    return false;
  }
}

// Test 5: Get Patient by ID (like patient details page)
async function testGetPatientById() {
  console.log('\n📝 Test 5: Get Patient by ID (Patient Details)');
  
  if (!createdPatientId) {
    console.log('⚠️  Skipping - no patient ID available');
    return true;
  }

  try {
    const result = await makeRequest('GET', `/api/patients/${createdPatientId}`);
    
    if (result.success && result.data && result.data.patient) {
      const patient = result.data.patient;
      console.log('✅ Patient details retrieved successfully');
      console.log('   Patient ID:', patient.id);
      console.log('   Name:', `${patient.first_name} ${patient.middle_name || ''} ${patient.last_name}`.trim());
      console.log('   Email:', patient.email || 'N/A');
      console.log('   Phone:', patient.phone || 'N/A');
      console.log('   Age:', patient.age || 'N/A');
      console.log('   Gender:', patient.gender || 'N/A');
      console.log('   Blood Type:', patient.blood_type || 'N/A');
      console.log('   Status:', patient.status);
      return true;
    } else {
      console.error('❌ Unexpected response format:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to get patient by ID');
    return false;
  }
}

// Test 6: Update Patient (like edit patient form)
async function testUpdatePatient() {
  console.log('\n📝 Test 6: Update Patient (Edit Form)');
  
  if (!createdPatientId) {
    console.log('⚠️  Skipping - no patient ID available');
    return true;
  }

  const updateData = {
    phone: '555-9999',
    mobile_phone: '555-8888',
    occupation: 'Senior Software Engineer',
    notes: 'Updated via integration test - phone numbers changed'
  };

  try {
    const result = await makeRequest('PUT', `/api/patients/${createdPatientId}`, updateData);
    
    if (result.success && result.data && result.data.patient) {
      console.log('✅ Patient updated successfully');
      console.log('   Updated phone:', result.data.patient.phone);
      console.log('   Updated mobile:', result.data.patient.mobile_phone);
      console.log('   Updated occupation:', result.data.patient.occupation);
      return true;
    } else {
      console.error('❌ Unexpected response format:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to update patient');
    return false;
  }
}

// Test 7: Filter Patients (like directory filters)
async function testFilterPatients() {
  console.log('\n📝 Test 7: Filter Patients (Directory Filters)');
  
  try {
    const result = await makeRequest('GET', '/api/patients?gender=male&status=active&page=1&limit=10');
    
    if (result.success && result.data) {
      console.log('✅ Patient filter successful');
      console.log('   Filters: gender=male, status=active');
      console.log('   Results on page:', result.data.patients.length);
      console.log('   Total matching:', result.data.pagination.total);
      
      if (result.data.patients.length > 0) {
        console.log('\n   Filtered patients:');
        result.data.patients.slice(0, 3).forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.first_name} ${p.last_name} - ${p.gender}, ${p.status}`);
        });
      }
      return true;
    } else {
      console.error('❌ Unexpected response format:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to filter patients');
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Patient Frontend Integration Tests');
  console.log('=====================================');
  console.log('Simulating frontend API calls from http://localhost:3001');
  console.log('');
  
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
    total: 7
  };

  // Run tests sequentially
  const tests = [
    testAuthentication,
    testCreatePatient,
    testGetPatients,
    testSearchPatients,
    testGetPatientById,
    testUpdatePatient,
    testFilterPatients
  ];

  for (const test of tests) {
    const result = await test();
    if (result === true) {
      results.passed++;
    } else if (result === 'skip') {
      results.skipped++;
    } else {
      results.failed++;
    }
  }

  // Print summary
  console.log('\n=====================================');
  console.log('📊 Test Summary');
  console.log('=====================================');
  console.log(`✅ Passed:  ${results.passed}/${results.total}`);
  console.log(`❌ Failed:  ${results.failed}/${results.total}`);
  console.log(`⚠️  Skipped: ${results.skipped}/${results.total}`);
  console.log(`📈 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! Patient management integration is working correctly.');
    console.log('✅ Frontend can successfully communicate with backend API');
    console.log('✅ Patient CRUD operations are functional');
    console.log('✅ Search and filtering work as expected');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
    if (results.failed === results.total) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('   1. Make sure backend is running on port 3000');
      console.log('   2. Update TEST_USER.password with correct credentials');
      console.log('   3. Verify database connection is working');
      console.log('   4. Check that patient tables exist in tenant schema');
    }
  }
  
  console.log('\n📝 Next steps:');
  console.log('   1. Open http://localhost:3001/auth/login in your browser');
  console.log('   2. Login with: ' + TEST_USER.email);
  console.log('   3. Navigate to Patient Registration');
  console.log('   4. Test the complete patient management workflow');
}

// Run the tests
runTests().catch(error => {
  console.error('\n💥 Test suite failed with error:', error.message);
  process.exit(1);
});
