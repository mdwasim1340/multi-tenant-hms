const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_TENANT_ID = 'tenant_1762083064503';
const TEST_TOKEN = process.env.TEST_TOKEN || 'your_jwt_token_here';

// Configure axios defaults
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'X-Tenant-ID': TEST_TENANT_ID,
    'X-App-ID': 'hospital-management',
    'X-API-Key': process.env.API_KEY || 'hospital-dev-key-123'
  }
});

async function testBillingEnhancements() {
  console.log('🧪 Testing Billing System Enhancements\n');
  console.log('=' .repeat(60));
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Create Payment Plan
  try {
    console.log('\n📋 Test 1: Create Payment Plan');
    const paymentPlanData = {
      tenant_id: TEST_TENANT_ID,
      patient_id: 1,
      plan_name: 'Test Payment Plan - 6 Months',
      total_amount: 60000,
      installments: 6,
      frequency: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      notes: 'Test payment plan for billing enhancements'
    };
    
    const response = await api.post('/api/payment-plans', paymentPlanData);
    
    if (response.data.success && response.data.payment_plan) {
      console.log('✅ Payment plan created successfully');
      console.log(`   Plan ID: ${response.data.payment_plan.id}`);
      console.log(`   Installment Amount: ₹${response.data.payment_plan.installment_amount}`);
      results.passed++;
      results.tests.push({ name: 'Create Payment Plan', status: 'PASS' });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    console.log('❌ Failed to create payment plan');
    console.log(`   Error: ${error.response?.data?.error || error.message}`);
    results.failed++;
    results.tests.push({ name: 'Create Payment Plan', status: 'FAIL', error: error.message });
  }

  // Test 2: Get Payment Plans
  try {
    console.log('\n📋 Test 2: Get Payment Plans');
    const response = await api.get('/api/payment-plans?limit=10');
    
    if (response.data.success && Array.isArray(response.data.payment_plans)) {
      console.log('✅ Payment plans retrieved successfully');
      console.log(`   Total plans: ${response.data.payment_plans.length}`);
      results.passed++;
      results.tests.push({ name: 'Get Payment Plans', status: 'PASS' });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    console.log('❌ Failed to get payment plans');
    console.log(`   Error: ${error.response?.data?.error || error.message}`);
    results.failed++;
    results.tests.push({ name: 'Get Payment Plans', status: 'FAIL', error: error.message });
  }

  // Test 3: Create Insurance Claim
  try {
    console.log('\n📋 Test 3: Create Insurance Claim');
    const claimData = {
      tenant_id: TEST_TENANT_ID,
      patient_id: 1,
      insurance_provider: 'Test Insurance Co.',
      policy_number: 'POL-12345',
      claim_amount: 50000,
      submission_date: new Date().toISOString().split('T')[0],
      notes: 'Test insurance claim'
    };
    
    const response = await api.post('/api/insurance-claims', claimData);
    
    if (response.data.success && response.data.claim) {
      console.log('✅ Insurance claim created successfully');
      console.log(`   Claim Number: ${response.data.claim.claim_number}`);
      console.log(`   Status: ${response.data.claim.status}`);
      results.passed++;
      results.tests.push({ name: 'Create Insurance Claim', status: 'PASS' });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    console.log('❌ Failed to create insurance claim');
    console.log(`   Error: ${error.response?.data?.error || error.message}`);
    results.failed++;
    results.tests.push({ name: 'Create Insurance Claim', status: 'FAIL', error: error.message });
  }

  // Test 4: Get Insurance Claims
  try {
    console.log('\n📋 Test 4: Get Insurance Claims');
    const response = await api.get('/api/insurance-claims?limit=10');
    
    if (response.data.success && Array.isArray(response.data.claims)) {
      console.log('✅ Insurance claims retrieved successfully');
      console.log(`   Total claims: ${response.data.claims.length}`);
      results.passed++;
      results.tests.push({ name: 'Get Insurance Claims', status: 'PASS' });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    console.log('❌ Failed to get insurance claims');
    console.log(`   Error: ${error.response?.data?.error || error.message}`);
    results.failed++;
    results.tests.push({ name: 'Get Insurance Claims', status: 'FAIL', error: error.message });
  }

  // Test 5: Create Billing Adjustment
  try {
    console.log('\n📋 Test 5: Create Billing Adjustment');
    const adjustmentData = {
      tenant_id: TEST_TENANT_ID,
      adjustment_type: 'discount',
      amount: 5000,
      reason: 'Senior citizen discount',
      created_by: 1
    };
    
    const response = await api.post('/api/billing-adjustments', adjustmentData);
    
    if (response.data.success && response.data.adjustment) {
      console.log('✅ Billing adjustment created successfully');
      console.log(`   Adjustment ID: ${response.data.adjustment.id}`);
      console.log(`   Type: ${response.data.adjustment.adjustment_type}`);
      console.log(`   Status: ${response.data.adjustment.status}`);
      results.passed++;
      results.tests.push({ name: 'Create Billing Adjustment', status: 'PASS' });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    console.log('❌ Failed to create billing adjustment');
    console.log(`   Error: ${error.response?.data?.error || error.message}`);
    results.failed++;
    results.tests.push({ name: 'Create Billing Adjustment', status: 'FAIL', error: error.message });
  }

  // Test 6: Get Billing Adjustments
  try {
    console.log('\n📋 Test 6: Get Billing Adjustments');
    const response = await api.get('/api/billing-adjustments?limit=10');
    
    if (response.data.success && Array.isArray(response.data.adjustments)) {
      console.log('✅ Billing adjustments retrieved successfully');
      console.log(`   Total adjustments: ${response.data.adjustments.length}`);
      results.passed++;
      results.tests.push({ name: 'Get Billing Adjustments', status: 'PASS' });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    console.log('❌ Failed to get billing adjustments');
    console.log(`   Error: ${error.response?.data?.error || error.message}`);
    results.failed++;
    results.tests.push({ name: 'Get Billing Adjustments', status: 'FAIL', error: error.message });
  }

  // Test 7: Verify Database Tables
  try {
    console.log('\n📋 Test 7: Verify Database Tables');
    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'multitenant_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
    });

    const tables = ['payments', 'insurance_claims', 'payment_plans', 'billing_adjustments', 'tax_configurations'];
    let allTablesExist = true;

    for (const table of tables) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);

      if (result.rows[0].exists) {
        console.log(`   ✅ Table '${table}' exists`);
      } else {
        console.log(`   ❌ Table '${table}' NOT found`);
        allTablesExist = false;
      }
    }

    await pool.end();

    if (allTablesExist) {
      results.passed++;
      results.tests.push({ name: 'Verify Database Tables', status: 'PASS' });
    } else {
      throw new Error('Some tables are missing');
    }
  } catch (error) {
    console.log('❌ Failed to verify database tables');
    console.log(`   Error: ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Verify Database Tables', status: 'FAIL', error: error.message });
  }

  // Print Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  console.log('\n📋 Detailed Results:');
  results.tests.forEach((test, index) => {
    const icon = test.status === 'PASS' ? '✅' : '❌';
    console.log(`${index + 1}. ${icon} ${test.name}`);
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
  });

  console.log('\n' + '='.repeat(60));
  
  if (results.failed === 0) {
    console.log('🎉 All tests passed! Billing enhancements are working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
  }
}

// Run tests
testBillingEnhancements()
  .then(() => {
    console.log('\n✅ Test execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  });
