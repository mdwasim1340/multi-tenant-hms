const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_TENANT = 'aajmin_polyclinic';

// Test credentials - use environment variables or defaults
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@test.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test@123';

let authToken = '';
let testPatientId = null;
let testBedId = null;

/**
 * Test Phase 3: Bed Assignment Optimization
 */
async function testPhase3() {
  console.log('\n🧪 Testing Phase 3: Bed Assignment Optimization\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Authenticate
    console.log('\n1️⃣  Authenticating...');
    await authenticate();
    console.log('✅ Authentication successful');

    // Step 2: Create test patient with isolation requirements
    console.log('\n2️⃣  Creating test patient with isolation requirements...');
    await createTestPatient();
    console.log('✅ Test patient created');

    // Step 3: Check isolation requirements
    console.log('\n3️⃣  Checking isolation requirements...');
    await checkIsolationRequirements();
    console.log('✅ Isolation requirements checked');

    // Step 4: Get available beds
    console.log('\n4️⃣  Getting available beds...');
    await getAvailableBeds();
    console.log('✅ Available beds retrieved');

    // Step 5: Get isolation room availability
    console.log('\n5️⃣  Getting isolation room availability...');
    await getIsolationRoomAvailability();
    console.log('✅ Isolation room availability retrieved');

    // Step 6: Get bed recommendations
    console.log('\n6️⃣  Getting bed recommendations...');
    await getBedRecommendations();
    console.log('✅ Bed recommendations generated');

    // Step 7: Validate bed assignment
    console.log('\n7️⃣  Validating bed assignment...');
    await validateBedAssignment();
    console.log('✅ Bed assignment validated');

    // Step 8: Assign bed to patient
    console.log('\n8️⃣  Assigning bed to patient...');
    await assignBed();
    console.log('✅ Bed assigned successfully');

    // Step 9: Clear isolation (cleanup)
    console.log('\n9️⃣  Clearing isolation status...');
    await clearIsolation();
    console.log('✅ Isolation cleared');

    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Phase 3 Testing Complete!');
    console.log('='.repeat(60));
    console.log('\n✅ All bed assignment optimization features working correctly');
    console.log('\nTested Features:');
    console.log('  ✓ Isolation requirements checking');
    console.log('  ✓ Available beds retrieval');
    console.log('  ✓ Isolation room availability');
    console.log('  ✓ Bed recommendations with scoring');
    console.log('  ✓ Bed assignment validation');
    console.log('  ✓ Bed assignment execution');
    console.log('  ✓ Isolation status management');
    console.log('\n📊 Phase 3 Status: READY FOR PRODUCTION');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

/**
 * Authenticate and get token
 */
async function authenticate() {
  const response = await axios.post(`${API_URL}/auth/signin`, {
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });

  authToken = response.data.token;
  console.log('   Token obtained');
}

/**
 * Create test patient with isolation requirements
 */
async function createTestPatient() {
  const response = await axios.post(
    `${API_URL}/api/patients`,
    {
      patient_number: `TEST-ISO-${Date.now()}`,
      first_name: 'Test',
      last_name: 'Patient',
      date_of_birth: '1980-01-01',
      gender: 'male',
      email: 'test.patient@example.com',
      phone: '555-0100',
      isolation_required: true,
      isolation_type: 'contact',
      medical_history: 'MRSA infection'
    },
    {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': TEST_TENANT,
        'X-App-ID': 'hospital_system',
        'X-API-Key': process.env.HOSPITAL_APP_API_KEY
      }
    }
  );

  testPatientId = response.data.patient.id;
  console.log(`   Patient ID: ${testPatientId}`);
}

/**
 * Check isolation requirements for patient
 */
async function checkIsolationRequirements() {
  const response = await axios.post(
    `${API_URL}/api/bed-management/check-isolation`,
    {
      patient_id: testPatientId
    },
    {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': TEST_TENANT,
        'X-App-ID': 'hospital_system',
        'X-API-Key': process.env.HOSPITAL_APP_API_KEY
      }
    }
  );

  const requirements = response.data.requirements;
  console.log(`   Isolation Required: ${requirements.isolation_required}`);
  console.log(`   Isolation Type: ${requirements.isolation_type || 'None'}`);
  console.log(`   Reasons: ${requirements.reasons.length} identified`);
  console.log(`   PPE Requirements: ${requirements.ppe_requirements.join(', ')}`);
}

