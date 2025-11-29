/**
 * Simple Bed Management Endpoints Test
 * Tests basic endpoint availability
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(name, url) {
  try {
    const response = await axios.get(`${BASE_URL}${url}`, {
      headers: {
        'X-Tenant-ID': 'tenant_1762083064503',
        'X-App-ID': 'hospital-management',
        'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-123'
      }
    });
    console.log(`✅ ${name}: ${response.status}`);
    return true;
  } catch (error) {
    const status = error.response?.status || 'ERROR';
    const message = error.response?.data?.error || error.message;
    console.log(`${status === 401 ? '⚠️' : '❌'} ${name}: ${status} - ${message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Testing Bed Management Endpoints...\n');
  
  // Test health endpoint
  await testEndpoint('Health Check', '/health');
  
  // Test bed management endpoints (will return 400/401 but confirms routes exist)
  await testEndpoint('List Departments', '/api/bed-management/departments');
  await testEndpoint('List Beds', '/api/bed-management/beds');
  await testEndpoint('List Assignments', '/api/bed-management/assignments');
  await testEndpoint('List Transfers', '/api/bed-management/transfers');
  await testEndpoint('Bed Occupancy', '/api/bed-management/occupancy');
  await testEndpoint('Available Beds', '/api/bed-management/available-beds');
  await testEndpoint('AI Features', '/api/bed-management/admin/features');
  
  console.log('\n✅ Endpoint availability test complete!');
  console.log('Note: 400/401 errors are expected without authentication');
}

runTests().catch(error => {
  console.error('Test failed:', error.message);
  process.exit(1);
});
