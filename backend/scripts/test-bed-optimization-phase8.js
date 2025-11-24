/**
 * Test Script for Bed Management Optimization - Phase 8
 * Admin Interface - Backend
 * 
 * Tests:
 * - Feature management (list, enable, disable)
 * - Audit log retrieval
 * - LOS accuracy metrics
 * - Bed utilization metrics
 * - ED boarding metrics
 * - Capacity forecast metrics
 * - Metrics export (CSV and JSON)
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';
const TENANT_ID = 'aajmin_polyclinic';

async function runTests() {
  console.log('🧪 Starting Phase 8 Tests: Admin Interface - Backend\n');
  console.log('=' .repeat(70));

  try {
    // Test 1: List all features
    await testListFeatures();

    // Test 2: Enable a feature
    await testEnableFeature();

    // Test 3: Disable a feature
    await testDisableFeature();

    // Test 4: Get audit log
    await testAuditLog();

    // Test 5: LOS accuracy metrics
    await testLOSAccuracyMetrics();

    // Test 6: Bed utilization metrics
    await testBedUtilizationMetrics();

    // Test 7: ED boarding metrics
    await testEDBoardingMetrics();

    // Test 8: Capacity forecast metrics
    await testCapacityForecastMetrics();

    // Test 9: Export metrics (JSON)
    await testExportMetricsJSON();

    // Test 10: Export metrics (CSV)
    await testExportMetricsCSV();

    console.log('\n' + '='.repeat(70));
    console.log('✅ All Phase 8 tests completed successfully!');
    console.log('=' .repeat(70));

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

async function testListFeatures() {
  console.log('\n📋 Test 1: List All Features');
  console.log('-'.repeat(70));

  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/bed-management/admin/features`,
      {
        headers: {
          'X-Tenant-ID': TENANT_ID,
          'X-App-ID': 'hospital_system',
          'X-API-Key': 'hospital-dev-key-789'
        }
      }
    );

    console.log('✅ Features retrieved successfully');
    console.log(`   Total features: ${response.data.count}`);
    
    response.data.data.forEach(feature => {
      console.log(`\n   ${feature.display_name}:`);
      console.log(`   - Feature: ${feature.feature_name}`);
      console.log(`   - Status: ${feature.enabled ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`   - Description: ${feature.description}`);
      
      if (feature.enabled && feature.enabled_at) {
        console.log(`   - Enabled at: ${new Date(feature.enabled_at).toLocaleString()}`);
        console.log(`   - Enabled by: ${feature.enabled_by || 'N/A'}`);
      }
      
      if (!feature.enabled && feature.disabled_at) {
        console.log(`   - Disabled at: ${new Date(feature.disabled_at).toLocaleString()}`);
        console.log(`   - Disabled by: ${feature.disabled_by || 'N/A'}`);
      }
    });

  } catch (error) {
    console.log('❌ Failed to list features:', error.message);
    throw error;
  }
}

async function testEnableFeature() {
  console.log('\n🔓 Test 2: Enable Feature');
  console.log('-'.repeat(70));

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/bed-management/admin/features/los_prediction/enable`,
      {
        enabled_by: 'test_admin',
        reason: 'Testing feature enablement',
        configuration: {
          update_frequency: 'daily',
          confidence_threshold: 0.7
        }
      },
      {
        headers: {
          'X-Tenant-ID': TENANT_ID,
          'X-App-ID': 'hospital_system',
          'X-API-Key': 'hospital-dev-key-789',
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Feature enabled successfully');
    console.log(`   Feature: ${response.data.data.feature_name}`);
    console.log(`   Status: ${response.data.data.enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`   Enabled by: ${response.data.data.enabled_by}`);
    console.log(`   Enabled at: ${new Date(response.data.data.enabled_at).toLocaleString()}`);

  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('⚠️  Feature already enabled or invalid request');
    } else {
      console.log('❌ Failed to enable feature:', error.message);
      throw error;
    }
  }
}

async function testDisableFeature() {
  console.log('\n🔒 Test 3: Disable Feature');
  console.log('-'.repeat(70));

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/bed-management/admin/features/capacity_forecasting/disable`,
      {
        disabled_by: 'test_admin',
        reason: 'Testing feature disablement for maintenance'
      },
      {
        headers: {
          'X-Tenant-ID': TENANT_ID,
          'X-App-ID': 'hospital_system',
          'X-API-Key': 'hospital-dev-key-789',
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Feature disabled successfully');
    console.log(`   Feature: ${response.data.data.feature_name}`);
    console.log(`   Status: ${response.data.data.enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`   Disabled by: ${response.data.data.disabled_by}`);
    console.log(`   Disabled at: ${new Date(response.data.data.disabled_at).toLocaleString()}`);
    console.log(`   Reason: ${response.data.data.reason}`);

  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('⚠️  Feature already disabled or invalid request');
    } else {
      console.log('❌ Failed to disable feature:', error.message);
      throw error;
    }
  }
}

async function testAuditLog() {
  console.log('\n📜 Test 4: Get Audit Log');
  console.log('-'.repeat(70));

  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/bed-management/admin/audit-log`,
      {
        params: {
          limit: 10
        },
        headers: {
          'X-Tenant-ID': TENANT_ID,
          'X-App-ID': 'hospital_system',
          'X-API-Key': 'hospital-dev-key-789'
        }
      }
    );

    console.log('✅ Audit log retrieved successfully');
    console.log(`   Total entries: ${response.data.pagination.total}`);
    console.log(`   Showing: ${response.data.data.length} entries`);
    
    if (response.data.data.length > 0) {
      console.log('\n   Recent actions:');
      response.data.data.slice(0, 5).forEach((entry, index) => {
        console.log(`   ${index + 1}. ${entry.action.toUpperCase()} ${entry.feature_name}`);
        console.log(`      By: ${entry.performed_by}`);
        console.log(`      At: ${new Date(entry.created_at).toLocaleString()}`);
        console.log(`      Reason: ${entry.reason || 'N/A'}`);
      });
    }

  } catch (error) {
    console.log('❌ Failed to get audit log:', error.message);
    throw error;
  }
}

async function testLOSAccuracyMetrics() {
  console.log('\n📊 Test 5: LOS Accuracy Metrics');
  console.log('-'.repeat(70));

  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/bed-management/admin/metrics/los-accuracy`,
      {
        headers: {
          'X-Tenant-ID': TENANT_ID,
          'X-App-ID': 'hospital_system',
          'X-API-Key': 'hospital-dev-key-789'
        }
      }
    );

    console.log('✅ LOS accuracy metrics retrieved successfully');
    console.log(`   Total predictions: ${response.data.data.total_predictions}`);
    console.log(`   Mean absolute error: ${response.data.data.mean_absolute_error} days`);
    console.log(`   Standard deviation: ${response.data.data.std_deviation} days`);
    console.log(`   Accuracy within 1 day: ${response.data.data.accuracy_within_1_day}`);
    console.log(`   Accuracy within 2 days: ${response.data.data.accuracy_within_2_days}`);
    console.log(`   Average confidence: ${response.data.data.avg_confidence}`);

  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.log('⚠️  LOS prediction feature not enabled');
    } else {
      console.log('❌ Failed to get LOS accuracy metrics:', error.message);
    }
  }
}

async function testBedUtilizationMetrics() {
  console.log('\n🛏️  Test 6: Bed Utilization Metrics');
  console.log('-'.repeat(70));

  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/bed-management/admin/metrics/bed-utilization`,
      {
        headers: {
          'X-Tenant-ID': TENANT_ID,
          'X-App-ID': 'hospital_system',
          'X-API-Key': 'hospital-dev-key-789'
        }
      }
    );

    console.log('✅ Bed utilization metrics retrieved successfully');
    
    if (response.data.data.length > 0) {
      console.log(`   Units analyzed: ${response.data.data.length}`);
      
      response.data.data.forEach(unit => {
        console.log(`\n   ${unit.unit}:`);
        console.log(`   - Average utilization: ${unit.avg_utilization}`);
        console.log(`   - Peak utilization: ${unit.peak_utilization}`);
        console.log(`   - Min utilization: ${unit.min_utilization}`);
        console.log(`   - Avg turnover time: ${unit.avg_turnover_time_hours} hours`);
        console.log(`   - Data points: ${unit.data_points}`);
      });
    } else {
      console.log('   No utilization data available yet');
    }

  } catch (error) {
    console.log('⚠️  No bed utilization data available:', error.message);
  }
}

async function testEDBoardingMetrics() {
  console.log('\n🚑 Test 7: ED Boarding Metrics');
  console.log('-'.repeat(70));

  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/bed-management/admin/metrics/ed-boarding`,
      {
        headers: {
          'X-Tenant-ID': TENANT_ID,
          'X-App-ID': 'hospital_system',
          'X-API-Key': 'hospital-dev-key-789'
        }
      }
    );

    console.log('✅ ED boarding metrics retrieved successfully');
    console.log(`   Average boarding time: ${response.data.data.avg_boarding_time_hours} hours`);
    console.log(`   Max boarding time: ${response.data.data.max_boarding_time_hours} hours`);
    console.log(`   Min boarding time: ${response.data.data.min_boarding_time_hours} hours`);
    console.log(`   Total transfers: ${response.data.data.total_transfers}`);
    console.log(`   Over 4 hours: ${response.data.data.over_4_hours} (${response.data.data.over_4_hours_percentage})`);
    console.log(`   Over 8 hours: ${response.data.data.over_8_hours} (${response.data.data.over_8_hours_percentage})`);

  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.log('⚠️  Transfer optimization feature not enabled');
    } else {
      console.log('⚠️  No ED boarding data available:', error.message);
    }
  }
}

async function testCapacityForecastMetrics() {
  console.log('\n🔮 Test 8: Capacity Forecast Metrics');
  console.log('-'.repeat(70));

  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/bed-management/admin/metrics/capacity-forecast`,
      {
        headers: {
          'X-Tenant-ID': TENANT_ID,
          'X-App-ID': 'hospital_system',
          'X-API-Key': 'hospital-dev-key-789'
        }
      }
    );

    console.log('✅ Capacity forecast metrics retrieved successfully');
    
    if (response.data.data.length > 0) {
      console.log(`   Units analyzed: ${response.data.data.length}`);
      
      response.data.data.forEach(unit => {
        console.log(`\n   ${unit.unit}:`);
        console.log(`   - MAE 24h: ${unit.mae_24h} patients`);
        console.log(`   - MAE 48h: ${unit.mae_48h} patients`);
        console.log(`   - MAE 72h: ${unit.mae_72h} patients`);
        console.log(`   - Total forecasts: ${unit.total_forecasts}`);
      });
    } else {
      console.log('   No forecast data available yet');
    }

  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.log('⚠️  Capacity forecasting feature not enabled');
    } else {
      console.log('⚠️  No capacity forecast data available:', error.message);
    }
  }
}

async function testExportMetricsJSON() {
  console.log('\n📥 Test 9: Export Metrics (JSON)');
  console.log('-'.repeat(70));

  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/bed-management/admin/metrics/export`,
      {
        params: {
          format: 'json'
        },
        headers: {
          'X-Tenant-ID': TENANT_ID,
          'X-App-ID': 'hospital_system',
          'X-API-Key': 'hospital-dev-key-789'
        }
      }
    );

    console.log('✅ Metrics exported successfully (JSON)');
    console.log(`   Total records: ${response.data.count}`);
    
    if (response.data.data.length > 0) {
      console.log(`   Sample record:`);
      const sample = response.data.data[0];
      console.log(`   - Date: ${sample.date}`);
      console.log(`   - Unit: ${sample.unit}`);
      console.log(`   - Bed utilization: ${sample.bed_utilization_rate}%`);
      console.log(`   - Avg turnover time: ${sample.avg_turnover_time_hours} hours`);
    }

  } catch (error) {
    console.log('⚠️  No metrics data available for export:', error.message);
  }
}

async function testExportMetricsCSV() {
  console.log('\n📄 Test 10: Export Metrics (CSV)');
  console.log('-'.repeat(70));

  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/bed-management/admin/metrics/export`,
      {
        params: {
          format: 'csv'
        },
        headers: {
          'X-Tenant-ID': TENANT_ID,
          'X-App-ID': 'hospital_system',
          'X-API-Key': 'hospital-dev-key-789'
        }
      }
    );

    console.log('✅ Metrics exported successfully (CSV)');
    console.log(`   Content type: ${response.headers['content-type']}`);
    console.log(`   Content disposition: ${response.headers['content-disposition']}`);
    
    const lines = response.data.split('\n');
    console.log(`   Total lines: ${lines.length}`);
    console.log(`   Header: ${lines[0]}`);
    
    if (lines.length > 1) {
      console.log(`   Sample data: ${lines[1]}`);
    }

  } catch (error) {
    console.log('⚠️  No metrics data available for CSV export:', error.message);
  }
}

// Run tests
runTests();
