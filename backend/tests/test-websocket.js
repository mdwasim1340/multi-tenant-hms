const WebSocket = require('ws');

const WS_URL = 'ws://localhost:3000/ws';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQHRlc3QuY29tIiwic3ViIjoidGVzdC11c2VyLWlkIiwiY29nbml0bzpncm91cHMiOlsiYWRtaW4iXSwiaWF0IjoxNzYyMzU1Mzg3LCJleHAiOjE3NjIzNTg5ODd9.y7Aa6Pxpp33Cyq7yRAuBmS1MVU44K-q7QaCI6nB93iQ';

async function testWebSocket() {
  console.log('🧪 Testing WebSocket Connection\n');

  try {
    const wsUrl = `${WS_URL}?token=${TEST_TOKEN}&tenantId=tenant_1762083064503`;
    console.log('Connecting to:', wsUrl);
    
    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      console.log('✅ WebSocket connected successfully');
      
      // Send a ping message
      ws.send(JSON.stringify({
        type: 'ping',
        timestamp: new Date().toISOString()
      }));
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      console.log('📨 Received message:', message);
      
      if (message.type === 'connected') {
        console.log('✅ Connection confirmed by server');
      }
      
      if (message.type === 'pong') {
        console.log('✅ Ping-pong test successful');
        ws.close();
      }
    });

    ws.on('close', (code, reason) => {
      console.log(`🔌 WebSocket closed: ${code} - ${reason}`);
      if (code === 1000) {
        console.log('✅ WebSocket test completed successfully');
      }
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
    });

    // Close connection after 5 seconds if no response
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        console.log('⏰ Closing connection after timeout');
        ws.close();
      }
    }, 5000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWebSocket();