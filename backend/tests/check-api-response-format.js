const axios = require('axios');
require('dotenv').config();

async function checkApiResponseFormat() {
  console.log('🔍 Checking API Response Format...\n');

  const baseURL = 'http://localhost:3000';
  const password = 'Advanture101$';
  const email = 'mdwasimkrm13@gmail.com';
  
  try {
    // Step 1: Sign in
    const signinResponse = await axios.post(`${baseURL}/auth/signin`, {
      email: email,
      password: password
    });
    
    const token = signinResponse.data.token;
    const userData = signinResponse.data.user;
    const tenantId = userData.tenant_id;
    
    console.log('✅ Signin successful');
    
    // Step 2: Get categories and examine response format
    const headers = {
      'Content-Type': 'application/json',
      'X-App-ID': 'hospital_system',
      'X-API-Key': 'hospital-dev-key-123',
      'Authorization': `Bearer ${token}`,
      'X-Tenant-ID': tenantId
    };
    
    const response = await axios.get(`${baseURL}/api/beds/categories`, { headers });
    
    console.log('📊 Raw API Response:');
    console.log('Status:', response.status);
    console.log('Data keys:', Object.keys(response.data));
    console.log('Categories count:', response.data.categories?.length);
    
    if (response.data.categories && response.data.categories.length > 0) {
      console.log('\n📋 First category structure:');
      const firstCategory = response.data.categories[0];
      console.log('Keys:', Object.keys(firstCategory));
      console.log('Sample category:', JSON.stringify(firstCategory, null, 2));
      
      console.log('\n📊 Bed count analysis:');
      response.data.categories.forEach((cat, index) => {
        console.log(`${index + 1}. ${cat.name}:`);
        console.log(`   - bed_count value: "${cat.bed_count}"`);
        console.log(`   - bed_count type: ${typeof cat.bed_count}`);
        console.log(`   - parsed as int: ${parseInt(cat.bed_count)}`);
        console.log(`   - is truthy: ${!!cat.bed_count}`);
      });
    }
    
    console.log('\n💡 ANALYSIS:');
    console.log('If bed_count is showing as "0" (string) instead of 0 (number),');
    console.log('the backend server needs to be restarted to load the controller changes.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.status, error.response?.data || error.message);
  }
}

checkApiResponseFormat();