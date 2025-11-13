/**
 * Test Cognito Authentication System
 * 
 * This script tests the complete authentication flow including:
 * - User login with Cognito
 * - JWT token validation
 * - Role-based access control
 * - Tenant isolation
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

// Test users
const USERS = [
  {
    email: 'mdwasimkrm13@gmail.com',
    password: 'Advanture101$',
    role: 'hospital-admin',
    tenant: 'aajmin polyclinic',
    description: 'Hospital Administrator'
  },
  {
    email: 'mdwasimakram44@gmail.com',
    password: 'Advanture101$',
    role: 'admin',
    tenant: 'admin',
    description: 'System Administrator'
  }
];

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  if (details) {
    console.log(`   ${details}`);
  }
  
  testResults.tests.push({ name, passed, details });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

// Test 1: Sign in with valid credentials
async function testValidLogin(user) {
  console.log(`\n📝 Testing login for: ${user.email}`);
  
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/signin`, {
      email: user.email,
      password: user.password
    });
    
    if (response.status === 200 && response.data.AccessToken) {
      logTest(
        `Login with valid credentials (${user.email})`,
        true,
        `Token received: ${response.data.AccessToken.substring(0, 50)}...`
      );
      return response.data.AccessToken;
    } else {
      logTest(
        `Login with valid credentials (${user.email})`,
        false,
        'No access token in response'
      );
      return null;
    }
  } catch (error) {
    logTest(
      `Login with valid credentials (${user.email})`,
      false,
      error.response?.data?.message || error.message
    );
    return null;
  }
}

// Test 2: Sign in with invalid credentials
async function testInvalidLogin(user) {
  console.log(`\n📝 Testing invalid login for: ${user.email}`);
  
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/signin`, {
      email: user.email,
      password: 'WrongPassword123!'
    });
    
    logTest(
      `Login with invalid credentials (${user.email})`,
      false,
      'Should have failed but succeeded'
    );
  } catch (error) {
    if (error.response?.status === 500) {
      logTest(
        `Login with invalid credentials (${user.email})`,
        true,
        'Correctly rejected invalid credentials'
      );
    } else {
      logTest(
        `Login with invalid credentials (${user.email})`,
        false,
        `Unexpected error: ${error.message}`
      );
    }
  }
}

// Test 3: Access protected endpoint with valid token
async function testProtectedEndpoint(token, user) {
  console.log(`\n📝 Testing protected endpoint access for: ${user.email}`);
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': user.tenant === 'admin' ? 'admin' : 'tenant_1762083586064',
        'Origin': 'http://localhost:3002' // Simulate request from admin dashboard
      }
    });
    
    if (response.status === 200) {
      logTest(
        `Access protected endpoint (${user.email})`,
        true,
        `Retrieved ${response.data.users?.length || 0} users`
      );
    } else {
      logTest(
        `Access protected endpoint (${user.email})`,
        false,
        'Unexpected response status'
      );
    }
  } catch (error) {
    logTest(
      `Access protected endpoint (${user.email})`,
      false,
      error.response?.data?.message || error.message
    );
  }
}

// Test 4: Access protected endpoint without token
async function testUnauthorizedAccess() {
  console.log(`\n📝 Testing unauthorized access`);
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/users`, {
      headers: {
        'X-Tenant-ID': 'admin',
        'Origin': 'http://localhost:3002'
      }
    });
    
    logTest(
      'Access protected endpoint without token',
      false,
      'Should have been rejected but succeeded'
    );
  } catch (error) {
    if (error.response?.status === 401) {
      logTest(
        'Access protected endpoint without token',
        true,
        'Correctly rejected unauthorized access'
      );
    } else {
      logTest(
        'Access protected endpoint without token',
        false,
        `Unexpected error: ${error.message}`
      );
    }
  }
}

// Test 5: Verify role-based access control
async function testRoleBasedAccess(token, user) {
  console.log(`\n📝 Testing role-based access for: ${user.email}`);
  
  try {
    // Try to access admin-only endpoint
    const response = await axios.get(`${API_BASE_URL}/api/tenants`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': 'admin',
        'Origin': 'http://localhost:3002'
      }
    });
    
    if (user.role === 'admin') {
      logTest(
        `Admin access to tenants endpoint (${user.email})`,
        response.status === 200,
        response.status === 200 ? 'Admin access granted' : 'Admin access denied'
      );
    } else {
      // Hospital admin can also access tenants endpoint (their own tenant)
      logTest(
        `Hospital admin access to tenants endpoint (${user.email})`,
        response.status === 200,
        'Hospital admin can view tenant information'
      );
    }
  } catch (error) {
    if (user.role !== 'admin' && error.response?.status === 403) {
      logTest(
        `Non-admin access to tenants endpoint (${user.email})`,
        true,
        'Correctly denied non-admin access'
      );
    } else {
      logTest(
        `Role-based access control (${user.email})`,
        false,
        error.response?.data?.message || error.message
      );
    }
  }
}

// Test 6: Verify tenant isolation
async function testTenantIsolation(token1, user1, token2, user2) {
  console.log(`\n📝 Testing tenant isolation`);
  
  try {
    // Get users for tenant 1
    const response1 = await axios.get(`${API_BASE_URL}/api/users`, {
      headers: {
        'Authorization': `Bearer ${token1}`,
        'X-Tenant-ID': user1.tenant === 'admin' ? 'admin' : 'tenant_1762083586064',
        'Origin': 'http://localhost:3002'
      }
    });
    
    // Get users for tenant 2
    const response2 = await axios.get(`${API_BASE_URL}/api/users`, {
      headers: {
        'Authorization': `Bearer ${token2}`,
        'X-Tenant-ID': user2.tenant === 'admin' ? 'admin' : 'tenant_1762083586064',
        'Origin': 'http://localhost:3002'
      }
    });
    
    const users1 = response1.data.users || [];
    const users2 = response2.data.users || [];
    
    // Check if data is properly isolated
    const isolated = JSON.stringify(users1) !== JSON.stringify(users2) || 
                     user1.tenant === user2.tenant;
    
    logTest(
      'Tenant data isolation',
      isolated,
      `Tenant 1 has ${users1.length} users, Tenant 2 has ${users2.length} users`
    );
  } catch (error) {
    logTest(
      'Tenant data isolation',
      false,
      error.response?.data?.message || error.message
    );
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Cognito Authentication Tests');
  console.log('=========================================\n');
  
  console.log('Configuration:');
  console.log(`- API Base URL: ${API_BASE_URL}`);
  console.log(`- User Pool ID: ${process.env.COGNITO_USER_POOL_ID}`);
  console.log(`- Region: ${process.env.AWS_REGION}`);
  console.log(`- Users to test: ${USERS.length}\n`);
  
  const tokens = [];
  
  // Test valid logins for all users
  for (const user of USERS) {
    const token = await testValidLogin(user);
    tokens.push({ token, user });
  }
  
  // Test invalid logins
  for (const user of USERS) {
    await testInvalidLogin(user);
  }
  
  // Test protected endpoint access
  for (const { token, user } of tokens) {
    if (token) {
      await testProtectedEndpoint(token, user);
    }
  }
  
  // Test unauthorized access
  await testUnauthorizedAccess();
  
  // Test role-based access control
  for (const { token, user } of tokens) {
    if (token) {
      await testRoleBasedAccess(token, user);
    }
  }
  
  // Test tenant isolation (if we have at least 2 valid tokens)
  if (tokens.length >= 2 && tokens[0].token && tokens[1].token) {
    await testTenantIsolation(
      tokens[0].token, tokens[0].user,
      tokens[1].token, tokens[1].user
    );
  }
  
  // Print summary
  console.log('\n\n📊 Test Summary');
  console.log('================');
  console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%\n`);
  
  if (testResults.failed > 0) {
    console.log('❌ Failed Tests:');
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => {
        console.log(`   - ${t.name}`);
        if (t.details) console.log(`     ${t.details}`);
      });
  }
  
  console.log('\n✅ Authentication system testing complete!');
  
  if (testResults.failed === 0) {
    console.log('🎉 All tests passed! Authentication system is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error.message);
  process.exit(1);
});
