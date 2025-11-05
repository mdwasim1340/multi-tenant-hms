const axios = require('axios');

const API_URL = 'http://localhost:3000';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQHRlc3QuY29tIiwic3ViIjoidGVzdC11c2VyLWlkIiwiY29nbml0bzpncm91cHMiOlsiYWRtaW4iXSwiaWF0IjoxNzYyMzU1Mzg3LCJleHAiOjE3NjIzNTg5ODd9.y7Aa6Pxpp33Cyq7yRAuBmS1MVU44K-q7QaCI6nB93iQ';
const TENANT_ID = 'tenant_1762083064503';

async function testBackupSystem() {
  console.log('🧪 Testing Backup System\n');

  const headers = {
    'Origin': 'http://localhost:3002',
    'X-App-ID': 'admin-dashboard',
    'X-API-Key': 'admin-dev-key-456',
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'X-Tenant-ID': TENANT_ID,
    'Content-Type': 'application/json'
  };

  try {
    // Test 1: Get retention policies
    console.log('Test 1: Fetching retention policies...');
    const policiesResponse = await axios.get(`${API_URL}/api/backups/retention-policies`, { headers });
    console.log('✅ Retention policies:', policiesResponse.data.policies.length);
    
    // Test 2: Get backup history (should be empty initially)
    console.log('\nTest 2: Fetching backup history...');
    const historyResponse = await axios.get(`${API_URL}/api/backups/tenant/${TENANT_ID}`, { headers });
    console.log('✅ Current backups:', historyResponse.data.backups.length);

    // Test 3: Get backup statistics
    console.log('\nTest 3: Fetching backup statistics...');
    const statsResponse = await axios.get(`${API_URL}/api/backups/tenant/${TENANT_ID}/stats`, { headers });
    console.log('✅ Backup stats:', statsResponse.data.stats);

    // Test 4: Setup backup schedules
    console.log('\nTest 4: Setting up backup schedules...');
    const setupResponse = await axios.post(`${API_URL}/api/backups/tenant/${TENANT_ID}/setup-schedules`, {
      tier_id: 'premium'
    }, { headers });
    console.log('✅ Backup schedules set up');

    // Test 5: Get backup schedules
    console.log('\nTest 5: Fetching backup schedules...');
    const schedulesResponse = await axios.get(`${API_URL}/api/backups/tenant/${TENANT_ID}/schedules`, { headers });
    console.log('✅ Backup schedules:', schedulesResponse.data.schedules.length);

    // Test 6: Create manual backup
    console.log('\nTest 6: Creating manual backup...');
    const backupResponse = await axios.post(`${API_URL}/api/backups/create`, {
      tenant_id: TENANT_ID,
      backup_type: 'full',
      storage_tier: 's3_standard'
    }, { headers });
    console.log('✅ Backup job created:', backupResponse.data.job.id);

    // Wait a moment for backup to start
    console.log('\nWaiting 3 seconds for backup to process...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test 7: Check backup status
    console.log('\nTest 7: Checking backup status...');
    const updatedHistoryResponse = await axios.get(`${API_URL}/api/backups/tenant/${TENANT_ID}`, { headers });
    const latestBackup = updatedHistoryResponse.data.backups[0];
    console.log('✅ Latest backup status:', latestBackup.status);

    // Test 8: Get admin summary
    console.log('\nTest 8: Fetching admin backup summary...');
    const adminSummaryResponse = await axios.get(`${API_URL}/api/backups/admin/summary`, { headers });
    console.log('✅ Admin summary:', adminSummaryResponse.data.summary.length, 'tenants');

    console.log('\n🎉 All backup system tests completed!');
    console.log('\n📊 Test Results Summary:');
    console.log(`   - Retention policies: ${policiesResponse.data.policies.length}`);
    console.log(`   - Backup schedules created: ${schedulesResponse.data.schedules.length}`);
    console.log(`   - Manual backup status: ${latestBackup.status}`);
    console.log(`   - Total tenants with backups: ${adminSummaryResponse.data.summary.length}`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.status, error.response?.data || error.message);
  }
}

testBackupSystem();