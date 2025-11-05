const axios = require('axios');
const WebSocket = require('ws');

const API_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000/ws';
const TENANT_ID = 'tenant_1762083064503';

async function testRealtimeInfrastructure() {
  console.log('🧪 Testing Real-Time Infrastructure\n');

  try {
    // Test 1: WebSocket connection
    console.log('Test 1: Connecting to WebSocket...');
    const ws = new WebSocket(`${WS_URL}?token=test_token&tenantId=${TENANT_ID}`);

    await new Promise((resolve, reject) => {
      ws.on('open', () => {
        console.log('✅ WebSocket connected');
        resolve();
      });
      ws.on('error', reject);
      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });

    // Test 2: Receive messages
    console.log('\nTest 2: Testing message reception...');
    const messagePromise = new Promise((resolve) => {
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        console.log('✅ Received message:', message.type);
        resolve(message);
      });
    });

    // Test 3: Publish test event
    console.log('\nTest 3: Publishing test event...');
    await axios.post(
      `${API_URL}/api/realtime/test-event`,
      {
        tenant_id: TENANT_ID,
        event_type: 'system.alert',
        data: { message: 'Test alert' }
      },
      {
        headers: { 'Authorization': 'Bearer test_token' }
      }
    );
    console.log('✅ Event published');

    // Wait for message
    await messagePromise;

    // Test 4: Get recent events
    console.log('\nTest 4: Fetching recent events...');
    const eventsResponse = await axios.get(
      `${API_URL}/api/realtime/events/${TENANT_ID}`,
      {
        headers: { 'Authorization': 'Bearer test_token' }
      }
    );
    console.log('✅ Events fetched:', eventsResponse.data.events.length);

    // Test 5: Get connection stats
    console.log('\nTest 5: Fetching connection stats...');
    const statsResponse = await axios.get(
      `${API_URL}/api/realtime/stats`,
      {
        headers: { 'Authorization': 'Bearer test_token' }
      }
    );
    console.log('✅ Stats:', statsResponse.data);

    // Cleanup
    ws.close();
    console.log('\n✅ All real-time infrastructure tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRealtimeInfrastructure();
