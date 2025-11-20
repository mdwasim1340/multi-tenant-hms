/**
 * Bed Management System - Complete Integration Test
 * 
 * Tests all bed management functionality including:
 * - Departments
 * - Beds
 * - Bed Assignments
 * - Bed Transfers
 * - Bed Availability
 * 
 * Run: node tests/bed-management-complete.js
 */

const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TENANT_ID = process.env.TEST_TENANT_ID || 'aajmin_polyclinic';

// Test credentials
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'admin@aajminpolyclinic.com',
  password: process.env.TEST_USER_PASSWORD || 'Admin@123'
};

let authToken = '';
let testDepartmentId = null;
let testBedId = null;
let testPatientId = null;
let testAssignmentId = null;
let testTransferId = null;

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logSection(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${message}`, 'cyan');
  log(`${'='.repeat(60)}`, 'cyan');
}

// API helper
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Tenant-ID': TENANT_ID
  }
});

// Add auth token to requests
api.interceptors.request.use(config => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Test 1: Authentication
async function testAuthentication() {
  logSection('Test 1: Authentication');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/signin`, TEST_USER);
    
    if (response.data && response.data.token) {
      authToken = response.data.token;
      logSuccess('Authentication successful');
      logInfo(`Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      logError('No token received');
      return false;
    }
  } catch (error) {
    logError(`Authentication failed: ${error.message}`);
    if (error.response) {
      logError(`Response: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// Test 2: List Departments
async function testListDepartments() {
  logSection('Test 2: List Departments');
  
  try {
    const response = await api.get('/api/beds/departments');
    
    if (response.data && Array.isArray(response.data.departments)) {
      logSuccess(`Found ${response.data.departments.length} departments`);
      
      if (response.data.departments.length > 0) {
        testDepartmentId = response.data.departments[0].id;
        logInfo(`Using department: ${response.data.departments[0].name} (ID: ${testDepartmentId})`);
        
        // Display first 3 departments
        response.data.departments.slice(0, 3).forEach(dept => {
          logInfo(`  - ${dept.name}: ${dept.total_beds} beds (${dept.available_beds} available)`);
        });
      }
      
      return true;
    } else {
      logError('Invalid response format');
      return false;
    }
  } catch (error) {
    logError(`Failed to list departments: ${error.message}`);
    if (error.response) {
      logError(`Response: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// Test 3: Create Department
async function testCreateDepartment() {
  logSection('Test 3: Create Department');
  
  const newDepartment = {
    name: `Test Department ${Date.now()}`,
    code: `TEST${Date.now()}`,
    description: 'Test department for bed management',
    floor: 3,
    total_beds: 20
  };
  
  try {
    const response = await api.post('/api/beds/departments', newDepartment);
    
    if (response.data && response.data.department) {
      testDepartmentId = response.data.department.id;
      logSuccess('Department created successfully');
      logInfo(`Department ID: ${testDepartmentId}`);
      logInfo(`Name: ${response.data.department.name}`);
      return true;
    } else {
      logError('Invalid response format');
      return false;
    }
  } catch (error) {
    logError(`Failed to create department: ${error.message}`);
    if (error.response) {
      logError(`Response: ${JSON.stringify(error.response.data)}
`);
    }
    return false;
  }
}

// Test 4: Get Department Stats
async function testGetDepartmentStats() {
  logSection('Test 4: Get Department Stats');
  
  if (!testDepartmentId) {
    logWarning('No department ID available, skipping test');
    return false;
  }
  
  try {
    const response = await api.get(`/api/beds/departments/${testDepartmentId}/stats`);
    
    if (response.data && response.data.stats) {
      logSuccess('Department stats retrieved successfully');
      const stats = response.data.stats;
      logInfo(`Total Beds: ${stats.total_beds}`);
      logInfo(`Available Beds: ${stats.available_beds}`);
      logInfo(`Occupied Beds: ${stats.occupied_beds}`);
      logInfo(`Occupancy Rate: ${stats.occupancy_rate}%`);
      return true;
    } else {
      logError('Invalid response format');
      return false;
    }
  } catch (error) {
    logError(`Failed to get department stats: ${error.message}`);
    if (error.response) {
      logError(`Response: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// Test 5: Create Bed
async function testCreateBed() {
  logSection('Test 5: Create Bed');
  
  if (!testDepartmentId) {
    logWarning('No department ID available, skipping test');
    return false;
  }
  
  const newBed = {
    bed_number: `BED-TEST-${Date.now()}`,
    department_id: testDepartmentId,
    bed_type: 'general',
    status: 'available',
    features: ['oxygen', 'monitor']
  };
  
  try {
    const response = await api.post('/api/beds', newBed);
    
    if (response.data && response.data.bed) {
      testBedId = response.data.bed.id;
      logSuccess('Bed created successfully');
      logInfo(`Bed ID: ${testBedId}`);
      logInfo(`Bed Number: ${response.data.bed.bed_number}`);
      logInfo(`Type: ${response.data.bed.bed_type}`);
      return true;
    } else {
      logError('Invalid response format');
      return false;
    }
  } catch (error) {
    logError(`Failed to create bed: ${error.message}`);
    if (error.response) {
      logError(`Response: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// Test 6: List Beds
async function testListBeds() {
  logSection('Test 6: List Beds');
  
  try {
    const response = await api.get('/api/beds', {
      params: {
        department_id: testDepartmentId,
        status: 'available'
      }
    });
    
    if (response.data && Array.isArray(response.data.beds)) {
      logSuccess(`Found ${response.data.beds.length} beds`);
      
      // Display first 3 beds
      response.data.beds.slice(0, 3).forEach(bed => {
        logInfo(`  - ${bed.bed_number} (${bed.bed_type}): ${bed.status}`);
      });
      
      return true;
    } else {
      logError('Invalid response format');
      return false;
    }
  } catch (error) {
    logError(`Failed to list beds: ${error.message}`);
    if (error.response) {
      logError(`Response: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// Test 7: Check Bed Availability
async function testCheckBedAvailability() {
  logSection('Test 7: Check Bed Availability');
  
  try {
    const response = await api.get('/api/beds/availability', {
      params: {
        department_id: testDepartmentId,
        bed_type: 'general'
      }
    });
    
    if (response.data && response.data.availability) {
      logSuccess('Bed availability checked successfully');
      const avail = response.data.availability;
      logInfo(`Total Available: ${avail.total_available}`);
      logInfo(`By Type: ${JSON.stringify(avail.by_type)}`);
      logInfo(`By Department: ${JSON.stringify(avail.by_department)}`);
      return true;
    } else {
      logError('Invalid response format');
      return false;
    }
  } catch (error) {
    logError(`Failed to check bed availability: ${error.message}`);
    if (error.response) {
      logError(`Response: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// Test 8: Create Patient (for assignment testing)
async function testCreatePatient() {
  logSection('Test 8: Create Patient (for testing)');
  
  const newPatient = {
    patient_number: `PAT-TEST-${Date.now()}`,
    first_name: 'Test',
    last_name: 'Patient',
    date_of_birth: '1990-01-01',
    gender: 'male',
    phone: '1234567890',
    email: `test${Date.now()}@example.com`
  };
  
  try {
    const response = await api.post('/api/patients', newPatient);
    
    if (response.data && response.data.patient) {
      testPatientId = response.data.patient.id;
      logSuccess('Test patient created successfully');
      logInfo(`Patient ID: ${testPatientId}`);
      logInfo(`Name: ${response.data.patient.first_name} ${response.data.patient.last_name}`);
      return true;
    } else {
      logError('Invalid response format');
      return false;
    }
  } catch (error) {
    logError(`Failed to create patient: ${error.message}`);
    if (error.response) {
      logError(`Response: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// Test 9: Create Bed Assignment
async function testCreateBedAssignment() {
  logSection('Test 9: Create Bed Assignment');
  
  if (!testBedId || !testPatientId) {
    logWarning('Missing bed or patient ID, skipping test');
    return false;
  }
  
  const newAssignment = {
    bed_id: testBedId,
    patient_id: testPatientId,
    admission_date: new Date().toISOString(),
    admission_reason: 'Test admission for bed management testing',
    expected_discharge_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
  
  try {
    const response = await api.post('/api/beds/assignments', newAssignment);
    
    if (response.data && response.data.assignment) {
      testAssignmentId = response.data.assignment.id;
      logSuccess('Bed assignment created successfully');
      logInfo(`Assignment ID: ${testAssignmentId}`);
      logInfo(`Bed: ${response.data.assignment.bed_number}`);
      logInfo(`Patient: ${response.data.assignment.patient_name}`);
      return true;
    } else {
      logError('Invalid response format');
      return false;
    }
  } catch (error) {
    logError(`Failed to create bed assignment: ${error.message}`);
    if (error.response) {
      logError(`Response: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// Test 10: List Bed Assignments
async function testListBedAssignments() {
  logSection('Test 10: List Bed Assignments');
  
  try {
    const response = await api.get('/api/beds/assignments', {
      params: {
        status: 'active'
      }
    });
    
    if (response.data && Array.isArray(response.data.assignments)) {
      logSuccess(`Found ${response.data.assignments.length} active assignments`);
      
      // Display first 3 assignments
      response.data.assignments.slice(0, 3).forEach(assignment => {
        logInfo(`  - ${assignment.patient_name} in ${assignment.bed_number} (${assignment.department_name})`);
      });
      
      return true;
    } else {
      logError('Invalid response format');
      return false;
    }
  } catch (error) {
    logError(`Failed to list bed assignments: ${error.message}`);
    if (error.response) {
      logError(`Response: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// Test 11: Get Bed Occupancy
async function testGetBedOccupancy() {
  logSection('Test 11: Get Bed Occupancy');
  
  try {
    const response = await api.get('/api/beds/occupancy');
    
    if (response.data && response.data.occupancy) {
      logSuccess('Bed occupancy retrieved successfully');
      const occ = response.data.occupancy;
      logInfo(`Total Beds: ${occ.total_beds}`);
      logInfo(`Occupied: ${occ.occupied_beds}`);
      logInfo(`Available: ${occ.available_beds}`);
      logInfo(`Occupancy Rate: ${occ.occupancy_rate}%`);
      return true;
    } else {
      logError('Invalid response format');
      return false;
    }
  } catch (error) {
    logError(`Failed to get bed occupancy: ${error.message}`);
    if (error.response) {
      logError(`Response: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// Test 12: Create Bed Transfer
async function testCreateBedTransfer() {
  logSection('Test 12: Create Bed Transfer');
  
  if (!testAssignmentId) {
    logWarning('No assignment ID available, skipping test');
    return false;
  }
  
  // First, create a new bed for transfer
  const newBed = {
    bed_number: `BED-TRANSFER-${Date.now()}`,
    department_id: testDepartmentId,
    bed_type: 'general',
    status: 'available'
  };
  
  try {
    const bedResponse = await api.post('/api/beds', newBed);
    const newBedId = bedResponse.data.bed.id;
    
    const newTransfer = {
      assignment_id: testAssignmentId,
      from_bed_id: testBedId,
      to_bed_id: newBedId,
      transfer_reason: 'Test transfer for bed management testing',
      transfer_date: new Date().toISOString()
    };
    
    const response = await api.post('/api/beds/transfers', newTransfer);
    
    if (response.data && response.data.transfer) {
      testTransferId = response.data.transfer.id;
      logSuccess('Bed transfer created successfully');
      logInfo(`Transfer ID: ${testTransferId}`);
      logInfo(`From: ${response.data.transfer.from_bed_number}`);
      logInfo(`To: ${response.data.transfer.to_bed_number}`);
      return true;
    } else {
      logError('Invalid response format');
      return false;
    }
  } catch (error) {
    logError(`Failed to create bed transfer: ${error.message}`);
    if (error.response) {
      logError(`Response: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// Test 13: Complete Bed Transfer
async function testCompleteBedTransfer() {
  logSection('Test 13: Complete Bed Transfer');
  
  if (!testTransferId) {
    logWarning('No transfer ID available, skipping test');
    return false;
  }
  
  try {
    const response = await api.post(`/api/beds/transfers/${testTransferId}/complete`);
    
    if (response.data && response.data.transfer) {
      logSuccess('Bed transfer completed successfully');
      logInfo(`Status: ${response.data.transfer.status}`);
      logInfo(`Completed At: ${response.data.transfer.completed_at}`);
      return true;
    } else {
      logError('Invalid response format');
      return false;
    }
  } catch (error) {
    logError(`Failed to complete bed transfer: ${error.message}`);
    if (error.response) {
      logError(`Response: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// Test 14: Discharge Patient
async function testDischargePatient() {
  logSection('Test 14: Discharge Patient');
  
  if (!testAssignmentId) {
    logWarning('No assignment ID available, skipping test');
    return false;
  }
  
  const dischargeData = {
    discharge_date: new Date().toISOString(),
    discharge_reason: 'Test discharge - patient recovered'
  };
  
  try {
    const response = await api.post(`/api/beds/assignments/${testAssignmentId}/discharge`, dischargeData);
    
    if (response.data && response.data.assignment) {
      logSuccess('Patient discharged successfully');
      logInfo(`Status: ${response.data.assignment.status}`);
      logInfo(`Discharge Date: ${response.data.assignment.discharge_date}`);
      return true;
    } else {
      logError('Invalid response format');
      return false;
    }
  } catch (error) {
    logError(`Failed to discharge patient: ${error.message}`);
    if (error.response) {
      logError(`Response: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// Test 15: Get Patient History
async function testGetPatientHistory() {
  logSection('Test 15: Get Patient History');
  
  if (!testPatientId) {
    logWarning('No patient ID available, skipping test');
    return false;
  }
  
  try {
    const response = await api.get(`/api/beds/assignments/patient/${testPatientId}`);
    
    if (response.data && Array.isArray(response.data.history)) {
      logSuccess(`Found ${response.data.history.length} assignment(s) in patient history`);
      
      response.data.history.forEach(assignment => {
        logInfo(`  - ${assignment.bed_number} (${assignment.admission_date} - ${assignment.discharge_date || 'Current'})`);
      });
      
      return true;
    } else {
      logError('Invalid response format');
      return false;
    }
  } catch (error) {
    logError(`Failed to get patient history: ${error.message}`);
    if (error.response) {
      logError(`Response: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// Main test runner
async function runAllTests() {
  logSection('BED MANAGEMENT SYSTEM - COMPLETE TEST SUITE');
  logInfo(`Testing against: ${BASE_URL}`);
  logInfo(`Tenant: ${TENANT_ID}`);
  logInfo(`User: ${TEST_USER.email}`);
  
  const tests = [
    { name: 'Authentication', fn: testAuthentication },
    { name: 'List Departments', fn: testListDepartments },
    { name: 'Create Department', fn: testCreateDepartment },
    { name: 'Get Department Stats', fn: testGetDepartmentStats },
    { name: 'Create Bed', fn: testCreateBed },
    { name: 'List Beds', fn: testListBeds },
    { name: 'Check Bed Availability', fn: testCheckBedAvailability },
    { name: 'Create Patient', fn: testCreatePatient },
    { name: 'Create Bed Assignment', fn: testCreateBedAssignment },
    { name: 'List Bed Assignments', fn: testListBedAssignments },
    { name: 'Get Bed Occupancy', fn: testGetBedOccupancy },
    { name: 'Create Bed Transfer', fn: testCreateBedTransfer },
    { name: 'Complete Bed Transfer', fn: testCompleteBedTransfer },
    { name: 'Discharge Patient', fn: testDischargePatient },
    { name: 'Get Patient History', fn: testGetPatientHistory }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      logError(`Test "${test.name}" threw an error: ${error.message}`);
      failed++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  logSection('TEST SUMMARY');
  logInfo(`Total Tests: ${tests.length}`);
  logSuccess(`Passed: ${passed}`);
  if (failed > 0) {
    logError(`Failed: ${failed}`);
  }
  
  const successRate = ((passed / tests.length) * 100).toFixed(1);
  logInfo(`Success Rate: ${successRate}%`);
  
  if (passed === tests.length) {
    logSuccess('\n🎉 ALL TESTS PASSED! Bed Management System is fully operational!');
  } else {
    logWarning(`\n⚠️  ${failed} test(s) failed. Please review the errors above.`);
  }
}

// Run tests
runAllTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});
