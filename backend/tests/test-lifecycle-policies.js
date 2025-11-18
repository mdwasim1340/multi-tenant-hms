/**
 * Team Alpha - S3 Lifecycle Policies Test
 * Test complete lifecycle management system
 */

const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_TENANT_ID = 'tenant_1762083064503';

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'multitenant_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Test JWT token (would be obtained from signin in real scenario)
const TEST_JWT_TOKEN = 'test-jwt-token';

// API client with authentication
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${TEST_JWT_TOKEN}`,
    'X-Tenant-ID': TEST_TENANT_ID,
    'X-App-ID': 'hospital-management',
    'X-API-Key': 'hospital-dev-key-789',
    'Content-Type': 'application/json'
  }
});

async function testLifecyclePolicies() {
  console.log('🚀 Testing S3 Lifecycle Policies System...\n');

  let testResults = {
    passed: 0,
    failed: 0,
    total: 0
  };

  // Test 1: Database Migration Applied
  console.log('📋 Test 1: Database Migration Applied');
  try {
    const client = await pool.connect();
    
    // Check if file_access_logs table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'file_access_logs'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ file_access_logs table exists');
      testResults.passed++;
    } else {
      console.log('❌ file_access_logs table missing');
      testResults.failed++;
    }
    
    // Check if view exists
    const viewCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'file_access_patterns'
      );
    `);
    
    if (viewCheck.rows[0].exists) {
      console.log('✅ file_access_patterns view exists');
      testResults.passed++;
    } else {
      console.log('❌ file_access_patterns view missing');
      testResults.failed++;
    }
    
    // Check if functions exist
    const functionCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM pg_proc
      WHERE proname IN ('get_tenant_access_stats', 'recommend_storage_transitions');
    `);
    
    if (functionCheck.rows[0].count == 2) {
      console.log('✅ Analysis functions exist');
      testResults.passed++;
    } else {
      console.log('❌ Analysis functions missing');
      testResults.failed++;
    }
    
    client.release();
    testResults.total += 3;
  } catch (error) {
    console.log('❌ Database check failed:', error.message);
    testResults.failed += 3;
    testResults.total += 3;
  }

  // Test 2: Lifecycle Status API
  console.log('\n📋 Test 2: Lifecycle Status API');
  try {
    const response = await api.get('/api/lifecycle/status');
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Lifecycle status API working');
      console.log(`   - Configured: ${response.data.data.isConfigured}`);
      console.log(`   - Total Rules: ${response.data.data.totalRules}`);
      console.log(`   - Active Rules: ${response.data.data.activeRules}`);
      testResults.passed++;
    } else {
      console.log('❌ Lifecycle status API failed');
      testResults.failed++;
    }
    testResults.total++;
  } catch (error) {
    console.log('❌ Lifecycle status API error:', error.response?.data?.error || error.message);
    testResults.failed++;
    testResults.total++;
  }

  // Test 3: Lifecycle Configuration API
  console.log('\n📋 Test 3: Lifecycle Configuration API');
  try {
    const response = await api.get('/api/lifecycle/configuration');
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Lifecycle configuration API working');
      console.log(`   - Rules: ${response.data.data.totalRules}`);
      console.log(`   - Active: ${response.data.data.activeRules}`);
      testResults.passed++;
    } else {
      console.log('❌ Lifecycle configuration API failed');
      testResults.failed++;
    }
    testResults.total++;
  } catch (error) {
    console.log('❌ Lifecycle configuration API error:', error.response?.data?.error || error.message);
    testResults.failed++;
    testResults.total++;
  }

  // Test 4: Storage Classes Info API
  console.log('\n📋 Test 4: Storage Classes Info API');
  try {
    const response = await api.get('/api/lifecycle/storage-classes');
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Storage classes API working');
      console.log(`   - Total Classes: ${response.data.data.totalClasses}`);
      
      // Display cost comparison
      const costComparison = response.data.data.costComparison;
      console.log('   - Cost Comparison:');
      costComparison.forEach(sc => {
        console.log(`     ${sc.displayName}: $${sc.costPerGB}/GB (${sc.savingsVsStandard}% savings vs Standard)`);
      });
      
      testResults.passed++;
    } else {
      console.log('❌ Storage classes API failed');
      testResults.failed++;
    }
    testResults.total++;
  } catch (error) {
    console.log('❌ Storage classes API error:', error.response?.data?.error || error.message);
    testResults.failed++;
    testResults.total++;
  }

  // Test 5: Access Patterns API
  console.log('\n📋 Test 5: Access Patterns API');
  try {
    const response = await api.get('/api/lifecycle/access-patterns');
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Access patterns API working');
      console.log(`   - Patterns: ${response.data.data.patterns.length}`);
      console.log(`   - Total: ${response.data.data.pagination.total}`);
      testResults.passed++;
    } else {
      console.log('❌ Access patterns API failed');
      testResults.failed++;
    }
    testResults.total++;
  } catch (error) {
    console.log('❌ Access patterns API error:', error.response?.data?.error || error.message);
    testResults.failed++;
    testResults.total++;
  }

  // Test 6: Storage Recommendations API
  console.log('\n📋 Test 6: Storage Recommendations API');
  try {
    const response = await api.get('/api/lifecycle/recommendations');
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Storage recommendations API working');
      console.log(`   - Recommendations: ${response.data.data.recommendations.length}`);
      console.log(`   - Total Potential Savings: $${response.data.data.summary.totalPotentialSavings.toFixed(2)}`);
      console.log(`   - Average Savings: ${response.data.data.summary.averageSavingsPercent.toFixed(1)}%`);
      testResults.passed++;
    } else {
      console.log('❌ Storage recommendations API failed');
      testResults.failed++;
    }
    testResults.total++;
  } catch (error) {
    console.log('❌ Storage recommendations API error:', error.response?.data?.error || error.message);
    testResults.failed++;
    testResults.total++;
  }

  // Test 7: Tenant Access Stats API
  console.log('\n📋 Test 7: Tenant Access Stats API');
  try {
    const response = await api.get('/api/lifecycle/stats');
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Tenant access stats API working');
      const stats = response.data.data;
      console.log(`   - Total Files: ${stats.total_files}`);
      console.log(`   - Total Accesses: ${stats.total_accesses}`);
      console.log(`   - Unique Users: ${stats.unique_users}`);
      console.log(`   - Files not accessed (30 days): ${stats.files_not_accessed_30_days}`);
      console.log(`   - Files not accessed (90 days): ${stats.files_not_accessed_90_days}`);
      console.log(`   - Files not accessed (180 days): ${stats.files_not_accessed_180_days}`);
      testResults.passed++;
    } else {
      console.log('❌ Tenant access stats API failed');
      testResults.failed++;
    }
    testResults.total++;
  } catch (error) {
    console.log('❌ Tenant access stats API error:', error.response?.data?.error || error.message);
    testResults.failed++;
    testResults.total++;
  }

  // Test 8: Lifecycle Savings Calculation
  console.log('\n📋 Test 8: Lifecycle Savings Calculation');
  try {
    const response = await api.get('/api/lifecycle/savings');
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Lifecycle savings calculation working');
      const savings = response.data.data;
      console.log(`   - Current Monthly Cost: $${savings.currentMonthlyCost.toFixed(2)}`);
      console.log(`   - Optimized Monthly Cost: $${savings.optimizedMonthlyCost.toFixed(2)}`);
      console.log(`   - Monthly Savings: $${savings.monthlySavings.toFixed(2)}`);
      console.log(`   - Savings Percentage: ${savings.savingsPercentage.toFixed(1)}%`);
      testResults.passed++;
    } else {
      console.log('❌ Lifecycle savings calculation failed');
      testResults.failed++;
    }
    testResults.total++;
  } catch (error) {
    console.log('❌ Lifecycle savings calculation error:', error.response?.data?.error || error.message);
    testResults.failed++;
    testResults.total++;
  }

  // Test 9: Lifecycle Transitions Monitoring
  console.log('\n📋 Test 9: Lifecycle Transitions Monitoring');
  try {
    const response = await api.get('/api/lifecycle/transitions');
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Lifecycle transitions monitoring working');
      console.log(`   - Upcoming Transitions: ${response.data.data.totalFiles}`);
      console.log(`   - Total Estimated Savings: $${response.data.data.totalEstimatedSavings.toFixed(2)}`);
      testResults.passed++;
    } else {
      console.log('❌ Lifecycle transitions monitoring failed');
      testResults.failed++;
    }
    testResults.total++;
  } catch (error) {
    console.log('❌ Lifecycle transitions monitoring error:', error.response?.data?.error || error.message);
    testResults.failed++;
    testResults.total++;
  }

  // Test 10: Lifecycle Validation
  console.log('\n📋 Test 10: Lifecycle Validation');
  try {
    const response = await api.get('/api/lifecycle/validate');
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Lifecycle validation working');
      const validation = response.data.data;
      console.log(`   - Is Valid: ${validation.isValid}`);
      console.log(`   - Issues: ${validation.issues.length}`);
      console.log(`   - Recommendations: ${validation.recommendations.length}`);
      
      if (validation.issues.length > 0) {
        console.log('   - Issues Found:');
        validation.issues.forEach(issue => console.log(`     - ${issue}`));
      }
      
      if (validation.recommendations.length > 0) {
        console.log('   - Recommendations:');
        validation.recommendations.forEach(rec => console.log(`     - ${rec}`));
      }
      
      testResults.passed++;
    } else {
      console.log('❌ Lifecycle validation failed');
      testResults.failed++;
    }
    testResults.total++;
  } catch (error) {
    console.log('❌ Lifecycle validation error:', error.response?.data?.error || error.message);
    testResults.failed++;
    testResults.total++;
  }

  // Test 11: File Access Logging (Simulate)
  console.log('\n📋 Test 11: File Access Logging');
  try {
    const client = await pool.connect();
    
    // Insert test access log
    await client.query(`
      INSERT INTO file_access_logs (
        tenant_id, file_id, file_path, access_type, user_id,
        file_size_bytes, storage_class, success
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      TEST_TENANT_ID,
      'test-file-123.pdf',
      `${TEST_TENANT_ID}/medical-records/2025/11/123/test-file-123.pdf`,
      'download',
      1,
      1048576, // 1MB
      'STANDARD',
      true
    ]);
    
    // Verify the log was inserted
    const logCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM file_access_logs
      WHERE tenant_id = $1 AND file_id = $2
    `, [TEST_TENANT_ID, 'test-file-123.pdf']);
    
    if (logCheck.rows[0].count > 0) {
      console.log('✅ File access logging working');
      testResults.passed++;
    } else {
      console.log('❌ File access logging failed');
      testResults.failed++;
    }
    
    client.release();
    testResults.total++;
  } catch (error) {
    console.log('❌ File access logging error:', error.message);
    testResults.failed++;
    testResults.total++;
  }

  // Test 12: Access Pattern Analysis
  console.log('\n📋 Test 12: Access Pattern Analysis');
  try {
    const client = await pool.connect();
    
    // Test the analysis view
    const patternCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM file_access_patterns
      WHERE tenant_id = $1
    `, [TEST_TENANT_ID]);
    
    console.log(`✅ Access pattern analysis working (${patternCheck.rows[0].count} patterns)`);
    testResults.passed++;
    
    client.release();
    testResults.total++;
  } catch (error) {
    console.log('❌ Access pattern analysis error:', error.message);
    testResults.failed++;
    testResults.total++;
  }

  // Display final results
  console.log('\n' + '='.repeat(60));
  console.log('📊 S3 LIFECYCLE POLICIES TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed}/${testResults.total}`);
  console.log(`❌ Failed: ${testResults.failed}/${testResults.total}`);
  console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

  if (testResults.passed === testResults.total) {
    console.log('\n🎉 ALL TESTS PASSED! S3 Lifecycle Policies System is working perfectly!');
    console.log('\n💰 Expected Benefits:');
    console.log('   - 46% savings after 30 days (Standard-IA)');
    console.log('   - 83% savings after 90 days (Glacier)');
    console.log('   - 96% savings after 180 days (Deep Archive)');
    console.log('   - Automatic optimization with Intelligent-Tiering');
    console.log('   - Complete access pattern tracking');
    console.log('   - Data-driven storage recommendations');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }

  console.log('\n🔄 Next Steps:');
  console.log('   1. Run S3 lifecycle configuration script');
  console.log('   2. Monitor file access patterns');
  console.log('   3. Review cost optimization recommendations');
  console.log('   4. Set up automated cost alerts');

  return testResults.passed === testResults.total;
}

// Run the test
if (require.main === module) {
  testLifecyclePolicies()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    })
    .finally(() => {
      pool.end();
    });
}

module.exports = { testLifecyclePolicies };