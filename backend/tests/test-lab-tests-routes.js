#!/usr/bin/env node

/**
 * Lab Tests Routes Registration Test
 * 
 * Verifies that all lab tests routes are properly registered
 */

const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TENANT_ID = 'demo_hospital_001';

// Test configuration
const config = {
  headers: {
    'X-Tenant-ID': TENANT_ID,
    'X-App-ID': 'hospital_system',
    'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-123'
  }
};

async function testRouteRegistration() {
  console.log('🧪 Lab Tests Routes Registration Test');
  console.log('=====================================\n');

  let passedTests = 0;
  let failedTests = 0;

  const routes = [
    // Lab Tests Routes
    { method: 'GET', path: '/api/lab-tests', name: 'List lab tests' },
    { method: 'GET', path: '/api/lab-tests/categories', name: 'Get test categories' },
    { method: 'GET', path: '/api/lab-tests/specimen-types', name: 'Get specimen types' },
    { method: 'GET', path: '/api/lab-tests/1', name: 'Get lab test by ID' },
    
    // Lab Orders Routes
    { method: 'GET', path: '/api/lab-orders', name: 'List lab orders' },
    { method: 'GET', path: '/api/lab-orders/statistics', name: 'Get order statistics' },
    { method: 'GET', path: '/api/lab-orders/patient/1', name: 'Get orders by patient' },
    { method: 'GET', path: '/api/lab-orders/1', name: 'Get lab order by ID' },
    
    // Lab Results Routes
    { method: 'GET', path: '/api/lab-results', name: 'List lab results' },
    { method: 'GET', path: '/api/lab-results/abnormal', name: 'Get abnormal results' },
    { method: 'GET', path: '/api/lab-results/critical', name: 'Get critical results' },
    { method: 'GET', path: '/api/lab-results/statistics', name: 'Get result statistics' },
    { method: 'GET', path: '/api/lab-results/history/1', name: 'Get result history' },
    { method: 'GET', path: '/api/lab-results/order/1', name: 'Get results by order' },
    { method: 'GET', path: '/api/lab-results/1', name: 'Get lab result by ID' }
  ];

  console.log(`Testing ${routes.length} routes...\n`);

  for (const route of routes) {
    try {
      const response = await axios({
        method: route.method,
        url: `${BASE_URL}${route.path}`,
        ...config,
        validateStatus: () => true // Accept any status code
      });

      // Route is registered if we don't get 404
      if (response.status !== 404) {
        console.log(`✅ ${route.method} ${route.path} - ${route.name}`);
        console.log(`   Status: ${response.status}`);
        passedTests++;
      } else {
        console.log(`❌ ${route.method} ${route.path} - ${route.name}`);
        console.log(`   Status: 404 (Route not found)`);
        failedTests++;
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`❌ ${route.method} ${route.path} - ${route.name}`);
        console.log(`   Error: Cannot connect to server at ${BASE_URL}`);
        failedTests++;
      } else {
        console.log(`❌ ${route.method} ${route.path} - ${route.name}`);
        console.log(`   Error: ${error.message}`);
        failedTests++;
      }
    }
  }

  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`Total routes tested: ${routes.length}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`Success rate: ${((passedTests / routes.length) * 100).toFixed(1)}%`);

  if (failedTests === 0) {
    console.log('\n🎉 All routes are properly registered!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some routes are not registered correctly.');
    process.exit(1);
  }
}

// Run the test
testRouteRegistration().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
