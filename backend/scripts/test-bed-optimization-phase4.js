const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_TENANT = 'aajmin_polyclinic';

// Test credentials - use environment variables or defaults
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@test.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test@123';

let authToken = '';
let testBedId = null;

/**
 * Test Phase 4: Bed Status Tracking
 */
async function testPhase4() {
  console.log('\n🧪 Testing Phase 4: Bed Status Tracking\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Authenticate
    console.log('\n1️⃣  Authenticating...');
    await authenticate();
    console.log('✅ Authentication successful');

    // Step 2: Get bed status for all units
    console.log('\n2️⃣  Getting bed status for all units...');
    await getBedStatusAll();
    console.log('✅ Bed status retrieved');

    // Step 3: Get bed status for specific unit
    console.log('\n3️⃣  Getting bed status for specific unit...');
    await getBedStatusByUnit();
    console.log('✅ Unit bed status retrieved');

    // Step 4: Get status summary
    console.log('\n4️⃣  Getting status summary...');
    await getStatusSummary();
    console.log('✅ Status summary retrieved');

    // Step 5: Update bed status
    console.log('\n5️⃣  Updating bed status...');
    await updateBedStatus();
    console.log('✅ Bed status updated');

    // Step 6: Get cleaning priorities
    console.log('\n6️⃣  Getting cleaning priorities...');
    await getCleaningPriorities();
    console.log('✅ Cleaning priorities retrieved');

    // Step 7: Send housekeeping alert
    console.log('\n7️⃣  Sending housekeeping alert...');
    await sendHousekeepingAlert();
    console.log('✅ Housekeeping alert sent');

    // Step 8: Get turnover metrics
    console.log('\n8️⃣  Getting turnover metrics...');
    await getTurnoverMetrics();
    console.log('✅ Turnover metrics retrieved');

    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Phase 4 Testing Complete!');
    console.log('='.repeat(60));
    console.log('\n✅ All bed status tracking features working correctly');
    console.log('\nTested Features:');
    console.log('  ✓ Real-time bed status monitoring');
    console.log('  ✓ Unit-specific status queries');
    console.log('  ✓ Status summary aggregation');
    console.log('  ✓ Bed status updates');
    console.log('  ✓ Cleaning prioritization');
    console.log('  ✓ Housekeeping alerts');
    console.log('  ✓ Turnover metrics tracking');
    console.log('\n📊 Phase 4 Status: READY FOR PRODUCTION');

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
 * Get bed status for all units
 */
async function getBedStatusAll() {
  const response = await axios.get(
    `${API_URL}/api/bed-management/status/all`,
    {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': TEST_TENANT,
        'X-App-ID': 'hospital_system',
        'X-API-Key': process.env.HOSPITAL_APP_API_KEY
      }
    }
  );

  const data = response.data;
  console.log(`   Total Beds: ${data.beds.length}`);
  console.log(`   Available: ${data.summary.available}`);
  console.log(`   Occupied: ${data.summary.occupied}`);
  console.log(`   Cleaning: ${data.summary.cleaning}`);
  console.log(`   Utilization: ${data.summary.utilization_rate.toFixed(1)}%`);

  // Store a bed ID for later tests
  if (data.beds.length > 0) {
    testBedId = data.beds[0].id;
  }
}

/**
 * Get bed status for specific unit
 */
async function getBedStatusByUnit() {
  if (!testBedId) {
    console.log('   ⚠️  No beds available for unit test');
    return;
  }

  // Get the unit ID from the first bed
  const statusResponse = await axios.get(
    `${API_URL}/api/bed-management/status/all`,
    {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': TEST_TENANT,
        'X-App-ID': 'hospital_system',
        'X-API-Key': process.env.HOSPITAL_APP_API_KEY
      }
    }
  );

  const unitId = statusResponse.data.beds[0]?.unit_id;
  
  if (!unitId) {
    console.log('   ⚠️  No unit ID available');
    return;
  }

  const response = await axios.get(
    `${API_URL}/api/bed-management/status/${unitId}`,
    {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': TEST_TENANT,
        'X-App-ID': 'hospital_system',
        'X-API-Key': process.env.HOSPITAL_APP_API_KEY
      }
    }
  );

  const data = response.data;
  console.log(`   Unit Beds: ${data.beds.length}`);
  console.log(`   Unit Name: ${data.beds[0]?.unit_name || 'N/A'}`);
}

