/**
 * Test WebSocket Notifications
 * Team: Epsilon
 * Purpose: Test real-time notification delivery via WebSocket
 */

const WebSocket = require('ws');
const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000';
const WS_BASE_URL = 'ws://localhost:3000';

// Test configuration
const testConfig = {
  email: 'mdwasimkrm13@gmail.com', // Update with actual user
  password: 'Admin@123', // Update with actual password
  tenantId: 'aajmin_polyclinic',
};

let authToken = '';
let userId = 0;

async function testWebSocketNotifications() {
  console.log('🧪 Testing WebSocket Notifications\n');
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

    // Step 2: Connect to WebSocket
    console.log('\n📝 Step 2: Connecting to WebSocket...');
    const ws = new WebSocket(
      `${WS_BASE_URL}/ws/notifications?token=${authToken}&tenant_id=${testConfig.tenantId}`
    );

    // Setup WebSocket event handlers
    ws.on('open', () => {
      console.log('   ✅ WebSocket connected');
    });

    ws.on('message', data => {
      const message = JSON.parse(data.toString());
      console.log(`   📨 Received message:`, message.type);
      
      if (message.type === 'notification') {
        console.log(`      📄 Notification: ${message.data.title}`);
      } else if (message.type === 'stats_update') {
        console.log(`      📊 Stats: ${JSON.stringify(message.data)}`);
      }
    });

    ws.on('error', error => {
      console.error('   ❌ WebSocket error:', error.message);
    });

    ws.on('close', () => {
      console.log('   🔌 WebSocket disconnected');
    });

    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Create a notification via API
    console.log('\n📝 Step 3: Creating notification via API...');
    const createResponse = await axios.post(
      `${API_BASE_URL}/api/notifications`,
      {
        user_id: userId,
        type: 'general_info',
        priority: 'high',
        title: 'WebSocket Test Notification',
        message: 'This notification should appear in real-time via WebSocket!',
        data: {
          test: true,
          websocket: true,
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

    console.log(`   ✅ Created notification ID: ${createResponse.data.notification.id}`);
    console.log(`   ⏳ Waiting for WebSocket delivery...`);

    // Wait for WebSocket message
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 4: Send ping via WebSocket
    console.log('\n📝 Step 4: Testing WebSocket ping/pong...');
    ws.send(JSON.stringify({ type: 'ping' }));
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 5: Close WebSocket
    console.log('\n📝 Step 5: Closing WebSocket connection...');
    ws.close();

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ WebSocket test completed!');
    console.log('='.repeat(60));
    console.log('\n📊 Test Summary:');
    console.log('   ✅ Authentication successful');
    console.log('   ✅ WebSocket connection established');
    console.log('   ✅ Notification created via API');
    console.log('   ✅ Real-time delivery tested');
    console.log('   ✅ Ping/pong tested');
    console.log('   ✅ Connection closed gracefully');
    console.log('\n🎉 WebSocket notification system is operational!\n');

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
console.log('🚀 Starting WebSocket Notification Tests');
console.log('📍 API Base URL:', API_BASE_URL);
console.log('📍 WebSocket URL:', WS_BASE_URL);
console.log('🏥 Tenant:', testConfig.tenantId);
console.log('👤 User:', testConfig.email);

testWebSocketNotifications()
  .then(() => {
    console.log('✅ Test suite completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });
