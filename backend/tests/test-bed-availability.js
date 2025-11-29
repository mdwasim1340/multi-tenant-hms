/**
 * Bed Availability Service - Quick Test
 * 
 * Tests the bed availability checking functionality
 * 
 * Run: node tests/test-bed-availability.js
 */

const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TENANT_ID = process.env.TEST_TENANT_ID || 'aajmin_polyclinic';

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'admin@aajminpolyclinic.com',
  password: process.env.TEST_USER_PASSWORD || 'Admin@123'
};

let authToken = '';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Tenant-ID': TENANT_ID
  }
});

api.interceptors.request.use(config => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

async function authenticate() {
  log('\n🔐 Authenticating...', 'cyan');
  try {
    const response = await axios.post(`${BASE_URL}/auth/signin`, TEST_USER);
    authToken = response.data.token;
    log('✅ Authentication successful', 'green');
    return true;
  } catch (error) {
    log(`❌ Authentication failed: ${error.message}`, 'red');
    return false;
  }
}

async function testBedAvailability() {
  log('\n📊 Testing Bed Availability...', 'cyan');
  
  try {
    // Test 1: Get all available beds
    log('\n1️⃣  Getting all available beds...', 'blue');
    const allAvailable = await api.get('/api/beds/availability');
    log(`   Total Available: ${allAvailable.data.availability.total_available}`, 'green');
    log(`   By Type: ${JSON.stringify(allAvailable.data.availability.by_type, null, 2)}`, 'green');
    
    // Test 2: Filter by bed type
    log('\n2️⃣  Filtering by bed type (ICU)...', 'blue');
    const icuBeds = await api.get('/api/beds/availability', {
      params: { bed_type: 'icu' }
    });
    log(`   ICU Beds Available: ${icuBeds.data.availability.total_available}`, 'green');
    
    // Test 3: Filter by department
    log('\n3️⃣  Getting departments first...', 'blue');
    const departments = await api.get('/api/beds/departments');
    if (departments.data.departments.length > 0) {
      const deptId = departments.data.departments[0].id;
      const deptName = departments.data.departments[0].name;
      
      log(`   Testing with department: ${deptName}`, 'blue');
      const deptBeds = await api.get('/api/beds/availability', {
        params: { department_id: deptId }
      });
      log(`   Available in ${deptName}: ${deptBeds.data.availability.total_available}`, 'green');
    }
    
    // Test 4: Combined filters
    log('\n4️⃣  Testing combined filters (general beds in specific department)...', 'blue');
    if (departments.data.departments.length > 0) {
      const deptId = departments.data.departments[0].id;
      const combined = await api.get('/api/beds/availability', {
        params: {
          department_id: deptId,
          bed_type: 'general'
        }
      });
      log(`   General beds available: ${combined.data.availability.total_available}`, 'green');
    }
    
    // Test 5: Get bed occupancy
    log('\n5️⃣  Getting overall bed occupancy...', 'blue');
    const occupancy = await api.get('/api/beds/occupancy');
    const occ = occupancy.data.occupancy;
    log(`   Total Beds: ${occ.total_beds}`, 'green');
    log(`   Occupied: ${occ.occupied_beds}`, 'green');
    log(`   Available: ${occ.available_beds}`, 'green');
    log(`   Occupancy Rate: ${occ.occupancy_rate}%`, 'green');
    
    log('\n✅ All bed availability tests passed!', 'green');
    return true;
  } catch (error) {
    log(`\n❌ Bed availability test failed: ${error.message}`, 'red');
    if (error.response) {
      log(`   Response: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return false;
  }
}

async function runTests() {
  log('='.repeat(60), 'cyan');
  log('  BED AVAILABILITY SERVICE - QUICK TEST', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`  API: ${BASE_URL}`, 'blue');
  log(`  Tenant: ${TENANT_ID}`, 'blue');
  log('='.repeat(60), 'cyan');
  
  const authSuccess = await authenticate();
  if (!authSuccess) {
    log('\n❌ Cannot proceed without authentication', 'red');
    process.exit(1);
  }
  
  const testSuccess = await testBedAvailability();
  
  log('\n' + '='.repeat(60), 'cyan');
  if (testSuccess) {
    log('  🎉 ALL TESTS PASSED!', 'green');
  } else {
    log('  ⚠️  SOME TESTS FAILED', 'red');
  }
  log('='.repeat(60), 'cyan');
}

runTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
