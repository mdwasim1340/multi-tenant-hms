const axios = require('axios');
require('dotenv').config();

async function testWithCorrectPassword() {
  console.log('🔍 Testing Bed Categories API with Correct Password...\n');

  const baseURL = 'http://localhost:3000';
  const password = 'Advanture101$';
  
  // List of users to try (these exist in the database)
  const testUsers = [
    { email: 'mdwasimkrm13@gmail.com', tenant: 'aajmin_polyclinic' },
    { email: 'mrsonu1569@gmail.com', tenant: 'aajmin_polyclinic' },
    { email: 'boxihi4400@hh7f.com', tenant: 'aajmin_polyclinic' }
  ];
  
  for (const user of testUsers) {
    console.log(`\n🔐 Testing user: ${user.email}`);
    
    try {
      // Step 1: Sign in
      console.log('  📝 Attempting signin...');
      
      const signinResponse = await axios.post(`${baseURL}/auth/signin`, {
        email: user.email,
        password: password
      });
      
      console.log('  ✅ Signin successful!');
      const token = signinResponse.data.token;
      const userData = signinResponse.data.user;
      
      console.log('  📋 User data:', {
        email: userData.email,
        tenant: userData.tenant_id,
        hasToken: !!token,
        tokenPreview: token ? token.substring(0, 30) + '...' : 'none'
      });
      
      // Step 2: Test bed categories API
      console.log('\n  🛏️ Testing bed categories API...');
      
      const categoriesResponse = await axios.get(`${baseURL}/api/beds/categories`, {
        headers: {
          'Content-Type': 'application/json',
          'X-App-ID': 'hospital_system',
          'X-API-Key': 'hospital-dev-key-123',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': userData.tenant_id
        }
      });
      
      console.log('  ✅ Categories API successful:', categoriesResponse.status);
      console.log('  📊 Categories found:', categoriesResponse.data?.categories?.length || 0);
      
      if (categoriesResponse.data?.categories && categoriesResponse.data.categories.length > 0) {
        console.log('\n  📋 Categories:');
        categoriesResponse.data.categories.forEach((cat, index) => {
          console.log(`    ${index + 1}. ${cat.name} (${cat.color}) - ${cat.description}`);
        });
      }
      
      // Step 3: Test create category
      console.log('\n  ➕ Testing create category...');
      
      const newCategory = {
        name: `Test Category ${Date.now()}`,
        description: 'A test category created by API test',
        color: '#FF5733',
        icon: 'test-icon'
      };
      
      const createResponse = await axios.post(`${baseURL}/api/beds/categories`, newCategory, {
        headers: {
          'Content-Type': 'application/json',
          'X-App-ID': 'hospital_system',
          'X-API-Key': 'hospital-dev-key-123',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': userData.tenant_id
        }
      });
      
      console.log('  ✅ Create category successful:', createResponse.status);
      console.log('  📋 Created category ID:', createResponse.data?.category?.id);
      
      // Success! We found working credentials and API works
      console.log('\n🎉 SUCCESS! Everything is working!');
      console.log(`✅ Working credentials: ${user.email} / ${password}`);
      console.log(`✅ Tenant: ${userData.tenant_id}`);
      console.log(`✅ Bed Categories API is fully functional`);
      console.log(`✅ Both GET and POST endpoints work`);
      
      // Now let's check what's wrong with the frontend
      console.log('\n🔍 FRONTEND ISSUE ANALYSIS:');
      console.log('The backend API is working perfectly with proper authentication.');
      console.log('The issue is likely in the frontend authentication flow.');
      console.log('');
      console.log('NEXT STEPS:');
      console.log('1. Check if user is properly logged in on frontend');
      console.log('2. Verify token is being stored in cookies correctly');
      console.log('3. Check if X-Tenant-ID is being sent correctly');
      console.log('4. Verify API client configuration');
      
      return; // Exit after first success
      
    } catch (error) {
      console.log('  ❌ Error:', error.response?.status, error.response?.data?.error || error.message);
      
      if (error.response?.data) {
        console.log('  📋 Error details:', JSON.stringify(error.response.data, null, 2));
      }
    }
  }
  
  console.log('\n❌ No working authentication found');
}

testWithCorrectPassword().catch(console.error);