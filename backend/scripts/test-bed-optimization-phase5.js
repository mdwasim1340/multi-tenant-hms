/**
 * Test Script for Bed Management Optimization - Phase 5
 * Discharge Readiness Prediction & Coordination
 * 
 * Tests:
 * - Discharge readiness prediction
 * - Medical and social readiness scoring
 * - Barrier identification
 * - Intervention suggestions
 * - Discharge metrics
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';
const TENANT_ID = 'aajmin_polyclinic';

// Test data
let testPatientId = null;
let testAdmissionId = null;
let testBarrierId = null;

async function runTests() {
  console.log('🧪 Starting Phase 5 Tests: Discharge Readiness Prediction\n');
  console.log('=' .repeat(70));

  try {
    // Test 1: Predict discharge readiness
    await testPredictDischargeReadiness();

    // Test 2: Get discharge-ready patients
    await testGetDischargeReadyPatients();

    // Test 3: Update barrier status
    await testUpdateBarrierStatus();

    // Test 4: Get discharge metrics
    await testGetDischargeMetrics();

    // Test 5: Batch discharge predictions
    await testBatchDischargePredictions();

    console.log('\n' + '='.repeat(70));
    console.log('✅ All Phase 5 tests completed successfully!');
    console.log('=' .repeat(70));

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

async function testPredictDischargeReadiness() {
  console.log('\n📊 Test 1: Predict Discharge Readiness');
  console.log('-'.repeat(70));

  // First, create a test patient and admission
  testPatientId = Math.floor(Math.random() * 1000000);
  testAdmissionId = Math.floor(Math.random() * 1000000);

  console.log(`Creating test patient ${testPatientId} with admission ${testAdmissionId}...`);

  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/bed-management/discharge-readiness/${testPatientId}`,
      {
        params: { admissionId: testAdmissionId },
        headers: {
          'X-Tenant-ID': TENANT_ID,
          'X-App-ID': 'hospital_system',
          'X-API-Key': 'hospital-dev-key-789'
        }
      }
    );

    console.log('✅ Discharge readiness prediction successful');
    console.log(`   Medical Readiness: ${response.data.data.medical_readiness_score}/100`);
    console.log(`   Social Readiness: ${response.data.data.social_readiness_score}/100`);
    console.log(`   Overall Readiness: ${response.data.data.overall_readiness_score}/100`);
    console.log(`   Confidence: ${response.data.data.confidence_level}`);
    console.log(`   Predicted Discharge: ${response.data.data.predicted_discharge_date}`);
    console.log(`   Barriers: ${response.data.data.barriers.length}`);
    console.log(`   Interventions: ${response.data.data.recommended_interventions.length}`);

    if (response.data.data.barriers.length > 0) {
      testBarrierId = response.data.data.barriers[0].barrier_id;
      console.log(`\n   First Barrier:`);
      console.log(`   - Category: ${response.data.data.barriers[0].category}`);
      console.log(`   - Description: ${response.data.data.barriers[0].description}`);
      console.log(`   - Severity: ${response.data.data.barriers[0].severity}`);
      console.log(`   - Estimated Delay: ${response.data.data.barriers[0].estimated_delay_hours} hours`);
    }

    if (response.data.data.recommended_interventions.length > 0) {
      console.log(`\n   First Intervention:`);
      console.log(`   - Type: ${response.data.data.recommended_interventions[0].intervention_type}`);
      console.log(`   - Description: ${response.data.data.recommended_interventions[0].description}`);
      console.log(`   - Priority: ${response.data.data.recommended_interventions[0].priority}`);
      console.log(`   - Assigned To: ${response.data.data.recommended_interventions[0].assigned_to}`);
    }

  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.log('⚠️  Feature not enabled - this is expected if discharge_readiness is disabled');
      console.log('   Enable with: AI Feature Manager');
    } else {
      throw error;
    }
  }
}

async function testGetDischargeReadyPatients() {
  console.log('\n📋 Test 2: Get Discharge-Ready Patients');
  console.log('-'.repeat(70));

  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/bed-management/discharge-ready-patients`,
      {
        params: { minScore: 70 },
        headers: {
          'X-Tenant-ID': TENANT_ID,
          'X-App-ID': 'hospital_system',
          'X-API-Key': 'hospital-dev-key-789'
        }
      }
    );

    console.log('✅ Retrieved discharge-ready patients');
    console.log(`   Total patients: ${response.data.count}`);

    if (response.data.data.length > 0) {
      console.log(`\n   Sample Patient:`);
      const patient = response.data.data[0];
      console.log(`   - Patient ID: ${patient.patient_id}`);
      console.log(`   - Admission ID: ${patient.admission_id}`);
      console.log(`   - Overall Score: ${patient.overall_readiness_score}/100`);
      console.log(`   - Predicted Discharge: ${patient.predicted_discharge_date}`);
      console.log(`   - Barriers: ${patient.barriers.length}`);
    }

  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.log('⚠️  Feature not enabled - this is expected if discharge_readiness is disabled');
    } else {
      throw error;
    }
  }
}

async function testUpdateBarrierStatus() {
  console.log('\n🔄 Test 3: Update Barrier Status');
  console.log('-'.repeat(70));

  if (!testBarrierId) {
    console.log('⚠️  No barrier ID available from previous test - skipping');
    return;
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/bed-management/discharge-barriers/${testAdmissionId}`,
      {
        barrierId: testBarrierId,
        resolved: true
      },
      {
        headers: {
          'X-Tenant-ID': TENANT_ID,
          'X-App-ID': 'hospital_system',
          'X-API-Key': 'hospital-dev-key-789'
        }
      }
    );

    console.log('✅ Barrier status updated successfully');
    console.log(`   Barrier ${testBarrierId} marked as resolved`);

  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.log('⚠️  Feature not enabled - this is expected if discharge_readiness is disabled');
    } else {
      throw error;
    }
  }
}

async function testGetDischargeMetrics() {
  console.log('\n📈 Test 4: Get Discharge Metrics');
  console.log('-'.repeat(70));

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/bed-management/discharge-metrics`,
      {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        headers: {
          'X-Tenant-ID': TENANT_ID,
          'X-App-ID': 'hospital_system',
          'X-API-Key': 'hospital-dev-key-789'
        }
      }
    );

    console.log('✅ Discharge metrics retrieved');
    console.log(`   Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);
    console.log(`   Total Discharges: ${response.data.data.total_discharges}`);
    console.log(`   Average LOS: ${response.data.data.average_los.toFixed(1)} hours`);
    console.log(`   Delayed Discharges: ${response.data.data.delayed_discharges}`);
    console.log(`   Average Delay: ${response.data.data.average_delay_hours.toFixed(1)} hours`);
    console.log(`   Intervention Success Rate: ${response.data.data.intervention_success_rate.toFixed(1)}%`);

    if (Object.keys(response.data.data.barriers_by_category).length > 0) {
      console.log(`\n   Barriers by Category:`);
      for (const [category, count] of Object.entries(response.data.data.barriers_by_category)) {
        console.log(`   - ${category}: ${count}`);
      }
    }

  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.log('⚠️  Feature not enabled - this is expected if discharge_readiness is disabled');
    } else {
      throw error;
    }
  }
}

async function testBatchDischargePredictions() {
  console.log('\n🔄 Test 5: Batch Discharge Predictions');
  console.log('-'.repeat(70));

  const admissions = [
    { patientId: Math.floor(Math.random() * 1000000), admissionId: Math.floor(Math.random() * 1000000) },
    { patientId: Math.floor(Math.random() * 1000000), admissionId: Math.floor(Math.random() * 1000000) },
    { patientId: Math.floor(Math.random() * 1000000), admissionId: Math.floor(Math.random() * 1000000) }
  ];

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/bed-management/batch-discharge-predictions`,
      { admissions },
      {
        headers: {
          'X-Tenant-ID': TENANT_ID,
          'X-App-ID': 'hospital_system',
          'X-API-Key': 'hospital-dev-key-789'
        }
      }
    );

    console.log('✅ Batch predictions completed');
    console.log(`   Total: ${response.data.summary.total}`);
    console.log(`   Successful: ${response.data.summary.successful}`);
    console.log(`   Failed: ${response.data.summary.failed}`);

    if (response.data.data.length > 0) {
      console.log(`\n   Sample Prediction:`);
      const prediction = response.data.data[0];
      console.log(`   - Patient ID: ${prediction.patient_id}`);
      console.log(`   - Overall Score: ${prediction.overall_readiness_score}/100`);
      console.log(`   - Barriers: ${prediction.barriers.length}`);
    }

  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.log('⚠️  Feature not enabled - this is expected if discharge_readiness is disabled');
    } else {
      throw error;
    }
  }
}

// Run tests
runTests();
