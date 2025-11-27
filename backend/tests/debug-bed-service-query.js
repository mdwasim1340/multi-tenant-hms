#!/usr/bin/env node

/**
 * Debug script to test the bed service query issue
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000';
const TENANT_ID = 'aajmin_polyclinic';
const TEST_EMAIL = 'mdwasimkrm13@gmail.com';
const TEST_PASSWORD = 'Advanture101$';

async function debugBedServiceQuery() {
  console.log('🔍 Debugging Bed Service Query Issue...\n');

  try {
    // Step 1: Authenticate
    console.log('1. Authenticating...');
    const authResponse = await axios.post(`${API_BASE}/auth/signin`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    const token = authResponse.data.token;
    console.log('✅ Authentication successful\n');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'X-Tenant-ID': TENANT_ID,
      'X-App-ID': 'hospital_system',
      'X-API-Key': 'hospital-dev-key-123',
      'Content-Type': 'application/json'
    };

    // Step 2: Test simple bed query with minimal parameters
    console.log('2. Testing simple bed query...');
    try {
      const simpleResponse = await axios.get(`${API_BASE}/api/bed-management/beds?page=1&limit=5`, {
        headers
      });
      console.log('✅ Simple query successful');
      console.log(`Found ${simpleResponse.data.beds?.length || 0} beds`);
    } catch (error) {
      console.log('❌ Simple query failed:', error.response?.data || error.message);
    }

    // Step 3: Test with search parameter
    console.log('\n3. Testing with search parameter...');
    try {
      const searchResponse = await axios.get(`${API_BASE}/api/bed-management/beds?search=TEST`, {
        headers
      });
      console.log('✅ Search query successful');
      console.log(`Found ${searchResponse.data.beds?.length || 0} beds`);
    } catch (error) {
      console.log('❌ Search query failed:', error.response?.data || error.message);
    }

    // Step 4: Test with unit filter
    console.log('\n4. Testing with unit filter...');
    try {
      const unitResponse = await axios.get(`${API_BASE}/api/bed-management/beds?unit=ICU`, {
        headers
      });
      console.log('✅ Unit filter query successful');
      console.log(`Found ${unitResponse.data.beds?.length || 0} beds`);
    } catch (error) {
      console.log('❌ Unit filter query failed:', error.response?.data || error.message);
    }

    // Step 5: Test with status filter
    console.log('\n5. Testing with status filter...');
    try {
      const statusResponse = await axios.get(`${API_BASE}/api/bed-management/beds?status=available`, {
        headers
      });
      console.log('✅ Status filter query successful');
      console.log(`Found ${statusResponse.data.beds?.length || 0} beds`);
    } catch (error) {
      console.log('❌ Status filter query failed:', error.response?.data || error.message);
    }

    // Step 6: Test with multiple parameters
    console.log('\n6. Testing with multiple parameters...');
    try {
      const multiResponse = await axios.get(`${API_BASE}/api/bed-management/beds?page=1&limit=10&status=available&unit=ICU`, {
        headers
      });
      console.log('✅ Multi-parameter query successful');
      console.log(`Found ${multiResponse.data.beds?.length || 0} beds`);
    } catch (error) {
      console.log('❌ Multi-parameter query failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Error during debugging:', error.response?.data || error.message);
  }
}

// Run the debug
debugBedServiceQuery();