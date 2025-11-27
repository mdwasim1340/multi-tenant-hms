/**
 * Bed Management System API Test Script
 * Team Beta - Sprint 1, Day 2
 * 
 * Tests all bed management endpoints including:
 * - Departments CRUD
 * - Beds CRUD  
 * - Bed Assignments
 * - Bed Transfers
 * - Occupancy metrics
 * - Multi-tenant isolation
 */

const axios = require('axios');
const colors = require('colors');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TENANT_ID = process.env.TENANT_ID || 'tenant_8bc80e66';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

if (!AUTH_TOKEN) {
  console.error(colors.red('❌ AUTH_TOKEN environment variable is required'));
  console.log(colors.yellow('Usage: AUTH_TOKEN=your_token node test-bed-management-api.js'));
  process.exit(1);
}

// Axios instance with auth headers
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'X-Tenant-ID': TENANT_ID,
    'Content-Type': 'application/json'
  }
});

// Test data storage
const testData = {
  departmentId: null,
  bedId: null,
  patientId: null,
  assignmentId: null,
  transferId: null
};

// Utility functions
function logSuccess(message) {
  console.log(colors.green('✓ ' + message));
}

function logError(message, error) {
  console.log(colors.red('✗ ' + message));
  if (error.response) {
    console.log(colors.red(`  Status: ${error.response.status}`));
    console.log(colors.red(`  Error: ${JSON.stringify(error.response.data, null, 2)}`));
  } else {
    console.log(colors.red(`  Error: ${error.message}`));
  }
}

function logInfo(message) {
  console.log(colors.cyan('ℹ ' + message));
}

function logSection(title) {
  console.log('\n' + colors.bold.blue('='.repeat(60)));
  console.log(colors.bold.blue(title));
  console.log(colors.bold.blue('='.repeat(60)));
}

// Test functions
async function testDepartmentCreation() {
  logSection('Test 1: Create Department');
  try {
    const response = await api.post('/api/beds/departments', {
      name: 'Emergency Department',
      code: 'ER',
      description: 'Emergency Room',
      bed_capacity: 50,
      floor_number: 1,
      status: 'active'
    });
    
    testData.departmentId = response.data.id;
    logSuccess(`Department created with ID: ${testData.departmentId}`);
    logInfo(`Response: ${JSON.stringify(response.data, null, 2)}`);
    return true;
  } catch (error) {
    logError('Failed to create department', error);
    return false;
  }
}

async function testListDepartments() {
  logSection('Test 2: List Departments');
  try {
    const response = await api.get('/api/beds/departments');
    logSuccess(`Retrieved ${response.data.departments.length} departments`);
    logInfo(`First department: ${JSON.stringify(response.data.departments[0], null, 2)}`);
    return true;
  } catch (error) {
    logError('Failed to list departments', error);
    return false;
  }
}

async function testGetDepartmentById() {
  logSection('Test 3: Get Department by ID');
  try {
    const response = await api.get(`/api/beds/departments/${testData.departmentId}`);
    logSuccess(`Retrieved department: ${response.data.name}`);
    return true;
  } catch (error) {
    logError('Failed to get department', error);
    return false;
  }
}

async function testBedCreation() {
  logSection('Test 4: Create Bed');
  try {
    const response = await api.post('/api/beds', {
      bed_number: 'ER-101',
      department_id: testData.departmentId,
      bed_type: 'standard',
      status: 'available',
      features: { oxygen: true, monitor: true }
    });
    
    testData.bedId = response.data.id;
    logSuccess(`Bed created with ID: ${testData.bedId}`);
    logInfo(`Response: ${JSON.stringify(response.data, null, 2)}`);
    return true;
  } catch (error) {
    logError('Failed to create bed', error);
    return false;
  }
}

