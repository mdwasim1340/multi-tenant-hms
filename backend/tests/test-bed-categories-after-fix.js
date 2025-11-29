const axios = require('axios');
require('dotenv').config();

async function testAfterFix() {
  console.log('🔍 Testing Bed Categories API After Schema Fix...\n');

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
    
    // Step 2: Test bed categories endpoint
    console.log('\n2️⃣ Testing bed categories endpoint...');
    
    const headers = {
      'Content-Type': 'application/json',
      'X-App-ID': 'hospital_system',
      'X-API-Key': 'hospital-dev-key-123',
      'Authorization': `Bearer ${token}`,
      'X-Tenant-ID': tenantId
    };
    
    try {
      const response = await axios.get(`${baseURL}/api/beds/categories`, { headers });
      
      console.log('🎉 SUCCESS! Bed Categories API is working!');
      console.log('📊 Status:', response.status);
      console.log('📊 Categories found:', response.data?.categories?.length || 0);
      
      if (response.data?.categories && response.data.categories.length > 0) {
        console.log('\n📋 Categories:');
        response.data.categories.forEach((cat, index) => {
          console.log(`${index + 1}. ${cat.name} (${cat.color}) - ${cat.bed_count} beds`);
        });
      }
      
      // Test create category
      console.log('\n3️⃣ Testing create category...');
      
      const newCategory = {
        name: `Test Category ${Date.now()}`,
        description: 'A test category created after fix',
        color: '#FF5733',
        icon: 'test-icon'
      };
      
      const createResponse = await axios.post(`${baseURL}/api/beds/categories`, newCategory, { headers });
      
      console.log('✅ Create category successful:', createResponse.status);
      console.log('📋 Created category:', createResponse.data?.category?.name);
      
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('✅ Bed Categories API is fully functional');
      console.log('✅ Frontend should now work properly');
      
    } catch (apiError) {
      console.log('❌ API call still failing');
      console.log('📋 Status:', apiError.response?.status);
      console.log('📋 Error:', JSON.stringify(apiError.response?.data, null, 2));
      
      // Check if backend needs restart
      console.log('\n💡 TROUBLESHOOTING:');
      console.log('1. Backend might need restart to load controller changes');
      console.log('2. Check if there are compilation errors in TypeScript');
      console.log('3. Verify the controller file was saved properly');
      
      // Test if backend is responding
      try {
        const healthResponse = await axios.get(`${baseURL}/health`);
        console.log('✅ Backend is responding:', healthResponse.status);
      } catch (healthError) {
        console.log('❌ Backend not responding:', healthError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAfterFix();