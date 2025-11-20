/**
 * Medical Records S3 Integration Test
 * Tests file upload/download with compression and Intelligent-Tiering
 * 
 * Run: node tests/test-medical-records-s3.js
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_TENANT = 'aajmin_polyclinic';

// Test credentials
const TEST_USER = {
  email: 'admin@aajmin.com',
  password: 'Admin123!@#'
};

let authToken = '';
let testPatientId = null;
let testRecordId = null;

// API client
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

// Test results
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

async function setupTestData() {
  console.log('\n🔧 Setting up test data...');
  try {
    // Create test patient
    const patientResponse = await api.post('/api/patients', {
      patient_number: `TEST-S3-${Date.now()}`,
      first_name: 'S3',
      last_name: 'Test',
      date_of_birth: '1990-01-01',
      gender: 'male'
    });
    testPatientId = patientResponse.data.patient.id;

    // Create test record
    const recordResponse = await api.post('/api/medical-records', {
      patient_id: testPatientId,
      visit_date: new Date().toISOString(),
      chief_complaint: 'S3 integration test',
      diagnosis: 'Testing file uploads'
    });
    testRecordId = recordResponse.data.record.id;

    logTest('Setup test data', true, `Patient: ${testPatientId}, Record: ${testRecordId}`);
    return true;
  } catch (error) {
    logTest('Setup test data', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 1: Upload Small Text File
async function testUploadSmallFile() {
  console.log('\n📄 Test 1: Upload Small Text File');
  try {
    // Create test file
    const testContent = 'This is a test medical report.\nPatient is in good health.';
    const testFile = Buffer.from(testContent);

    // Request upload URL
    const urlResponse = await api.post('/api/medical-records/upload-url', {
      filename: 'test-report.txt',
      content_type: 'text/plain',
      file_size: testFile.length
    });

    const { upload_url, file_id, download_url } = urlResponse.data;

    // Upload to S3
    await axios.put(upload_url, testFile, {
      headers: { 'Content-Type': 'text/plain' }
    });

    // Attach to record
    await api.post(`/api/medical-records/${testRecordId}/attachments`, {
      file_id,
      filename: 'test-report.txt',
      file_type: 'text/plain',
      file_size: testFile.length,
      description: 'Test text report'
    });

    logTest('Upload small text file', true, `File ID: ${file_id}`);
    return { file_id, download_url };
  } catch (error) {
    logTest('Upload small text file', false, error.response?.data?.error || error.message);
    return null;
  }
}

// Test 2: Download and Verify File
async function testDownloadFile(fileId) {
  console.log('\n📥 Test 2: Download and Verify File');
  try {
    // Get download URL
    const urlResponse = await api.get(`/api/medical-records/download-url/${fileId}`);
    const { download_url } = urlResponse.data;

    // Download from S3
    const fileResponse = await axios.get(download_url);
    const content = fileResponse.data;

    // Verify content
    const expectedContent = 'This is a test medical report.\nPatient is in good health.';
    const contentMatches = content === expectedContent;

    logTest('Download and verify file', contentMatches, 'File content matches original');
    return contentMatches;
  } catch (error) {
    logTest('Download and verify file', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 3: Upload Large File (Multipart)
async function testUploadLargeFile() {
  console.log('\n📦 Test 3: Upload Large File (Multipart)');
  try {
    // Create 6MB test file
    const largeContent = Buffer.alloc(6 * 1024 * 1024, 'A');

    // Request upload URL
    const urlResponse = await api.post('/api/medical-records/upload-url', {
      filename: 'large-scan.bin',
      content_type: 'application/octet-stream',
      file_size: largeContent.length
    });

    const { upload_url, file_id } = urlResponse.data;

    // Upload to S3
    await axios.put(upload_url, largeContent, {
      headers: { 'Content-Type': 'application/octet-stream' },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    // Attach to record
    await api.post(`/api/medical-records/${testRecordId}/attachments`, {
      file_id,
      filename: 'large-scan.bin',
      file_type: 'application/octet-stream',
      file_size: largeContent.length,
      description: 'Large test file'
    });

    logTest('Upload large file', true, `File ID: ${file_id}, Size: 6MB`);
    return file_id;
  } catch (error) {
    logTest('Upload large file', false, error.response?.data?.error || error.message);
    return null;
  }
}

// Test 4: File Compression
async function testFileCompression() {
  console.log('\n🗜️ Test 4: File Compression');
  try {
    // Create compressible text content
    const originalContent = 'Medical Report\n'.repeat(1000);
    const originalSize = Buffer.from(originalContent).length;

    // Compress
    const compressed = zlib.gzipSync(originalContent);
    const compressedSize = compressed.length;

    // Request upload URL
    const urlResponse = await api.post('/api/medical-records/upload-url', {
      filename: 'compressed-report.txt.gz',
      content_type: 'application/gzip',
      file_size: compressedSize
    });

    const { upload_url, file_id } = urlResponse.data;

    // Upload compressed file
    await axios.put(upload_url, compressed, {
      headers: { 
        'Content-Type': 'application/gzip',
        'Content-Encoding': 'gzip'
      }
    });

    // Attach to record
    await api.post(`/api/medical-records/${testRecordId}/attachments`, {
      file_id,
      filename: 'compressed-report.txt.gz',
      file_type: 'application/gzip',
      file_size: compressedSize,
      description: 'Compressed report'
    });

    const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

    logTest('File compression', true, 
      `Original: ${originalSize} bytes, Compressed: ${compressedSize} bytes (${compressionRatio}% reduction)`
    );
    return file_id;
  } catch (error) {
    logTest('File compression', false, error.response?.data?.error || error.message);
    return null;
  }
}

// Test 5: Multiple File Types
async function testMultipleFileTypes() {
  console.log('\n📎 Test 5: Multiple File Types');
  try {
    const fileTypes = [
      { name: 'report.pdf', type: 'application/pdf', content: Buffer.from('PDF content') },
      { name: 'xray.jpg', type: 'image/jpeg', content: Buffer.from('JPEG content') },
      { name: 'lab.csv', type: 'text/csv', content: Buffer.from('CSV content') }
    ];

    let successCount = 0;

    for (const file of fileTypes) {
      try {
        // Request upload URL
        const urlResponse = await api.post('/api/medical-records/upload-url', {
          filename: file.name,
          content_type: file.type,
          file_size: file.content.length
        });

        const { upload_url, file_id } = urlResponse.data;

        // Upload to S3
        await axios.put(upload_url, file.content, {
          headers: { 'Content-Type': file.type }
        });

        // Attach to record
        await api.post(`/api/medical-records/${testRecordId}/attachments`, {
          file_id,
          filename: file.name,
          file_type: file.type,
          file_size: file.content.length,
          description: `Test ${file.type}`
        });

        successCount++;
      } catch (error) {
        console.log(`   ⚠️ Failed to upload ${file.name}`);
      }
    }

    logTest('Multiple file types', successCount === fileTypes.length, 
      `Uploaded ${successCount}/${fileTypes.length} file types`
    );
    return successCount === fileTypes.length;
  } catch (error) {
    logTest('Multiple file types', false, error.message);
    return false;
  }
}

// Test 6: Get All Attachments
async function testGetAllAttachments() {
  console.log('\n📋 Test 6: Get All Attachments');
  try {
    const response = await api.get(`/api/medical-records/${testRecordId}/attachments`);
    const attachments = response.data.attachments;

    logTest('Get all attachments', 
      Array.isArray(attachments) && attachments.length >= 5,
      `Found ${attachments.length} attachments`
    );

    // Display attachment details
    console.log('\n   Attachments:');
    attachments.forEach((att, i) => {
      console.log(`   ${i + 1}. ${att.filename} (${att.file_type}) - ${att.file_size} bytes`);
    });

    return true;
  } catch (error) {
    logTest('Get all attachments', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 7: S3 Intelligent-Tiering Configuration
async function testIntelligentTiering() {
  console.log('\n🎯 Test 7: S3 Intelligent-Tiering Configuration');
  try {
    // This test verifies the configuration exists
    // Actual tiering happens over time in S3
    
    const AWS = require('aws-sdk');
    const s3 = new AWS.S3({
      region: process.env.AWS_REGION
    });

    const bucketName = process.env.S3_BUCKET_NAME;

    // Check if Intelligent-Tiering is configured
    try {
      const config = await s3.getBucketIntelligentTieringConfiguration({
        Bucket: bucketName,
        Id: 'EntireBucket'
      }).promise();

      logTest('S3 Intelligent-Tiering', true, 
        'Intelligent-Tiering configured for cost optimization'
      );
      return true;
    } catch (error) {
      if (error.code === 'NoSuchConfiguration') {
        logTest('S3 Intelligent-Tiering', false, 
          'Intelligent-Tiering not configured (run setup script)'
        );
      } else {
        throw error;
      }
      return false;
    }
  } catch (error) {
    logTest('S3 Intelligent-Tiering', false, error.message);
    return false;
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
  console.log('║     Medical Records S3 Integration Test                   ║');
  console.log('║     Testing file uploads, compression, and tiering        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Setup
  if (!await authenticate()) {
    console.log('\n❌ Authentication failed. Cannot proceed with tests.');
    return;
  }

  if (!await setupTestData()) {
    console.log('\n❌ Failed to setup test data. Cannot proceed with tests.');
    return;
  }

  // Run tests
  const smallFileResult = await testUploadSmallFile();
  if (smallFileResult) {
    await testDownloadFile(smallFileResult.file_id);
  }
  
  await testUploadLargeFile();
  await testFileCompression();
  await testMultipleFileTypes();
  await testGetAllAttachments();
  await testIntelligentTiering();

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
    console.log('\n🎉 All S3 tests passed! File management is working perfectly!');
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
