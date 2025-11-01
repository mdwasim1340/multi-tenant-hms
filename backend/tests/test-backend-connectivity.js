const axios = require('axios');

async function testBackendConnectivity() {
  console.log('🔍 Testing Backend Connectivity');
  console.log('===============================');

  const BACKEND_URL = 'http://localhost:3000';

  try {
    // Test 1: Basic connectivity
    console.log('\n📋 1. Testing Basic Connectivity');
    const healthResponse = await axios.get(BACKEND_URL, {
      headers: {
        'X-Tenant-ID': 'admin'
      },
      timeout: 5000
    });
    
    console.log('✅ Backend is accessible!');
    console.log('Status:', healthResponse.status);
    console.log('Response:', healthResponse.data);

    // Test 2: Test signin endpoint specifically
    console.log('\n📋 2. Testing Signin Endpoint');
    try {
      const signinResponse = await axios.post(`${BACKEND_URL}/auth/signin`, {
        email: 'mdwasimkrm13@gmail.com',
        password: 'Advanture101$'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': 'admin'
        },
        timeout: 5000
      });

      console.log('✅ Signin endpoint working!');
      console.log('Status:', signinResponse.status);
      console.log('Has AccessToken:', !!signinResponse.data.AccessToken);
    } catch (signinError) {
      console.log('❌ Signin endpoint error:', signinError.message);
      if (signinError.response) {
        console.log('Status:', signinError.response.status);
        console.log('Data:', signinError.response.data);
      }
    }

    // Test 3: Test CORS headers
    console.log('\n📋 3. Testing CORS Configuration');
    try {
      const corsResponse = await axios.post(`${BACKEND_URL}/auth/signin`, {
        email: 'mdwasimkrm13@gmail.com',
        password: 'Advanture101$'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': 'admin',
          'Origin': 'http://localhost:3002'
        },
        timeout: 5000
      });

      console.log('✅ CORS working!');
      console.log('Status:', corsResponse.status);
    } catch (corsError) {
      if (corsError.response && corsError.response.status !== 403) {
        console.log('✅ CORS working (no CORS error)');
      } else {
        console.log('❌ CORS issue:', corsError.message);
      }
    }

  } catch (error) {
    console.error('❌ Backend connectivity failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🔧 Backend is not running or not accessible on port 3000');
      console.log('   Check if backend process is running');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('🔧 Connection timeout - backend might be slow to respond');
    } else {
      console.log('🔧 Other error:', error.code);
    }
  }
}

testBackendConnectivity();