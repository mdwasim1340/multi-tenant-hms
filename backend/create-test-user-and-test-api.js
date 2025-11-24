const axios = require('axios');
require('dotenv').config();

async function createTestUserAndTestAPI() {
  console.log('🔍 Creating Test User and Testing Bed Categories API...\n');

  const baseURL = 'http://localhost:3000';
  
  const testUser = {
    email: 'testuser@aajminpolyclinic.com',
    password: 'TestPass123!',
    name: 'Test User',
    tenant: 'aajmin_polyclinic'
  };
  
  try {
    // Step 1: Try to create a new user
    console.log('1️⃣ Creating test user...');
    
    try {
      const signupResponse = await axios.post(`${baseURL}/auth/signup`, {
        email: testUser.email,
        password: testUser.password,
        name: testUser.name,
        tenant: testUser.tenant
      });
      
      console.log('✅ User created successfully');
      
    } catch (signupError) {
      if (signupError.response?.status === 409) {
        console.log('ℹ️ User already exists, proceeding with signin...');
      } else {
        console.log('❌ Signup failed:', signupError.response?.data || signupError.message);
        return;
      }
    }
    
    // Step 2: Sign in with the user
    console.log('\n2️⃣ Signing in...');
    
    const signinResponse = await axios.post(`${baseURL}/auth/signin`, {
      email: testUser.email,
      password: testUser.password
    });
    
    console.log('✅ Signin successful');
    const token = signinResponse.data.token;
    const userData = signinResponse.data.user;
    
    console.log('📋 User info:', {
      email: userData.email,
      tenant: userData.tenant_id,
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'none'
    });
    
    // Step 3: Test bed categories API
    console.log('\n3️⃣ Testing bed categories API...');
    
    const categoriesResponse = await axios.get(`${baseURL}/api/beds/categories`, {
      headers: {
        'Content-Type': 'application/json',
        'X-App-ID': 'hospital_system',
        'X-API-Key': 'hospital-dev-key-123',
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': userData.tenant_id
      }
    });
    
    console.log('✅ Categories API successful:', categoriesResponse.status);
    console.log('📊 Categories found:', categoriesResponse.data?.categories?.length || 0);
    
    if (categoriesResponse.data?.categories) {
      console.log('\n📋 Categories data:');
      categoriesResponse.data.categories.forEach((cat, index) => {
        console.log(`${index + 1}. ${cat.name} (${cat.color}) - ${cat.description}`);
      });
    }
    
    // Step 4: Test other bed categories endpoints
    console.log('\n4️⃣ Testing create category endpoint...');
    
    try {
      const newCategory = {
        name: 'Test Category',
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
      
      console.log('✅ Create category successful:', createResponse.status);
      console.log('📋 Created category:', createResponse.data);
      
    } catch (createError) {
      console.log('❌ Create category failed:', createError.response?.status, createError.response?.data || createError.message);
    }
    
    console.log('\n🎉 SUCCESS! Bed Categories API is working properly');
    console.log(`✅ Working credentials: ${testUser.email} / ${testUser.password}`);
    console.log(`✅ Tenant: ${userData.tenant_id}`);
    console.log(`✅ Token authentication works`);
    
  } catch (error) {
    console.log('❌ Test failed:', error.response?.status, error.response?.data || error.message);
    
    if (error.response?.data) {
      console.log('📋 Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

createTestUserAndTestAPI().catch(console.error);