const axios = require('axios');

const BACKEND_URL = 'http://localhost:3000';

// Test user credentials
const testUser = {
  email: 'mdwasimkrm13@gmail.com',
  password: 'Advanture101$'
};

let authToken = '';
let tenantId = '';

async function testSignIn() {
  console.log('\n🔐 Step 1: Testing Sign In...');
  
  try {
    const response = await axios.post(`${BACKEND_URL}/auth/signin`, testUser, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      console.log('✅ Sign In: SUCCESS');
      authToken = response.data.token;
      
      // Extract tenant ID from user data
      if (response.data.user && response.data.user.tenant_id) {
        tenantId = response.data.user.tenant_id;
        console.log(`📋 Tenant ID: ${tenantId}`);
      }
      
      // Check permissions
      if (response.data.permissions) {
        const billingPerms = response.data.permissions.filter(p => p.resource === 'billing');
        console.log(`🔑 Billing Permissions: ${billingPerms.length > 0 ? billingPerms.map(p => p.action).join(', ') : 'None'}`);
      }
      
      return true;
    }
  } catch (error) {
    console.log('❌ Sign In: FAILED');
    if (error.response) {
      console.log('📋 Error:', error.response.data);
    } else {
      console.log('📋 Error:', error.message);
    }
    return false;
  }
}

async function testGetBillingReport() {
  console.log('\n📊 Step 2: Testing Get Billing Report...');
  
  try {
    const response = await axios.get(`${BACKEND_URL}/api/billing/report`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': tenantId,
        'X-App-ID': 'hospital-management',
        'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-789',
        'Origin': 'http://localhost:3001'
      }
    });
    
    if (response.status === 200) {
      console.log('✅ Get Billing Report: SUCCESS');
      const report = response.data.report;
      console.log(`📋 Total Revenue: $${report.total_revenue || 0}`);
      console.log(`📋 Monthly Revenue: $${report.monthly_revenue || 0}`);
      console.log(`📋 Pending Amount: $${report.pending_amount || 0}`);
      console.log(`📋 Overdue Amount: $${report.overdue_amount || 0}`);
      console.log(`📋 Total Invoices: ${report.total_invoices || 0}`);
      console.log(`📋 Paid Invoices: ${report.paid_invoices || 0}`);
      console.log(`📋 Pending Invoices: ${report.pending_invoices || 0}`);
      console.log(`📋 Overdue Invoices: ${report.overdue_invoices || 0}`);
      return true;
    }
  } catch (error) {
    console.log('❌ Get Billing Report: FAILED');
    if (error.response) {
      console.log('📋 Status:', error.response.status);
      console.log('📋 Error:', error.response.data);
    } else {
      console.log('📋 Error:', error.message);
    }
    return false;
  }
}

async function testGetInvoices() {
  console.log('\n📄 Step 3: Testing Get Invoices...');
  
  try {
    const response = await axios.get(`${BACKEND_URL}/api/billing/invoices/${tenantId}`, {
      params: {
        limit: 10,
        offset: 0
      },
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': tenantId,
        'X-App-ID': 'hospital-management',
        'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-789',
        'Origin': 'http://localhost:3001'
      }
    });
    
    if (response.status === 200) {
      console.log('✅ Get Invoices: SUCCESS');
      const { invoices, pagination } = response.data;
      console.log(`📋 Total Invoices: ${pagination.total}`);
      console.log(`📋 Returned: ${invoices.length}`);
      
      if (invoices.length > 0) {
        console.log('\n📋 Sample Invoice:');
        const invoice = invoices[0];
        console.log(`   - Invoice Number: ${invoice.invoice_number}`);
        console.log(`   - Amount: ${invoice.currency} ${invoice.amount}`);
        console.log(`   - Status: ${invoice.status}`);
        console.log(`   - Due Date: ${invoice.due_date}`);
        console.log(`   - Line Items: ${invoice.line_items?.length || 0}`);
      }
      
      return true;
    }
  } catch (error) {
    console.log('❌ Get Invoices: FAILED');
    if (error.response) {
      console.log('📋 Status:', error.response.status);
      console.log('📋 Error:', error.response.data);
    } else {
      console.log('📋 Error:', error.message);
    }
    return false;
  }
}

