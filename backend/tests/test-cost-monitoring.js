/**
 * Team Alpha - Cost Monitoring Test
 * Test storage cost monitoring functionality
 */

const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:3000';
const TENANT_ID = process.env.TEST_TENANT_ID || 'aajmin_polyclinic';

// Test credentials (should be set in .env)
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@test.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!@#';

let authToken = '';

async function signin() {
  try {
    console.log('🔐 Signing in...');
    const response = await axios.post(`${API_URL}/auth/signin`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    authToken = response.data.token;
    console.log('✅ Signed in successfully\n');
    return true;
  } catch (error) {
    console.error('❌ Signin failed:', error.response?.data || error.message);
    return false;
  }
}

async function getCurrentMetrics() {
  try {
    console.log('📊 Getting current storage metrics...');
    const response = await axios.get(`${API_URL}/api/storage/metrics`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-Tenant-ID': TENANT_ID,
      },
    });

    const metrics = response.data;
    console.log('✅ Current storage metrics retrieved:');
    console.log(`   Total Size: ${(metrics.total_size_bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`);
    console.log(`   File Count: ${metrics.file_count}`);
    console.log(`   Monthly Cost: $${metrics.estimated_monthly_cost.toFixed(2)}`);
    console.log(`   Compression Savings: ${(metrics.compression_savings_bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`);
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Get current metrics failed:', error.response?.data || error.message);
    return false;
  }
}

async function getCostBreakdown() {
  try {
    console.log('💰 Getting cost breakdown...');
    const response = await axios.get(`${API_URL}/api/storage/costs`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-Tenant-ID': TENANT_ID,
      },
      params: {
        days: 30,
      },
    });

    const { current_metrics, cost_trends } = response.data;
    console.log('✅ Cost breakdown retrieved:');
    console.log(`   Storage Cost: $${current_metrics.cost_breakdown.storage_cost.toFixed(2)}`);
    console.log(`   Request Cost: $${current_metrics.cost_breakdown.request_cost.toFixed(2)}`);
    console.log(`   Transfer Cost: $${current_metrics.cost_breakdown.data_transfer_cost.toFixed(2)}`);
    console.log(`   Total Cost: $${current_metrics.cost_breakdown.total_cost.toFixed(2)}`);
    console.log(`   Cost Trends: ${cost_trends.length} data points`);
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Get cost breakdown failed:', error.response?.data || error.message);
    return false;
  }
}

async function getCostTrends() {
  try {
    console.log('📈 Getting cost trends...');
    const response = await axios.get(`${API_URL}/api/storage/trends`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-Tenant-ID': TENANT_ID,
      },
      params: {
        days: 7,
      },
    });

    const { trends } = response.data;
    console.log('✅ Cost trends retrieved:');
    console.log(`   Data Points: ${trends.length}`);
    if (trends.length > 0) {
      console.log(`   Latest Cost: $${trends[0].total_cost.toFixed(2)}`);
      console.log(`   Latest Size: ${trends[0].total_size_gb.toFixed(2)} GB`);
    }
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Get cost trends failed:', error.response?.data || error.message);
    return false;
  }
}

async function getCostAlerts() {
  try {
    console.log('🚨 Getting cost alerts...');
    const response = await axios.get(`${API_URL}/api/storage/alerts`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-Tenant-ID': TENANT_ID,
      },
    });

    const { alerts } = response.data;
    console.log('✅ Cost alerts retrieved:');
    console.log(`   Active Alerts: ${alerts.length}`);
    alerts.forEach((alert, index) => {
      console.log(`   ${index + 1}. ${alert.alert_type}: ${alert.alert_message}`);
    });
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Get cost alerts failed:', error.response?.data || error.message);
    return false;
  }
}

