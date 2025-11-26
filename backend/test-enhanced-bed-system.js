/**
 * Enhanced Bed Management System Test
 * Comprehensive testing of the real-time bed management system
 */

const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

// Configuration
const BASE_URL = 'http://localhost:3000';
const TENANT_ID = 'aajmin_polyclinic';

// Test credentials
const TEST_CREDENTIALS = {
  email: 'mdwasimkrm13@gmail.com',
  password: 'Advanture101'
};

let authToken = '';
let testBedId = null;

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'multitenant_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Helper function to make authenticated API calls
async function apiCall(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': TENANT_ID,
        'X-App-ID': 'hospital-management',
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ API call failed: ${method} ${endpoint}`);
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// Test authentication
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/signin`, TEST_CREDENTIALS);
    
    if (response.data.token) {
      authToken = response.data.token;
      console.log('✅ Authentication successful');
      console.log(`   Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      console.log('❌ Authentication failed - no token received');
      return false;
    }
  } catch (error) {
    console.log('❌ Authentication failed:', error.response?.data?.error || error.message);
    return false;
  }
}

// Test dashboard metrics API
async function testDashboardMetrics() {
  console.log('\n📊 Testing Dashboard Metrics API...');
  
  try {
    const metrics = await apiCall('GET', '/api/bed-management/dashboard/metrics');
    
    console.log('✅ Dashboard metrics retrieved successfully');
    console.log(`   Total beds: ${metrics.occupancy?.total_beds || 0}`);
    console.log(`   Occupied beds: ${metrics.occupancy?.occupied_beds || 0}`);
    console.log(`   Available beds: ${metrics.occupancy?.available_beds || 0}`);
    console.log(`   Occupancy rate: ${metrics.occupancy?.occupancy_rate || 0}%`);
    console.log(`   Departments: ${metrics.departments?.length || 0}`);
    
    return true;
  } catch (error) {
    console.log('❌ Dashboard metrics test failed');
    return false;
  }
}

// Test bed visualization API
async function testBedVisualization() {
  console.log('\n🏥 Testing Bed Visualization API...');
  
  try {
    const visualization = await apiCall('GET', '/api/bed-management/beds/visualization');
    
    console.log('✅ Bed visualization data retrieved successfully');
    console.log(`   Total beds: ${visualization.beds?.length || 0}`);
    console.log(`   Filters applied: ${JSON.stringify(visualization.filters_applied || {})}`);
    
    // Store a test bed ID for later tests
    if (visualization.beds && visualization.beds.length > 0) {
      testBedId = visualization.beds[0].id;
      console.log(`   Test bed ID: ${testBedId}`);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Bed visualization test failed');
    return false;
  }
}

// Test bed assignment creation
async function testBedAssignment() {
  console.log('\n👤 Testing Bed Assignment...');
  
  if (!testBedId) {
    console.log('❌ No test bed available for assignment');
    return false;
  }
  
  try {
    const assignmentData = {
      bed_id: testBedId,
      patient_name: 'Test Patient Enhanced',
      patient_mrn: 'MRN-ENHANCED-001',
      patient_age: 35,
      patient_gender: 'Male',
      admission_date: new Date().toISOString(),
      condition: 'Stable',
      assigned_doctor: 'Dr. Enhanced Test',
      assigned_nurse: 'Nurse Enhanced Test',
      admission_reason: 'Enhanced system verification test',
      notes: 'This is an enhanced bed management test'
    };
    
    const result = await apiCall('POST', '/api/bed-management/assignments', assignmentData);
    
    console.log('✅ Bed assignment created successfully');
    console.log(`   Assignment ID: ${result.assignment?.id}`);
    console.log(`   Patient: ${result.assignment?.patient_name}`);
    
    return true;
    
  } catch (error) {
    console.log('❌ Bed assignment test failed');
    return false;
  }
}

// Test maintenance scheduling
async function testMaintenanceScheduling() {
  console.log('\n🔧 Testing Maintenance Scheduling...');
  
  if (!testBedId) {
    console.log('❌ No test bed available for maintenance');
    return false;
  }
  
  try {
    const maintenanceData = {
      bed_id: testBedId,
      maintenance_type: 'Enhanced Equipment Check',
      priority: 'Low',
      description: 'Enhanced bed management system verification test',
      estimated_duration: 60,
      assigned_technician: 'Enhanced Test Technician',
      equipment_needed: 'Enhanced testing tools',
      safety_precautions: 'Enhanced safety protocols',
      requires_patient_relocation: false
    };
    
    const result = await apiCall('POST', '/api/bed-management/maintenance', maintenanceData);
    
    console.log('✅ Maintenance scheduled successfully');
    console.log(`   Maintenance ID: ${result.maintenance?.id}`);
    console.log(`   Type: ${result.maintenance?.maintenance_type}`);
    
    return true;
    
  } catch (error) {
    console.log('❌ Maintenance scheduling test failed');
    return false;
  }
}

// Test bed history
async function testBedHistory() {
  console.log('\n📋 Testing Bed History...');
  
  if (!testBedId) {
    console.log('❌ No test bed available for history');
    return false;
  }
  
  try {
    const history = await apiCall('GET', `/api/bed-management/history/${testBedId}`);
    
    console.log('✅ Bed history retrieved successfully');
    console.log(`   History entries: ${history.history?.length || 0}`);
    console.log(`   Total entries: ${history.total || 0}`);
    
    return true;
    
  } catch (error) {
    console.log('❌ Bed history test failed');
    return false;
  }
}

// Test occupancy reports
async function testOccupancyReports() {
  console.log('\n📈 Testing Occupancy Reports...');
  
  try {
    const report = await apiCall('GET', '/api/bed-management/reports/occupancy?group_by=daily');
    
    console.log('✅ Occupancy report generated successfully');
    console.log(`   Report type: ${report.report_type}`);
    console.log(`   Average occupancy: ${report.data?.summary?.average_occupancy_rate || 0}%`);
    console.log(`   Trend data points: ${report.data?.trends?.length || 0}`);
    console.log(`   Department breakdown: ${report.data?.department_breakdown?.length || 0}`);
    
    return true;
    
  } catch (error) {
    console.log('❌ Occupancy reports test failed');
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Enhanced Bed Management System Test Suite');
  console.log('='.repeat(50));
  
  const tests = [
    { name: 'Authentication', fn: testAuthentication },
    { name: 'Dashboard Metrics', fn: testDashboardMetrics },
    { name: 'Bed Visualization', fn: testBedVisualization },
    { name: 'Bed Assignment', fn: testBedAssignment },
    { name: 'Maintenance Scheduling', fn: testMaintenanceScheduling },
    { name: 'Bed History', fn: testBedHistory },
    { name: 'Occupancy Reports', fn: testOccupancyReports }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ Test ${test.name} threw an error:`, error.message);
      failed++;
    }
  }
  
  // Final results
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Enhanced Bed Management System is operational.');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the issues above.');
  }
  
  // Close database connection
  await pool.end();
  
  process.exit(failed === 0 ? 0 : 1);
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});