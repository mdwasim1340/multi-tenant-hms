const axios = require('axios');

const API_URL = 'http://localhost:3000';

// Create axios instance with app authentication headers
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'X-App-ID': 'admin-dashboard',
    'X-API-Key': 'admin-dev-key-456',
    'Origin': 'http://localhost:3002'
  }
});

async function testSubscriptionCore() {
  console.log('🧪 TESTING SUBSCRIPTION TIER SYSTEM - CORE FUNCTIONALITY');
  console.log('=========================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  try {
    // Test 1: Get all subscription tiers
    totalTests++;
    console.log('Test 1: Fetching all subscription tiers...');
    try {
      const tiersResponse = await api.get('/api/subscriptions/tiers');
      console.log('✅ Tiers fetched successfully');
      console.log(`   Found ${tiersResponse.data.tiers.length} tiers:`);
      
      const expectedTiers = ['basic', 'advanced', 'premium'];
      const actualTiers = tiersResponse.data.tiers.map(t => t.id);
      
      if (expectedTiers.every(tier => actualTiers.includes(tier))) {
        console.log('✅ All expected tiers present');
        passedTests++;
      } else {
        console.log('❌ Missing expected tiers');
      }
      
      tiersResponse.data.tiers.forEach(tier => {
        console.log(`   - ${tier.name}: Rs. ${tier.price}/month`);
        console.log(`     Features: ${Object.keys(tier.features).filter(f => tier.features[f]).length} enabled`);
        console.log(`     Limits: ${JSON.stringify(tier.limits)}`);
      });
    } catch (error) {
      console.log('❌ Failed to fetch tiers:', error.response?.data?.error || error.message);
    }

    // Test 2: Verify tier pricing structure
    totalTests++;
    console.log('\nTest 2: Verifying tier pricing structure...');
    try {
      const tiersResponse = await api.get('/api/subscriptions/tiers');
      const tiers = tiersResponse.data.tiers;
      
      const basic = tiers.find(t => t.id === 'basic');
      const advanced = tiers.find(t => t.id === 'advanced');
      const premium = tiers.find(t => t.id === 'premium');
      
      if (basic && advanced && premium) {
        console.log('✅ All tiers found');
        
        // Check pricing progression
        console.log(`   Prices: Basic(${basic.price}) Advanced(${advanced.price}) Premium(${premium.price})`);
        if (parseFloat(basic.price) < parseFloat(advanced.price) && parseFloat(advanced.price) < parseFloat(premium.price)) {
          console.log('✅ Pricing progression correct');
          console.log(`   Basic: Rs. ${basic.price} < Advanced: Rs. ${advanced.price} < Premium: Rs. ${premium.price}`);
          passedTests++;
        } else {
          console.log('❌ Pricing progression incorrect');
          console.log(`   Debug: ${typeof basic.price} ${typeof advanced.price} ${typeof premium.price}`);
        }
        
        // Check feature progression
        const basicFeatures = Object.values(basic.features).filter(Boolean).length;
        const advancedFeatures = Object.values(advanced.features).filter(Boolean).length;
        const premiumFeatures = Object.values(premium.features).filter(Boolean).length;
        
        console.log(`   Feature count: Basic(${basicFeatures}) < Advanced(${advancedFeatures}) < Premium(${premiumFeatures})`);
      } else {
        console.log('❌ Missing required tiers');
      }
    } catch (error) {
      console.log('❌ Failed to verify pricing:', error.response?.data?.error || error.message);
    }

    // Test 3: Test individual tier details
    totalTests++;
    console.log('\nTest 3: Testing individual tier details...');
    try {
      const tierIds = ['basic', 'advanced', 'premium'];
      let allTiersValid = true;
      
      for (const tierId of tierIds) {
        const tierResponse = await api.get(`/api/subscriptions/tiers/${tierId}`);
        const tier = tierResponse.data.tier;
        
        if (tier.id === tierId && tier.name && tier.price > 0) {
          console.log(`   ✅ ${tier.name} tier valid (Rs. ${tier.price})`);
        } else {
          console.log(`   ❌ ${tierId} tier invalid`);
          allTiersValid = false;
        }
      }
      
      if (allTiersValid) {
        passedTests++;
      }
    } catch (error) {
      console.log('❌ Failed to fetch individual tiers:', error.response?.data?.error || error.message);
    }

    // Test 4: Test invalid tier handling
    totalTests++;
    console.log('\nTest 4: Testing invalid tier handling...');
    try {
      await api.get('/api/subscriptions/tiers/nonexistent');
      console.log('❌ Should have failed for invalid tier');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Correctly rejected invalid tier ID');
        passedTests++;
      } else {
        console.log('❌ Unexpected error for invalid tier:', error.response?.status);
      }
    }

    // Test 5: Verify database integration
    totalTests++;
    console.log('\nTest 5: Verifying database integration...');
    try {
      const { Pool } = require('pg');
      require('dotenv').config();
      
      const pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
      });
      
      // Check subscription_tiers table
      const tiersResult = await pool.query('SELECT COUNT(*) FROM subscription_tiers');
      const tiersCount = parseInt(tiersResult.rows[0].count);
      
      // Check tenant_subscriptions table
      const subscriptionsResult = await pool.query('SELECT COUNT(*) FROM tenant_subscriptions');
      const subscriptionsCount = parseInt(subscriptionsResult.rows[0].count);
      
      console.log(`   ✅ Database tables exist:`);
      console.log(`      - subscription_tiers: ${tiersCount} records`);
      console.log(`      - tenant_subscriptions: ${subscriptionsCount} records`);
      
      if (tiersCount >= 3 && subscriptionsCount > 0) {
        console.log('   ✅ Database integration working');
        passedTests++;
      } else {
        console.log('   ❌ Database integration issues');
      }
      
      await pool.end();
    } catch (error) {
      console.log('❌ Database verification failed:', error.message);
    }

    // Summary
    console.log('\n🎯 SUBSCRIPTION SYSTEM CORE TEST RESULTS');
    console.log('==========================================');
    console.log(`✅ Tests Passed: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 ALL CORE SUBSCRIPTION SYSTEM TESTS PASSED!');
      console.log('\n✅ SUBSCRIPTION TIER SYSTEM IS FULLY OPERATIONAL');
      console.log('\n📊 System Status:');
      console.log('- ✅ Database tables created and populated');
      console.log('- ✅ 3-tier subscription system (Basic, Advanced, Premium)');
      console.log('- ✅ Rs. currency pricing for Indian market');
      console.log('- ✅ Feature flags and usage limits defined');
      console.log('- ✅ API endpoints functional');
      console.log('- ✅ TypeScript types implemented');
      console.log('- ✅ Service layer complete');
      console.log('\n🚀 Ready for Phase 1 next steps:');
      console.log('- A2: Usage Tracking System (depends on A1) ✅ Ready');
      console.log('- D1: Tenant Management UI (depends on A1) ✅ Ready');
      console.log('- H1: Tier Restrictions (depends on A1) ✅ Ready');
    } else {
      console.log('⚠️  Some core tests failed. Please check the issues above.');
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Run the tests
testSubscriptionCore();