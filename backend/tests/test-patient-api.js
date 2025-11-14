/**
 * Patient API Integration Test
 * Tests the complete patient management API endpoints
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';
const TEST_TENANT_ID = 'aajmin_polyclinic'; // Use existing tenant

// Test credentials (you'll need to update these with valid credentials)
const TEST_USER = {
  email: 'admin@aajminpolyclinic.com',
  password: 'Admin@123'
};

let authToken = '';
let createdPatientId = null;

// Helper function to make authenticated requests
async function makeRequest(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': TEST_TENANT_ID,
        'X-App-ID': 'hospital-management',
        'X-API-Key': 'hospital-dev-key-123',
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ Error in ${method} ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
}

// Test 1: Authentication
async function testAuthentication() {
  console.log('\n📝 Test 1: Authentication');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/signin`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    authToken = response.data.token;
    console.log('✅ Authentication successful');
    console.log('   Token:', authToken.substring(0, 20) + '...');
    return true;
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 2: Create Patient
async function testCreatePatient() {
  console.log('\n📝 Test 2: Create Patient');
  
  const testPatient = {
    patient_number: `P${Date.now()}`,
    first_name: 'John',
    last_name: 'Doe',
    middle_name: 'Michael',
    email: 'john.doe@example.com',
    phone: '555-0101',
    mobile_phone: '555-0102',
    date_of_birth: '1985-01-15T00:00:00.000Z',
    gender: 'male',
    marital_status: 'married',
    occupation: 'Software Engineer',
    address_line_1: '123 Main St',
    city: 'New York',
    state: 'NY',
    postal_code: '10001',
    country: 'USA',
    emergency_contact_name: 'Jane Doe',
    emergency_contact_relationship: 'Spouse',
    emergency_contact_phone: '555-0103',
    blood_type: 'O+',
    allergies: 'Penicillin',
    current_medications: 'None',
    medical_history: 'No significant medical history',
    insurance_provider: 'Blue Cross',
    insurance_policy_number: 'BC123456',
    status: 'active'
  };

  try {
    const result = await makeRequest('POST', '/api/patients', testPatient);
    createdPatientId = result.data.patient.id;
    
    console.log('✅ Patient created successfully');
    console.log('   Patient ID:', createdPatientId);
    console.log('   Patient Number:', result.data.patient.patient_number);
    console.log('   Name:', `${result.data.patient.first_name} ${result.data.patient.last_name}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to create patient');
    return false;
  }
}

// Test 3: Get All Patients
async function testGetPatients() {
  console.log('\n📝 Test 3: Get All Patients');
  
  try {
    const result = await makeRequest('GET', '/api/patients?page=1&limit=10');
    
    console.log('✅ Patients retrieved successfully');
    console.log('   Total patients:', result.data.pagination.total);
    console.log('   Current page:', result.data.pagination.page);
    console.log('   Patients on this page:', result.data.patients.length);
    
    if (result.data.patients.length > 0) {
      console.log('   First patient:', result.data.patients[0].first_name, result.data.patients[0].last_name);
    }
    return true;
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
    
    console.log('✅ Patient search successful');
    console.log('   Search results:', result.data.patients.length);
    
    if (result.data.patients.length > 0) {
      console.log('   Found:', result.data.patients[0].first_name, result.data.patients[0].last_name);
    }
    return true;
  } catch (error) {
    console.error('❌ Failed to search patients');
    return false;
  }
}

// Test 5: Get Patient by ID
async function testGetPatientById() {
  console.log('\n📝 Test 5: Get Patient by ID');
  
  if (!createdPatientId) {
    console.log('⚠️  Skipping - no patient ID available');
    return true;
  }

  try {
    const result = await makeRequest('GET', `/api/patients/${createdPatientId}`);
    
    console.log('✅ Patient retrieved successfully');
    console.log('   Patient ID:', result.data.patient.id);
    console.log('   Name:', `${result.data.patient.first_name} ${result.data.patient.last_name}`);
    console.log('   Email:', result.data.patient.email);
    console.log('   Age:', result.data.patient.age);
    return true;
  } catch (error) {
    console.error('❌ Failed to get patient by ID');
    return false;
  }
}

// Test 6: Update Patient
async function testUpdatePatient() {
  console.log('\n📝 Test 6: Update Patient');
  
  if (!createdPatientId) {
    console.log('⚠️  Skipping - no patient ID available');
    return true;
  }

  const updateData = {
    phone: '555-9999',
    occupation: 'Senior Software Engineer',
    notes: 'Updated via API test'
  };

  try {
    const result = await makeRequest('PUT', `/api/patients/${createdPatientId}`, updateData);
    
    console.log('✅ Patient updated successfully');
    console.log('   Updated phone:', result.data.patient.phone);
    console.log('   Updated occupation:', result.data.patient.occupation);
    return true;
  } catch (error) {
    console.error('❌ Failed to update patient');
    return false;
  }
}

// Test 7: Filter Patients
async function testFilterPatients() {
  console.log('\n📝 Test 7: Filter Patients');
  
  try {
    const result = await makeRequest('GET', '/api/patients?gender=male&status=active&page=1&limit=10');
    
    console.log('✅ Patient filter successful');
    console.log('   Filtered results:', result.data.patients.length);
    console.log('   Total matching:', result.data.pagination.total);
    return true;
  } catch (error) {
    console.error('❌ Failed to filter patients');
    return false;
  }
}

// Test 8: Soft Delete Patient
async function testDeletePatient() {
  console.log('\n📝 Test 8: Soft Delete Patient');
  
  if (!createdPatientId) {
    console.log('⚠️  Skipping - no patient ID available');
    return true;
  }

  try {
    const result = await makeRequest('DELETE', `/api/patients/${createdPatientId}`);
    
    console.log('✅ Patient deactivated successfully');
    console.log('   Status:', result.data.patient.status);
    return true;
  } catch (error) {
    console.error('❌ Failed to delete patient');
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Patient API Integration Tests');
  console.log('==========================================');
  
  const results = {
    passed: 0,
    failed: 0,
    total: 8
  };

  // Run tests sequentially
  if (await testAuthentication()) results.passed++; else results.failed++;
  if (await testCreatePatient()) results.passed++; else results.failed++;
  if (await testGetPatients()) results.passed++; else results.failed++;
  if (await testSearchPatients()) results.passed++; else results.failed++;
  if (await testGetPatientById()) results.passed++; else results.failed++;
  if (await testUpdatePatient()) results.passed++; else results.failed++;
  if (await testFilterPatients()) results.passed++; else results.failed++;
  if (await testDeletePatient()) results.passed++; else results.failed++;

  // Print summary
  console.log('\n==========================================');
  console.log('📊 Test Summary');
  console.log('==========================================');
  console.log(`✅ Passed: ${results.passed}/${results.total}`);
  console.log(`❌ Failed: ${results.failed}/${results.total}`);
  console.log(`📈 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! Patient API is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
