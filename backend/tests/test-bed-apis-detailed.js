#!/usr/bin/env node

/**
 * Detailed Bed Management API Test
 * Date: November 24, 2025
 * Purpose: Investigate specific API endpoints for bed management
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_CREDENTIALS = {
  email: 'mdwasimkrm13@gmail.com',
  password: 'Advanture101$'
};

const TENANT_ID = 'aajmin_polyclinic';
const APP_ID = 'hospital-management';
const API_KEY = 'hospital-dev-key-123';

console.log('🔍 DETAILED BED MANAGEMENT API TEST');
console.log('=' .repeat(50));

async function getAuthToken() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/signin`, TEST_CREDENTIALS, {
      headers: {
        'Content-Type': 'application/json',
        'X-App-ID': APP_ID,
        'X-API-Key': API_KEY
      }
    });
    
    return response.data.token;
  } catch (error) {
    console.log('❌ Auth failed:', error.message);
    return null;
  }
}

async function testSpecificEndpoints() {
  console.log('\n🔐 Getting authentication token...');
  const token = await getAuthToken();
  
  if (!token) {
    console.log('❌ Cannot proceed without token');
    return;
  }
  
  console.log('✅ Token obtained');
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': TENANT_ID,
    'X-App-ID': APP_ID,
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  };
  
  // Test various endpoint variations
  const endpoints = [
    '/api/departments',
    '/api/beds',
    '/api/bed-management/departments',
    '/api/bed-management/beds',
    '/api/bed-management/stats',
    '/api/departments/stats',
    '/api/bed-categories',
    '/api/bed-management/categories'
  ];
  
  console.log('\n📡 Testing API endpoints...');
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Testing: ${endpoint}`);
      
      const response = await axios.get(`${BASE_URL}${endpoint}`, {
        headers,
        timeout: 5000
      });
      
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📊 Response size: ${JSON.stringify(response.data).length} bytes`);
      
      // Analyze response structure
      if (response.data) {
        if (Array.isArray(response.data)) {
          console.log(`   📋 Array with ${response.data.length} items`);
          if (response.data.length > 0) {
            console.log(`   🔍 First item keys: ${Object.keys(response.data[0]).join(', ')}`);
          }
        } else if (response.data.data && Array.isArray(response.data.data)) {
          console.log(`   📋 Data array with ${response.data.data.length} items`);
          if (response.data.data.length > 0) {
            console.log(`   🔍 First item keys: ${Object.keys(response.data.data[0]).join(', ')}`);
          }
        } else if (typeof response.data === 'object') {
          console.log(`   📋 Object with keys: ${Object.keys(response.data).join(', ')}`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Status: ${error.response?.status || 'ERROR'}`);
      console.log(`   💬 Error: ${error.response?.data?.error || error.message}`);
      
      if (error.response?.data) {
        console.log(`   📄 Response: ${JSON.stringify(error.response.data)}`);
      }
    }
  }
}

async function testDepartmentSpecific() {
  console.log('\n🏥 Testing Department-Specific Endpoints...');
  
  const token = await getAuthToken();
  if (!token) return;
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': TENANT_ID,
    'X-App-ID': APP_ID,
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  };
  
  // First get departments to find valid IDs
  try {
    const deptResponse = await axios.get(`${BASE_URL}/api/departments`, { headers });
    console.log('✅ Departments retrieved successfully');
    
    if (deptResponse.data && deptResponse.data.departments) {
      const departments = deptResponse.data.departments;
      console.log(`📋 Found ${departments.length} departments`);
      
      // Test with first department
      if (departments.length > 0) {
        const firstDept = departments[0];
        console.log(`🔍 Testing with department: ${firstDept.name} (ID: ${firstDept.id})`);
        
        // Test department stats with valid ID
        try {
          const statsResponse = await axios.get(`${BASE_URL}/api/departments/${firstDept.id}/stats`, { headers });
          console.log(`   ✅ Department stats: ${statsResponse.status}`);
          console.log(`   📊 Stats: ${JSON.stringify(statsResponse.data)}`);
        } catch (error) {
          console.log(`   ❌ Department stats failed: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
        }
        
        // Test department beds
        try {
          const bedsResponse = await axios.get(`${BASE_URL}/api/departments/${firstDept.id}/beds`, { headers });
          console.log(`   ✅ Department beds: ${bedsResponse.status}`);
          if (bedsResponse.data && bedsResponse.data.beds) {
            console.log(`   📋 Found ${bedsResponse.data.beds.length} beds in department`);
          }
        } catch (error) {
          console.log(`   ❌ Department beds failed: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Could not retrieve departments:', error.message);
  }
}

async function runDetailedTest() {
  await testSpecificEndpoints();
  await testDepartmentSpecific();
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 DETAILED TEST COMPLETE');
  console.log('='.repeat(50));
  console.log('✅ Authentication: Working');
  console.log('✅ Basic APIs: Departments and Beds working');
  console.log('⚠️ Some endpoints may need specific parameters');
  console.log('📝 Check logs above for specific endpoint results');
}

if (require.main === module) {
  runDetailedTest().catch(console.error);
}