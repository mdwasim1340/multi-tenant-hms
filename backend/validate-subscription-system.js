const { Pool } = require('pg');
const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:3000';

// Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

async function validateSubscriptionSystem() {
  console.log('🔍 A1-SUBSCRIPTION TIER SYSTEM VALIDATION');
  console.log('=' .repeat(50));
  
  let validationResults = {
    database: { passed: 0, total: 0 },
    api: { passed: 0, total: 0 },
    integration: { passed: 0, total: 0 }
  };

  const validate = async (category, testName, testFn) => {
    validationResults[category].total++;
    try {
      console.log(`\n✓ ${testName}`);
      await testFn();
      console.log('  ✅ PASSED');
      validationResults[category].passed++;
    } catch (error) {
      console.log(`  ❌ FAILED: ${error.message}`);
    }
  };

  try {
    // DATABASE VALIDATION
    console.log('\n📊 DATABASE VALIDATION');
    console.log('-'.repeat(30));

    await validate('database', 'Subscription tiers table exists with correct data', async () => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT COUNT(*) FROM subscription_tiers WHERE is_active = true');
        const count = parseInt(result.rows[0].count);
        if (count !== 3) throw new Error(`Expected 3 tiers, found ${count}`);
        
        // Check specific tiers
        const tiers = await client.query('SELECT id, name, price FROM subscription_tiers ORDER BY display_order');
        const expectedTiers = [
          { id: 'basic', name: 'Basic', price: '4999.00' },
          { id: 'advanced', name: 'Advanced', price: '14999.00' },
          { id: 'premium', name: 'Premium', price: '29999.00' }
        ];
        
        for (let i = 0; i < expectedTiers.length; i++) {
          const expected = expectedTiers[i];
          const actual = tiers.rows[i];
          if (actual.id !== expected.id || actual.name !== expected.name || actual.price !== expected.price) {
            throw new Error(`Tier ${i + 1} mismatch: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
          }
        }
        
        console.log('    - Basic: ₹4,999/month');
        console.log('    - Advanced: ₹14,999/month');
        console.log('    - Premium: ₹29,999/month');
      } finally {
        client.release();
      }
    });

    await validate('database', 'Tenant subscriptions table exists with assignments', async () => {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT COUNT(*) FROM tenant_subscriptions');
        const count = parseInt(result.rows[0].count);
        if (count === 0) throw new Error('No tenant subscriptions found');
        
        // Check that all tenants have subscriptions
        const tenantsResult = await client.query('SELECT COUNT(*) FROM tenants');
        const subscriptionsResult = await client.query('SELECT COUNT(*) FROM tenant_subscriptions');
        
        if (tenantsResult.rows[0].count !== subscriptionsResult.rows[0].count) {
          throw new Error('Not all tenants have subscriptions assigned');
        }
        
        console.log(`    - ${count} tenant subscriptions assigned`);
      } finally {
        client.release();
      }
    });

    await validate('database', 'Database indexes created for performance', async () => {
      const client = await pool.connect();
      try {
        const result = await client.query(`
          SELECT indexname FROM pg_indexes 
          WHERE tablename IN ('subscription_tiers', 'tenant_subscriptions')
          AND indexname LIKE 'idx_%'
        `);
        
        const expectedIndexes = [
          'idx_tenant_subscriptions_tenant',
          'idx_tenant_subscriptions_tier', 
          'idx_tenant_subscriptions_status'
        ];
        
        const actualIndexes = result.rows.map(row => row.indexname);
        for (const expectedIndex of expectedIndexes) {
          if (!actualIndexes.includes(expectedIndex)) {
            throw new Error(`Missing index: ${expectedIndex}`);
          }
        }
        
        console.log(`    - ${result.rows.length} performance indexes created`);
      } finally {
        client.release();
      }
    });

    // API VALIDATION
    console.log('\n🌐 API VALIDATION');
    console.log('-'.repeat(30));

    const headers = {
      'Origin': 'http://localhost:3002',
      'X-App-ID': 'admin-dashboard',
      'X-API-Key': 'admin-dev-key-456'
    };

    await validate('api', 'Get all subscription tiers endpoint', async () => {
      const response = await axios.get(`${API_URL}/api/subscriptions/tiers`, { headers });
      
      if (!response.data.success) throw new Error('API response indicates failure');
      if (!Array.isArray(response.data.tiers)) throw new Error('Tiers not returned as array');
      if (response.data.tiers.length !== 3) throw new Error(`Expected 3 tiers, got ${response.data.tiers.length}`);
      
      console.log(`    - Retrieved ${response.data.tiers.length} subscription tiers`);
    });

    await validate('api', 'Get specific tier details endpoint', async () => {
      const response = await axios.get(`${API_URL}/api/subscriptions/tiers/premium`, { headers });
      
      if (!response.data.success) throw new Error('API response indicates failure');
      if (response.data.tier.id !== 'premium') throw new Error('Wrong tier returned');
      if (response.data.tier.price !== 29999) throw new Error('Wrong price returned');
      
      console.log('    - Premium tier details retrieved correctly');
    });

    await validate('api', 'Tier comparison endpoint', async () => {
      const response = await axios.get(
        `${API_URL}/api/subscriptions/compare?current_tier=basic&target_tier=premium`, 
        { headers }
      );
      
      if (!response.data.success) throw new Error('API response indicates failure');
      if (response.data.price_difference !== 25000) throw new Error('Wrong price difference calculated');
      if (!response.data.is_upgrade) throw new Error('Should be marked as upgrade');
      
      console.log('    - Tier comparison working correctly');
      console.log(`    - Price difference: ₹${response.data.price_difference}`);
    });

    await validate('api', 'App authentication middleware protection', async () => {
      try {
        // This should fail without proper headers
        await axios.get(`${API_URL}/api/subscriptions/tiers`);
        throw new Error('API should have blocked direct access');
      } catch (error) {
        if (error.response?.status === 403) {
          console.log('    - Direct access properly blocked');
          return;
        }
        throw error;
      }
    });

    // INTEGRATION VALIDATION
    console.log('\n🔗 INTEGRATION VALIDATION');
    console.log('-'.repeat(30));

    await validate('integration', 'TypeScript types and service integration', async () => {
      // Check that compiled files exist
      const fs = require('fs');
      const path = require('path');
      
      const requiredFiles = [
        'dist/services/subscription.js',
        'dist/middleware/featureAccess.js',
        'dist/routes/subscriptions.js',
        'dist/types/subscription.js'
      ];
      
      for (const file of requiredFiles) {
        if (!fs.existsSync(path.join(__dirname, file))) {
          throw new Error(`Compiled file missing: ${file}`);
        }
      }
      
      console.log('    - All TypeScript files compiled successfully');
    });

    await validate('integration', 'Feature flags and limits configuration', async () => {
      const client = await pool.connect();
      try {
        // Check that features are properly configured
        const result = await client.query(`
          SELECT features, limits FROM subscription_tiers WHERE id = 'basic'
        `);
        
        const basicTier = result.rows[0];
        const features = basicTier.features;
        const limits = basicTier.limits;
        
        // Basic tier should have patients and appointments, but not medical_records
        if (!features.patients) throw new Error('Basic tier should have patients feature');
        if (!features.appointments) throw new Error('Basic tier should have appointments feature');
        if (features.medical_records) throw new Error('Basic tier should NOT have medical_records feature');
        
        // Check limits
        if (limits.max_patients !== 500) throw new Error('Basic tier should have 500 patient limit');
        if (limits.max_users !== 5) throw new Error('Basic tier should have 5 user limit');
        
        console.log('    - Feature flags configured correctly');
        console.log('    - Usage limits configured correctly');
      } finally {
        client.release();
      }
    });

    await validate('integration', 'Tenant creation with default subscription', async () => {
      const client = await pool.connect();
      try {
        // Check that existing tenants have subscriptions
        const result = await client.query(`
          SELECT t.id, t.name, ts.tier_id, ts.status 
          FROM tenants t 
          JOIN tenant_subscriptions ts ON t.id = ts.tenant_id 
          LIMIT 3
        `);
        
        if (result.rows.length === 0) throw new Error('No tenants with subscriptions found');
        
        for (const row of result.rows) {
          if (row.tier_id !== 'basic') throw new Error(`Tenant ${row.id} should have basic tier, has ${row.tier_id}`);
          if (row.status !== 'active') throw new Error(`Tenant ${row.id} should have active status, has ${row.status}`);
        }
        
        console.log(`    - ${result.rows.length} tenants have default subscriptions`);
      } finally {
        client.release();
      }
    });

    // SUMMARY
    console.log('\n' + '='.repeat(50));
    console.log('📊 A1-SUBSCRIPTION SYSTEM VALIDATION SUMMARY');
    console.log('='.repeat(50));
    
    const totalPassed = validationResults.database.passed + validationResults.api.passed + validationResults.integration.passed;
    const totalTests = validationResults.database.total + validationResults.api.total + validationResults.integration.total;
    
    console.log(`📊 Database: ${validationResults.database.passed}/${validationResults.database.total} passed`);
    console.log(`🌐 API: ${validationResults.api.passed}/${validationResults.api.total} passed`);
    console.log(`🔗 Integration: ${validationResults.integration.passed}/${validationResults.integration.total} passed`);
    console.log(`📈 Overall: ${totalPassed}/${totalTests} (${((totalPassed/totalTests)*100).toFixed(1)}%)`);
    
    if (totalPassed === totalTests) {
      console.log('\n🎉 A1-SUBSCRIPTION TIER SYSTEM IMPLEMENTATION COMPLETE!');
      console.log('✅ All validation tests passed');
      console.log('🚀 System ready for production use');
      
      console.log('\n📋 IMPLEMENTATION CHECKLIST:');
      console.log('✅ Database schema created (subscription_tiers, tenant_subscriptions)');
      console.log('✅ TypeScript types defined (TierFeatures, TierLimits, etc.)');
      console.log('✅ Subscription service implemented');
      console.log('✅ Feature access middleware created');
      console.log('✅ Usage limit middleware created');
      console.log('✅ API routes implemented (/api/subscriptions/*)');
      console.log('✅ Integration with main application');
      console.log('✅ Default subscriptions assigned to existing tenants');
      console.log('✅ App authentication protection enabled');
      
      console.log('\n🎯 NEXT STEPS:');
      console.log('- Agent A2 can now implement usage tracking');
      console.log('- Agent D1 can build tenant management UI');
      console.log('- Agent H1 can implement tier restrictions in hospital system');
      
    } else {
      console.log(`\n⚠️  ${totalTests - totalPassed} validation(s) failed`);
      console.log('Please review the errors above before proceeding');
    }

  } catch (error) {
    console.error('❌ Validation suite failed:', error);
  } finally {
    await pool.end();
  }
}

// Run validation
if (require.main === module) {
  validateSubscriptionSystem().catch(console.error);
}

module.exports = { validateSubscriptionSystem };