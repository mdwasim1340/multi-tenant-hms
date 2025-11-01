const axios = require('axios');

async function testAdminDashboardNetwork() {
  console.log('🔍 Testing Admin Dashboard Network Request');
  console.log('==========================================');

  const email = 'mdwasimkrm13@gmail.com';
  const password = 'Advanture101$';

  try {
    // Simulate the exact request from admin dashboard
    console.log('\n📋 Simulating Admin Dashboard Request');
    console.log('From: http://10.66.66.8:3002 (admin dashboard)');
    console.log('To: http://localhost:3000 (backend)');

    const api = axios.create({
      baseURL: 'http://localhost:3000',
    });

    // Add the same interceptor as admin dashboard
    api.interceptors.request.use(
      (config) => {
        config.headers["X-Tenant-ID"] = 'admin'; // getTenantId() returns 'admin'
        config.headers["Origin"] = 'http://10.66.66.8:3002'; // Simulate browser origin
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    const response = await api.post("/auth/signin", { email, password });

    console.log('✅ Network request successful!');
    console.log('Status:', response.status);
    console.log('Response structure:');
    console.log('- AccessToken:', !!response.data.AccessToken);
    console.log('- TokenType:', response.data.TokenType);
    console.log('- ExpiresIn:', response.data.ExpiresIn);

    // Test CORS headers in response
    console.log('\n📋 CORS Headers Check');
    console.log('Access-Control-Allow-Origin:', response.headers['access-control-allow-origin']);
    console.log('Access-Control-Allow-Credentials:', response.headers['access-control-allow-credentials']);

    console.log('\n🎉 Admin Dashboard Network Test: SUCCESS');
    console.log('The signin should now work from the admin dashboard!');

  } catch (error) {
    console.error('❌ Network request failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🔧 Backend connection refused');
    } else if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
      console.log('Headers:', error.response.headers);
    }
  }
}

testAdminDashboardNetwork();