const axios = require('axios');
require('dotenv').config();

async function testSpecificEndpoint() {
  console.log('🔍 Testing Specific Bed Categories Endpoint...\n');

  const baseURL = 'http://localhost:3000';
  const password = 'Advanture101$';
  const email = 'mdwasimkrm13@gmail.com';
  
  try {
    // Step 1: Sign in
    console.log('1️⃣ Signing in...');
    
    const signinResponse = await axios.post(`${baseURL}/auth/signin`, {
      email: email,
      password: password
    });
    
    const token = signinResponse.data.token;
    const userData = signinResponse.data.user;
    const tenantId = userData.tenant_id;
    
    console.log('✅ Signin successful');
    console.log('📋 Tenant ID:', tenantId);
    console.log('📋 Token preview:', token.substring(0, 30) + '...');
    
    // Step 2: Test the exact endpoint with verbose logging
    console.log('\n2️⃣ Testing /api/beds/categories endpoint...');
    
    const headers = {
      'Content-Type': 'application/json',
      'X-App-ID': 'hospital_system',
      'X-API-Key': 'hospital-dev-key-123',
      'Authorization': `Bearer ${token}`,
      'X-Tenant-ID': tenantId
    };
    
    console.log('📋 Request headers:');
    Object.entries(headers).forEach(([key, value]) => {
      if (key === 'Authorization') {
        console.log(`  ${key}: Bearer ${value.split(' ')[1].substring(0, 20)}...`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    });
    
    try {
      const response = await axios.get(`${baseURL}/api/beds/categories`, { headers });
      
      console.log('\n✅ SUCCESS! API call worked');
      console.log('📊 Status:', response.status);
      console.log('📊 Categories found:', response.data?.categories?.length || 0);
      
      if (response.data?.categories && response.data.categories.length > 0) {
        console.log('\n📋 Categories:');
        response.data.categories.forEach((cat, index) => {
          console.log(`${index + 1}. ${cat.name} (${cat.color}) - ${cat.bed_count} beds`);
        });
      }
      
      console.log('\n🎉 BED CATEGORIES API IS NOW WORKING!');
      console.log('✅ The frontend should now be able to load categories');
      
    } catch (apiError) {
      console.log('\n❌ API call failed');
      console.log('📋 Status:', apiError.response?.status);
      console.log('📋 Error:', JSON.stringify(apiError.response?.data, null, 2));
      
      // Check if it's a different error now
      if (apiError.response?.data?.message?.includes('NaN')) {
        console.log('\n🔍 Still getting NaN error. Let me check the controller code...');
        console.log('💡 The error might be in a different part of the controller');
        console.log('💡 Or there might be another beds-related query causing issues');
      }
    }
    
    // Step 3: Test other bed-related endpoints to isolate the issue
    console.log('\n3️⃣ Testing other bed-related endpoints...');
    
    const endpointsToTest = [
      '/api/beds',
      '/api/beds/occupancy',
      '/api/beds/availability'
    ];
    
    for (const endpoint of endpointsToTest) {
      try {
        console.log(`\n  Testing ${endpoint}...`);
        const response = await axios.get(`${baseURL}${endpoint}`, { headers });
        console.log(`  ✅ ${endpoint}: ${response.status} - ${response.data?.beds?.length || response.data?.length || 'OK'}`);
      } catch (error) {
        console.log(`  ❌ ${endpoint}: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
        
        if (error.response?.data?.message?.includes('NaN')) {
          console.log(`    💡 Found the NaN error source: ${endpoint}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSpecificEndpoint();