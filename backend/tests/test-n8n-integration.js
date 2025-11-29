/**
 * Test n8n AI Agents Integration
 * Tests all department agents: OPD, Ward, Emergency, General Query
 */

const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000';
const SESSION_ID = `test_session_${Date.now()}`;

// Test configuration
const TESTS = [
  {
    department: 'opd',
    message: 'What are the common symptoms of diabetes?',
    description: 'OPD Agent - Medical consultation'
  },
  {
    department: 'ward',
    message: 'How do I manage patient discharge procedures?',
    description: 'Ward Agent - Ward management'
  },
  {
    department: 'emergency',
    message: 'What is the protocol for cardiac arrest?',
    description: 'Emergency Agent - Emergency procedures'
  },
  {
    department: 'general',
    message: 'What are the hospital visiting hours?',
    description: 'General Query - Hospital information'
  }
];

async function testN8NStatus() {
  console.log('\n🔍 Testing n8n Configuration Status...\n');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/n8n/status`);
    
    if (response.data.success) {
      console.log('✅ n8n Configuration Status:');
      console.log('   Base URL:', response.data.configured.baseUrl ? '✓' : '✗');
      console.log('   Auth Token:', response.data.configured.authToken ? '✓' : '✗');
      console.log('   OPD Agent:', response.data.configured.opdPath ? '✓' : '✗');
      console.log('   Ward Agent:', response.data.configured.wardPath ? '✓' : '✗');
      console.log('   Emergency Agent:', response.data.configured.emergencyPath ? '✓' : '✗');
      console.log('\n   Agent URLs:');
      console.log('   - OPD:', response.data.agents.opd.url);
      console.log('   - Ward:', response.data.agents.ward.url);
      console.log('   - Emergency:', response.data.agents.emergency.url);
      return true;
    }
  } catch (error) {
    console.error('❌ Failed to check n8n status:', error.message);
    return false;
  }
}

async function testDepartmentAgent(department, message, description) {
  console.log(`\n🤖 Testing: ${description}`);
  console.log(`   Department: ${department}`);
  console.log(`   Message: "${message}"`);
  
  try {
    const response = await axios.post(
      `${BASE_URL}/api/n8n/chat`,
      {
        message: message,
        sessionId: SESSION_ID,
        department: department
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 95000 // Slightly longer than n8n timeout
      }
    );
    
    if (response.data.success) {
      console.log('✅ Response received:');
      console.log(`   Status: Success`);
      console.log(`   Department: ${response.data.department}`);
      console.log(`   Response length: ${response.data.response.length} characters`);
      console.log(`   Response preview: ${response.data.response.substring(0, 150)}...`);
      return true;
    } else {
      console.log('❌ Request failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.error || error.message);
    if (error.response?.data?.debug) {
      console.error('   Debug info:', error.response.data.debug);
    }
    return false;
  }
}

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         n8n AI Agents Integration Test Suite              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  // Check configuration first
  const configOk = await testN8NStatus();
  
  if (!configOk) {
    console.log('\n⚠️  Configuration check failed. Please verify .env settings.');
    console.log('   Required variables:');
    console.log('   - N8N_BASE_URL');
    console.log('   - N8N_WEBHOOK_AUTH_TOKEN');
    console.log('   - N8N_OPD_AGENT_PATH');
    console.log('   - N8N_WARD_AGENT_PATH');
    console.log('   - N8N_EMERGENCY_AGENT_PATH');
    return;
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('Starting Agent Tests...');
  console.log('═'.repeat(60));
  
  let passed = 0;
  let failed = 0;
  
  for (const test of TESTS) {
    const result = await testDepartmentAgent(
      test.department,
      test.message,
      test.description
    );
    
    if (result) {
      passed++;
    } else {
      failed++;
    }
    
    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('Test Summary');
  console.log('═'.repeat(60));
  console.log(`✅ Passed: ${passed}/${TESTS.length}`);
  console.log(`❌ Failed: ${failed}/${TESTS.length}`);
  console.log(`📊 Success Rate: ${((passed / TESTS.length) * 100).toFixed(1)}%`);
  
  if (passed === TESTS.length) {
    console.log('\n🎉 All tests passed! n8n integration is working correctly.');
  } else if (passed > 0) {
    console.log('\n⚠️  Some tests failed. Check the error messages above.');
  } else {
    console.log('\n❌ All tests failed. Please check:');
    console.log('   1. Backend server is running (npm run dev)');
    console.log('   2. n8n instance is accessible');
    console.log('   3. Webhook paths are correct');
    console.log('   4. Authentication token is valid');
  }
}

// Run tests
runTests().catch(error => {
  console.error('\n💥 Test suite crashed:', error.message);
  process.exit(1);
});