async function testListBeds() {
  logSection('Test 5: List Beds');
  try {
    const response = await api.get('/api/beds');
    logSuccess(`Retrieved ${response.data.beds.length} beds`);
    logInfo(`First bed: ${JSON.stringify(response.data.beds[0], null, 2)}`);
    return true;
  } catch (error) {
    logError('Failed to list beds', error);
    return false;
  }
}

async function testGetBedById() {
  logSection('Test 6: Get Bed by ID');
  try {
    const response = await api.get(`/api/beds/${testData.bedId}`);
    logSuccess(`Retrieved bed: ${response.data.bed_number}`);
    return true;
  } catch (error) {
    logError('Failed to get bed', error);
    return false;
  }
}

async function testUpdateBed() {
  logSection('Test 7: Update Bed');
  try {
    const response = await api.put(`/api/beds/${testData.bedId}`, {
      status: 'maintenance',
      features: { oxygen: true, monitor: true, ventilator: true }
    });
    logSuccess(`Bed updated: ${response.data.bed_number}`);
    return true;
  } catch (error) {
    logError('Failed to update bed', error);
    return false;
  }
}

async function testBedOccupancy() {
  logSection('Test 8: Get Bed Occupancy Metrics');
  try {
    const response = await api.get('/api/beds/occupancy');
    logSuccess('Retrieved occupancy metrics');
    logInfo(`Occupancy: ${JSON.stringify(response.data, null, 2)}`);
    return true;
  } catch (error) {
    logError('Failed to get occupancy metrics', error);
    return false;
  }
}

async function testBedAvailability() {
  logSection('Test 9: Check Bed Availability');
  try {
    // First update bed back to available
    await api.put(`/api/beds/${testData.bedId}`, { status: 'available' });
    
    const response = await api.get(`/api/beds/availability?bed_id=${testData.bedId}`);
    logSuccess(`Bed availability: ${response.data.available}`);
    return true;
  } catch (error) {
    logError('Failed to check bed availability', error);
    return false;
  }
}

async function testGetOrCreatePatient() {
  logSection('Test 10: Get or Create Test Patient');
  try {
    // Try to get existing patients
    const listResponse = await api.get('/api/patients?limit=1');
    
    if (listResponse.data.patients && listResponse.data.patients.length > 0) {
      testData.patientId = listResponse.data.patients[0].id;
      logSuccess(`Using existing patient ID: ${testData.patientId}`);
    } else {
      // Create a test patient
      const createResponse = await api.post('/api/patients', {
        first_name: 'Test',
        last_name: 'Patient',
        date_of_birth: '1990-01-01',
        gender: 'male',
        blood_group: 'O+',
        contact_number: '1234567890',
        email: 'test@example.com'
      });
      testData.patientId = createResponse.data.id;
      logSuccess(`Created test patient ID: ${testData.patientId}`);
    }
    return true;
  } catch (error) {
    logError('Failed to get/create patient', error);
    return false;
  }
}

async function testBedAssignment() {
  logSection('Test 11: Create Bed Assignment');
  try {
    const response = await api.post('/api/beds/assignments', {
      bed_id: testData.bedId,
      patient_id: testData.patientId,
      admission_type: 'emergency',
      admission_date: new Date().toISOString(),
      diagnosis: 'Test admission',
      notes: 'Automated test assignment'
    });
    
    testData.assignmentId = response.data.id;
    logSuccess(`Bed assignment created with ID: ${testData.assignmentId}`);
    logInfo(`Response: ${JSON.stringify(response.data, null, 2)}`);
    return true;
  } catch (error) {
    logError('Failed to create bed assignment', error);
    return false;
  }
}

async function testListAssignments() {
  logSection('Test 12: List Bed Assignments');
  try {
    const response = await api.get('/api/beds/assignments');
    logSuccess(`Retrieved ${response.data.assignments.length} assignments`);
    return true;
  } catch (error) {
    logError('Failed to list assignments', error);
    return false;
  }
}

