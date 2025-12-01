/**
 * Multi-Tenant Isolation Verification Test
 * 
 * This test verifies that the billing system properly isolates data between tenants.
 * It tests:
 * 1. X-Tenant-ID header enforcement
 * 2. Cross-tenant access prevention
 * 3. Data isolation between tenants
 * 
 * Requirements: Backend server must be running
 * Run: node backend/tests/test-multi-tenant-isolation.js
 */

const axios = require('axios');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || 'hospital-dev-key-123';

// Test data - You'll need to replace these with actual tenant IDs and tokens
const TENANT_A = {
  id: 'tenant_1762083064503',
  name: 'Tenant A',
  token: null, // Will be set after login
  email: 'admin@tenanta.com',
  password: 'password123'
};

const TENANT_B = {
  id: 'tenant_1762083064515',
  name: 'Tenant B',
  token: null, // Will be set after login
  email: 'admin@tenantb.com',
  password: 'password123'
};

// Test results
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to log test results
function logTest(name, passed, message) {
  results.total++;
  if (passed) {
    results.passed++;
    console.log(`✅ PASS: ${name}`);
  } else {
    results.failed++;
    console.log(`❌ FAIL: ${name}`);
    console.log(`   ${message}`);
  }
  results.tests.push({ name, passed, message });
}

