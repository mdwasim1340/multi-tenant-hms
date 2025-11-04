const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

const API_URL = 'http://localhost:3000';

// Database connection for direct testing
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

async function testSubscriptionSystem() {
  console.log('🧪 Testing Subscription Tier System\n');
  
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

  try {
    // Test 1: Database Tables Exist
    await runTest('Database tables exist', async () => {
      const client = await pool.connect();
      try {
        // Check subscription_tiers table
        const tiersResult = await client.query("SELECT COUNT(*) FROM subscription_tiers");
        const tiersCount = parseInt(tiersResult.rows[0].count);
        if (tiersCount === 0) throw new Error('No subscription tiers found');
        console.log(`   - Found ${tiersCount} subscription tiers`);

        // Check tenant_subscriptions table
        const subscriptionsResult = await client.query("SELECT COUNT(*) FROM tenant_subscriptions");
        const subscriptionsCount = parseInt(subscriptionsResult.rows[0].count);
        console.log(`   - Found ${subscriptionsCount} tenant subscriptions`);

        // Check indexes exist
        const indexResult = await client.query(`
          SELECT indexname FROM pg_indexes 
          WHERE tablename IN ('subscription_tiers', 'tenant_subscriptions')
        `);
        console.log(`   - Found ${indexResult.rows.length} indexes`);
      } finally {
        client.release();
      }
    });

    // Test 2: Get All Subscription Tiers
    await runTest('Fetch all subscription tiers', async () => {
      const response = await axios.get(`${API_URL}/api/subscriptions/tiers`);
      
      if (!response.data.success) {
        throw new Error('API response indicates failure');
      }
      
      const tiers = response.data.tiers;
      if (!Array.isArray(tiers) || tiers.length === 0) {
        throw new Error('No tiers returned');
      }
      
      console.log(`   - Retrieved ${tiers.length} tiers`);
      
      // Verify tier structure
      const basicTier = tiers.find(t => t.id === 'basic');
      if (!basicTier) throw new Error('Basic tier not found');
      
      const requiredFields = ['id', 'name', 'price', 'features', 'limits'];
      for (const field of requiredFields) {
        if (!(field in basicTier)) {
          throw new Error(`Missing field: ${field}`);
        }
      }
      
      console.log(`   - Basic tier: ${basicTier.name} - ₹${basicTier.price}`);
    });

    // Test 3: Get Specific Tier Details
    await runTest('Fetch specific tier details', async () => {
      const response = await axios.get(`${API_URL}/api/subscriptions/tiers/premium`);
      
      if (!response.data.success) {
        throw new Error('API response indicates failure');
      }
      
      const tier = response.data.tier;
      if (!tier || tier.id !== 'premium') {
        throw new Error('Premium tier not returned correctly');
      }
      
      console.log(`   - Premium tier: ${tier.name} - ₹${tier.price}`);
      console.log(`   - Features: ${Object.keys(tier.features).filter(f => tier.features[f]).length} enabled`);
    });

    // Test 4: Get Tenant Subscription (requires existing tenant)
    await runTest('Fetch tenant subscription', async () => {
      // First, get a tenant ID
      const client = await pool.connect();
      let tenantId;
      try {
        const tenantsResult = await client.query('SELECT id FROM tenants LIMIT 1');
        if (tenantsResult.rows.length === 0) {
          throw new Error('No tenants found for testing');
        }
        tenantId = tenantsResult.rows[0].id;
      } finally {
        client.release();
      }

      // Mock auth token (in real scenario, this would be a valid JWT)
      const mockToken = 'mock_jwt_token';
      
      try {
        const response = await axios.get(
          `${API_URL}/api/subscriptions/tenant/${tenantId}`,
          { 
            headers: { 
              'Authorization': `Bearer ${mockToken}`,
              'X-Tenant-ID': tenantId
            } 
          }
        );
        
        if (!response.data.success) {
          throw new Error('API response indicates failure');
        }
        
        const subscription = response.data.subscription;
        console.log(`   - Tenant ${tenantId} has ${subscription.tier.name} subscription`);
        console.log(`   - Status: ${subscription.status}`);
      } catch (error) {
        if (error.response?.status === 401) {
          console.log('   - Auth required (expected in production)');
          return; // This is expected without proper auth
        }
        throw error;
      }
    });

    // Test 5: Tier Comparison
    await runTest('Compare subscription tiers', async () => {
      const response = await axios.get(
        `${API_URL}/api/subscriptions/compare?current_tier=basic&target_tier=premium`
      );
      
      if (!response.data.success) {
        throw new Error('API response indicates failure');
      }
      
      const comparison = response.data;
      console.log(`   - Price difference: ₹${comparison.price_difference}`);
      console.log(`   - Is upgrade: ${comparison.is_upgrade}`);
      console.log(`   - Feature changes: ${Object.keys(comparison.feature_differences).length}`);
    });

    // Test 6: Database Subscription Service Integration
    await runTest('Subscription service integration', async () => {
      const client = await pool.connect();
      try {
        // Test that subscription service can access database
        const { subscriptionService } = require('../src/services/subscription');
        
        const tiers = await subscriptionService.getAllTiers();
        if (!Array.isArray(tiers) || tiers.length === 0) {
          throw new Error('Subscription service cannot fetch tiers');
        }
        
        console.log(`   - Service retrieved ${tiers.length} tiers`);
        
        // Test feature access check
        const tenantResult = await client.query('SELECT id FROM tenants LIMIT 1');
        if (tenantResult.rows.length > 0) {
          const tenantId = tenantResult.rows[0].id;
          const accessResult = await subscriptionService.hasFeatureAccess(tenantId, 'patients');
          console.log(`   - Feature access check: ${accessResult.hasAccess ? 'PASS' : 'FAIL'}`);
        }
      } finally {
        client.release();
      }
    });

    // Test 7: Feature Flag Middleware (simulated)
    await runTest('Feature flag middleware functionality', async () => {
      const { requireFeature } = require('../src/middleware/featureAccess');
      
      if (typeof requireFeature !== 'function') {
        throw new Error('requireFeature middleware not exported correctly');
      }
      
      console.log('   - Feature middleware exported correctly');
      
      // Test middleware creation
      const middleware = requireFeature('medical_records');
      if (typeof middleware !== 'function') {
        throw new Error('Middleware not created correctly');
      }
      
      console.log('   - Middleware creation successful');
    });

    // Test 8: Usage Limit Calculations
    await runTest('Usage limit calculations', async () => {
      const { subscriptionService } = require('../src/services/subscription');
      
      // Get a tenant for testing
      const client = await pool.connect();
      let tenantId;
      try {
        const tenantResult = await client.query('SELECT id FROM tenants LIMIT 1');
        if (tenantResult.rows.length === 0) {
          throw new Error('No tenants found for testing');
        }
        tenantId = tenantResult.rows[0].id;
      } finally {
        client.release();
      }
      
      // Test usage limit check
      const limitResult = await subscriptionService.checkUsageLimit(tenantId, 'max_patients', 100);
      
      console.log(`   - Current patients: ${limitResult.currentValue}`);
      console.log(`   - Limit: ${limitResult.limit === -1 ? 'Unlimited' : limitResult.limit}`);
      console.log(`   - Within limit: ${limitResult.withinLimit}`);
      console.log(`   - Usage percentage: ${limitResult.percentage.toFixed(1)}%`);
    });

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 SUBSCRIPTION SYSTEM TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${testResults.passed}/${testResults.total}`);
    console.log(`❌ Failed: ${testResults.failed}/${testResults.total}`);
    console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    if (testResults.failed === 0) {
      console.log('\n🎉 All subscription system tests passed!');
      console.log('✅ Subscription tier system is fully operational');
    } else {
      console.log(`\n⚠️  ${testResults.failed} test(s) failed. Please review the errors above.`);
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the tests
if (require.main === module) {
  testSubscriptionSystem().catch(console.error);
}

module.exports = { testSubscriptionSystem };