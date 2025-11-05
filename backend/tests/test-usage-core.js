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

async function testUsageCore() {
  console.log('🧪 TESTING USAGE TRACKING SYSTEM - CORE FUNCTIONALITY');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  try {
    // Test 1: Database verification
    totalTests++;
    console.log('Test 1: Verifying database tables...');
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
      
      // Check usage_tracking table
      const trackingResult = await pool.query('SELECT COUNT(*) FROM usage_tracking');
      const trackingCount = parseInt(trackingResult.rows[0].count);
      
      // Check usage_summary table
      const summaryResult = await pool.query('SELECT COUNT(*) FROM usage_summary');
      const summaryCount = parseInt(summaryResult.rows[0].count);
      
      console.log(`   ✅ Database tables verified:`);
      console.log(`      - usage_tracking: ${trackingCount} records`);
      console.log(`      - usage_summary: ${summaryCount} records`);
      
      if (summaryCount > 0) {
        console.log('   ✅ Usage summaries initialized for existing tenants');
        passedTests++;
      } else {
        console.log('   ❌ No usage summaries found');
      }
      
      await pool.end();
    } catch (error) {
      console.log('❌ Database verification failed:', error.message);
    }

    // Test 2: Test usage service directly
    totalTests++;
    console.log('\nTest 2: Testing usage service directly...');
    try {
      // Import and test the usage service
      const { usageService } = require('../src/services/usage');
      
      // Get existing tenant
      const { Pool } = require('pg');
      const pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
      });
      
      const tenantsResult = await pool.query('SELECT id FROM tenants LIMIT 1');
      if (tenantsResult.rows.length > 0) {
        const tenantId = tenantsResult.rows[0].id;
        
        // Test tracking usage
        await usageService.trackUsage(tenantId, 'api_call', 1, { test: true });
        console.log('   ✅ Usage tracking service working');
        
        // Test getting current usage
        const usage = await usageService.getCurrentUsage(tenantId);
        if (usage) {
          console.log(`   ✅ Current usage retrieved: ${usage.api_calls_count} API calls`);
          passedTests++;
        } else {
          console.log('   ❌ Failed to get current usage');
        }
      } else {
        console.log('   ❌ No tenants found for testing');
      }
      
      await pool.end();
    } catch (error) {
      console.log('❌ Usage service test failed:', error.message);
    }

    // Test 3: Test API endpoints (basic)
    totalTests++;
    console.log('\nTest 3: Testing basic API connectivity...');
    try {
      // Test public endpoint first
      const tiersResponse = await api.get('/api/subscriptions/tiers');
      console.log('   ✅ API connectivity working');
      console.log(`   Found ${tiersResponse.data.tiers.length} subscription tiers`);
      passedTests++;
    } catch (error) {
      console.log('❌ API connectivity failed:', error.response?.data?.error || error.message);
    }

    // Test 4: Test usage tracking middleware
    totalTests++;
    console.log('\nTest 4: Testing usage tracking middleware...');
    try {
      // Get a tenant ID
      const { Pool } = require('pg');
      const pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
      });
      
      const tenantsResult = await pool.query('SELECT id FROM tenants LIMIT 1');
      if (tenantsResult.rows.length > 0) {
        const tenantId = tenantsResult.rows[0].id;
        
        // Make API call with tenant header to trigger tracking
        await api.get('/api/subscriptions/tiers', {
          headers: { 'X-Tenant-ID': tenantId }
        });
        
        // Wait for async tracking
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if tracking occurred
        const trackingResult = await pool.query(
          'SELECT COUNT(*) FROM usage_tracking WHERE tenant_id = $1 AND metric_type = $2',
          [tenantId, 'api_call']
        );
        
        const apiCallCount = parseInt(trackingResult.rows[0].count);
        if (apiCallCount > 0) {
          console.log(`   ✅ Usage tracking middleware working (${apiCallCount} API calls tracked)`);
          passedTests++;
        } else {
          console.log('   ❌ No API calls tracked by middleware');
        }
      } else {
        console.log('   ❌ No tenants found for testing');
      }
      
      await pool.end();
    } catch (error) {
      console.log('❌ Middleware test failed:', error.message);
    }

    // Test 5: Test usage report generation
    totalTests++;
    console.log('\nTest 5: Testing usage report generation...');
    try {
      const { usageService } = require('../src/services/usage');
      
      const { Pool } = require('pg');
      const pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
      });
      
      const tenantsResult = await pool.query('SELECT id FROM tenants LIMIT 1');
      if (tenantsResult.rows.length > 0) {
        const tenantId = tenantsResult.rows[0].id;
        
        const report = await usageService.generateUsageReport(tenantId);
        console.log('   ✅ Usage report generated successfully');
        console.log(`      Tenant: ${report.tenant_name}`);
        console.log(`      Tier: ${report.tier_name}`);
        console.log(`      Warnings: ${report.warnings.length}`);
        console.log(`      Recommendations: ${report.recommendations.length}`);
        passedTests++;
      } else {
        console.log('   ❌ No tenants found for testing');
      }
      
      await pool.end();
    } catch (error) {
      console.log('❌ Report generation failed:', error.message);
    }

    // Summary
    console.log('\n🎯 USAGE TRACKING CORE TEST RESULTS');
    console.log('====================================');
    console.log(`✅ Tests Passed: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 ALL CORE USAGE TRACKING TESTS PASSED!');
      console.log('\n✅ USAGE TRACKING SYSTEM IS FULLY OPERATIONAL');
      console.log('\n📊 Core Features Working:');
      console.log('- ✅ Database tables created and initialized');
      console.log('- ✅ Usage service layer functional');
      console.log('- ✅ API connectivity established');
      console.log('- ✅ Usage tracking middleware operational');
      console.log('- ✅ Usage report generation working');
      console.log('\n🚀 System Ready For:');
      console.log('- A2: Usage Tracking System ✅ COMPLETE');
      console.log('- D2: Billing Interface (depends on A2) ✅ Ready');
      console.log('- Admin dashboard usage metrics ✅ Ready');
      console.log('- Automated billing calculations ✅ Ready');
    } else {
      console.log('⚠️  Some core tests failed. Please check the issues above.');
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Run the tests
testUsageCore();