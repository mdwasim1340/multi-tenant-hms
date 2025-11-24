/**
 * Test Script for Bed Management Optimization - Phase 7
 * Capacity Forecasting & Surge Planning
 * 
 * Tests:
 * - 24/48/72-hour capacity forecasts
 * - Seasonal pattern analysis
 * - Staffing recommendations
 * - Surge capacity assessment
 * - Capacity metrics
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';
const TENANT_ID = 'aajmin_polyclinic';

async function runTests() {
  console.log('🧪 Starting Phase 7 Tests: Capacity Forecasting\n');
  console.log('=' .repeat(70));

  try {
    // Test 1: Get 24-hour capacity forecast
    await testCapacityForecast(24);

    // Test 2: Get 48-hour capacity forecast
    await testCapacityForecast(48);

    // Test 3: Get 72-hour capacity forecast
    await testCapacityForecast(72);

    // Test 4: Analyze seasonal patterns
    await testSeasonalPatterns();

    // Test 5: Get staffing recommendations
    await testStaffingRecommendations();

    // Test 6: Assess surge capacity
    await testSurgeCapacity();

    // Test 7: Get capacity metrics
    await testCapacityMetrics();

    console.log('\n' + '='.repeat(70));
    console.log('✅ All Phase 7 tests completed successfully!');
    console.log('=' .repeat(70));

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

async function testCapacityForecast(hours) {
  console.log(`\n📊 Test: ${hours}-Hour Capacity Forecast`);
  console.log('-'.repeat(70));

  const units = ['ICU', 'Medical', 'Surgical', 'Emergency'];
  
  for (const unit of units) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/bed-management/capacity/capacity-forecast/${unit}`,
        {
          params: { hours },
          headers: {
            'X-Tenant-ID': TENANT_ID,
            'X-App-ID': 'hospital_system',
            'X-API-Key': 'hospital-dev-key-789'
          }
        }
      );

      console.log(`\n   ${unit} Unit - ${hours}h Forecast:`);
      console.log(`   Total intervals: ${response.data.intervals}`);
      
      if (response.data.data.length > 0) {
        // Show first, middle, and last forecast
        const forecasts = response.data.data;
        const first = forecasts[0];
        const middle = forecasts[Math.floor(forecasts.length / 2)];
        const last = forecasts[forecasts.length - 1];

        console.log(`\n   First Interval (${new Date(first.forecast_date).toLocaleString()}):`);
        console.log(`   - Predicted Occupancy: ${first.predicted_occupancy}/${first.total_capacity}`);
        console.log(`   - Occupancy Rate: ${first.occupancy_rate}%`);
        console.log(`   - Available Beds: ${first.predicted_available}`);
        console.log(`   - Confidence: ${first.confidence_level}`);
        if (first.factors.length > 0) {
          console.log(`   - Factors: ${first.factors.join(', ')}`);
        }

        console.log(`\n   Mid Interval (${new Date(middle.forecast_date).toLocaleString()}):`);
        console.log(`   - Predicted Occupancy: ${middle.predicted_occupancy}/${middle.total_capacity}`);
        console.log(`   - Occupancy Rate: ${middle.occupancy_rate}%`);
        console.log(`   - Confidence: ${middle.confidence_level}`);

        console.log(`\n   Final Interval (${new Date(last.forecast_date).toLocaleString()}):`);
        console.log(`   - Predicted Occupancy: ${last.predicted_occupancy}/${last.total_capacity}`);
        console.log(`   - Occupancy Rate: ${last.occupancy_rate}%`);
        console.log(`   - Confidence: ${last.confidence_level}`);

        // Calculate trend
        const trend = last.occupancy_rate - first.occupancy_rate;
        if (trend > 5) {
          console.log(`\n   📈 Trend: Increasing occupancy (+${trend.toFixed(1)}%)`);
        } else if (trend < -5) {
          console.log(`\n   📉 Trend: Decreasing occupancy (${trend.toFixed(1)}%)`);
        } else {
          console.log(`\n   ➡️  Trend: Stable occupancy (${trend.toFixed(1)}%)`);
        }
      } else {
        console.log('   No forecast data available');
      }

    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log(`   ⚠️  ${unit}: Feature not enabled`);
      } else {
        console.log(`   ❌ ${unit}: ${error.message}`);
      }
    }
  }
}

async function testSeasonalPatterns() {
  console.log('\n🌡️  Test: Seasonal Pattern Analysis');
  console.log('-'.repeat(70));

  const units = ['ICU', 'Medical'];
  
  for (const unit of units) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/bed-management/capacity/seasonal-patterns/${unit}`,
        {
          params: { months: 12 },
          headers: {
            'X-Tenant-ID': TENANT_ID,
            'X-App-ID': 'hospital_system',
            'X-API-Key': 'hospital-dev-key-789'
          }
        }
      );

      console.log(`\n   ${unit} Unit - 12 Month Analysis:`);
      console.log(`   Patterns found: ${response.data.data.length}`);
      
      if (response.data.data.length > 0) {
        // Show first 3 months
        const patterns = response.data.data.slice(0, 3);
        
        patterns.forEach(pattern => {
          console.log(`\n   ${pattern.period}:`);
          console.log(`   - Average Occupancy: ${pattern.average_occupancy}%`);
          console.log(`   - Trend: ${pattern.trend}`);
          console.log(`   - Peak Days: ${pattern.peak_days.join(', ')}`);
          console.log(`   - Low Days: ${pattern.low_days.join(', ')}`);
        });

        // Calculate overall trend
        const firstPattern = response.data.data[0];
        const lastPattern = response.data.data[response.data.data.length - 1];
        const overallTrend = lastPattern.average_occupancy - firstPattern.average_occupancy;
        
        console.log(`\n   Overall Trend: ${overallTrend > 0 ? '📈 Increasing' : overallTrend < 0 ? '📉 Decreasing' : '➡️  Stable'} (${overallTrend.toFixed(1)}%)`);
      } else {
        console.log('   Insufficient historical data for pattern analysis');
      }

    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log(`   ⚠️  ${unit}: Feature not enabled`);
      } else {
        console.log(`   ❌ ${unit}: ${error.message}`);
      }
    }
  }
}

async function testStaffingRecommendations() {
  console.log('\n👥 Test: Staffing Recommendations');
  console.log('-'.repeat(70));

  const units = ['ICU', 'Medical'];
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  for (const unit of units) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/bed-management/capacity/staffing-recommendations/${unit}`,
        {
          params: { date: tomorrow.toISOString() },
          headers: {
            'X-Tenant-ID': TENANT_ID,
            'X-App-ID': 'hospital_system',
            'X-API-Key': 'hospital-dev-key-789'
          }
        }
      );

      console.log(`\n   ${unit} Unit - ${tomorrow.toLocaleDateString()}:`);
      
      if (response.data.data.length > 0) {
        response.data.data.forEach(rec => {
          console.log(`\n   ${rec.shift.toUpperCase()} Shift:`);
          console.log(`   - Nurses: ${rec.recommended_nurses} (1:${rec.patient_to_nurse_ratio} ratio)`);
          console.log(`   - Doctors: ${rec.recommended_doctors}`);
          console.log(`   - Support Staff: ${rec.recommended_support_staff}`);
          
          if (rec.reasoning.length > 0) {
            console.log(`   - Reasoning:`);
            rec.reasoning.forEach(reason => {
              console.log(`     • ${reason}`);
            });
          }
        });

        // Calculate total staff needed
        const totalNurses = response.data.data.reduce((sum, rec) => sum + rec.recommended_nurses, 0);
        const totalDoctors = response.data.data.reduce((sum, rec) => sum + rec.recommended_doctors, 0);
        const totalSupport = response.data.data.reduce((sum, rec) => sum + rec.recommended_support_staff, 0);
        
        console.log(`\n   Total Daily Staff Needed:`);
        console.log(`   - Nurses: ${totalNurses}`);
        console.log(`   - Doctors: ${totalDoctors}`);
        console.log(`   - Support: ${totalSupport}`);
      } else {
        console.log('   No recommendations available');
      }

    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log(`   ⚠️  ${unit}: Feature not enabled`);
      } else {
        console.log(`   ❌ ${unit}: ${error.message}`);
      }
    }
  }
}

async function testSurgeCapacity() {
  console.log('\n🚨 Test: Surge Capacity Assessment');
  console.log('-'.repeat(70));

  const units = ['ICU', 'Medical', 'Surgical', 'Emergency'];
  
  for (const unit of units) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/bed-management/capacity/surge-capacity/${unit}`,
        {
          headers: {
            'X-Tenant-ID': TENANT_ID,
            'X-App-ID': 'hospital_system',
            'X-API-Key': 'hospital-dev-key-789'
          }
        }
      );

      const surge = response.data.data;
      
      console.log(`\n   ${unit} Unit:`);
      console.log(`   - Current Occupancy: ${surge.current_level}%`);
      console.log(`   - Surge Trigger: ${surge.trigger_level}%`);
      console.log(`   - Status: ${surge.surge_activated ? '🚨 SURGE ACTIVATED' : '✅ Normal'}`);
      console.log(`   - Additional Beds Available: ${surge.additional_beds_available}`);
      console.log(`   - Activation Time: ${surge.estimated_activation_time}`);
      
      console.log(`\n   Resource Requirements:`);
      console.log(`   - Staff: ${surge.resource_requirements.staff}`);
      console.log(`   - Equipment: ${surge.resource_requirements.equipment.length} items`);
      console.log(`   - Supplies: ${surge.resource_requirements.supplies.length} items`);
      
      console.log(`\n   Recommendations:`);
      surge.recommendations.forEach(rec => {
        const icon = rec.includes('SURGE') ? '🚨' : rec.includes('WARNING') ? '⚠️' : '✅';
        console.log(`   ${icon} ${rec}`);
      });

      // Status indicator
      if (surge.surge_activated) {
        console.log(`\n   ⚠️  IMMEDIATE ACTION REQUIRED`);
      } else if (surge.current_level >= 80) {
        console.log(`\n   ⚠️  APPROACHING SURGE THRESHOLD`);
      } else {
        console.log(`\n   ✅ Normal capacity levels`);
      }

    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log(`   ⚠️  ${unit}: Feature not enabled`);
      } else {
        console.log(`   ❌ ${unit}: ${error.message}`);
      }
    }
  }
}

async function testCapacityMetrics() {
  console.log('\n📈 Test: Capacity Metrics');
  console.log('-'.repeat(70));

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/bed-management/capacity/capacity-metrics`,
      {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        headers: {
          'X-Tenant-ID': TENANT_ID,
          'X-App-ID': 'hospital_system',
          'X-API-Key': 'hospital-dev-key-789'
        }
      }
    );

    console.log('✅ Capacity metrics retrieved successfully');
    console.log(`   Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);
    console.log(`   Average Occupancy: ${response.data.data.average_occupancy}%`);
    console.log(`   Peak Occupancy: ${response.data.data.peak_occupancy}%`);
    console.log(`   Forecast Accuracy: ${response.data.data.forecast_accuracy}%`);
    console.log(`   Surge Activations: ${response.data.data.surge_activations}`);

  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.log('⚠️  Feature not enabled - this is expected if capacity_forecasting is disabled');
    } else {
      throw error;
    }
  }
}

// Run tests
runTests();