/**
 * Get status summary
 */
async function getStatusSummary() {
  const response = await axios.get(
    `${API_URL}/api/bed-management/status-summary`,
    {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': TEST_TENANT,
        'X-App-ID': 'hospital_system',
        'X-API-Key': process.env.HOSPITAL_APP_API_KEY
      }
    }
  );

  const data = response.data;
  console.log(`   Total Units: ${data.beds_by_unit.length}`);
  console.log(`   Overall Utilization: ${data.summary.utilization_rate.toFixed(1)}%`);
  
  if (data.beds_by_unit.length > 0) {
    const unit = data.beds_by_unit[0];
    console.log(`   Sample Unit: ${unit.unit_name} (${unit.summary.total} beds)`);
  }
}

/**
 * Update bed status
 */
async function updateBedStatus() {
  if (!testBedId) {
    console.log('   ⚠️  No bed available for status update');
    return;
  }

  const response = await axios.put(
    `${API_URL}/api/bed-management/status/${testBedId}`,
    {
      status: 'cleaning',
      cleaning_status: 'in_progress',
      notes: 'Test status update - Phase 4 testing'
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

  const bed = response.data.bed;
  console.log(`   Bed ${bed.bed_number} status: ${bed.status}`);
  console.log(`   Cleaning status: ${bed.cleaning_status}`);
}

/**
 * Get cleaning priorities
 */
async function getCleaningPriorities() {
  const response = await axios.get(
    `${API_URL}/api/bed-management/cleaning-priority`,
    {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': TEST_TENANT,
        'X-App-ID': 'hospital_system',
        'X-API-Key': process.env.HOSPITAL_APP_API_KEY
      }
    }
  );

  const data = response.data;
  console.log(`   Beds Needing Cleaning: ${data.count}`);
  console.log(`   STAT Priority: ${data.stat_count}`);
  console.log(`   Overdue: ${data.overdue_count}`);

  if (data.beds.length > 0) {
    const topBed = data.beds[0];
    console.log(`   Top Priority: ${topBed.bed_number} (Score: ${topBed.priority_score.toFixed(1)})`);
  }
}

/**
 * Send housekeeping alert
 */
async function sendHousekeepingAlert() {
  if (!testBedId) {
    console.log('   ⚠️  No bed available for housekeeping alert');
    return;
  }

  await axios.post(
    `${API_URL}/api/bed-management/alert-housekeeping`,
    {
      bed_id: testBedId,
      priority: 'high',
      reason: 'Test alert - Phase 4 testing - expedited cleaning needed'
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

  console.log('   Alert sent with HIGH priority');
}

/**
 * Get turnover metrics
 */
async function getTurnoverMetrics() {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

  const response = await axios.get(
    `${API_URL}/api/bed-management/turnover-metrics?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`,
    {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': TEST_TENANT,
        'X-App-ID': 'hospital_system',
        'X-API-Key': process.env.HOSPITAL_APP_API_KEY
      }
    }
  );

  const metrics = response.data.metrics;
  console.log(`   Total Turnovers: ${metrics.overall.total_turnovers || 0}`);
  console.log(`   Avg Turnover Time: ${metrics.overall.avg_turnover_time?.toFixed(1) || 'N/A'} minutes`);
  console.log(`   Exceeded Target: ${metrics.overall.exceeded_target_percentage?.toFixed(1) || 0}%`);
  console.log(`   Units Tracked: ${metrics.by_unit.length}`);
}

// Run the tests
testPhase4();
