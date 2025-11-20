/**
 * Team Alpha - Week 7: Integration Testing Suite
 * 
 * Tests complete workflows across all systems:
 * - Patient → Appointment → Medical Record
 * - Appointment → Lab Order → Lab Result
 * - Cross-system data integrity
 * - Multi-tenant isolation
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';
const TENANT_ID = process.env.TEST_TENANT_ID || 'tenant_1762083064503';

// Test credentials - using dedicated test user
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test.integration@hospital.com',
  password: process.env.TEST_USER_PASSWORD || 'TestPass123!'
};

let authToken = '';
let testPatientId = null;
let testAppointmentId = null;
let testMedicalRecordId = null;
let testLabOrderId = null;
let testLabResultId = null;

// Helper function to make authenticated requests
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'X-Tenant-ID': TENANT_ID,
    'X-App-ID': 'hospital-management',
    'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-123'
  }
});

// Add auth token to requests
api.interceptors.request.use(config => {
  if (authToken) {
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }
  return config;
});

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, message = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  if (message) console.log(`   ${message}`);
  
  results.tests.push({ name, passed, message });
  if (passed) results.passed++;
  else results.failed++;
}

async function runTests() {
  console.log('\n🧪 Team Alpha - Week 7 Integration Tests\n');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Authentication
    console.log('\n📝 Step 1: Authentication');
    await testAuthentication();
    
    // Step 2: Patient → Appointment → Medical Record Flow
    console.log('\n📝 Step 2: Patient → Appointment → Medical Record Flow');
    await testPatientAppointmentMedicalRecordFlow();
    
    // Step 3: Appointment → Lab Order → Lab Result Flow
    console.log('\n📝 Step 3: Appointment → Lab Order → Lab Result Flow');
    await testAppointmentLabOrderResultFlow();
    
    // Step 4: Cross-System Data Integrity
    console.log('\n📝 Step 4: Cross-System Data Integrity');
    await testCrossSystemDataIntegrity();
    
    // Step 5: Multi-Tenant Isolation
    console.log('\n📝 Step 5: Multi-Tenant Isolation');
    await testMultiTenantIsolation();
    
    // Step 6: Cleanup
    console.log('\n📝 Step 6: Cleanup Test Data');
    await cleanupTestData();
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary:');
  console.log(`   Total Tests: ${results.tests.length}`);
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   Success Rate: ${((results.passed / results.tests.length) * 100).toFixed(1)}%`);
  
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests.filter(t => !t.passed).forEach(t => {
      console.log(`   - ${t.name}: ${t.message}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  process.exit(results.failed > 0 ? 1 : 0);
}

async function testAuthentication() {
  try {
    const response = await axios.post(`${API_BASE}/auth/signin`, TEST_USER);
    authToken = response.data.token;
    
    // Decode token to see user info (for debugging)
    const tokenParts = authToken.split('.');
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    console.log('   Token email:', payload.email || payload['cognito:username']);
    console.log('   Token sub:', payload.sub);
    
    logTest('User authentication', !!authToken, `Token received: ${authToken.substring(0, 20)}...`);
  } catch (error) {
    logTest('User authentication', false, error.message);
    throw error;
  }
}

async function testPatientAppointmentMedicalRecordFlow() {
  // 1. Create Patient
  try {
    const patientData = {
      patient_number: `TEST-${Date.now()}`,
      first_name: 'Integration',
      last_name: 'Test',
      date_of_birth: '1990-01-01',
      gender: 'male',
      email: 'integration.test@example.com',
      phone: '555-0100',
      blood_type: 'O+',
      status: 'active'
    };
    
    const response = await api.post('/api/patients', patientData);
    // Handle both response formats: {patient: {...}} or {data: {patient: {...}}}
    const patient = response.data.patient || response.data.data?.patient;
    testPatientId = patient?.id;
    
    logTest('Create patient', !!testPatientId, `Patient ID: ${testPatientId}`);
  } catch (error) {
    logTest('Create patient', false, error.message);
    throw error;
  }
  
  // 2. Schedule Appointment
  try {
    // Use a unique time to avoid conflicts with previous test runs
    const appointmentTime = new Date(Date.now() + 86400000 + Math.floor(Math.random() * 3600000)); // Tomorrow + random hour
    const appointmentData = {
      patient_id: testPatientId,
      doctor_id: 3, // User ID 3 exists in tenant_1762083064503
      appointment_date: appointmentTime.toISOString(),
      duration_minutes: 30,
      appointment_type: 'consultation',
      status: 'scheduled',
      notes: 'Integration test appointment'
    };
    
    const response = await api.post('/api/appointments', appointmentData);
    // Handle both response formats
    const appointment = response.data.appointment || response.data.data?.appointment || response.data;
    testAppointmentId = appointment?.id;
    
    logTest('Schedule appointment', !!testAppointmentId, `Appointment ID: ${testAppointmentId}`);
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
    console.log('   Appointment error details:', error.response?.data);
    logTest('Schedule appointment', false, errorMsg);
  }
  
  // 3. Complete Appointment
  try {
    const response = await api.put(`/api/appointments/${testAppointmentId}`, {
      status: 'completed'
    });
    
    const appointment = response.data.appointment || response.data.data?.appointment || response.data;
    logTest('Complete appointment', appointment?.status === 'completed');
  } catch (error) {
    logTest('Complete appointment', false, error.message);
  }
  
  // 4. Create Medical Record
  try {
    const recordData = {
      patient_id: testPatientId,
      appointment_id: testAppointmentId,
      doctor_id: 3,
      visit_date: new Date().toISOString(),
      chief_complaint: 'Integration test visit',
      diagnosis: 'Test diagnosis',
      treatment_plan: 'Test treatment',
      vital_signs: {
        blood_pressure: '120/80',
        temperature: '98.6',
        pulse: '72'
      },
      notes: 'Integration test medical record'
    };
    
    const response = await api.post('/api/medical-records', recordData);
    const record = response.data.record || response.data.data?.record || response.data;
    testMedicalRecordId = record?.id;
    
    logTest('Create medical record', !!testMedicalRecordId, `Record ID: ${testMedicalRecordId}`);
  } catch (error) {
    logTest('Create medical record', false, error.message);
  }
  
  // 5. Verify Medical Record Links to Appointment
  try {
    const response = await api.get(`/api/medical-records/${testMedicalRecordId}`);
    const record = response.data.record;
    
    const linked = record.appointment_id === testAppointmentId && 
                   record.patient_id === testPatientId;
    
    logTest('Medical record links to appointment', linked);
  } catch (error) {
    logTest('Medical record links to appointment', false, error.message);
  }
}

async function testAppointmentLabOrderResultFlow() {
  // 1. Create Lab Order from Appointment
  try {
    const orderData = {
      patient_id: testPatientId,
      appointment_id: testAppointmentId,
      ordered_by: 3, // Doctor ID
      priority: 'routine',
      clinical_notes: 'Integration test lab order',
      test_ids: [1] // CBC test exists in tenant schema
    };
    
    const response = await api.post('/api/lab-orders', orderData);
    const order = response.data.order || response.data.data?.order || response.data;
    testLabOrderId = order?.id;
    
    logTest('Create lab order', !!testLabOrderId, `Lab Order ID: ${testLabOrderId}`);
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
    console.log('   Lab order error details:', error.response?.data);
    logTest('Create lab order', false, errorMsg);
  }
  
  // 2. Update Lab Order Status
  try {
    const response = await api.put(`/api/lab-orders/${testLabOrderId}`, {
      status: 'in_progress'
    });
    
    logTest('Update lab order status', response.data.order.status === 'in_progress');
  } catch (error) {
    logTest('Update lab order status', false, error.message);
  }
  
  // 3. Record Lab Results
  try {
    const resultData = {
      lab_order_id: testLabOrderId,
      lab_test_id: 1,
      result_value: '95',
      result_unit: 'mg/dL',
      reference_range_min: 70,
      reference_range_max: 100,
      is_abnormal: false,
      status: 'final',
      notes: 'Integration test result'
    };
    
    const response = await api.post('/api/lab-results', resultData);
    const result = response.data.result || response.data.data?.result || response.data;
    testLabResultId = result?.id;
    
    logTest('Record lab result', !!testLabResultId, `Lab Result ID: ${testLabResultId}`);
  } catch (error) {
    logTest('Record lab result', false, error.message);
  }
  
  // 4. Verify Lab Result Links to Order
  try {
    const response = await api.get(`/api/lab-results/${testLabResultId}`);
    const result = response.data.result;
    
    const linked = result.lab_order_id === testLabOrderId;
    
    logTest('Lab result links to order', linked);
  } catch (error) {
    logTest('Lab result links to order', false, error.message);
  }
  
  // 5. Complete Lab Order
  try {
    const response = await api.put(`/api/lab-orders/${testLabOrderId}`, {
      status: 'completed'
    });
    
    logTest('Complete lab order', response.data.order.status === 'completed');
  } catch (error) {
    logTest('Complete lab order', false, error.message);
  }
}

async function testCrossSystemDataIntegrity() {
  // 1. Verify Patient has Appointment
  try {
    const response = await api.get(`/api/appointments?patient_id=${testPatientId}`);
    const appointments = response.data.appointments || response.data.data?.appointments || response.data || [];
    const hasAppointment = Array.isArray(appointments) && appointments.some(a => a.id === testAppointmentId);
    
    logTest('Patient has appointment', hasAppointment);
  } catch (error) {
    logTest('Patient has appointment', false, error.message);
  }
  
  // 2. Verify Appointment has Medical Record
  try {
    const response = await api.get(`/api/medical-records?appointment_id=${testAppointmentId}`);
    const records = response.data.records || response.data.data?.records || response.data || [];
    const hasRecord = Array.isArray(records) && records.some(r => r.id === testMedicalRecordId);
    
    logTest('Appointment has medical record', hasRecord);
  } catch (error) {
    logTest('Appointment has medical record', false, error.message);
  }
  
  // 3. Verify Appointment has Lab Order
  try {
    const response = await api.get(`/api/lab-orders?appointment_id=${testAppointmentId}`);
    const orders = response.data.orders || response.data.data?.orders || response.data || [];
    const hasOrder = Array.isArray(orders) && orders.some(o => o.id === testLabOrderId);
    
    logTest('Appointment has lab order', hasOrder);
  } catch (error) {
    logTest('Appointment has lab order', false, error.message);
  }
  
  // 4. Verify Lab Order has Results
  try {
    const response = await api.get(`/api/lab-results?lab_order_id=${testLabOrderId}`);
    const results = response.data.results || response.data.data?.results || response.data || [];
    const hasResult = Array.isArray(results) && results.some(r => r.id === testLabResultId);
    
    logTest('Lab order has results', hasResult);
  } catch (error) {
    logTest('Lab order has results', false, error.message);
  }
}

async function testMultiTenantIsolation() {
  const DIFFERENT_TENANT = 'tenant_1762083064515'; // Different tenant
  
  // 1. Try to access patient from different tenant
  try {
    await axios.get(`${API_BASE}/api/patients/${testPatientId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': DIFFERENT_TENANT
      }
    });
    
    logTest('Multi-tenant patient isolation', false, 'Should not access patient from different tenant');
  } catch (error) {
    const isolated = error.response && (error.response.status === 404 || error.response.status === 403);
    logTest('Multi-tenant patient isolation', isolated, 'Patient not accessible from different tenant');
  }
  
  // 2. Try to access appointment from different tenant
  try {
    await axios.get(`${API_BASE}/api/appointments/${testAppointmentId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': DIFFERENT_TENANT
      }
    });
    
    logTest('Multi-tenant appointment isolation', false, 'Should not access appointment from different tenant');
  } catch (error) {
    const isolated = error.response && (error.response.status === 404 || error.response.status === 403);
    logTest('Multi-tenant appointment isolation', isolated, 'Appointment not accessible from different tenant');
  }
  
  // 3. Try to access medical record from different tenant
  try {
    await axios.get(`${API_BASE}/api/medical-records/${testMedicalRecordId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': DIFFERENT_TENANT
      }
    });
    
    logTest('Multi-tenant medical record isolation', false, 'Should not access record from different tenant');
  } catch (error) {
    const isolated = error.response && (error.response.status === 404 || error.response.status === 403);
    logTest('Multi-tenant medical record isolation', isolated, 'Medical record not accessible from different tenant');
  }
  
  // 4. Try to access lab order from different tenant
  try {
    await axios.get(`${API_BASE}/api/lab-orders/${testLabOrderId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': DIFFERENT_TENANT
      }
    });
    
    logTest('Multi-tenant lab order isolation', false, 'Should not access lab order from different tenant');
  } catch (error) {
    const isolated = error.response && (error.response.status === 404 || error.response.status === 403);
    logTest('Multi-tenant lab order isolation', isolated, 'Lab order not accessible from different tenant');
  }
}

async function cleanupTestData() {
  // Delete in reverse order of creation to respect foreign keys
  
  // 1. Delete Lab Result
  if (testLabResultId) {
    try {
      await api.delete(`/api/lab-results/${testLabResultId}`);
      logTest('Cleanup: Delete lab result', true);
    } catch (error) {
      logTest('Cleanup: Delete lab result', false, error.message);
    }
  }
  
  // 2. Delete Lab Order
  if (testLabOrderId) {
    try {
      await api.delete(`/api/lab-orders/${testLabOrderId}`);
      logTest('Cleanup: Delete lab order', true);
    } catch (error) {
      logTest('Cleanup: Delete lab order', false, error.message);
    }
  }
  
  // 3. Delete Medical Record
  if (testMedicalRecordId) {
    try {
      await api.delete(`/api/medical-records/${testMedicalRecordId}`);
      logTest('Cleanup: Delete medical record', true);
    } catch (error) {
      logTest('Cleanup: Delete medical record', false, error.message);
    }
  }
  
  // 4. Delete Appointment
  if (testAppointmentId) {
    try {
      await api.delete(`/api/appointments/${testAppointmentId}`);
      logTest('Cleanup: Delete appointment', true);
    } catch (error) {
      logTest('Cleanup: Delete appointment', false, error.message);
    }
  }
  
  // 5. Delete Patient
  if (testPatientId) {
    try {
      await api.delete(`/api/patients/${testPatientId}`);
      logTest('Cleanup: Delete patient', true);
    } catch (error) {
      logTest('Cleanup: Delete patient', false, error.message);
    }
  }
}

// Run the tests
runTests();
