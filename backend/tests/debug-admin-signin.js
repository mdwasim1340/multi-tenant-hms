require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function debugAdminSignin() {
  console.log('🔍 Debugging Admin Dashboard Signin Issue');
  console.log('==========================================');

  const email = 'mdwasimkrm13@gmail.com';
  const password = 'Advanture101$';

  try {
    // Test 1: Direct signin without tenant header (like our working test)
    console.log('\n📋 1. Testing Direct Signin (No Tenant Header)');
    try {
      const directResponse = await axios.post(`${API_URL}/auth/signin`, {
        email: email,
        password: password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Direct signin successful!');
      console.log('Response:', {
        hasAccessToken: !!directResponse.data.AccessToken,
        hasTokenType: !!directResponse.data.TokenType,
        hasExpiresIn: !!directResponse.data.ExpiresIn
      });
    } catch (directError) {
      console.log('❌ Direct signin failed:', directError.response?.data || directError.message);
    }

    // Test 2: Signin with admin tenant header (like admin dashboard does)
    console.log('\n📋 2. Testing Signin with Admin Tenant Header');
    try {
      const tenantResponse = await axios.post(`${API_URL}/auth/signin`, {
        email: email,
        password: password
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': 'admin'
        }
      });

      console.log('✅ Tenant signin successful!');
      console.log('Response:', {
        hasAccessToken: !!tenantResponse.data.AccessToken,
        hasTokenType: !!tenantResponse.data.TokenType,
        hasExpiresIn: !!tenantResponse.data.ExpiresIn
      });
    } catch (tenantError) {
      console.log('❌ Tenant signin failed:', tenantError.response?.data || tenantError.message);
      console.log('Status:', tenantError.response?.status);
    }

    // Test 3: Check if user exists in Cognito
    console.log('\n📋 3. Checking User in Cognito');
    const username = email.replace('@', '_').replace(/\./g, '_');
    console.log(`Expected username: ${username}`);

  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
  }
}

debugAdminSignin();