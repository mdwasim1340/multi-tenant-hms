/**
 * Bed Management System Test Script
 * Tests all bed management endpoints
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TENANT_ID = 'tenant_1762083064503'; // Auto ID Hospital
const API_KEY = process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-123';

// Test user credentials
const TEST_USER = {
  email: 'admin@autoid.com',
  password: 'Admin@123'
};

let authToken = null;

// Helper function to make authenticated requests
async function makeRequest(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': TENANT_ID,
        'X-App-ID': 'hospital-management',
        'X-API-Key': API_KEY
      }
    };

    if (authToken) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

// Test functions
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...');
  const result = await makeRequest('POST', '/auth/signin', TEST_USER);
  
  if (result.success && result.data.token) {
    authToken = result.data.token;
    console.log('✅ Authentication successful');
    return true;
  } else {
    console.log('❌ Authentication failed:', result.error);
    return false;
  }
}

async function testDepartments() {
  console.log('\n🏥 Testing Departments...');
  
  // List departments
  const list = await makeRequest('GET', '/api/bed-management/departments');
  console.log(list.success ? '✅ List departments' : '❌ List departments failed');
  
  // Create department
  const create = await makeRequest('POST', '/api/bed-management/departments', {
    department_code: 'ICU-001',
    name: 'Intensive Care Unit',
    description: 'Critical care department',
    floor_number: 3,
    building: 'Main Building',
    total_bed_capacity: 20
  });
  console.log(create.success ? '✅ Create department' : '❌ Create department failed');
  
  return create.success ? create.data.department?.id : null;
}

async function testBeds(departmentId) {
  console.log('\n🛏️  Testing Beds...');
  
  // List beds
  const list = await makeRequest('GET', '/api/bed-management/beds');
  console.log(list.success ? '✅ List beds' : '❌ List beds failed');
  
  // Create bed
  const create = await makeRequest('POST', '/api/bed-management/beds', {
    bed_number: 'ICU-101',
    department_id: departmentId,
    bed_type: 'icu',
    floor_number: 3,
    room_number: '301',
    wing: 'North',
    status: 'available',
    features: {
      telemetry: true,
      oxygen: true,
      isolation_capable: false
    }
  });
  console.log(create.success ? '✅ Create bed' : '❌ Create bed failed');
  
  return create.success ? create.data.bed?.id : null;
}

async function testBedAssignments(bedId) {
  console.log('\n📋 Testing Bed Assignments...');
  
  // List assignments
  const list = await makeRequest('GET', '/api/bed-management/assignments');
  console.log(list.success ? '✅ List assignments' : '❌ List assignments failed');
  
  // Create assignment (requires patient_id)
  const create = await makeRequest('POST', '/api/bed-management/assignments', {
    bed_id: bedId,
    patient_id: 1, // Assuming patient exists
    admission_type: 'emergency',
    admission_reason: 'Critical condition',
    patient_condition: 'critical',
    expected_discharge_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });
  console.log(create.success ? '✅ Create assignment' : '❌ Create assignment failed');
  
  return create.success ? create.data.assignment?.id : null;
}

async function testBedTransfers(fromBedId, toBedId) {
  console.log('\n🔄 Testing Bed Transfers...');
  
  // List transfers
  const list = await makeRequest('GET', '/api/bed-management/transfers');
  console.log(list.success ? '✅ List transfers' : '❌ List transfers failed');
  
  // Create transfer (requires patient_id)
  const create = await makeRequest('POST', '/api/bed-management/transfers', {
    patient_id: 1,
    from_bed_id: fromBedId,
    to_bed_id: toBedId,
    transfer_reason: 'Better monitoring required',
    transfer_type: 'medical_necessity'
  });
  console.log(create.success ? '✅ Create transfer' : '❌ Create transfer failed');
  
  return create.success ? create.data.transfer?.id : null;
}

async function testBedStatus() {
  console.log('\n📊 Testing Bed Status...');
  
  // Get bed occupancy
  const occupancy = await makeRequest('GET', '/api/bed-management/occupancy');
  console.log(occupancy.success ? '✅ Get occupancy' : '❌ Get occupancy failed');
  
  // Get available beds
  const available = await makeRequest('GET', '/api/bed-management/available-beds');
  console.log(available.success ? '✅ Get available beds' : '❌ Get available beds failed');
}

async function testAIFeatures() {
  console.log('\n🤖 Testing AI Features...');
  
  // List AI features
  const features = await makeRequest('GET', '/api/bed-management/admin/features');
  console.log(features.success ? '✅ List AI features' : '❌ List AI features failed');
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Bed Management System Tests...');
  console.log('=' .repeat(60));
  
  // Step 1: Authenticate
  const authenticated = await testAuthentication();
  if (!authenticated) {
    console.log('\n❌ Tests aborted: Authentication failed');
    return;
  }
  
  // Step 2: Test Departments
  const departmentId = await testDepartments();
  
  // Step 3: Test Beds
  const bedId = await testBeds(departmentId);
  
  // Step 4: Test Bed Assignments
  if (bedId) {
    await testBedAssignments(bedId);
  }
  
  // Step 5: Test Bed Transfers
  if (bedId) {
    // Create second bed for transfer test
    const bed2 = await makeRequest('POST', '/api/bed-management/beds', {
      bed_number: 'ICU-102',
      department_id: departmentId,
      bed_type: 'icu',
      floor_number: 3,
      room_number: '302',
      status: 'available'
    });
    
    if (bed2.success && bed2.data.bed?.id) {
      await testBedTransfers(bedId, bed2.data.bed.id);
    }
  }
  
  // Step 6: Test Bed Status
  await testBedStatus();
  
  // Step 7: Test AI Features
  await testAIFeatures();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Bed Management System Tests Complete!');
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test execution failed:', error.message);
  process.exit(1);
});
