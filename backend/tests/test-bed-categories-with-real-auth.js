const axios = require('axios');
require('dotenv').config();

async function testWithRealAuth() {
  console.log('🔍 Testing Bed Categories API with Real Authentication...\n');

  const baseURL = 'http://localhost:3000';
  
  // Step 1: Get a real JWT token by signing in
  console.log('1️⃣ Attempting to sign in and get real JWT token...');
  
  try {
    const signinResponse = await axios.post(`${baseURL}/auth/signin`, {
      email: 'admin@aajminpolyclinic.com',
      password: 'AdminPass123!'
    });
    
    console.log('✅ Signin successful');
    const token = signinResponse.data.token;
    const user = signinResponse.data.user;
    
    console.log('📋 User info:', {
      email: user.email,
      tenant: user.tenant,
      hasToken: !!token
    });
    
    // Step 2: Test bed categories API with real token
    console.log('\n2️⃣ Testing bed categories API with real token...');
    
    const categoriesResponse = await axios.get(`${baseURL}/api/beds/categories`, {
      headers: {
        'Content-Type': 'application/json',
        'X-App-ID': 'hospital_system',
        'X-API-Key': 'hospital-dev-key-123',
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': user.tenant || 'tenant_aajmin_polyclinic'
      }
    });
    
    console.log('✅ Categories API successful:', categoriesResponse.status);
    console.log('📊 Categories found:', categoriesResponse.data?.categories?.length || 0);
    
    if (categoriesResponse.data?.categories?.length > 0) {
      console.log('📋 Sample category:', categoriesResponse.data.categories[0]);
    }
    
  } catch (error) {
    if (error.response?.status === 401 && error.response?.data?.error?.includes('User not found')) {
      console.log('❌ User not found - trying to create user first...');
      
      // Try to create the user
      try {
        console.log('\n🔧 Creating test user...');
        const signupResponse = await axios.post(`${baseURL}/auth/signup`, {
          email: 'admin@aajminpolyclinic.com',
          password: 'AdminPass123!',
          name: 'Admin User',
          tenant: 'aajmin_polyclinic'
        });
        
        console.log('✅ User created successfully');
        
        // Now try signin again
        console.log('\n🔄 Retrying signin...');
        const signinResponse = await axios.post(`${baseURL}/auth/signin`, {
          email: 'admin@aajminpolyclinic.com',
          password: 'AdminPass123!'
        });
        
        const token = signinResponse.data.token;
        const user = signinResponse.data.user;
        
        console.log('✅ Signin successful after user creation');
        
        // Test categories API
        const categoriesResponse = await axios.get(`${baseURL}/api/beds/categories`, {
          headers: {
            'Content-Type': 'application/json',
            'X-App-ID': 'hospital_system',
            'X-API-Key': 'hospital-dev-key-123',
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': user.tenant || 'tenant_aajmin_polyclinic'
          }
        });
        
        console.log('✅ Categories API successful:', categoriesResponse.status);
        console.log('📊 Categories found:', categoriesResponse.data?.categories?.length || 0);
        
      } catch (createError) {
        console.log('❌ Failed to create user:', createError.response?.data || createError.message);
      }
      
    } else {
      console.log('❌ Authentication failed:', error.response?.status, error.response?.data || error.message);
    }
  }
}

testWithRealAuth().catch(console.error);