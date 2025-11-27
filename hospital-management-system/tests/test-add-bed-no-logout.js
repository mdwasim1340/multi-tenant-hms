/**
 * Test Script: Verify Add Bed No Longer Causes Logout
 * 
 * This script tests the fix for the add bed logout issue
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';
const TENANT_ID = 'aajmin_polyclinic';

// Test scenarios
const testScenarios = [
  {
    name: 'Valid Bed Data',
    data: {
      bed_number: 'TEST-301',
      department_id: 3,
      bed_type: 'Standard',
      floor_number: '3',
      room_number: '301',
      wing: 'A',
      features: {
        equipment: ['Monitor', 'IV Stand'],
        features: ['Adjustable Height', 'Side Rails']
      },
      notes: 'Test bed - should not cause logout'
    },
    expectedStatus: 201,
    shouldLogout: false
  },
  {
    name: 'Duplicate Bed Number',
    data: {
      bed_number: 'TEST-301', // Same as above
      department_id: 3,
      bed_type: 'Standard',
      floor_number: '3',
      room_number: '301',
      wing: 'A'
    },
    expectedStatus: 400,
    shouldLogout: false
  },
  {
    name: 'Invalid Department ID',
    data: {
      bed_number: 'TEST-302',
      department_id: 9999, // Non-existent
      bed_type: 'Standard',
      floor_number: '3',
      room_number: '302',
      wing: 'A'
    },
    expectedStatus: 400,
    shouldLogout: false
  },
  {
    name: 'Missing Required Fields',
    data: {
      bed_number: 'TEST-303',
      // Missing department_id
      bed_type: 'Standard'
    },
    expectedStatus: 400,
    shouldLogout: false
  }
];

async function testAddBed(scenario, token) {
  console.log(`\n🧪 Testing: ${scenario.name}`);
  console.log('─'.repeat(70));

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/beds`,
      scenario.data,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': TENANT_ID,
          'X-App-ID': 'hospital_system',
          'X-API-Key': 'hospital-dev-key-789',
          'Content-Type': 'application/json'
        },
        validateStatus: () => true // Don't throw on any status
      }
    );

    console.log(`Status: ${response.status}`);
    console.log(`Expected: ${scenario.expectedStatus}`);

    if (response.status === scenario.expectedStatus) {
      console.log('✅ Status code matches expected');
    } else {
      console.log('❌ Status code does not match expected');
    }

    // Check if response indicates logout
    const responseData = response.data;
    const hasLogoutIndicator = 
      responseData?.error?.toLowerCase().includes('token expired') ||
      responseData?.error?.toLowerCase().includes('token invalid') ||
      responseData?.error?.toLowerCase().includes('jwt expired');

    if (hasLogoutIndicator && !scenario.shouldLogout) {
      console.log('❌ FAIL: Response indicates logout when it should not');
      console.log('Error message:', responseData.error);
      return false;
    } else if (!hasLogoutIndicator && scenario.shouldLogout) {
      console.log('❌ FAIL: Response does not indicate logout when it should');
      return false;
    } else {
      console.log('✅ Logout behavior is correct');
    }

    // Log response for debugging
    if (response.status >= 400) {
      console.log('Error response:', JSON.stringify(responseData, null, 2));
    } else {
      console.log('Success response:', JSON.stringify(responseData, null, 2));
    }

    return true;

  } catch (error) {
    console.log('❌ Request failed:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Add Bed Logout Fix Tests');
  console.log('═'.repeat(70));

  // First, we need a valid token
  console.log('\n📝 Note: This test requires a valid authentication token');
  console.log('Please ensure you have a valid token in your cookies or environment');
  console.log('For manual testing, use the browser console to get the token:');
  console.log('  document.cookie.split("; ").find(row => row.startsWith("token="))');
  console.log('');

  // For automated testing, you would get the token from login
  // For now, we'll use a placeholder
  const token = process.env.TEST_TOKEN || 'your-test-token-here';

  if (token === 'your-test-token-here') {
    console.log('⚠️  No test token provided. Set TEST_TOKEN environment variable.');
    console.log('Example: TEST_TOKEN=your-token node test-add-bed-no-logout.js');
    console.log('');
    console.log('Continuing with placeholder token for demonstration...');
  }

  let passedTests = 0;
  let failedTests = 0;

  for (const scenario of testScenarios) {
    const result = await testAddBed(scenario, token);
    if (result) {
      passedTests++;
    } else {
      failedTests++;
    }
  }

  console.log('\n═'.repeat(70));
  console.log('📊 Test Results Summary');
  console.log('═'.repeat(70));
  console.log(`Total Tests: ${testScenarios.length}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log('');

  if (failedTests === 0) {
    console.log('🎉 All tests passed! The add bed logout issue is fixed.');
  } else {
    console.log('⚠️  Some tests failed. Please review the output above.');
  }

  console.log('═'.repeat(70));
}

// Run the tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
