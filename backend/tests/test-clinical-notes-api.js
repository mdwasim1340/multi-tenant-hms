// Clinical Notes API Integration Test
// Tests all CRUD operations and version history
//
// SETUP: Set JWT token before running:
// $env:TEST_JWT_TOKEN="your_jwt_token_here"
// Then run: node tests/test-clinical-notes-api.js

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TENANT_ID = 'tenant_1762083064503';
const JWT_TOKEN = process.env.TEST_JWT_TOKEN || '';

// Test configuration
const config = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${JWT_TOKEN}`,
    'X-Tenant-ID': TENANT_ID,
    'X-App-ID': 'hospital-management',
    'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-123'
  }
};

let createdNoteId = null;

console.log('🧪 Clinical Notes API Integration Test\n');
console.log('=' .repeat(60));

async function testCreateClinicalNote() {
  console.log('\n📝 Test 1: Create Clinical Note');
  
  try {
    const noteData = {
      patient_id: 1,
      provider_id: 1,
      note_type: 'progress_note',
      content: '<h3>Subjective</h3><p>Patient reports feeling better.</p><h3>Objective</h3><p>Vital signs stable.</p>',
      summary: 'Follow-up visit - patient improving'
    };

    const response = await axios.post(
      `${BASE_URL}/api/clinical-notes`,
      noteData,
      config
    );

    if (response.status === 201 && response.data.success) {
      createdNoteId = response.data.data.id;
      console.log('  ✅ Clinical note created successfully');
      console.log(`  ℹ️  Note ID: ${createdNoteId}`);
      console.log(`  ℹ️  Status: ${response.data.data.status}`);
      return true;
    } else {
      console.log('  ❌ Unexpected response:', response.data);
      return false;
    }
  } catch (error) {
    console.log('  ❌ Error:', error.response?.data || error.message);
    return false;
  }
}

async function testGetClinicalNoteById() {
  console.log('\n📖 Test 2: Get Clinical Note by ID');
  
  if (!createdNoteId) {
    console.log('  ⚠️  Skipped - no note ID available');
    return false;
  }

  try {
    const response = await axios.get(
      `${BASE_URL}/api/clinical-notes/${createdNoteId}`,
      config
    );

    if (response.status === 200 && response.data.success) {
      console.log('  ✅ Clinical note retrieved successfully');
      console.log(`  ℹ️  Note Type: ${response.data.data.note_type}`);
      console.log(`  ℹ️  Status: ${response.data.data.status}`);
      return true;
    } else {
      console.log('  ❌ Unexpected response:', response.data);
      return false;
    }
  } catch (error) {
    console.log('  ❌ Error:', error.response?.data || error.message);
    return false;
  }
}

async function testListClinicalNotes() {
  console.log('\n📋 Test 3: List Clinical Notes');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/api/clinical-notes?page=1&limit=10`,
      config
    );

    if (response.status === 200 && response.data.success) {
      console.log('  ✅ Clinical notes listed successfully');
      console.log(`  ℹ️  Total notes: ${response.data.pagination.total}`);
      console.log(`  ℹ️  Notes in response: ${response.data.data.length}`);
      return true;
    } else {
      console.log('  ❌ Unexpected response:', response.data);
      return false;
    }
  } catch (error) {
    console.log('  ❌ Error:', error.response?.data || error.message);
    return false;
  }
}

async function testUpdateClinicalNote() {
  console.log('\n✏️  Test 4: Update Clinical Note (Creates Version)');
  
  if (!createdNoteId) {
    console.log('  ⚠️  Skipped - no note ID available');
    return false;
  }

  try {
    const updateData = {
      content: '<h3>Subjective</h3><p>Patient reports feeling much better.</p><h3>Objective</h3><p>Vital signs stable and improving.</p>',
      summary: 'Follow-up visit - significant improvement'
    };

    const response = await axios.put(
      `${BASE_URL}/api/clinical-notes/${createdNoteId}`,
      updateData,
      config
    );

    if (response.status === 200 && response.data.success) {
      console.log('  ✅ Clinical note updated successfully');
      console.log('  ℹ️  Version history should be created automatically');
      return true;
    } else {
      console.log('  ❌ Unexpected response:', response.data);
      return false;
    }
  } catch (error) {
    console.log('  ❌ Error:', error.response?.data || error.message);
    return false;
  }
}

async function testGetVersionHistory() {
  console.log('\n📚 Test 5: Get Version History');
  
  if (!createdNoteId) {
    console.log('  ⚠️  Skipped - no note ID available');
    return false;
  }

  try {
    const response = await axios.get(
      `${BASE_URL}/api/clinical-notes/${createdNoteId}/versions`,
      config
    );

    if (response.status === 200 && response.data.success) {
      console.log('  ✅ Version history retrieved successfully');
      console.log(`  ℹ️  Number of versions: ${response.data.data.length}`);
      
      if (response.data.data.length > 0) {
        console.log('  ✅ Version history is working (versions created on update)');
      } else {
        console.log('  ⚠️  No versions found (may need to update note first)');
      }
      return true;
    } else {
      console.log('  ❌ Unexpected response:', response.data);
      return false;
    }
  } catch (error) {
    console.log('  ❌ Error:', error.response?.data || error.message);
    return false;
  }
}

