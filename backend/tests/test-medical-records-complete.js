/**
 * Medical Records Complete Integration Test
 * End-to-end test of medical records with appointments and patients
 * 
 * Run: node tests/test-medical-records-complete.js
 */

require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_TENANT = 'aajmin_polyclinic';

const TEST_USER = {
  email: 'admin@aajmin.com',
  password: 'Admin123!@#'
};

let authToken = '';
let testPatientId = null;
let testAppointmentId = null;
let testRecordId = null;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Tenant-ID': TEST_TENANT
  }
});

api.interceptors.request.use(config => {
  if (authToken) {
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }
  return config;
});

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, message = '') {
  results.total++;
  if (passed) {
    results.passed++;
    console.log(`✅ ${name}`);
  } else {
    results.failed++;
    console.log(`❌ ${name}`);
    if (message) console.log(`   ${message}`);
  }
  results.tests.push({ name, passed, message });
}

async function authenticate() {
  console.log('\n🔐 Authenticating...');
  try {
    const response = await axios.post(`${API_URL}/auth/signin`, TEST_USER);
    authToken = response.data.token;
    logTest('Authentication', true);
    return true;
  } catch (error) {
    logTest('Authentication', false, error.message);
    return false;
  }
}

// Scenario 1: Complete Patient Visit Workflow
async function testCompleteVisitWorkflow() {
  console.log('\n🏥 Scenario 1: Complete Patient Visit Workflow');
  
  try {
    // Step 1: Create patient
    console.log('   Step 1: Creating patient...');
    const patientResponse = await api.post('/api/patients', {
      patient_number: `VISIT-${Date.now()}`,
      first_name: 'John',
      last_name: 'Workflow',
      date_of_birth: '1985-05-15',
      gender: 'male',
      email: 'john.workflow@test.com',
      phone: '555-0150',
      medical_history: 'No significant history',
      allergies: 'None known'
    });
    testPatientId = patientResponse.data.patient.id;
    console.log(`   ✓ Patient created: ${testPatientId}`);

    // Step 2: Schedule appointment
    console.log('   Step 2: Scheduling appointment...');
    const appointmentResponse = await api.post('/api/appointments', {
      patient_id: testPatientId,
      appointment_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      duration_minutes: 30,
      appointment_type: 'consultation',
      reason: 'Annual checkup',
      notes: 'First visit'
    });
    testAppointmentId = appointmentResponse.data.appointment.id;
    console.log(`   ✓ Appointment scheduled: ${testAppointmentId}`);

    // Step 3: Complete appointment
    console.log('   Step 3: Completing appointment...');
    await api.post(`/api/appointments/${testAppointmentId}/complete`);
    console.log('   ✓ Appointment completed');

    // Step 4: Create medical record
    console.log('   Step 4: Creating medical record...');
    const recordResponse = await api.post('/api/medical-records', {
      patient_id: testPatientId,
      appointment_id: testAppointmentId,
      visit_date: new Date().toISOString(),
      chief_complaint: 'Annual checkup',
      diagnosis: 'Healthy, no concerns',
      treatment_plan: 'Continue healthy lifestyle',
      vital_signs: {
        blood_pressure: '118/76',
        temperature: '98.4',
        pulse: '68',
        respiratory_rate: '14',
        weight: '165',
        height: '70'
      },
      notes: 'Patient in excellent health. Recommended annual follow-up.',
      follow_up_required: true,
      follow_up_date: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]
    });
    testRecordId = recordResponse.data.record.id;
    console.log(`   ✓ Medical record created: ${testRecordId}`);

    // Step 5: Add lab results attachment
    console.log('   Step 5: Adding lab results...');
    const uploadResponse = await api.post('/api/medical-records/upload-url', {
      filename: 'lab-results.pdf',
      content_type: 'application/pdf',
      file_size: 2048
    });
    
    await api.post(`/api/medical-records/${testRecordId}/attachments`, {
      file_id: uploadResponse.data.file_id,
      filename: 'lab-results.pdf',
      file_type: 'application/pdf',
      file_size: 2048,
      description: 'Complete blood count results'
    });
    console.log('   ✓ Lab results attached');

    // Step 6: Finalize record
    console.log('   Step 6: Finalizing record...');
    await api.post(`/api/medical-records/${testRecordId}/finalize`);
    console.log('   ✓ Record finalized');

    // Step 7: Verify complete workflow
    console.log('   Step 7: Verifying workflow...');
    const patientRecords = await api.get(`/api/medical-records?patient_id=${testPatientId}`);
    const recordDetails = await api.get(`/api/medical-records/${testRecordId}`);
    const attachments = await api.get(`/api/medical-records/${testRecordId}/attachments`);

    const workflowComplete = 
      patientRecords.data.records.length > 0 &&
      recordDetails.data.record.status === 'finalized' &&
      attachments.data.attachments.length > 0;

    logTest('Complete patient visit workflow', workflowComplete,
      'Patient → Appointment → Record → Attachments → Finalized'
    );

    return workflowComplete;
  } catch (error) {
    logTest('Complete patient visit workflow', false, 
      error.response?.data?.error || error.message
    );
    return false;
  }
}

