require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function testDashboardSigninFlow() {
  console.log('🔍 Testing Exact Admin Dashboard Signin Flow');
  console.log('=============================================');

  const email = 'mdwasimkrm13@gmail.com';
  const password = 'Advanture101$';

  try {
    // Simulate the exact request that admin dashboard makes
    console.log('\n📋 Simulating Admin Dashboard API Call');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

    // Create axios instance like admin dashboard does
    const api = axios.create({
      baseURL: API_URL,
    });

    // Add interceptor like admin dashboard does
    api.interceptors.request.use(
      (config) => {
        config.headers["X-Tenant-ID"] = 'admin'; // getTenantId() returns 'admin'
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    const response = await api.post("/auth/signin", { email, password });

    console.log('✅ Signin successful!');
    console.log('Response structure:');
    console.log('- AccessToken:', !!response.data.AccessToken);
    console.log('- TokenType:', response.data.TokenType);
    console.log('- ExpiresIn:', response.data.ExpiresIn);
    console.log('- token property (what dashboard looks for):', !!response.data.token);

    if (response.data.AccessToken) {
      console.log('\n✅ AccessToken is available for login');
      console.log('Token preview:', response.data.AccessToken.substring(0, 50) + '...');
    } else {
      console.log('\n❌ No AccessToken in response');
    }

    // Test the token with a protected route
    console.log('\n📋 Testing Token with Protected Route');
    try {
      const protectedResponse = await axios.post(`${API_URL}/files/upload-url`, {
        filename: 'dashboard-test.pdf'
      }, {
        headers: {
          'Authorization': `Bearer ${response.data.AccessToken}`,
          'X-Tenant-ID': 'admin',
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Token works with protected routes!');
      console.log('Upload URL generated:', !!protectedResponse.data.uploadUrl);
    } catch (protectedError) {
      console.log('❌ Token failed with protected route:', protectedError.response?.data || protectedError.message);
    }

  } catch (error) {
    console.error('❌ Dashboard signin flow failed:', error.response?.data || error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Headers:', error.response.headers);
    }
  }
}

testDashboardSigninFlow();