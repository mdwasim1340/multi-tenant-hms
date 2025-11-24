const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';
const TEST_TOKEN = process.env.TEST_TOKEN || 'your-jwt-token-here';
const TEST_TENANT_ID = process.env.TEST_TENANT_ID || 'aajmin_polyclinic';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'X-Tenant-ID': TEST_TENANT_ID,
    'X-App-ID': 'hospital-management',
    'X-API-Key': 'hospital-dev-key-789',
  },
});

async function testBedManagementIntegration() {
  console.log('🧪 Testing Bed Management Integration\n');
  console.log('=' .repeat(60));
  
  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: List Beds
  try {
    console.log('\n✅ Test 1: List Beds');
    const response = await api.get('/api/beds', {
      params: { page: 1, limit: 5 }
    });
    console.log(`   Found ${response.data.beds?.length || 0} beds`);
    console.log(`   Pagination: Page ${response.data.pagination?.page} of ${response.data.pagination?.pages}`);
    testsPassed++;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.response?.data?.error || error.message}`);
    testsFailed++;
  }

  // Test 2: Get Occupancy Stats
  try {
    console.log('\n✅ Test 2: Get Occupancy Statistics');
    const response = await api.get('/api/beds/occupancy');
    const stats = response.data.stats;
    console.log(`   Total Beds: ${stats.total_beds}`);
    console.log(`   Occupied: ${stats.occupied_beds}`);
    console.log(`   Available: ${stats.available_beds}`);
    console.log(`   Occupancy Rate: ${stats.occupancy_rate}%`);
    testsPassed++;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.response?.data?.error || error.message}`);
    testsFailed++;
  }

  // Test 3: List Departments
  try {
    console.log('\n✅ Test 3: List Departments');
    const response = await api.get('/api/beds/departments', {
      params: { page: 1, limit: 5 }
    });
    console.log(`   Found ${response.data.departments?.length || 0} departments`);
    if (response.data.departments?.length > 0) {
      const dept = response.data.departments[0];
      console.log(`   Example: ${dept.name} (${dept.code})`);
    }
    testsPassed++;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.response?.data?.error || error.message}`);
    testsFailed++;
  }

  // Test 4: List Assignments
  try {
    console.log('\n✅ Test 4: List Bed Assignments');
    const response = await api.get('/api/beds/assignments', {
      params: { page: 1, limit: 5, status: 'active' }
    });
    console.log(`   Found ${response.data.assignments?.length || 0} active assignments`);
    testsPassed++;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.response?.data?.error || error.message}`);
    testsFailed++;
  }

  // Test 5: List Transfers
  try {
    console.log('\n✅ Test 5: List Bed Transfers');
    const response = await api.get('/api/beds/transfers', {
      params: { page: 1, limit: 5 }
    });
    console.log(`   Found ${response.data.transfers?.length || 0} transfers`);
    testsPassed++;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.response?.data?.error || error.message}`);
    testsFailed++;
  }

  // Test 6: Check Bed Availability
  try {
    console.log('\n✅ Test 6: Check Bed Availability');
    const response = await api.get('/api/beds/availability', {
      params: { bed_type: 'standard' }
    });
    console.log(`   Available beds found: ${response.data.available_beds?.length || 0}`);
    testsPassed++;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.response?.data?.error || error.message}`);
    testsFailed++;
  }

  // Test 7: Get Department Stats (if departments exist)
  try {
    console.log('\n✅ Test 7: Get Department Statistics');
    const deptResponse = await api.get('/api/beds/departments', { params: { limit: 1 } });
    if (deptResponse.data.departments?.length > 0) {
      const deptId = deptResponse.data.departments[0].id;
      const statsResponse = await api.get(`/api/beds/departments/${deptId}/stats`);
      const stats = statsResponse.data.stats;
      console.log(`   Department: ${deptResponse.data.departments[0].name}`);
      console.log(`   Total Beds: ${stats.total_beds}`);
      console.log(`   Occupancy Rate: ${stats.occupancy_rate}%`);
      console.log(`   Avg Stay: ${stats.avg_stay_duration_days} days`);
      testsPassed++;
    } else {
      console.log(`   ⚠️  Skipped: No departments found`);
    }
  } catch (error) {
    console.log(`   ❌ Failed: ${error.response?.data?.error || error.message}`);
    testsFailed++;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary:');
  console.log(`   ✅ Passed: ${testsPassed}`);
  console.log(`   ❌ Failed: ${testsFailed}`);
  console.log(`   📈 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! Integration is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
  
  console.log('\n' + '='.repeat(60));
}

// Run tests
testBedManagementIntegration().catch(error => {
  console.error('\n❌ Test suite failed:', error.message);
  process.exit(1);
});
