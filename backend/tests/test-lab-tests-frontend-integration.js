/**
 * Lab Tests Frontend Integration Test
 * 
 * Test complete lab tests workflow from frontend perspective
 */

require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const TENANT_ID = process.env.TEST_TENANT_ID || 'aajmin_polyclinic';

// Test credentials
let authToken = null;
let testOrderId = null;
let testResultId = null;

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test authentication
async function testAuthentication() {
  log('\n📝 Testing Authentication...', 'blue');
  
  try {
    const response = await axios.post(`${API_URL}/auth/signin`, {
      email: 'admin@aajminpolyclinic.com',
      password: 'Admin@123'
    });

    if (response.data && response.data.token) {
      authToken = response.data.token;
      log('✅ Authentication successful', 'green');
      return true;
    }
  } catch (error) {
    log(`❌ Authentication failed: ${error.message}`, 'red');
    return false;
  }
}

// Test lab tests listing
async function testLabTestsListing() {
  log('\n🧪 Testing Lab Tests Listing...', 'blue');
  
  try {
    const response = await axios.get(`${API_URL}/api/lab-tests`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': TENANT_ID
      }
    });

    if (response.data && response.data.tests) {
      log(`✅ Retrieved ${response.data.tests.length} lab tests`, 'green');
      log(`   Categories: ${response.data.tests.map(t => t.category_name).filter((v, i, a) => a.indexOf(v) === i).join(', ')}`, 'yellow');
      return true;
    }
  } catch (error) {
    log(`❌ Lab tests listing failed: ${error.message}`, 'red');
    return false;
  }
}

// Test lab order creation
async function testLabOrderCreation() {
  log('\n📋 Testing Lab Order Creation...', 'blue');
  
  try {
    // First, get available tests
    const testsResponse = await axios.get(`${API_URL}/api/lab-tests?limit=3`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': TENANT_ID
      }
    });

    if (!testsResponse.data || !testsResponse.data.tests || testsResponse.data.tests.length === 0) {
      log('⚠️  No tests available for order creation', 'yellow');
      return false;
    }

    const testIds = testsResponse.data.tests.slice(0, 2).map(t => t.id);

    // Create order
    const orderData = {
      patient_id: 1,
      ordered_by: 1,
      priority: 'routine',
      clinical_notes: 'Frontend integration test order',
      test_ids: testIds
    };

    const response = await axios.post(`${API_URL}/api/lab-orders`, orderData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': TENANT_ID,
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.order) {
      testOrderId = response.data.order.id;
      log(`✅ Lab order created: ${response.data.order.order_number}`, 'green');
      log(`   Tests: ${testIds.length}`, 'yellow');
      log(`   Priority: ${response.data.order.priority}`, 'yellow');
      return true;
    }
  } catch (error) {
    log(`❌ Lab order creation failed: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

// Test lab order details
async function testLabOrderDetails() {
  log('\n📄 Testing Lab Order Details...', 'blue');
  
  if (!testOrderId) {
    log('⚠️  No order ID available', 'yellow');
    return false;
  }

  try {
    const response = await axios.get(`${API_URL}/api/lab-orders/${testOrderId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': TENANT_ID
      }
    });

    if (response.data) {
      log('✅ Order details retrieved', 'green');
      log(`   Order Number: ${response.data.order_number}`, 'yellow');
      log(`   Status: ${response.data.status}`, 'yellow');
      log(`   Items: ${response.data.items?.length || 0}`, 'yellow');
      return true;
    }
  } catch (error) {
    log(`❌ Order details failed: ${error.message}`, 'red');
    return false;
  }
}

