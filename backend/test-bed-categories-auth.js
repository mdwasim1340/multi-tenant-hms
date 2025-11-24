const axios = require('axios');

async function testBedCategoriesAuth() {
  console.log('🔍 Testing Bed Categories API with Authentication...\n');

  const baseURL = 'http://localhost:3000';
  
  // Test 1: Without any headers (should fail)
  console.log('1️⃣ Testing without headers...');
  try {
    const response = await axios.get(`${baseURL}/api/beds/categories`);
    console.log('❌ Unexpected success:', response.status);
  } catch (error) {
    console.log('✅ Expected failure:', error.response?.status, error.response?.data?.error || error.message);
  }

  // Test 2: With app headers only (should fail - needs auth token)
  console.log('\n2️⃣ Testing with app headers only...');
  try {
    const response = await axios.get(`${baseURL}/api/beds/categories`, {
      headers: {
        'Content-Type': 'application/json',
        'X-App-ID': 'hospital_system',
        'X-API-Key': 'hospital-dev-key-123',
      }
    });
    console.log('❌ Unexpected success:', response.status);
  } catch (error) {
    console.log('✅ Expected failure:', error.response?.status, error.response?.data?.error || error.message);
  }

  // Test 3: With dev token (should work if backend accepts dev tokens)
  console.log('\n3️⃣ Testing with dev token...');
  try {
    const response = await axios.get(`${baseURL}/api/beds/categories`, {
      headers: {
        'Content-Type': 'application/json',
        'X-App-ID': 'hospital_system',
        'X-API-Key': 'hospital-dev-key-123',
        'Authorization': 'Bearer dev-token-123',
        'X-Tenant-ID': 'tenant_aajmin_polyclinic'
      }
    });
    console.log('✅ Success:', response.status);
    console.log('📊 Categories found:', response.data?.categories?.length || 0);
  } catch (error) {
    console.log('❌ Failed:', error.response?.status, error.response?.data?.error || error.message);
    if (error.response?.data) {
      console.log('📋 Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }

  // Test 4: Check if backend is running
  console.log('\n4️⃣ Testing backend health...');
  try {
    const response = await axios.get(`${baseURL}/health`);
    console.log('✅ Backend is running:', response.status);
  } catch (error) {
    console.log('❌ Backend not responding:', error.message);
  }
}

testBedCategoriesAuth().catch(console.error);