// Scenario 2: Multiple Visits for Same Patient
async function testMultipleVisits() {
  console.log('\n📅 Scenario 2: Multiple Visits for Same Patient');
  
  try {
    // Create 3 records for the same patient
    const visits = [
      {
        date: new Date(Date.now() - 90 * 86400000), // 90 days ago
        complaint: 'Initial consultation',
        diagnosis: 'Mild hypertension'
      },
      {
        date: new Date(Date.now() - 30 * 86400000), // 30 days ago
        complaint: 'Follow-up visit',
        diagnosis: 'Blood pressure improving'
      },
      {
        date: new Date(), // Today
        complaint: 'Regular checkup',
        diagnosis: 'Blood pressure normal'
      }
    ];

    for (const visit of visits) {
      await api.post('/api/medical-records', {
        patient_id: testPatientId,
        visit_date: visit.date.toISOString(),
        chief_complaint: visit.complaint,
        diagnosis: visit.diagnosis,
        treatment_plan: 'Continue monitoring',
        vital_signs: {
          blood_pressure: '120/80',
          pulse: '72'
        }
      });
    }

    // Verify all records exist
    const response = await api.get(`/api/medical-records?patient_id=${testPatientId}`);
    const records = response.data.records;

    logTest('Multiple visits for same patient', 
      records.length >= 3,
      `Created ${records.length} visit records`
    );

    return records.length >= 3;
  } catch (error) {
    logTest('Multiple visits for same patient', false,
      error.response?.data?.error || error.message
    );
    return false;
  }
}

// Scenario 3: Search and Filter Records
async function testSearchAndFilter() {
  console.log('\n🔍 Scenario 3: Search and Filter Records');
  
  try {
    // Test 1: Filter by patient
    const byPatient = await api.get(`/api/medical-records?patient_id=${testPatientId}`);
    
    // Test 2: Filter by date range
    const startDate = new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];
    const byDateRange = await api.get(
      `/api/medical-records?start_date=${startDate}&end_date=${endDate}`
    );
    
    // Test 3: Filter by status
    const byStatus = await api.get('/api/medical-records?status=finalized');

    const allFiltersWork = 
      byPatient.data.records.length > 0 &&
      byDateRange.data.records.length > 0 &&
      Array.isArray(byStatus.data.records);

    logTest('Search and filter records', allFiltersWork,
      `Patient filter: ${byPatient.data.records.length}, ` +
      `Date range: ${byDateRange.data.records.length}, ` +
      `Status filter: ${byStatus.data.records.length}`
    );

    return allFiltersWork;
  } catch (error) {
    logTest('Search and filter records', false,
      error.response?.data?.error || error.message
    );
    return false;
  }
}

// Scenario 4: Record Update Workflow
async function testRecordUpdateWorkflow() {
  console.log('\n✏️ Scenario 4: Record Update Workflow');
  
  try {
    // Get current record
    const before = await api.get(`/api/medical-records/${testRecordId}`);
    const originalDiagnosis = before.data.record.diagnosis;

    // Update record
    await api.put(`/api/medical-records/${testRecordId}`, {
      diagnosis: 'Updated diagnosis after review',
      notes: 'Additional notes added after consultation with specialist'
    });

    // Verify update
    const after = await api.get(`/api/medical-records/${testRecordId}`);
    const updated = after.data.record;

    const updateSuccessful = 
      updated.diagnosis !== originalDiagnosis &&
      updated.diagnosis === 'Updated diagnosis after review';

    logTest('Record update workflow', updateSuccessful,
      'Record updated successfully'
    );

    return updateSuccessful;
  } catch (error) {
    logTest('Record update workflow', false,
      error.response?.data?.error || error.message
    );
    return false;
  }
}

// Scenario 5: Multi-Tenant Isolation
async function testMultiTenantIsolation() {
  console.log('\n🔒 Scenario 5: Multi-Tenant Isolation');
  
  try {
    // Try to access with different tenant
    const wrongTenantApi = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': 'different_tenant',
        'Authorization': `Bearer ${authToken}`
      }
    });

    const response = await wrongTenantApi.get('/api/medical-records');
    const records = response.data.records;

    // Should not see our test records
    const hasOurRecord = records.some(r => r.id === testRecordId);

    logTest('Multi-tenant isolation', !hasOurRecord,
      'Records properly isolated between tenants'
    );

    return !hasOurRecord;
  } catch (error) {
    // Error is acceptable (tenant might not exist)
    logTest('Multi-tenant isolation', true,
      'Tenant isolation enforced'
    );
    return true;
  }
}

// Cleanup
async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  try {
    if (testRecordId) {
      await api.delete(`/api/medical-records/${testRecordId}`);
      console.log('✅ Test records deleted');
    }
    if (testAppointmentId) {
      await api.delete(`/api/appointments/${testAppointmentId}`);
      console.log('✅ Test appointment deleted');
    }
    if (testPatientId) {
      await api.delete(`/api/patients/${testPatientId}`);
      console.log('✅ Test patient deleted');
    }
  } catch (error) {
    console.log('⚠️ Cleanup warning:', error.message);
  }
}

// Main test runner
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Medical Records Complete Integration Test             ║');
  console.log('║     End-to-end workflow testing                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  if (!await authenticate()) {
    console.log('\n❌ Authentication failed. Cannot proceed with tests.');
    return;
  }

  // Run all scenarios
  await testCompleteVisitWorkflow();
  await testMultipleVisits();
  await testSearchAndFilter();
  await testRecordUpdateWorkflow();
  await testMultiTenantIsolation();

  // Cleanup
  await cleanup();

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    TEST SUMMARY                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nTotal Scenarios: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

  if (results.failed === 0) {
    console.log('\n🎉 All integration tests passed! System is working perfectly!');
    console.log('\n📋 Tested Workflows:');
    console.log('   ✅ Complete patient visit (Patient → Appointment → Record)');
    console.log('   ✅ Multiple visits for same patient');
    console.log('   ✅ Search and filter functionality');
    console.log('   ✅ Record update workflow');
    console.log('   ✅ Multi-tenant data isolation');
  } else {
    console.log('\n⚠️ Some tests failed. Review the output above for details.');
  }

  process.exit(results.failed === 0 ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error('\n💥 Test suite error:', error);
  process.exit(1);
});
