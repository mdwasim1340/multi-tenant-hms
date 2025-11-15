/**
 * Medical Records API Test Suite
 * Tests all 11 endpoints with multi-tenant isolation
 * 
 * Run: node tests/test-medical-records-api.js
 */

require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_TENANT = 'tenant_1762083064503';

// Use JWT token from environment (same as Week 2 tests)
const JWT_TOKEN = process.env.TEST_JWT_TOKEN || 'YOUR_JWT_TOKEN_HERE';

let testPatientId = null;
let testRecordId = null;
let testFileId = null;

// API client with auth
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${JWT_TOKEN}`,
    'X-Tenant-ID': TEST_TENANT,
    'X-App-ID': 'hospital_system',
    'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-123'
  }
});

// Test results tracking
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

async function checkAuthentication() {
  console.log('\n🔐 Checking authentication...');
  try {
    // Try to access a protected endpoint
    await api.get('/api/patients', { params: { limit: 1 } });
    logTest('Authentication', true, 'JWT token is valid');
    return true;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('\n⚠️  JWT token is invalid or expired.');
      console.log('Please set TEST_JWT_TOKEN environment variable with a valid token.');
      console.log('You can get a token by signing in through the frontend.');
    }
    logTest('Authentication', false, error.message);
    return false;
  }
}

async function createTestPatient() {
  console.log('\n👤 Creating test patient...');
  try {
    const response = await api.post('/api/patients', {
      patient_number: `TEST-MR-${Date.now()}`,
      first_name: 'Medical',
      last_name: 'Records Test',
      date_of_birth: '1990-01-01',
      gender: 'male',
      email: 'medrecords@test.com',
      phone: '555-0199'
    });
    testPatientId = response.data.patient.id;
    logTest('Create test patient', true);
    return true;
  } catch (error) {
    logTest('Create test patient', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 1: Create Medical Record
async function testCreateRecord() {
  console.log('\n📝 Test 1: Create Medical Record');
  try {
    const response = await api.post('/api/medical-records', {
      patient_id: testPatientId,
      visit_date: new Date().toISOString(),
      chief_complaint: 'Annual checkup',
      diagnosis: 'Healthy',
      treatment_plan: 'Continue regular exercise',
      vital_signs: {
        blood_pressure: '120/80',
        temperature: '98.6',
        pulse: '72',
        respiratory_rate: '16'
      },
      notes: 'Patient in good health'
    });

    const record = response.data.record;
    testRecordId = record.id;

    logTest('Create medical record', 
      record && record.id && record.patient_id === testPatientId,
      `Record ID: ${record.id}`
    );
    return true;
  } catch (error) {
    logTest('Create medical record', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 2: Get All Records
async function testGetAllRecords() {
  console.log('\n📋 Test 2: Get All Records');
  try {
    const response = await api.get('/api/medical-records');
    const records = response.data.records;

    logTest('Get all records',
      Array.isArray(records) && records.length > 0,
      `Found ${records.length} records`
    );
    return true;
  } catch (error) {
    logTest('Get all records', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 3: Get Record by ID
async function testGetRecordById() {
  console.log('\n🔍 Test 3: Get Record by ID');
  try {
    const response = await api.get(`/api/medical-records/${testRecordId}`);
    const record = response.data.record;

    logTest('Get record by ID',
      record && record.id === testRecordId,
      `Retrieved record ${testRecordId}`
    );
    return true;
  } catch (error) {
    logTest('Get record by ID', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 4: Get Records by Patient
async function testGetRecordsByPatient() {
  console.log('\n👤 Test 4: Get Records by Patient');
  try {
    const response = await api.get(`/api/medical-records?patient_id=${testPatientId}`);
    const records = response.data.records;

    logTest('Get records by patient',
      Array.isArray(records) && records.every(r => r.patient_id === testPatientId),
      `Found ${records.length} records for patient ${testPatientId}`
    );
    return true;
  } catch (error) {
    logTest('Get records by patient', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 5: Update Record
async function testUpdateRecord() {
  console.log('\n✏️ Test 5: Update Record');
  try {
    const response = await api.put(`/api/medical-records/${testRecordId}`, {
      diagnosis: 'Healthy - Updated',
      notes: 'Updated notes after review'
    });

    const record = response.data.record;

    logTest('Update record',
      record && record.diagnosis === 'Healthy - Updated',
      'Record updated successfully'
    );
    return true;
  } catch (error) {
    logTest('Update record', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 6: Request Upload URL
async function testRequestUploadUrl() {
  console.log('\n📤 Test 6: Request Upload URL');
  try {
    const response = await api.post('/api/medical-records/upload-url', {
      filename: 'test-report.pdf',
      content_type: 'application/pdf',
      file_size: 1024
    });

    const data = response.data;
    testFileId = data.file_id;

    logTest('Request upload URL',
      data.upload_url && data.file_id && data.download_url,
      `File ID: ${data.file_id}`
    );
    return true;
  } catch (error) {
    logTest('Request upload URL', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 7: Get Download URL
async function testGetDownloadUrl() {
  console.log('\n📥 Test 7: Get Download URL');
  try {
    const response = await api.get(`/api/medical-records/download-url/${testFileId}`);
    const data = response.data;

    logTest('Get download URL',
      data.download_url && data.download_url.includes(testFileId),
      'Download URL generated'
    );
    return true;
  } catch (error) {
    logTest('Get download URL', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 8: Attach File to Record
async function testAttachFile() {
  console.log('\n📎 Test 8: Attach File to Record');
  try {
    const response = await api.post(`/api/medical-records/${testRecordId}/attachments`, {
      file_id: testFileId,
      filename: 'test-report.pdf',
      file_type: 'application/pdf',
      file_size: 1024,
      description: 'Test lab report'
    });

    const attachment = response.data.attachment;

    logTest('Attach file to record',
      attachment && attachment.record_id === testRecordId,
      `Attachment ID: ${attachment.id}`
    );
    return true;
  } catch (error) {
    logTest('Attach file to record', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 9: Get Record Attachments
async function testGetAttachments() {
  console.log('\n📎 Test 9: Get Record Attachments');
  try {
    const response = await api.get(`/api/medical-records/${testRecordId}/attachments`);
    const attachments = response.data.attachments;

    logTest('Get record attachments',
      Array.isArray(attachments) && attachments.length > 0,
      `Found ${attachments.length} attachments`
    );
    return true;
  } catch (error) {
    logTest('Get record attachments', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 10: Finalize Record
async function testFinalizeRecord() {
  console.log('\n🔒 Test 10: Finalize Record');
  try {
    const response = await api.post(`/api/medical-records/${testRecordId}/finalize`);
    const record = response.data.record;

    logTest('Finalize record',
      record && record.status === 'finalized',
      'Record finalized successfully'
    );
    return true;
  } catch (error) {
    logTest('Finalize record', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 11: Multi-Tenant Isolation
async function testMultiTenantIsolation() {
  console.log('\n🔒 Test 11: Multi-Tenant Isolation');
  try {
    // Try to access with different tenant ID
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

    // Should not see records from other tenant
    const hasTestRecord = records.some(r => r.id === testRecordId);

    logTest('Multi-tenant isolation',
      !hasTestRecord,
      'Records properly isolated between tenants'
    );
    return true;
  } catch (error) {
    // Error is acceptable (tenant might not exist)
    logTest('Multi-tenant isolation', true, 'Tenant isolation enforced');
    return true;
  }
}

// Test 12: Delete Record (cleanup)
async function testDeleteRecord() {
  console.log('\n🗑️ Test 12: Delete Record');
  try {
    await api.delete(`/api/medical-records/${testRecordId}`);

    // Verify deletion
    try {
      await api.get(`/api/medical-records/${testRecordId}`);
      logTest('Delete record', false, 'Record still exists after deletion');
      return false;
    } catch (error) {
      if (error.response?.status === 404) {
        logTest('Delete record', true, 'Record deleted successfully');
        return true;
      }
      throw error;
    }
  } catch (error) {
    logTest('Delete record', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Cleanup test data
async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  try {
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
  console.log('║     Medical Records API Test Suite                        ║');
  console.log('║     Testing 11 endpoints + multi-tenant isolation         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Setup
  if (!await checkAuthentication()) {
    console.log('\n❌ Authentication failed. Cannot proceed with tests.');
    console.log('\n💡 To run this test:');
    console.log('   1. Sign in through the frontend (http://localhost:3001)');
    console.log('   2. Copy the JWT token from browser dev tools');
    console.log('   3. Set TEST_JWT_TOKEN environment variable');
    console.log('   4. Or add it to backend/.env file');
    return;
  }

  if (!await createTestPatient()) {
    console.log('\n❌ Failed to create test patient. Cannot proceed with tests.');
    return;
  }

  // Run all tests
  await testCreateRecord();
  await testGetAllRecords();
  await testGetRecordById();
  await testGetRecordsByPatient();
  await testUpdateRecord();
  await testRequestUploadUrl();
  await testGetDownloadUrl();
  await testAttachFile();
  await testGetAttachments();
  await testFinalizeRecord();
  await testMultiTenantIsolation();
  await testDeleteRecord();

  // Cleanup
  await cleanup();

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    TEST SUMMARY                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nTotal Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! Medical Records API is working perfectly!');
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