async function testGetRazorpayConfig() {
  console.log('\n💳 Step 4: Testing Get Razorpay Config...');
  
  try {
    const response = await axios.get(`${BACKEND_URL}/api/billing/razorpay-config`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': tenantId,
        'X-App-ID': 'hospital-management',
        'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-789',
        'Origin': 'http://localhost:3001'
      }
    });
    
    if (response.status === 200) {
      console.log('✅ Get Razorpay Config: SUCCESS');
      console.log(`📋 Key ID: ${response.data.key_id ? '***' + response.data.key_id.slice(-4) : 'Not configured'}`);
      console.log(`📋 Currency: ${response.data.currency}`);
      return true;
    }
  } catch (error) {
    console.log('❌ Get Razorpay Config: FAILED');
    if (error.response) {
      console.log('📋 Status:', error.response.status);
      console.log('📋 Error:', error.response.data);
    } else {
      console.log('📋 Error:', error.message);
    }
    return false;
  }
}

async function testGetPayments() {
  console.log('\n💰 Step 5: Testing Get Payments...');
  
  try {
    const response = await axios.get(`${BACKEND_URL}/api/billing/payments`, {
      params: {
        limit: 10,
        offset: 0
      },
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': tenantId,
        'X-App-ID': 'hospital-management',
        'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-789',
        'Origin': 'http://localhost:3001'
      }
    });
    
    if (response.status === 200) {
      console.log('✅ Get Payments: SUCCESS');
      const { payments, pagination } = response.data;
      console.log(`📋 Total Payments: ${pagination.total}`);
      console.log(`📋 Returned: ${payments.length}`);
      
      if (payments.length > 0) {
        console.log('\n📋 Sample Payment:');
        const payment = payments[0];
        console.log(`   - Amount: ${payment.currency} ${payment.amount}`);
        console.log(`   - Method: ${payment.payment_method}`);
        console.log(`   - Status: ${payment.status}`);
        console.log(`   - Date: ${payment.payment_date || 'Pending'}`);
      }
      
      return true;
    }
  } catch (error) {
    console.log('❌ Get Payments: FAILED');
    if (error.response) {
      console.log('📋 Status:', error.response.status);
      console.log('📋 Error:', error.response.data);
    } else {
      console.log('📋 Error:', error.message);
    }
    return false;
  }
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 BILLING INTEGRATION TEST SUITE');
  console.log('═══════════════════════════════════════════════════════');
  
  const results = {
    signin: false,
    report: false,
    invoices: false,
    razorpay: false,
    payments: false
  };
  
  // Step 1: Sign in
  results.signin = await testSignIn();
  if (!results.signin) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }
  
  // Step 2: Get billing report
  results.report = await testGetBillingReport();
  
  // Step 3: Get invoices
  results.invoices = await testGetInvoices();
  
  // Step 4: Get Razorpay config
  results.razorpay = await testGetRazorpayConfig();
  
  // Step 5: Get payments
  results.payments = await testGetPayments();
  
  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  console.log('\nDetailed Results:');
  console.log(`  ${results.signin ? '✅' : '❌'} Sign In`);
  console.log(`  ${results.report ? '✅' : '❌'} Get Billing Report`);
  console.log(`  ${results.invoices ? '✅' : '❌'} Get Invoices`);
  console.log(`  ${results.razorpay ? '✅' : '❌'} Get Razorpay Config`);
  console.log(`  ${results.payments ? '✅' : '❌'} Get Payments`);
  
  console.log('\n═══════════════════════════════════════════════════════');
  
  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED! Billing integration is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.');
  }
  
  console.log('═══════════════════════════════════════════════════════\n');
}

// Run the tests
runAllTests();