// Helper function to make API request
async function makeRequest(method, endpoint, data, headers) {
  try {
    const response = await axios({
      method,
      url: `${API_URL}${endpoint}`,
      data,
      headers: {
        'Content-Type': 'application/json',
        'X-App-ID': 'hospital-management',
        'X-API-Key': API_KEY,
        ...headers
      }
    });
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

// Test 1: Verify X-Tenant-ID header is required
async function testTenantHeaderRequired() {
  console.log('\n📋 Test 1: X-Tenant-ID Header Requirement');
  
  // Try to access billing endpoint without X-Tenant-ID header
  const result = await makeRequest('GET', '/api/billing/invoices/test', null, {
    'Authorization': `Bearer fake-token`
  });
  
  // Should fail with 400 or 403
  const passed = !result.success && (result.status === 400 || result.status === 403);
  logTest(
    'Request without X-Tenant-ID should be rejected',
    passed,
    passed ? 'Correctly rejected' : `Expected 400/403, got ${result.status}`
  );
}

// Test 2: Verify invalid tenant ID is rejected
async function testInvalidTenantRejected() {
  console.log('\n📋 Test 2: Invalid Tenant ID Rejection');
  
  const result = await makeRequest('GET', '/api/billing/invoices/invalid_tenant', null, {
    'Authorization': `Bearer fake-token`,
    'X-Tenant-ID': 'invalid_tenant_id_12345'
  });
  
  // Should fail with 403 or 404
  const passed = !result.success && (result.status === 403 || result.status === 404);
  logTest(
    'Request with invalid tenant ID should be rejected',
    passed,
    passed ? 'Correctly rejected' : `Expected 403/404, got ${result.status}`
  );
}

// Test 3: Create test invoice for Tenant A
async function createInvoiceForTenantA() {
  console.log('\n📋 Test 3: Create Invoice for Tenant A');
  
  if (!TENANT_A.token) {
    logTest('Create invoice for Tenant A', false, 'Tenant A token not available');
    return null;
  }
  
  const invoiceData = {
    tenant_id: TENANT_A.id,
    patient_id: 1,
    patient_name: 'Test Patient A',
    patient_number: 'PA001',
    line_items: [
      {
        description: 'Test Service A',
        category: 'Consultation',
        quantity: 1,
        unit_price: 1000,
        amount: 1000
      }
    ],
    notes: 'Test invoice for multi-tenant isolation'
  };
  
  const result = await makeRequest(
    'POST',
    '/api/billing/generate-diagnostic-invoice',
    invoiceData,
    {
      'Authorization': `Bearer ${TENANT_A.token}`,
      'X-Tenant-ID': TENANT_A.id
    }
  );
  
  const passed = result.success && result.data.invoice;
  logTest(
    'Create invoice for Tenant A',
    passed,
    passed ? `Invoice created: ${result.data.invoice.invoice_number}` : result.error
  );
  
  return passed ? result.data.invoice : null;
}

// Test 4: Create test invoice for Tenant B
async function createInvoiceForTenantB() {
  console.log('\n📋 Test 4: Create Invoice for Tenant B');
  
  if (!TENANT_B.token) {
    logTest('Create invoice for Tenant B', false, 'Tenant B token not available');
    return null;
  }
  
  const invoiceData = {
    tenant_id: TENANT_B.id,
    patient_id: 1,
    patient_name: 'Test Patient B',
    patient_number: 'PB001',
    line_items: [
      {
        description: 'Test Service B',
        category: 'Consultation',
        quantity: 1,
        unit_price: 2000,
        amount: 2000
      }
    ],
    notes: 'Test invoice for multi-tenant isolation'
  };
  
  const result = await makeRequest(
    'POST',
    '/api/billing/generate-diagnostic-invoice',
    invoiceData,
    {
      'Authorization': `Bearer ${TENANT_B.token}`,
      'X-Tenant-ID': TENANT_B.id
    }
  );
  
  const passed = result.success && result.data.invoice;
  logTest(
    'Create invoice for Tenant B',
    passed,
    passed ? `Invoice created: ${result.data.invoice.invoice_number}` : result.error
  );
  
  return passed ? result.data.invoice : null;
}

// Test 5: Verify Tenant A cannot access Tenant B's invoices
async function testCrossTenantAccessPrevention(invoiceA, invoiceB) {
  console.log('\n📋 Test 5: Cross-Tenant Access Prevention');
  
  if (!invoiceA || !invoiceB) {
    logTest('Cross-tenant access prevention', false, 'Test invoices not available');
    return;
  }
  
  // Try to access Tenant B's invoice using Tenant A's credentials
  const result = await makeRequest(
    'GET',
    `/api/billing/invoice/${invoiceB.id}`,
    null,
    {
      'Authorization': `Bearer ${TENANT_A.token}`,
      'X-Tenant-ID': TENANT_A.id
    }
  );
  
  // Should fail with 403 or 404
  const passed = !result.success && (result.status === 403 || result.status === 404);
  logTest(
    'Tenant A cannot access Tenant B invoice',
    passed,
    passed ? 'Access correctly denied' : `Expected 403/404, got ${result.status}`
  );
}

// Test 6: Verify Tenant A can only see their own invoices
async function testTenantAIsolation(invoiceA) {
  console.log('\n📋 Test 6: Tenant A Data Isolation');
  
  if (!invoiceA) {
    logTest('Tenant A data isolation', false, 'Tenant A invoice not available');
    return;
  }
  
  // Get all invoices for Tenant A
  const result = await makeRequest(
    'GET',
    `/api/billing/invoices/${TENANT_A.id}`,
    null,
    {
      'Authorization': `Bearer ${TENANT_A.token}`,
      'X-Tenant-ID': TENANT_A.id
    }
  );
  
  if (!result.success) {
    logTest('Tenant A can access their invoices', false, result.error);
    return;
  }
  
  // Verify all invoices belong to Tenant A
  const invoices = result.data.invoices || [];
  const allBelongToTenantA = invoices.every(inv => inv.tenant_id === TENANT_A.id);
  
  logTest(
    'Tenant A only sees their own invoices',
    allBelongToTenantA,
    allBelongToTenantA
      ? `All ${invoices.length} invoices belong to Tenant A`
      : 'Found invoices from other tenants!'
  );
}

// Test 7: Verify Tenant B can only see their own invoices
async function testTenantBIsolation(invoiceB) {
  console.log('\n📋 Test 7: Tenant B Data Isolation');
  
  if (!invoiceB) {
    logTest('Tenant B data isolation', false, 'Tenant B invoice not available');
    return;
  }
  
  // Get all invoices for Tenant B
  const result = await makeRequest(
    'GET',
    `/api/billing/invoices/${TENANT_B.id}`,
    null,
    {
      'Authorization': `Bearer ${TENANT_B.token}`,
      'X-Tenant-ID': TENANT_B.id
    }
  );
  
  if (!result.success) {
    logTest('Tenant B can access their invoices', false, result.error);
    return;
  }
  
  // Verify all invoices belong to Tenant B
  const invoices = result.data.invoices || [];
  const allBelongToTenantB = invoices.every(inv => inv.tenant_id === TENANT_B.id);
  
  logTest(
    'Tenant B only sees their own invoices',
    allBelongToTenantB,
    allBelongToTenantB
      ? `All ${invoices.length} invoices belong to Tenant B`
      : 'Found invoices from other tenants!'
  );
}

// Test 8: Verify Tenant A cannot modify Tenant B's data
async function testCrossTenantModificationPrevention(invoiceB) {
  console.log('\n📋 Test 8: Cross-Tenant Modification Prevention');
  
  if (!invoiceB) {
    logTest('Cross-tenant modification prevention', false, 'Tenant B invoice not available');
    return;
  }
  
  // Try to update Tenant B's invoice using Tenant A's credentials
  const result = await makeRequest(
    'PUT',
    `/api/billing/invoice/${invoiceB.id}`,
    { notes: 'Attempting to modify from Tenant A' },
    {
      'Authorization': `Bearer ${TENANT_A.token}`,
      'X-Tenant-ID': TENANT_A.id
    }
  );
  
  // Should fail with 403 or 404
  const passed = !result.success && (result.status === 403 || result.status === 404);
  logTest(
    'Tenant A cannot modify Tenant B invoice',
    passed,
    passed ? 'Modification correctly denied' : `Expected 403/404, got ${result.status}`
  );
}

// Main test execution
async function runTests() {
  console.log('🧪 Multi-Tenant Isolation Verification Test');
  console.log('============================================\n');
  
  console.log('⚠️  IMPORTANT: This test requires:');
  console.log('   1. Backend server running on', API_URL);
  console.log('   2. Valid tenant IDs and credentials');
  console.log('   3. Database with test data\n');
  
  // Check if server is running
  try {
    await axios.get(`${API_URL}/health`);
    console.log('✅ Backend server is running\n');
  } catch (error) {
    console.log('❌ Backend server is NOT running!');
    console.log('   Please start the server with: cd backend && npm run dev\n');
    return;
  }
  
  // Run tests
  await testTenantHeaderRequired();
  await testInvalidTenantRejected();
  
  console.log('\n⚠️  Note: Tests 3-8 require valid tenant credentials.');
  console.log('   Update TENANT_A and TENANT_B objects with real credentials to run these tests.\n');
  
  // Uncomment these when you have valid credentials
  // const invoiceA = await createInvoiceForTenantA();
  // const invoiceB = await createInvoiceForTenantB();
  // await testCrossTenantAccessPrevention(invoiceA, invoiceB);
  // await testTenantAIsolation(invoiceA);
  // await testTenantBIsolation(invoiceB);
  // await testCrossTenantModificationPrevention(invoiceB);
  
  // Print summary
  console.log('\n============================================');
  console.log('📊 TEST SUMMARY');
  console.log('============================================');
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.tests
      .filter(t => !t.passed)
      .forEach(t => console.log(`   - ${t.name}: ${t.message}`));
  }
  
  console.log('\n✅ Multi-tenant isolation verification complete!');
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  console.error('\n❌ Test execution failed:', error.message);
  process.exit(1);
});