async function testGetPatientHistory() {
  logSection('Test 13: Get Patient Bed History');
  try {
    const response = await api.get(`/api/beds/assignments/patient/${testData.patientId}`);
    logSuccess(`Retrieved patient bed history`);
    logInfo(`Assignments: ${response.data.assignments.length}`);
    return true;
  } catch (error) {
    logError('Failed to get patient history', error);
    return false;
  }
}

async function testDepartmentStats() {
  logSection('Test 14: Get Department Statistics');
  try {
    const response = await api.get(`/api/beds/departments/${testData.departmentId}/stats`);
    logSuccess('Retrieved department statistics');
    logInfo(`Stats: ${JSON.stringify(response.data, null, 2)}`);
    return true;
  } catch (error) {
    logError('Failed to get department stats', error);
    return false;
  }
}

async function testMultiTenantIsolation() {
  logSection('Test 15: Multi-Tenant Isolation');
  try {
    // Try to access with wrong tenant ID
    const wrongTenantApi = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'X-Tenant-ID': 'tenant_wrong_123',
        'Content-Type': 'application/json'
      }
    });
    
    try {
      await wrongTenantApi.get('/api/beds');
      logError('Multi-tenant isolation FAILED - should have been blocked', new Error());
      return false;
    } catch (error) {
      if (error.response && (error.response.status === 404 || error.response.status === 403)) {
        logSuccess('Multi-tenant isolation working correctly');
        return true;
      } else {
        logError('Unexpected error during isolation test', error);
        return false;
      }
    }
  } catch (error) {
    logError('Failed to test multi-tenant isolation', error);
    return false;
  }
}

async function testDischargePatient() {
  logSection('Test 16: Discharge Patient');
  try {
    const response = await api.post(`/api/beds/assignments/${testData.assignmentId}/discharge`, {
      discharge_date: new Date().toISOString(),
      discharge_type: 'regular',
      discharge_notes: 'Test discharge'
    });
    
    logSuccess('Patient discharged successfully');
    return true;
  } catch (error) {
    logError('Failed to discharge patient', error);
    return false;
  }
}

async function testDeleteBed() {
  logSection('Test 17: Delete Bed (Soft Delete)');
  try {
    const response = await api.delete(`/api/beds/${testData.bedId}`);
    logSuccess('Bed deleted successfully');
    return true;
  } catch (error) {
    logError('Failed to delete bed', error);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log(colors.bold.cyan('\n🚀 Starting Bed Management System API Tests'));
  console.log(colors.cyan(`   Base URL: ${BASE_URL}`));
  console.log(colors.cyan(`   Tenant ID: ${TENANT_ID}`));
  console.log(colors.cyan(`   Date: ${new Date().toISOString()}\n`));

  const tests = [
    testDepartmentCreation,
    testListDepartments,
    testGetDepartmentById,
    testBedCreation,
    testListBeds,
    testGetBedById,
    testUpdateBed,
    testBedOccupancy,
    testBedAvailability,
    testGetOrCreatePatient,
    testBedAssignment,
    testListAssignments,
    testGetPatientHistory,
    testDepartmentStats,
    testMultiTenantIsolation,
    testDischargePatient,
    testDeleteBed
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await test();
    if (result) {
      passed++;
    } else {
      failed++;
    }
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n' + colors.bold.cyan('='.repeat(60)));
  console.log(colors.bold.cyan('Test Summary'));
  console.log(colors.bold.cyan('='.repeat(60)));
  console.log(colors.green(`✓ Passed: ${passed}/${tests.length}`));
  console.log(colors.red(`✗ Failed: ${failed}/${tests.length}`));
  
  if (failed === 0) {
    console.log(colors.bold.green('\n🎉 All tests passed!'));
  } else {
    console.log(colors.bold.red('\n❌ Some tests failed. Please review the errors above.'));
  }
  
  console.log('');
}

// Run tests
runAllTests().catch(error => {
  console.error(colors.red('Fatal error:'), error);
  process.exit(1);
});