async function testSignClinicalNote() {
  console.log('\n✍️  Test 6: Sign Clinical Note');
  
  if (!createdNoteId) {
    console.log('  ⚠️  Skipped - no note ID available');
    return false;
  }

  try {
    const signData = {
      signed_by: 1
    };

    const response = await axios.post(
      `${BASE_URL}/api/clinical-notes/${createdNoteId}/sign`,
      signData,
      config
    );

    if (response.status === 200 && response.data.success) {
      console.log('  ✅ Clinical note signed successfully');
      console.log(`  ℹ️  Status: ${response.data.data.status}`);
      console.log(`  ℹ️  Signed at: ${response.data.data.signed_at}`);
      return true;
    } else {
      console.log('  ❌ Unexpected response:', response.data);
      return false;
    }
  } catch (error) {
    console.log('  ❌ Error:', error.response?.data || error.message);
    return false;
  }
}

async function testFilterByPatient() {
  console.log('\n🔍 Test 7: Filter Notes by Patient');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/api/clinical-notes?patient_id=1`,
      config
    );

    if (response.status === 200 && response.data.success) {
      console.log('  ✅ Filtered notes retrieved successfully');
      console.log(`  ℹ️  Notes for patient 1: ${response.data.data.length}`);
      return true;
    } else {
      console.log('  ❌ Unexpected response:', response.data);
      return false;
    }
  } catch (error) {
    console.log('  ❌ Error:', error.response?.data || error.message);
    return false;
  }
}

async function testFilterByStatus() {
  console.log('\n🔍 Test 8: Filter Notes by Status');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/api/clinical-notes?status=signed`,
      config
    );

    if (response.status === 200 && response.data.success) {
      console.log('  ✅ Filtered notes by status retrieved successfully');
      console.log(`  ℹ️  Signed notes: ${response.data.data.length}`);
      return true;
    } else {
      console.log('  ❌ Unexpected response:', response.data);
      return false;
    }
  } catch (error) {
    console.log('  ❌ Error:', error.response?.data || error.message);
    return false;
  }
}

async function testValidation() {
  console.log('\n✅ Test 9: Validation - Missing Required Fields');
  
  try {
    const invalidData = {
      patient_id: 1,
      // Missing provider_id, note_type, and content
    };

    const response = await axios.post(
      `${BASE_URL}/api/clinical-notes`,
      invalidData,
      config
    );

    console.log('  ❌ Should have failed validation but succeeded');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('  ✅ Validation working correctly (400 error)');
      console.log('  ℹ️  Error details:', error.response.data.error);
      return true;
    } else {
      console.log('  ❌ Unexpected error:', error.response?.data || error.message);
      return false;
    }
  }
}

async function testDeleteClinicalNote() {
  console.log('\n🗑️  Test 10: Delete Clinical Note');
  
  if (!createdNoteId) {
    console.log('  ⚠️  Skipped - no note ID available');
    return false;
  }

  try {
    const response = await axios.delete(
      `${BASE_URL}/api/clinical-notes/${createdNoteId}`,
      config
    );

    if (response.status === 200 && response.data.success) {
      console.log('  ✅ Clinical note deleted successfully');
      return true;
    } else {
      console.log('  ❌ Unexpected response:', response.data);
      return false;
    }
  } catch (error) {
    console.log('  ❌ Error:', error.response?.data || error.message);
    return false;
  }
}

async function runAllTests() {
  const results = [];

  results.push(await testCreateClinicalNote());
  results.push(await testGetClinicalNoteById());
  results.push(await testListClinicalNotes());
  results.push(await testUpdateClinicalNote());
  results.push(await testGetVersionHistory());
  results.push(await testSignClinicalNote());
  results.push(await testFilterByPatient());
  results.push(await testFilterByStatus());
  results.push(await testValidation());
  results.push(await testDeleteClinicalNote());

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary:');
  
  const passed = results.filter(r => r === true).length;
  const failed = results.filter(r => r === false).length;
  
  console.log(`  ✅ Passed: ${passed}/10`);
  console.log(`  ❌ Failed: ${failed}/10`);
  
  if (passed === 10) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.');
    process.exit(1);
  }
}

// Check if backend is running and JWT token is set
async function checkBackend() {
  if (!JWT_TOKEN) {
    console.log('❌ JWT token not set. Please set TEST_JWT_TOKEN environment variable.');
    console.log('   PowerShell: $env:TEST_JWT_TOKEN="your_jwt_token_here"');
    console.log('   Then run: node tests/test-clinical-notes-api.js\n');
    return false;
  }

  try {
    await axios.get(`${BASE_URL}/health`);
    console.log('✅ Backend is running');
    console.log('✅ JWT token is set\n');
    return true;
  } catch (error) {
    console.log('❌ Backend is not running. Please start the backend first.');
    console.log('   Run: cd backend && npm run dev\n');
    return false;
  }
}

// Main execution
(async () => {
  const backendRunning = await checkBackend();
  if (backendRunning) {
    await runAllTests();
  } else {
    process.exit(1);
  }
})();