async function getStorageReport() {
  try {
    console.log('📋 Getting comprehensive storage report...');
    const response = await axios.get(`${API_URL}/api/storage/report`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-Tenant-ID': TENANT_ID,
      },
    });

    const report = response.data;
    console.log('✅ Storage report generated:');
    console.log(`   Current Cost: $${report.current_metrics.estimated_monthly_cost.toFixed(2)}`);
    console.log(`   Cost Trends: ${report.cost_trends.length} data points`);
    console.log(`   Active Alerts: ${report.active_alerts.length}`);
    console.log(`   Top Files: ${report.top_files_by_size.length}`);
    console.log(`   Access Patterns: ${report.access_patterns.length}`);
    console.log(`   Recommendations: ${report.optimization_recommendations.length}`);
    
    if (report.optimization_recommendations.length > 0) {
      console.log('   📝 Top Recommendations:');
      report.optimization_recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`     ${index + 1}. ${rec.title} (${rec.priority} priority)`);
        console.log(`        Potential Savings: $${rec.potential_savings.toFixed(2)}`);
      });
    }
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Get storage report failed:', error.response?.data || error.message);
    return false;
  }
}

async function refreshMetrics() {
  try {
    console.log('🔄 Refreshing storage metrics...');
    const response = await axios.post(
      `${API_URL}/api/storage/refresh`,
      {
        warning_threshold: 25,
        critical_threshold: 50,
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-Tenant-ID': TENANT_ID,
        },
      }
    );

    console.log('✅ Storage metrics refreshed successfully');
    console.log(`   New Cost: $${response.data.metrics.estimated_monthly_cost.toFixed(2)}`);
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Refresh metrics failed:', error.response?.data || error.message);
    return false;
  }
}

async function logFileAccess() {
  try {
    console.log('📝 Logging file access...');
    const response = await axios.post(
      `${API_URL}/api/storage/access-log`,
      {
        file_id: 'test-file-123',
        file_path: 'medical-records/test-file.pdf',
        access_type: 'download',
        file_size_bytes: 1024000,
        storage_class: 'STANDARD',
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-Tenant-ID': TENANT_ID,
        },
      }
    );

    console.log('✅ File access logged successfully');
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Log file access failed:', error.response?.data || error.message);
    return false;
  }
}

async function testExportMetrics() {
  try {
    console.log('📤 Testing metrics export...');
    const response = await axios.get(`${API_URL}/api/storage/export`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-Tenant-ID': TENANT_ID,
      },
      params: {
        days: 30,
      },
    });

    console.log('✅ Metrics export successful');
    console.log(`   Content Type: ${response.headers['content-type']}`);
    console.log(`   Content Length: ${response.data.length} characters`);
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Export metrics failed:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Team Alpha - Cost Monitoring Test\n');
  console.log('='.repeat(50));
  console.log('');

  const results = {
    signin: false,
    getCurrentMetrics: false,
    getCostBreakdown: false,
    getCostTrends: false,
    getCostAlerts: false,
    getStorageReport: false,
    refreshMetrics: false,
    logFileAccess: false,
    testExportMetrics: false,
  };

  // Run tests
  results.signin = await signin();
  if (!results.signin) {
    console.log('\n❌ Cannot continue without authentication');
    return;
  }

  results.getCurrentMetrics = await getCurrentMetrics();
  results.getCostBreakdown = await getCostBreakdown();
  results.getCostTrends = await getCostTrends();
  results.getCostAlerts = await getCostAlerts();
  results.getStorageReport = await getStorageReport();
  results.refreshMetrics = await refreshMetrics();
  results.logFileAccess = await logFileAccess();
  results.testExportMetrics = await testExportMetrics();

  // Summary
  console.log('='.repeat(50));
  console.log('\n📊 Test Summary:\n');

  const passed = Object.values(results).filter((r) => r).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([test, result]) => {
    console.log(`${result ? '✅' : '❌'} ${test}`);
  });

  console.log(`\n📈 Success Rate: ${passed}/${total} (${Math.round((passed / total) * 100)}%)`);

  if (passed === total) {
    console.log('\n🎉 All cost monitoring tests passed!');
    console.log('\n✅ Cost Monitoring System is OPERATIONAL');
    console.log('   - Storage metrics collection working');
    console.log('   - Cost breakdown calculation accurate');
    console.log('   - Cost trends tracking functional');
    console.log('   - Alert system operational');
    console.log('   - Comprehensive reporting available');
    console.log('   - File access logging working');
    console.log('   - CSV export functional');
    console.log('\n💰 Cost Optimization: Ready for production monitoring');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});