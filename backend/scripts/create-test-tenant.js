const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000';

// Test credentials for authentication
const TEST_USER = {
  email: 'auth-test@enterprise-corp.com',
  password: 'AuthTest123!'
};

const createTestTenant = async () => {
  try {
    console.log('🔐 Authenticating...');
    
    // Sign in to get token
    const authResponse = await axios.post(`${BASE_URL}/auth/signin`, TEST_USER);
    const token = authResponse.data.AccessToken;
    
    console.log('✅ Authentication successful');
    
    // Create a test tenant
    const tenantData = {
      id: 'demo_hospital_001',
      name: 'Demo City Hospital',
      email: 'admin@democityhospital.com',
      plan: 'enterprise',
      status: 'active'
    };

    console.log('📝 Creating test tenant...');
    
    const response = await axios.post(`${BASE_URL}/api/tenants`, tenantData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Tenant-ID': 'admin'
      }
    });

    if (response.status === 201) {
      console.log('✅ Test tenant created successfully');
      console.log(`   Tenant ID: ${tenantData.id}`);
      console.log(`   Name: ${tenantData.name}`);
      console.log(`   Email: ${tenantData.email}`);
      console.log(`   Plan: ${tenantData.plan}`);
      console.log(`   Status: ${tenantData.status}`);
    }
    
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
      console.log('ℹ️  Test tenant already exists');
    } else {
      console.error('❌ Error:', error.response?.data?.message || error.message);
    }
  }
};

createTestTenant();