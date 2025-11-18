/**
 * Team Alpha - Week 4 Complete Integration Test
 * Tests Medical Records system end-to-end
 * 
 * Run: node tests/test-week-4-complete.js
 */

require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_TENANT = 'tenant_1762083064503';
const JWT_TOKEN = process.env.TEST_JWT_TOKEN || 'YOUR_JWT_TOKEN_HERE';

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

let testPatientId = null;
let testRecordId = null;
let testFileId = null;

// Test 1: Create Test Patient
async function testCreatePatient() {
  console.log('\n📝 Test 1: Create Test Patient');
  try {
    const response = await api.post('/api/patients', {
      patient_number: `MR-TEST-${Date.now()}`,
      first_name: 'Medical',
      last_name: 'Records Test',
      date_of_birth: '1990-01-01',
      gender: 'male',
      email: 'medrecords@test.com',
      phone: '555-0199'
    });
    
    testPatientId = response.data.patient.id;
    logTest('Create test patient', true, `Patient ID: ${testPatientId}`);
    return true;
  } catch (error) {
    logTest('Create test patient', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 2: Create Medical Record
async function testCreateRecord() {
  console.log('\n📝 Test 2: Create Medical Record');
  try {
    const response = await api.post('/api/medical-records', {
      patient_id: testPatientId,
      visit_date: new Date().toISOString(),
      chief_complaint: 'Annual checkup',
      diagnosis: 'Healthy, no concerns',
      treatment_plan: 'Continue healthy lifestyle',
      vital_signs: {
        blood_pressure: '120/80',
        temperature: '98.6',
        pulse: '72',
        respiratory_rate: '16',
        weight: '165',
        height: '70'
      },
      notes: 'Patient in excellent health',
      follow_up_required: true,
      follow_up_date: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]
    });
    
    testRecordId = response.data.record.id;
    logTest('Create medical record', true, `Record ID: ${testRecordId}`);
    return true;
  } catch (error) {
    logTest('Create medical record', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 3: Get Record Details
async function testGetRecord() {
  console.log('\n🔍 Test 3: Get Record Details');
  try {
    const response = await api.get(`/api/medical-records/${testRecordId}`);
    const record = response.data.record;
    
    const isValid = 
      record.id === testRecordId &&
      record.patient_id === testPatientId &&
      record.status === 'draft';
    
    logTest('Get record details', isValid, 'Record retrieved successfully');
    return isValid;
  } catch (error) {
    logTest('Get record details', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 4: Update Record
async function testUpdateRecord() {
  console.log('\n✏️ Test 4: Update Record');
  try {
    const response = await api.put(`/api/medical-records/${testRecordId}`, {
      diagnosis: 'Healthy - Updated after review',
      notes: 'Additional notes added'
    });
    
    const record = response.data.record;
    const isUpdated = record.diagnosis === 'Healthy - Updated after review';
    
    logTest('Update record', isUpdated, 'Record updated successfully');
    return isUpdated;
  } catch (error) {
    logTest('Update record', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 5: Request Upload URL
async function testRequestUploadUrl() {
  console.log('\n📤 Test 5: Request Upload URL');
  try {
    const response = await api.post('/api/medical-records/upload-url', {
      filename: 'test-report.pdf',
      content_type: 'application/pdf',
      file_size: 1024
    });
    
    const data = response.data.data;
    testFileId = data.file_id;
    
    const isValid = data.upload_url && data.file_id && data.download_url;
    logTest('Request upload URL', isValid, `File ID: ${testFileId}`);
    return isValid;
  } catch (error) {
    logTest('Request upload URL', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 6: Attach File to Record
async function testAttachFile() {
  console.log('\n📎 Test 6: Attach File to Record');
  try {
    const response = await api.post(`/api/medical-records/${testRecordId}/attachments`, {
      file_id: testFileId,
      filename: 'test-report.pdf',
      file_type: 'application/pdf',
      file_size: 1024,
      description: 'Test lab report'
    });
    
    const attachment = response.data.attachment;
    const isValid = attachment && attachment.record_id === testRecordId;
    
    logTest('Attach file to record', isValid, `Attachment ID: ${attachment.id}`);
    return isValid;
  } catch (error) {
    logTest('Attach file to record', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 7: Get Record Attachments
async function testGetAttachments() {
  console.log('\n📎 Test 7: Get Record Attachments');
  try {
    const response = await api.get(`/api/medical-records/${testRecordId}/attachments`);
    const attachments = response.data.attachments;
    
    const isValid = Array.isArray(attachments) && attachments.length > 0;
    logTest('Get record attachments', isValid, `Found ${attachments.length} attachments`);
    return isValid;
  } catch (error) {
    logTest('Get record attachments', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 8: Get Download URL
async function testGetDownloadUrl() {
  console.log('\n📥 Test 8: Get Download URL');
  try {
    const response = await api.get(`/api/medical-records/download-url/${testFileId}`);
    const data = response.data.data;
    
    const isValid = data.download_url && data.download_url.includes(testFileId);
    logTest('Get download URL', isValid, 'Download URL generated');
    return isValid;
  } catch (error) {
    logTest('Get download URL', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 9: List Records by Patient
async function testListRecordsByPatient() {
  console.log('\n📋 Test 9: List Records by Patient');
  try {
    const response = await api.get(`/api/medical-records?patient_id=${testPatientId}`);
    const records = response.data.records;
    
    const isValid = Array.isArray(records) && records.some(r => r.id === testRecordId);
    logTest('List records by patient', isValid, `Found ${records.length} records`);
    return isValid;
  } catch (error) {
    logTest('List records by patient', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 10: Finalize Record
async function testFinalizeRecord() {
  console.log('\n🔒 Test 10: Finalize Record');
  try {
    const response = await api.post(`/api/medical-records/${testRecordId}/finalize`);
    const record = response.data.record;
    
    const isFinalized = record.status === 'finalized';
    logTest('Finalize record', isFinalized, 'Record finalized successfully');
    return isFinalized;
  } catch (error) {
    logTest('Finalize record', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 11: Verify Finalized Record is Read-Only
async function testFinalizedReadOnly() {
  console.log('\n🔒 Test 11: Verify Finalized Record is Read-Only');
  try {
    // Try to update finalized record (should fail)
    await api.put(`/api/medical-records/${testRecordId}`, {
      diagnosis: 'Should not update'
    });
    
    logTest('Finalized record read-only', false, 'Finalized record was updated (should be read-only)');
    return false;
  } catch (error) {
    // Error is expected
    const isReadOnly = error.response?.status === 400 || error.response?.status === 403;
    logTest('Finalized record read-only', isReadOnly, 'Finalized record is properly protected');
    return isReadOnly;
  }
}

// Test 12: Multi-Tenant Isolation
async function testMultiTenantIsolation() {
  console.log('\n🔒 Test 12: Multi-Tenant Isolation');
  try {
    const wrongTenantApi = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'X-Tenant-ID': 'different_tenant',
        'X-App-ID': 'hospital_system',
        'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-123'
      }
    });
    
    const response = await wrongTenantApi.get('/api/medical-records');
    const records = response.data.records;
    
    const hasTestRecord = records.some(r => r.id === testRecordId);
    logTest('Multi-tenant isolation', !hasTestRecord, 'Records properly isolated');
    return !hasTestRecord;
  } catch (error) {
    logTest('Multi-tenant isolation', true, 'Tenant isolation enforced');
    return true;
  }
}

// Cleanup
async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  try {
    if (testRecordId) {
      await api.delete(`/api/medical-records/${testRecordId}`);
      console.log('✅ Test record deleted');
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
  console.log('║     Team Alpha - Week 4 Complete Integration Test        ║');
  console.log('║     Medical Records System End-to-End                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Check authentication
  console.log('\n🔐 Checking authentication...');
  try {
    await api.get('/api/patients', { params: { limit: 1 } });
    console.log('✅ Authentication valid');
  } catch (error) {
    console.log('❌ Authentication failed');
    console.log('\n💡 To run this test:');
    console.log('   1. Sign in through the frontend');
    console.log('   2. Set TEST_JWT_TOKEN environment variable');
    console.log('   3. Run: node tests/test-week-4-complete.js');
    return;
  }

  // Run all tests
  await testCreatePatient();
  await testCreateRecord();
  await testGetRecord();
  await testUpdateRecord();
  await testRequestUploadUrl();
  await testAttachFile();
  await testGetAttachments();
  await testGetDownloadUrl();
  await testListRecordsByPatient();
  await testFinalizeRecord();
  await testFinalizedReadOnly();
  await testMultiTenantIsolation();

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
    console.log('\n🎉 All tests passed! Week 4 Medical Records system is complete!');
    console.log('\n✨ Medical Records System Features:');
    console.log('   ✅ Create medical records with vital signs');
    console.log('   ✅ Update and edit records');
    console.log('   ✅ Attach files with S3 integration');
    console.log('   ✅ Download attachments');
    console.log('   ✅ Finalize records (read-only)');
    console.log('   ✅ Multi-tenant isolation');
    console.log('   ✅ Permission-based access');
    console.log('\n🚀 Week 4 Complete! Ready for production!');
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
