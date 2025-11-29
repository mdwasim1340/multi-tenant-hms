const axios = require('axios');
require('dotenv').config();

async function debugAuthEndpoints() {
  console.log('🔍 Debugging Authentication Endpoints...\n');

  const baseURL = 'http://localhost:3000';
  
  // Test 1: Check if backend is running
  console.log('1️⃣ Testing backend health...');
  try {
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ Backend is running:', healthResponse.status);
  } catch (error) {
    console.log('❌ Backend not responding:', error.message);
    return;
  }
  
  // Test 2: Check auth endpoints availability
  console.log('\n2️⃣ Testing auth endpoints availability...');
  
  // Test signup endpoint with minimal data
  try {
    const signupResponse = await axios.post(`${baseURL}/auth/signup`, {
      email: 'test@example.com',
      password: 'TestPass123!'
    });
    console.log('✅ Signup endpoint accessible:', signupResponse.status);
  } catch (error) {
    console.log('📋 Signup endpoint response:', error.response?.status, error.response?.data || error.message);
  }
  
  // Test signin endpoint
  try {
    const signinResponse = await axios.post(`${baseURL}/auth/signin`, {
      email: 'nonexistent@example.com',
      password: 'wrongpassword'
    });
    console.log('✅ Signin endpoint accessible:', signinResponse.status);
  } catch (error) {
    console.log('📋 Signin endpoint response:', error.response?.status, error.response?.data || error.message);
  }
  
  // Test 3: Check what endpoints are available
  console.log('\n3️⃣ Testing available endpoints...');
  
  const endpointsToTest = [
    '/auth/signup',
    '/auth/signin',
    '/auth/forgot-password',
    '/api/beds/categories'
  ];
  
  for (const endpoint of endpointsToTest) {
    try {
      const response = await axios.get(`${baseURL}${endpoint}`);
      console.log(`✅ ${endpoint}: ${response.status}`);
    } catch (error) {
      const status = error.response?.status;
      const method = error.response?.config?.method?.toUpperCase() || 'GET';
      
      if (status === 405) {
        console.log(`ℹ️ ${endpoint}: Method ${method} not allowed (endpoint exists)`);
      } else if (status === 404) {
        console.log(`❌ ${endpoint}: Not found`);
      } else if (status === 401 || status === 403) {
        console.log(`🔒 ${endpoint}: Requires authentication (endpoint exists)`);
      } else {
        console.log(`📋 ${endpoint}: ${status} - ${error.response?.data?.error || error.message}`);
      }
    }
  }
  
  // Test 4: Check environment variables
  console.log('\n4️⃣ Checking environment configuration...');
  console.log('Environment variables:');
  console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('- AWS_REGION:', process.env.AWS_REGION ? 'set' : 'not set');
  console.log('- COGNITO_USER_POOL_ID:', process.env.COGNITO_USER_POOL_ID ? 'set' : 'not set');
  console.log('- DB_HOST:', process.env.DB_HOST || 'not set');
  console.log('- DB_NAME:', process.env.DB_NAME || 'not set');
}

debugAuthEndpoints().catch(console.error);