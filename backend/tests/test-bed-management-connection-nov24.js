#!/usr/bin/env node

/**
 * Bed Management Backend-Frontend Connection Test
 * Date: November 24, 2025
 * Purpose: Verify backend API connectivity for bed management system
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const FRONTEND_URL = 'http://localhost:3001';

// Test credentials
const TEST_CREDENTIALS = {
  email: 'mdwasimkrm13@gmail.com',
  password: 'Advanture101$'
};

const TENANT_ID = 'aajmin_polyclinic';
const APP_ID = 'hospital-management';
const API_KEY = 'hospital-dev-key-123';

console.log('🔍 BED MANAGEMENT CONNECTION TEST - November 24, 2025');
console.log('=' .repeat(60));

async function testBackendHealth() {
  console.log('\n1️⃣ Testing Backend Server Health...');
  
  try {
    // Test basic server response
    const response = await axios.get(`${BASE_URL}/health`, {
      timeout: 5000
    });
    
    console.log('✅ Backend server is responding');
    console.log(`   Status: ${response.status}`);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server is not running on port 3000');
      return false;
    } else if (error.response?.status === 404) {
      console.log('✅ Backend server is running (404 expected for /health)');
      return true;
    } else {
      console.log('⚠️ Backend server response:', error.message);
      return true; // Server is running but endpoint doesn't exist
    }
  }
}

async function testFrontendHealth() {
  console.log('\n2️⃣ Testing Frontend Server Health...');
  
  try {
    const response = await axios.get(`${FRONTEND_URL}`, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Connection-Test-Bot'
      }
    });
    
    console.log('✅ Frontend server is responding');
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers['content-type']}`);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Frontend server is not running on port 3001');
      return false;
    } else {
      console.log('⚠️ Frontend server error:', error.message);
      return false;
    }
  }
}

async function testAuthentication() {
  console.log('\n3️⃣ Testing Authentication Flow...');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/signin`, TEST_CREDENTIALS, {
      headers: {
        'Content-Type': 'application/json',
        'X-App-ID': APP_ID,
        'X-API-Key': API_KEY
      },
      timeout: 10000
    });
    
    if (response.data && response.data.token) {
      console.log('✅ Authentication successful');
      console.log(`   Token received: ${response.data.token.substring(0, 20)}...`);
      console.log(`   User: ${response.data.user?.name || 'Unknown'}`);
      return response.data.token;
    } else {
      console.log('❌ Authentication failed - no token received');
      return null;
    }
  } catch (error) {
    console.log('❌ Authentication error:', error.response?.data?.error || error.message);
    console.log('   Status:', error.response?.status);
    return null;
  }
}

async function testBedManagementAPIs(token) {
  console.log('\n4️⃣ Testing Bed Management APIs...');
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': TENANT_ID,
    'X-App-ID': APP_ID,
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  };
  
  const endpoints = [
    { name: 'Departments', url: '/api/departments' },
    { name: 'Beds', url: '/api/beds' },
    { name: 'Department Stats', url: '/api/departments/stats' },
    { name: 'Bed Categories', url: '/api/bed-categories' }
  ];
  
  let successCount = 0;
  
  for (const endpoint of endpoints) {
    try {
      console.log(`   Testing ${endpoint.name}...`);
      
      const response = await axios.get(`${BASE_URL}${endpoint.url}`, {
        headers,
        timeout: 5000
      });
      
      console.log(`   ✅ ${endpoint.name}: ${response.status} - ${JSON.stringify(response.data).length} bytes`);
      
      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data)) {
          console.log(`      📊 Array with ${response.data.length} items`);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          console.log(`      📊 Data array with ${response.data.data.length} items`);
        } else {
          console.log(`      📊 Object response`);
        }
      }
      
      successCount++;
    } catch (error) {
      console.log(`   ❌ ${endpoint.name}: ${error.response?.status || 'ERROR'} - ${error.response?.data?.error || error.message}`);
    }
  }
  
  console.log(`\n   📈 API Success Rate: ${successCount}/${endpoints.length} (${Math.round(successCount/endpoints.length*100)}%)`);
  return successCount === endpoints.length;
}

async function testBedManagementPage() {
  console.log('\n5️⃣ Testing Bed Management Page Access...');
  
  try {
    const response = await axios.get(`${FRONTEND_URL}/bed-management`, {
      headers: {
        'User-Agent': 'Connection-Test-Bot'
      },
      timeout: 10000
    });
    
    console.log('✅ Bed Management page accessible');
    console.log(`   Status: ${response.status}`);
    console.log(`   Content Length: ${response.data.length} characters`);
    
    // Check for key indicators in the HTML
    const html = response.data;
    const indicators = [
      { name: 'React App', pattern: /__NEXT_DATA__/ },
      { name: 'Bed Management', pattern: /bed.?management/i },
      { name: 'Next.js', pattern: /_next/ },
      { name: 'JavaScript', pattern: /<script/ }
    ];
    
    console.log('   🔍 Page Content Analysis:');
    indicators.forEach(indicator => {
      const found = indicator.pattern.test(html);
      console.log(`      ${found ? '✅' : '❌'} ${indicator.name}: ${found ? 'Found' : 'Not found'}`);
    });
    
    return true;
  } catch (error) {
    console.log('❌ Bed Management page error:', error.message);
    console.log('   Status:', error.response?.status);
    return false;
  }
}

async function runConnectionTest() {
  console.log('🚀 Starting comprehensive connection test...\n');
  
  const results = {
    backend: false,
    frontend: false,
    auth: false,
    apis: false,
    page: false
  };
  
  // Test backend health
  results.backend = await testBackendHealth();
  
  // Test frontend health
  results.frontend = await testFrontendHealth();
  
  // Only proceed with API tests if both servers are running
  if (results.backend && results.frontend) {
    // Test authentication
    const token = await testAuthentication();
    results.auth = !!token;
    
    // Test APIs if authentication successful
    if (token) {
      results.apis = await testBedManagementAPIs(token);
    }
    
    // Test page access
    results.page = await testBedManagementPage();
  }
  
  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 CONNECTION TEST SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`Backend Server:     ${results.backend ? '🟢 ONLINE' : '🔴 OFFLINE'}`);
  console.log(`Frontend Server:    ${results.frontend ? '🟢 ONLINE' : '🔴 OFFLINE'}`);
  console.log(`Authentication:     ${results.auth ? '🟢 WORKING' : '🔴 FAILED'}`);
  console.log(`Bed Management APIs: ${results.apis ? '🟢 WORKING' : '🔴 FAILED'}`);
  console.log(`Page Access:        ${results.page ? '🟢 WORKING' : '🔴 FAILED'}`);
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  console.log(`\nOverall Success Rate: ${passedTests}/${totalTests} (${successRate}%)`);
  
  if (successRate === 100) {
    console.log('\n🎉 ALL TESTS PASSED - BED MANAGEMENT SYSTEM FULLY CONNECTED!');
  } else if (successRate >= 80) {
    console.log('\n⚠️ MOSTLY WORKING - Minor issues detected');
  } else if (successRate >= 60) {
    console.log('\n🔧 PARTIAL CONNECTION - Significant issues need attention');
  } else {
    console.log('\n🚨 MAJOR ISSUES - System requires immediate attention');
  }
  
  console.log('\n📝 Test completed at:', new Date().toISOString());
  
  return results;
}

// Run the test
if (require.main === module) {
  runConnectionTest()
    .then(results => {
      const allPassed = Object.values(results).every(Boolean);
      process.exit(allPassed ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test runner error:', error);
      process.exit(1);
    });
}

module.exports = { runConnectionTest };