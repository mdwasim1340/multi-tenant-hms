/**
 * Simple Enhanced Bed Management System Test
 * Basic verification of the enhanced bed management system
 */

const axios = require('axios');
require('dotenv').config();

// Configuration
const BASE_URL = 'http://localhost:3000';
const TENANT_ID = 'aajmin_polyclinic';

// Test credentials
const TEST_CREDENTIALS = {
  email: 'mdwasimkrm13@gmail.com',
  password: 'Advanture101'
};

let authToken = '';

// Test authentication
async function testAuthentication() {
  console.log('🔐 Testing Authentication...');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/signin`, TEST_CREDENTIALS);
    
    if (response.data.token) {
      authToken = response.data.token;
      console.log('✅ Authentication successful');
      return true;
    } else {
      console.log('❌ Authentication failed - no token received');
      return false;
    }
  } catch (error) {
    console.log('❌ Authentication failed:', error.response?.data?.error || error.message);
    return false;
  }
}

// Test basic bed API (existing endpoint)
async function testBasicBedAPI() {
  console.log('\n🏥 Testing Basic Bed API...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/beds`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': TENANT_ID,
        'X-App-ID': 'hospital-management',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Basic bed API working');
    console.log(`   Beds found: ${response.data.beds?.length || 0}`);
    return true;
    
  } catch (error) {
    console.log('❌ Basic bed API failed:', error.response?.data || error.message);
    return false;
  }
}

// Test departments API
async function testDepartmentsAPI() {
  console.log('\n🏢 Testing Departments API...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/departments`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': TENANT_ID,
        'X-App-ID': 'hospital-management',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Departments API working');
    console.log(`   Departments found: ${response.data.departments?.length || 0}`);
    return true;
    
  } catch (error) {
    console.log('❌ Departments API failed:', error.response?.data || error.message);
    return false;
  }
}

// Test enhanced bed management API with proper headers
async function testEnhancedBedAPI() {
  console.log('\n🚀 Testing Enhanced Bed Management API...');
  
  try {
    // Try with different header combinations
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'X-Tenant-ID': TENANT_ID,
      'X-App-ID': 'hospital-management',
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:3001'
    };
    
    const response = await axios.get(`${BASE_URL}/api/bed-management/dashboard/metrics`, {
      headers
    });
    
    console.log('✅ Enhanced bed management API working');
    console.log(`   Metrics retrieved: ${JSON.stringify(response.data, null, 2)}`);
    return true;
    
  } catch (error) {
    console.log('❌ Enhanced bed management API failed:', error.response?.data || error.message);
    return false;
  }
}

// Check if backend server is running
async function testServerHealth() {
  console.log('🏥 Testing Server Health...');
  
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Backend server is running');
    console.log(`   Status: ${response.data.status}`);
    return true;
  } catch (error) {
    console.log('❌ Backend server not accessible:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Simple Enhanced Bed Management Test');
  console.log('='.repeat(40));
  
  const tests = [
    { name: 'Server Health', fn: testServerHealth },
    { name: 'Authentication', fn: testAuthentication },
    { name: 'Basic Bed API', fn: testBasicBedAPI },
    { name: 'Departments API', fn: testDepartmentsAPI },
    { name: 'Enhanced Bed API', fn: testEnhancedBedAPI }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ Test ${test.name} threw an error:`, error.message);
      failed++;
    }
  }
  
  // Final results
  console.log('\n' + '='.repeat(40));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(40));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
  } else if (passed > 0) {
    console.log('\n⚠️ Some tests passed. System partially operational.');
  } else {
    console.log('\n❌ All tests failed. Please check system configuration.');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});