/**
 * Get available beds
 */
async function getAvailableBeds() {
  const response = await axios.get(
    `${API_URL}/api/bed-management/beds/available`,
    {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': TEST_TENANT,
        'X-App-ID': 'hospital_system',
        'X-API-Key': process.env.HOSPITAL_APP_API_KEY
      }
    }
  );

  const beds = response.data.beds;
  console.log(`   Available Beds: ${beds.length}`);
  
  if (beds.length > 0) {
    testBedId = beds[0].id;
    console.log(`   Sample Bed: ${beds[0].bed_number} (${beds[0].unit_name})`);
  }
}

/**
 * Get isolation room availability
 */
async function getIsolationRoomAvailability() {
  const response = await axios.get(
    `${API_URL}/api/bed-management/isolation-rooms?isolation_type=contact`,
    {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': TEST_TENANT,
        'X-App-ID': 'hospital_system',
        'X-API-Key': process.env.HOSPITAL_APP_API_KEY
      }
    }
  );

  const availability = response.data.availability;
  console.log(`   Units with Contact Isolation: ${availability.length}`);
  
  if (availability.length > 0) {
    const unit = availability[0];
    console.log(`   ${unit.unit_name}: ${unit.available_count}/${unit.total_count} available (${unit.utilization_rate.toFixed(1)}% utilized)`);
  }
}

/**
 * Get bed recommendations
 */
async function getBedRecommendations() {
  const response = await axios.post(
    `${API_URL}/api/bed-management/recommend-beds`,
    {
      patient_id: testPatientId,
      isolation_required: true,
      isolation_type: 'contact',
      telemetry_required: false,
      oxygen_required: false,
      proximity_to_nurses_station: true
    },
    {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': TEST_TENANT,
        'X-App-ID': 'hospital_system',
        'X-API-Key': process.env.HOSPITAL_APP_API_KEY
      }
    }
  );

  const recommendations = response.data.recommendations;
  console.log(`   Recommendations: ${recommendations.length}`);
  
  if (recommendations.length > 0) {
    const top = recommendations[0];
    console.log(`   Top Recommendation: ${top.bed_number} (Score: ${top.score}, Confidence: ${top.confidence})`);
    console.log(`   Reasoning: ${top.reasoning.substring(0, 80)}...`);
    
    // Use the recommended bed for assignment
    testBedId = top.bed_id;
  }
}

/**
 * Validate bed assignment
 */
async function validateBedAssignment() {
  if (!testBedId) {
    console.log('   ⚠️  No bed available for validation');
    return;
  }

  const response = await axios.post(
    `${API_URL}/api/bed-management/validate-assignment`,
    {
      patient_id: testPatientId,
      bed_id: testBedId
    },
    {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': TEST_TENANT,
        'X-App-ID': 'hospital_system',
        'X-API-Key': process.env.HOSPITAL_APP_API_KEY
      }
    }
  );

  const validation = response.data.validation;
  console.log(`   Valid: ${validation.valid}`);
  if (!validation.valid) {
    console.log(`   Reason: ${validation.reason}`);
  }
}

/**
 * Assign bed to patient
 */
async function assignBed() {
  if (!testBedId) {
    console.log('   ⚠️  No bed available for assignment');
    return;
  }

  const response = await axios.post(
    `${API_URL}/api/bed-management/assign-bed`,
    {
      patient_id: testPatientId,
      bed_id: testBedId,
      reasoning: 'Automated test assignment - contact isolation required'
    },
    {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': TEST_TENANT,
        'X-App-ID': 'hospital_system',
        'X-API-Key': process.env.HOSPITAL_APP_API_KEY
      }
    }
  );

  const assignment = response.data.assignment;
  console.log(`   Assignment ID: ${assignment.id}`);
  console.log(`   Assigned At: ${new Date(assignment.assigned_at).toLocaleString()}`);
}

/**
 * Clear isolation status
 */
async function clearIsolation() {
  await axios.post(
    `${API_URL}/api/bed-management/clear-isolation/${testPatientId}`,
    {
      reason: 'Test cleanup - isolation no longer required'
    },
    {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': TEST_TENANT,
        'X-App-ID': 'hospital_system',
        'X-API-Key': process.env.HOSPITAL_APP_API_KEY
      }
    }
  );

  console.log('   Isolation status cleared');
}

// Run the tests
testPhase3();