// Test specimen collection
async function testSpecimenCollection() {
  log('\n🧪 Testing Specimen Collection...', 'blue');
  
  if (!testOrderId) {
    log('⚠️  No order ID available', 'yellow');
    return false;
  }

  try {
    const response = await axios.post(
      `${API_URL}/api/lab-orders/${testOrderId}/collect`,
      { collected_by: 1 },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-ID': TENANT_ID,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data) {
      log('✅ Specimen collected', 'green');
      return true;
    }
  } catch (error) {
    log(`❌ Specimen collection failed: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

// Test result entry
async function testResultEntry() {
  log('\n📊 Testing Result Entry...', 'blue');
  
  if (!testOrderId) {
    log('⚠️  No order ID available', 'yellow');
    return false;
  }

  try {
    // Get order items
    const orderResponse = await axios.get(`${API_URL}/api/lab-orders/${testOrderId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': TENANT_ID
      }
    });

    if (!orderResponse.data || !orderResponse.data.items || orderResponse.data.items.length === 0) {
      log('⚠️  No order items available', 'yellow');
      return false;
    }

    const firstItem = orderResponse.data.items[0];

    // Add result
    const resultData = {
      order_item_id: firstItem.id,
      result_numeric: 95.5,
      result_unit: 'mg/dL',
      reference_range: '70-100 mg/dL',
      performed_by: 1,
      interpretation: 'Result within normal range'
    };

    const response = await axios.post(`${API_URL}/api/lab-results`, resultData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': TENANT_ID,
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.result) {
      testResultId = response.data.result.id;
      log('✅ Result entered', 'green');
      log(`   Value: ${response.data.result.result_numeric} ${response.data.result.result_unit}`, 'yellow');
      log(`   Abnormal: ${response.data.result.is_abnormal}`, 'yellow');
      return true;
    }
  } catch (error) {
    log(`❌ Result entry failed: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

// Test result verification
async function testResultVerification() {
  log('\n✅ Testing Result Verification...', 'blue');
  
  if (!testResultId) {
    log('⚠️  No result ID available', 'yellow');
    return false;
  }

  try {
    const response = await axios.post(
      `${API_URL}/api/lab-results/${testResultId}/verify`,
      { verified_by: 1 },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-ID': TENANT_ID,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.result) {
      log('✅ Result verified', 'green');
      log(`   Verified at: ${response.data.result.verified_at}`, 'yellow');
      return true;
    }
  } catch (error) {
    log(`❌ Result verification failed: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

// Test statistics endpoints
async function testStatistics() {
  log('\n📈 Testing Statistics...', 'blue');
  
  try {
    // Order statistics
    const orderStats = await axios.get(`${API_URL}/api/lab-orders/statistics`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': TENANT_ID
      }
    });

    if (orderStats.data) {
      log('✅ Order statistics retrieved', 'green');
      log(`   Total: ${orderStats.data.total_orders}`, 'yellow');
      log(`   Pending: ${orderStats.data.pending_orders}`, 'yellow');
      log(`   Completed: ${orderStats.data.completed_orders}`, 'yellow');
    }

    // Result statistics
    const resultStats = await axios.get(`${API_URL}/api/lab-results/statistics`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': TENANT_ID
      }
    });

    if (resultStats.data) {
      log('✅ Result statistics retrieved', 'green');
      log(`   Total: ${resultStats.data.total_results}`, 'yellow');
      log(`   Abnormal: ${resultStats.data.abnormal_results}`, 'yellow');
      log(`   Verified: ${resultStats.data.verified_results}`, 'yellow');
    }

    return true;
  } catch (error) {
    log(`❌ Statistics failed: ${error.message}`, 'red');
    return false;
  }
}

// Run all tests
async function runTests() {
  log('='.repeat(60), 'blue');
  log('🧪 Lab Tests Frontend Integration Test', 'blue');
  log('='.repeat(60), 'blue');

  const results = {
    authentication: await testAuthentication(),
    labTestsListing: await testLabTestsListing(),
    labOrderCreation: await testLabOrderCreation(),
    labOrderDetails: await testLabOrderDetails(),
    specimenCollection: await testSpecimenCollection(),
    resultEntry: await testResultEntry(),
    resultVerification: await testResultVerification(),
    statistics: await testStatistics()
  };

  // Summary
  log('\n' + '='.repeat(60), 'blue');
  log('📊 Test Summary', 'blue');
  log('='.repeat(60), 'blue');

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([test, result]) => {
    const status = result ? '✅ PASS' : '❌ FAIL';
    const color = result ? 'green' : 'red';
    log(`${status} - ${test}`, color);
  });

  log('\n' + '='.repeat(60), 'blue');
  log(`Results: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`, 
    passed === total ? 'green' : 'yellow');
  log('='.repeat(60), 'blue');

  if (passed === total) {
    log('\n🎉 All tests passed! Frontend integration is working correctly!', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please check the errors above.', 'yellow');
  }

  process.exit(passed === total ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test execution failed: ${error.message}`, 'red');
  process.exit(1);
});
