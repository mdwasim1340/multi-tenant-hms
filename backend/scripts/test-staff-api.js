/**
 * Test Staff Management API
 * Team: Delta
 * Purpose: Verify staff management endpoints are working
 */

const axios = require('axios');
require('dotenv').config();

const API_BASE = 'http://localhost:3000';
const TENANT_ID = 'aajmin_polyclinic';

// Test credentials (you'll need to use actual credentials)
const TEST_EMAIL = 'admin@aajmin.com';
const TEST_PASSWORD = 'Admin@123';

let authToken = null;

async function signin() {
  try {
    console.log('🔐 Signing in...');
    const response = await axios.post(`${API_BASE}/auth/signin`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    authToken = response.data.token;
    console.log('✅ Signed in successfully\n');
    return true;
  } catch (error) {
    console.error('❌ Signin failed:', error.response?.data || error.message);
    return false;
  }
}

async function testGetStaff() {
  try {
    console.log('📋 Testing GET /api/staff...');
    const response = await axios.get(`${API_BASE}/api/staff`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': TENANT_ID,
        'X-App-ID': 'hospital_system',
        'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-789'
      }
    });
    
    console.log(`✅ GET /api/staff successful`);
    console.log(`   Staff count: ${response.data.staff?.length || 0}`);
    console.log(`   Total: ${response.data.total || 0}\n`);
    return true;
  } catch (error) {
    console.error('❌ GET /api/staff failed:', error.response?.data || error.message);
    return false;
  }
}

async function testCreateStaff() {
  try {
    console.log('➕ Testing POST /api/staff...');
    
    const staffData = {
      name: 'Dr. John Smith',
      email: `test.staff.${Date.now()}@hospital.com`,
      employee_id: `EMP${Date.now()}`,
      department: 'Cardiology',
      specialization: 'Cardiologist',
      hire_date: '2025-01-01',
      employment_type: 'full-time',
      phone: '+1234567890',
      role: 'Doctor'
    };
    
    const response = await axios.post(`${API_BASE}/api/staff`, staffData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': TENANT_ID,
        'X-App-ID': 'hospital_system',
        'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-789',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ POST /api/staff successful');
    console.log(`   Created staff: ${response.data.staff?.name || 'Unknown'}`);
    console.log(`   Employee ID: ${response.data.staff?.employee_id || 'Unknown'}`);
    console.log(`   User account created: ${response.data.user ? 'Yes' : 'No'}\n`);
    
    return response.data.staff?.id;
  } catch (error) {
    console.error('❌ POST /api/staff failed:', error.response?.data || error.message);
    return null;
  }
}

async function testGetStaffById(staffId) {
  try {
    console.log(`🔍 Testing GET /api/staff/${staffId}...`);
    const response = await axios.get(`${API_BASE}/api/staff/${staffId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': TENANT_ID,
        'X-App-ID': 'hospital_system',
        'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-789'
      }
    });
    
    console.log('✅ GET /api/staff/:id successful');
    console.log(`   Staff: ${response.data.name || 'Unknown'}`);
    console.log(`   Department: ${response.data.department || 'Unknown'}\n`);
    return true;
  } catch (error) {
    console.error(`❌ GET /api/staff/${staffId} failed:`, error.response?.data || error.message);
    return false;
  }
}

async function testUpdateStaff(staffId) {
  try {
    console.log(`✏️  Testing PUT /api/staff/${staffId}...`);
    
    const updateData = {
      department: 'Emergency Medicine',
      specialization: 'Emergency Physician'
    };
    
    const response = await axios.put(`${API_BASE}/api/staff/${staffId}`, updateData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-ID': TENANT_ID,
        'X-App-ID': 'hospital_system',
        'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-789',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ PUT /api/staff/:id successful');
    console.log(`   Updated department: ${response.data.staff?.department || 'Unknown'}\n`);
    return true;
  } catch (error) {
    console.error(`❌ PUT /api/staff/${staffId} failed:`, error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Staff Management API Tests\n');
  console.log('='.repeat(60));
  console.log('Test Configuration:');
  console.log('='.repeat(60));
  console.log(`API Base: ${API_BASE}`);
  console.log(`Tenant ID: ${TENANT_ID}`);
  console.log(`Test Email: ${TEST_EMAIL}`);
  console.log('='.repeat(60));
  console.log('');

  let results = {
    signin: false,
    getStaff: false,
    createStaff: false,
    getStaffById: false,
    updateStaff: false
  };

  // Test 1: Sign in
  results.signin = await signin();
  if (!results.signin) {
    console.log('\n❌ Cannot proceed without authentication');
    return results;
  }

  // Test 2: Get staff list
  results.getStaff = await testGetStaff();

  // Test 3: Create staff
  const staffId = await testCreateStaff();
  results.createStaff = staffId !== null;

  if (staffId) {
    // Test 4: Get staff by ID
    results.getStaffById = await testGetStaffById(staffId);

    // Test 5: Update staff
    results.updateStaff = await testUpdateStaff(staffId);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary:');
  console.log('='.repeat(60));
  console.log(`✅ Sign In:           ${results.signin ? 'PASS' : 'FAIL'}`);
  console.log(`✅ GET /api/staff:    ${results.getStaff ? 'PASS' : 'FAIL'}`);
  console.log(`✅ POST /api/staff:   ${results.createStaff ? 'PASS' : 'FAIL'}`);
  console.log(`✅ GET /api/staff/:id: ${results.getStaffById ? 'PASS' : 'FAIL'}`);
  console.log(`✅ PUT /api/staff/:id: ${results.updateStaff ? 'PASS' : 'FAIL'}`);
  console.log('='.repeat(60));

  const passCount = Object.values(results).filter(r => r).length;
  const totalCount = Object.keys(results).length;
  const percentage = Math.round((passCount / totalCount) * 100);

  console.log(`\n🎯 Overall: ${passCount}/${totalCount} tests passed (${percentage}%)\n`);

  if (percentage === 100) {
    console.log('🎉 All tests passed! Staff Management API is fully operational!\n');
  } else if (percentage >= 80) {
    console.log('✅ Most tests passed. Staff Management API is mostly operational.\n');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.\n');
  }

  return results;
}

// Run tests
runTests()
  .then(() => {
    console.log('✅ Test suite completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });
