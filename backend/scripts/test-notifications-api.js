/**
 * Test Notifications API
 * Team: Epsilon
 * Purpose: Test notification CRUD operations and verify database integration
 */

const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000';

// Test configuration
const testConfig = {
  email: 'admin@aajminpolyclinic.com', // Update with actual user
  password: 'Admin@123', // Update with actual password
  tenantId: 'tenant_aajmin_polyclinic',
};

let authToken = '';
let userId = 0;
let createdNotificationId = 0;

async function testNotificationsAPI() {
  console.log('🧪 Testing Notifications API\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Authenticate
    console.log('\n📝 Step 1: Authenticating...');
    const authResponse = await axios.post(`${API_BASE_URL}/auth/signin`, {
      email: testConfig.email,
      password: testConfig.password,
    });

    authToken = authResponse.data.token;
    userId = authResponse.data.user.id;
    console.log(`   ✅ Authenticated as user ID: ${userId}`);

    // Step 2: Create a notification
    console.log('\n📝 Step 2: Creating a test notification...');
    const createResponse = await axios.post(
      `${API_BASE_URL}/api/notifications`,
      {
        user_id: userId,
        type: 'general_info',
        priority: 'medium',
        title: 'Test Notification',
        message: 'This is a test notification created by the API test script',
        data: {
          test: true,
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-Tenant-ID': testConfig.tenantId,
          'X-App-ID': 'hospital_system',
          'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-123',
        },
      }
    );

    createdNotificationId = createResponse.data.notification.id;
    console.log(`   ✅ Created notification ID: ${createdNotificationId}`);
    console.log(`   📄 Title: ${createResponse.data.notification.title}`);
    console.log(`   📄 Type: ${createResponse.data.notification.type}`);
    console.log(`   📄 Priority: ${createResponse.data.notification.priority}`);

    // Step 3: List notifications
    console.log('\n📝 Step 3: Listing notifications...');
    const listResponse = await axios.get(`${API_BASE_URL}/api/notifications`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-Tenant-ID': testConfig.tenantId,
        'X-App-ID': 'hospital_system',
        'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-123',
      },
      params: {
        page: 1,
        limit: 10,
      },
    });

    console.log(`   ✅ Found ${listResponse.data.notifications.length} notifications`);
    console.log(`   📊 Total: ${listResponse.data.pagination.total}`);
    console.log(`   📊 Unread: ${listResponse.data.unreadCount}`);

    // Step 4: Get notification by ID
    console.log('\n📝 Step 4: Getting notification by ID...');
    const getResponse = await axios.get(
      `${API_BASE_URL}/api/notifications/${createdNotificationId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-Tenant-ID': testConfig.tenantId,
          'X-App-ID': 'hospital_system',
          'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-123',
        },
      }
    );

    console.log(`   ✅ Retrieved notification`);
    console.log(`   📄 Title: ${getResponse.data.notification.title}`);
    console.log(`   📄 Read: ${getResponse.data.notification.read_at ? 'Yes' : 'No'}`);

    // Step 5: Mark as read
    console.log('\n📝 Step 5: Marking notification as read...');
    const readResponse = await axios.put(
      `${API_BASE_URL}/api/notifications/${createdNotificationId}/read`,
      {},
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-Tenant-ID': testConfig.tenantId,
          'X-App-ID': 'hospital_system',
          'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-123',
        },
      }
    );

    console.log(`   ✅ Marked as read`);
    console.log(`   📄 Read at: ${readResponse.data.notification.read_at}`);

    // Step 6: Get notification stats
    console.log('\n📝 Step 6: Getting notification statistics...');
    const statsResponse = await axios.get(`${API_BASE_URL}/api/notifications/stats`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-Tenant-ID': testConfig.tenantId,
        'X-App-ID': 'hospital_system',
        'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-123',
      },
    });

    console.log(`   ✅ Statistics retrieved`);
    console.log(`   📊 Total: ${statsResponse.data.stats.total}`);
    console.log(`   📊 Unread: ${statsResponse.data.stats.unread}`);
    console.log(`   📊 Critical: ${statsResponse.data.stats.critical}`);

    // Step 7: Archive notification
    console.log('\n📝 Step 7: Archiving notification...');
    const archiveResponse = await axios.put(
      `${API_BASE_URL}/api/notifications/${createdNotificationId}/archive`,
      {},
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-Tenant-ID': testConfig.tenantId,
          'X-App-ID': 'hospital_system',
          'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-123',
        },
      }
    );

    console.log(`   ✅ Archived`);
    console.log(`   📄 Archived at: ${archiveResponse.data.notification.archived_at}`);

    // Step 8: Delete notification
    console.log('\n📝 Step 8: Deleting notification...');
    await axios.delete(`${API_BASE_URL}/api/notifications/${createdNotificationId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-Tenant-ID': testConfig.tenantId,
        'X-App-ID': 'hospital_system',
        'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-123',
      },
    });

    console.log(`   ✅ Deleted (soft delete)`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed!');
    console.log('='.repeat(60));
    console.log('\n📊 Test Summary:');
    console.log('   ✅ Authentication');
    console.log('   ✅ Create notification');
    console.log('   ✅ List notifications');
    console.log('   ✅ Get notification by ID');
    console.log('   ✅ Mark as read');
    console.log('   ✅ Get statistics');
    console.log('   ✅ Archive notification');
    console.log('   ✅ Delete notification');
    console.log('\n🎉 Notification system is fully operational!\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Run tests
console.log('🚀 Starting Notification API Tests');
console.log('📍 API Base URL:', API_BASE_URL);
console.log('🏥 Tenant:', testConfig.tenantId);
console.log('👤 User:', testConfig.email);

testNotificationsAPI()
  .then(() => {
    console.log('✅ Test suite completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });
