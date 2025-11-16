/**
 * Medical Records Routes Registration Test
 * Verifies that all routes are properly registered
 * 
 * Run: node tests/test-medical-records-routes.js
 */

require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';

const results = {
  total: 0,
  passed: 0,
  failed: 0
};

function logTest(name, passed, message = '') {
  results.total++;
  if (passed) {
    results.passed++;
    console.log(`✅ ${name}`);
  } else {
    results.failed++;
    console.log(`❌ ${name}`);
    if (message) console.log(`   ${message}`);
  }
}

async function testRouteRegistration() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Medical Records Routes Registration Test              ║');
  console.log('║     Verifying all 11 endpoints are registered            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const routes = [
    { method: 'GET', path: '/api/medical-records', name: 'List records' },
    { method: 'POST', path: '/api/medical-records', name: 'Create record' },
    { method: 'GET', path: '/api/medical-records/1', name: 'Get record by ID' },
    { method: 'PUT', path: '/api/medical-records/1', name: 'Update record' },
    { method: 'DELETE', path: '/api/medical-records/1', name: 'Delete record' },
    { method: 'POST', path: '/api/medical-records/upload-url', name: 'Request upload URL' },
    { method: 'GET', path: '/api/medical-records/download-url/test', name: 'Get download URL' },
    { method: 'POST', path: '/api/medical-records/1/attachments', name: 'Attach file' },
    { method: 'GET', path: '/api/medical-records/1/attachments', name: 'Get attachments' },
    { method: 'POST', path: '/api/medical-records/1/finalize', name: 'Finalize record' },
  ];

  console.log('Testing route registration (expecting 401/403 for auth):\n');

  for (const route of routes) {
    try {
      const config = {
        method: route.method.toLowerCase(),
        url: `${API_URL}${route.path}`,
        validateStatus: () => true // Don't throw on any status
      };

      const response = await axios(config);
      
      // We expect 401 (unauthorized) or 403 (forbidden) if route exists
      // 404 means route doesn't exist
      if (response.status === 404) {
        logTest(route.name, false, `Route not found: ${route.method} ${route.path}`);
      } else if (response.status === 401 || response.status === 403) {
        logTest(route.name, true, `Route registered (${response.status})`);
      } else {
        logTest(route.name, true, `Route registered (${response.status})`);
      }
    } catch (error) {
      logTest(route.name, false, error.message);
    }
  }

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    TEST SUMMARY                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nTotal Routes: ${results.total}`);
  console.log(`✅ Registered: ${results.passed}`);
  console.log(`❌ Missing: ${results.failed}`);
  console.log(`📊 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

  if (results.failed === 0) {
    console.log('\n🎉 All routes are properly registered!');
  } else {
    console.log('\n⚠️ Some routes are missing. Check the output above.');
  }

  process.exit(results.failed === 0 ? 0 : 1);
}

testRouteRegistration().catch(error => {
  console.error('\n💥 Test error:', error);
  process.exit(1);
});
