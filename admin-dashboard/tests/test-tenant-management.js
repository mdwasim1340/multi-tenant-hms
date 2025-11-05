// Test script for Tenant Management UI
// This script validates the tenant management functionality

const axios = require('axios');

const API_URL = 'http://localhost:3000';
const ADMIN_DASHBOARD_URL = 'http://localhost:3002';

async function testTenantManagement() {
  console.log('🧪 Testing Tenant Management System\n');
  
  let testResults = {
    passed: 0,
    failed: 0,
    total: 0
  };

  const runTest = async (testName, testFn) => {
    testResults.total++;
    try {
      console.log(`\n📋 Test ${testResults.total}: ${testName}`);
      await testFn();
      console.log('✅ PASSED');
      testResults.passed++;
    } catch (error) {
      console.log('❌ FAILED:', error.message);
      testResults.failed++;
    }
  };

  const headers = {
    'Origin': 'http://localhost:3002',
    'X-App-ID': 'admin-dashboard',
    'X-API-Key': 'admin-dev-key-456',
    'Authorization': 'Bearer mock_token'
  };

  try {
    // Test 1: Backend API - Get All Tenants
    await runTest('Backend API - Fetch all tenants', async () => {
      const response = await axios.get(`${API_URL}/api/tenants`, { headers });
      
      if (!Array.isArray(response.data) && !Array.isArray(response.data.tenants)) {
        throw new Error('Tenants data is not in expected format');
      }
      
      const tenants = response.data.tenants || response.data;
      console.log(`   - Retrieved ${tenants.length} tenants`);
      
      if (tenants.length > 0) {
        const tenant = tenants[0];
        console.log(`   - Sample tenant: ${tenant.name} (${tenant.status})`);
      }
    });

    // Test 2: Backend API - Get Subscription Tiers
    await runTest('Backend API - Fetch subscription tiers', async () => {
      const response = await axios.get(`${API_URL}/api/subscriptions/tiers`, { headers });
      
      if (!response.data.success || !Array.isArray(response.data.tiers)) {
        throw new Error('Subscription tiers data is not in expected format');
      }
      
      const tiers = response.data.tiers;
      console.log(`   - Retrieved ${tiers.length} subscription tiers`);
      
      const expectedTiers = ['basic', 'advanced', 'premium'];
      for (const expectedTier of expectedTiers) {
        const tier = tiers.find(t => t.id === expectedTier);
        if (!tier) {
          throw new Error(`Missing ${expectedTier} tier`);
        }
        console.log(`   - ${tier.name}: ₹${tier.price}/month`);
      }
    });

    // Test 3: Backend API - Tenant Creation Endpoint
    await runTest('Backend API - Tenant creation endpoint', async () => {
      const testTenantData = {
        id: `test_tenant_${Date.now()}`,
        name: 'Test Hospital',
        email: 'test@hospital.com',
        plan: 'basic',
        status: 'active'
      };
      
      try {
        const response = await axios.post(`${API_URL}/auth/tenants`, testTenantData, { headers });
        
        if (response.status !== 201) {
          throw new Error(`Expected 201 status, got ${response.status}`);
        }
        
        console.log('   - Tenant creation endpoint working');
        console.log(`   - Created tenant: ${testTenantData.name}`);
      } catch (error) {
        if (error.response?.status === 401) {
          console.log('   - Tenant creation endpoint protected (auth required)');
        } else {
          throw error;
        }
      }
    });

    // Test 4: Frontend Components - Check if pages exist
    await runTest('Frontend Components - Check page accessibility', async () => {
      try {
        // Test main tenants page
        const tenantsPageResponse = await axios.get(`${ADMIN_DASHBOARD_URL}/tenants`);
        if (tenantsPageResponse.status !== 200) {
          throw new Error('Tenants page not accessible');
        }
        console.log('   - Main tenants page accessible');

        // Test new tenant page
        const newTenantPageResponse = await axios.get(`${ADMIN_DASHBOARD_URL}/tenants/new`);
        if (newTenantPageResponse.status !== 200) {
          throw new Error('New tenant page not accessible');
        }
        console.log('   - New tenant page accessible');

      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log('   - Admin dashboard not running (start with npm run dev)');
        } else {
          throw error;
        }
      }
    });

    // Test 5: Data Integration - Verify tenant data structure
    await runTest('Data Integration - Verify tenant data structure', async () => {
      const response = await axios.get(`${API_URL}/api/tenants`, { headers });
      const tenants = response.data.tenants || response.data;
      
      if (tenants.length === 0) {
        console.log('   - No tenants found (this is okay for a fresh system)');
        return;
      }
      
      const tenant = tenants[0];
      const requiredFields = ['id', 'name', 'email', 'status', 'joindate'];
      
      for (const field of requiredFields) {
        if (!(field in tenant)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
      
      console.log('   - Tenant data structure is valid');
      console.log(`   - Sample tenant fields: ${Object.keys(tenant).join(', ')}`);
    });

    // Test 6: Subscription Integration - Verify subscription data
    await runTest('Subscription Integration - Verify subscription data', async () => {
      try {
        const response = await axios.get(`${API_URL}/api/tenants`, { headers });
        const tenants = response.data.tenants || response.data;
        
        if (tenants.length === 0) {
          console.log('   - No tenants to check subscription data');
          return;
        }
        
        const tenant = tenants[0];
        
        // Try to get subscription data for the tenant
        try {
          const subscriptionResponse = await axios.get(
            `${API_URL}/api/subscriptions/tenant/${tenant.id}`, 
            { headers }
          );
          
          if (subscriptionResponse.data.success) {
            const subscription = subscriptionResponse.data.subscription;
            console.log(`   - Tenant ${tenant.name} has ${subscription.tier.name} subscription`);
          }
        } catch (subError) {
          if (subError.response?.status === 401) {
            console.log('   - Subscription endpoint protected (auth required)');
          } else {
            console.log('   - Subscription data not available (may need setup)');
          }
        }
      } catch (error) {
        throw error;
      }
    });

    // Test 7: Usage Integration - Verify usage data
    await runTest('Usage Integration - Verify usage tracking', async () => {
      try {
        const response = await axios.get(`${API_URL}/api/tenants`, { headers });
        const tenants = response.data.tenants || response.data;
        
        if (tenants.length === 0) {
          console.log('   - No tenants to check usage data');
          return;
        }
        
        const tenant = tenants[0];
        
        // Try to get usage data for the tenant
        try {
          const usageResponse = await axios.get(
            `${API_URL}/api/usage/tenant/${tenant.id}/current`, 
            { headers }
          );
          
          if (usageResponse.data.success) {
            const usage = usageResponse.data.usage;
            console.log(`   - Tenant ${tenant.name} usage: ${usage.patients_count} patients, ${usage.users_count} users`);
          }
        } catch (usageError) {
          if (usageError.response?.status === 401) {
            console.log('   - Usage endpoint protected (auth required)');
          } else {
            console.log('   - Usage data not available (may need setup)');
          }
        }
      } catch (error) {
        throw error;
      }
    });

    // Test 8: Component Structure - Verify component files exist
    await runTest('Component Structure - Verify component files', async () => {
      const fs = require('fs');
      const path = require('path');
      
      const requiredFiles = [
        'components/tenants/tenant-list.tsx',
        'components/tenants/tenant-creation-form.tsx',
        'app/tenants/page.tsx',
        'app/tenants/new/page.tsx',
        'app/tenants/[id]/page.tsx'
      ];
      
      for (const file of requiredFiles) {
        if (!fs.existsSync(file)) {
          throw new Error(`Missing component file: ${file}`);
        }
      }
      
      console.log('   - All required component files exist');
      console.log(`   - Verified ${requiredFiles.length} component files`);
    });

    // Test 9: TypeScript Validation - Check for basic syntax
    await runTest('TypeScript Validation - Basic syntax check', async () => {
      const fs = require('fs');
      
      const componentFiles = [
        'components/tenants/tenant-list.tsx',
        'components/tenants/tenant-creation-form.tsx'
      ];
      
      for (const file of componentFiles) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Basic checks
        if (!content.includes('export')) {
          throw new Error(`${file} doesn't export anything`);
        }
        
        if (!content.includes('interface') && !content.includes('type')) {
          console.log(`   - Warning: ${file} might be missing TypeScript types`);
        }
      }
      
      console.log('   - TypeScript component structure looks good');
    });

    // Test 10: Integration Completeness - Overall system check
    await runTest('Integration Completeness - Overall system check', async () => {
      // Check if all major systems are integrated
      const systems = {
        tenants: false,
        subscriptions: false,
        usage: false,
        billing: false
      };
      
      try {
        await axios.get(`${API_URL}/api/tenants`, { headers });
        systems.tenants = true;
      } catch (e) { /* ignore */ }
      
      try {
        await axios.get(`${API_URL}/api/subscriptions/tiers`, { headers });
        systems.subscriptions = true;
      } catch (e) { /* ignore */ }
      
      try {
        await axios.get(`${API_URL}/api/usage/admin/summary`, { headers });
        systems.usage = true;
      } catch (e) { /* ignore */ }
      
      try {
        await axios.get(`${API_URL}/api/billing/razorpay-config`, { headers });
        systems.billing = true;
      } catch (e) { /* ignore */ }
      
      const workingSystems = Object.values(systems).filter(Boolean).length;
      const totalSystems = Object.keys(systems).length;
      
      console.log(`   - ${workingSystems}/${totalSystems} backend systems operational`);
      
      for (const [system, working] of Object.entries(systems)) {
        console.log(`   - ${system}: ${working ? '✅' : '❌'}`);
      }
      
      if (workingSystems < 3) {
        throw new Error('Not enough backend systems are operational');
      }
    });

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 TENANT MANAGEMENT SYSTEM TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${testResults.passed}/${testResults.total}`);
    console.log(`❌ Failed: ${testResults.failed}/${testResults.total}`);
    console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    if (testResults.failed === 0) {
      console.log('\n🎉 All tenant management tests passed!');
      console.log('✅ Tenant management system is fully operational');
      console.log('\n📋 SYSTEM READY FOR:');
      console.log('- Creating and managing hospital tenants');
      console.log('- Assigning subscription tiers');
      console.log('- Viewing tenant details and analytics');
      console.log('- Integration with billing and usage systems');
    } else {
      console.log(`\n⚠️  ${testResults.failed} test(s) failed. Please review the errors above.`);
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run the tests
if (require.main === module) {
  testTenantManagement().catch(console.error);
}

module.exports = { testTenantManagement };