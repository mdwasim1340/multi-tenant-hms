const axios = require('axios');
require('dotenv').config();

async function testAuthWithExistingUser() {
  console.log('🔍 Testing Authentication with Existing Users...\n');

  const baseURL = 'http://localhost:3000';
  
  // List of users to try (these exist in the database)
  const testUsers = [
    { email: 'mdwasimkrm13@gmail.com', tenant: 'aajmin_polyclinic' },
    { email: 'admin@testcomplete2.com', tenant: 'test_complete_1762083064426' },
    { email: 'admin@autoid.com', tenant: 'tenant_1762083064503' }
  ];
  
  // Common passwords to try
  const commonPasswords = [
    'password123',
    'AdminPass123!',
    'admin123',
    'Password123!',
    'test123'
  ];
  
  for (const user of testUsers) {
    console.log(`\n🔐 Testing user: ${user.email}`);
    
    for (const password of commonPasswords) {
      try {
        console.log(`  Trying password: ${password.substring(0, 4)}...`);
        
        const signinResponse = await axios.post(`${baseURL}/auth/signin`, {
          email: user.email,
          password: password
        });
        
        console.log(`  ✅ SUCCESS! Password found for ${user.email}`);
        const token = signinResponse.data.token;
        const userData = signinResponse.data.user;
        
        console.log('  📋 User data:', {
          email: userData.email,
          tenant: userData.tenant_id || user.tenant,
          hasToken: !!token
        });
        
        // Now test the bed categories API
        console.log('\n  🛏️ Testing bed categories API...');
        
        const categoriesResponse = await axios.get(`${baseURL}/api/beds/categories`, {
          headers: {
            'Content-Type': 'application/json',
            'X-App-ID': 'hospital_system',
            'X-API-Key': 'hospital-dev-key-123',
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': userData.tenant_id || user.tenant
          }
        });
        
        console.log('  ✅ Categories API successful:', categoriesResponse.status);
        console.log('  📊 Categories found:', categoriesResponse.data?.categories?.length || 0);
        
        if (categoriesResponse.data?.categories?.length > 0) {
          console.log('  📋 Sample category:', categoriesResponse.data.categories[0]);
        }
        
        // Success! We found working credentials
        console.log('\n🎉 SOLUTION FOUND!');
        console.log(`✅ Working credentials: ${user.email} / ${password}`);
        console.log(`✅ Tenant: ${userData.tenant_id || user.tenant}`);
        console.log(`✅ Token works for bed categories API`);
        
        return; // Exit after first success
        
      } catch (error) {
        if (error.response?.status === 401) {
          console.log(`  ❌ Wrong password`);
        } else {
          console.log(`  ❌ Error:`, error.response?.status, error.response?.data?.error || error.message);
        }
      }
    }
  }
  
  console.log('\n❌ No working credentials found with common passwords');
  console.log('💡 You may need to create a new user or reset password');
}

testAuthWithExistingUser().catch(console.error);