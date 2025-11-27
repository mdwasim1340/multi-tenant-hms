#!/usr/bin/env node

/**
 * Test Bed Creation Authentication
 * 
 * This script simulates the exact bed creation request to identify
 * where the Cognito authentication error is occurring.
 */

const axios = require('axios');

console.log('🔍 Testing Bed Creation Authentication Flow...\n');

const BASE_URL = 'http://localhost:3000';
const TEST_TENANT_ID = 'aajmin_polyclinic';

async function testBedCreationWithMockToken() {
  console.log('1. Testing bed creation with mock token...');
  
  const bedData = {
    bed_number: 'TEST-001',
    department_id: 3,
    bed_type: 'Standard',
    floor_number: '1',
    room_number: '101',
    wing: 'A',
    features: {
      equipment: ['Monitor', 'IV Stand'],
      features: ['Adjustable Height']
    },
    notes: 'Test bed creation'
  };
  
  try {
    const response = await axios.post(`${BASE_URL}/api/beds`, bedData, {
      headers: {
        'Authorization': 'Bearer mock-jwt-token',
        'X-Tenant-ID': TEST_TENANT_ID,
        'X-App-ID': 'hospital_system',
        'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-123',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   ❌ ERROR: Bed creation succeeded with mock token!');
    console.log('   Response:', response.data);
  } catch (error) {
    console.log(`   ✓ Bed creation properly rejected: ${error.response?.status}`);
    console.log(`   ✓ Error message: ${error.response?.data?.error || error.response?.data?.message}`);
    
    // Check if this is the Cognito error we're seeing
    if (error.response?.data?.message?.includes('Invalid token')) {
      console.log('   ✓ This is the expected JWT validation error');
    }
  }
}

async function testMiddlewareChain() {
  console.log('\n2. Testing middleware chain...');
  
  // Test each middleware step
  const middlewareTests = [
    {
      name: 'App Auth Middleware',
      headers: {
        'X-App-ID': 'hospital_system',
        'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-123'
      }
    },
    {
      name: 'Tenant Middleware',
      headers: {
        'X-Tenant-ID': TEST_TENANT_ID,
        'X-App-ID': 'hospital_system',
        'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-123'
      }
    },
    {
      name: 'Hospital Auth Middleware',
      headers: {
        'Authorization': 'Bearer mock-jwt-token',
        'X-Tenant-ID': TEST_TENANT_ID,
        'X-App-ID': 'hospital_system',
        'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-123'
      }
    }
  ];
  
  for (const test of middlewareTests) {
    console.log(`   Testing ${test.name}...`);
    try {
      await axios.get(`${BASE_URL}/api/beds`, { headers: test.headers });
      console.log(`   ❌ ${test.name}: Unexpected success`);
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.error || error.response?.data?.message;
      console.log(`   ✓ ${test.name}: ${status} - ${message}`);
    }
  }
}

async function simulateRealRequest() {
  console.log('\n3. Simulating real frontend request...');
  
  console.log('   💡 To test with a real token:');
  console.log('   1. Open browser dev tools on the hospital management system');
  console.log('   2. Go to Application > Cookies');
  console.log('   3. Copy the "token" value');
  console.log('   4. Set it as REAL_TOKEN environment variable');
  console.log('   5. Run: REAL_TOKEN=your_token_here node test-bed-creation-auth.js');
  
  const realToken = process.env.REAL_TOKEN;
  
  if (realToken) {
    console.log('   ✓ Real token provided, testing...');
    
    const bedData = {
      bed_number: 'REAL-TEST-001',
      department_id: 3,
      bed_type: 'Standard',
      floor_number: '1',
      room_number: '102',
      wing: 'A',
      features: {
        equipment: ['Monitor'],
        features: ['Adjustable Height']
      },
      notes: 'Real token test'
    };
    
    try {
      const response = await axios.post(`${BASE_URL}/api/beds`, bedData, {
        headers: {
          'Authorization': `Bearer ${realToken}`,
          'X-Tenant-ID': TEST_TENANT_ID,
          'X-App-ID': 'hospital_system',
          'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-123',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('   ✅ SUCCESS: Bed created with real token!');
      console.log('   Response:', response.data);
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.data?.error || error.response?.data?.message}`);
      
      // Log the full error for debugging
      if (error.response?.data) {
        console.log('   Full error response:', JSON.stringify(error.response.data, null, 2));
      }
    }
  } else {
    console.log('   ⚠️  No real token provided');
  }
}

async function checkBackendLogs() {
  console.log('\n4. Backend Log Analysis...');
  
  console.log('   📋 The Cognito error in your backend logs suggests:');
  console.log('   - The error occurs during JWT token validation');
  console.log('   - The hospitalAuthMiddleware is trying to validate the token');
  console.log('   - The JWT verification process is calling Cognito');
  console.log('   - The token might be expired, malformed, or from wrong user pool');
  
  console.log('\n   🔍 To debug further:');
  console.log('   1. Check if the user is properly logged in');
  console.log('   2. Verify the JWT token in browser cookies');
  console.log('   3. Check if the token is being sent correctly');
  console.log('   4. Verify the user exists in the Cognito User Pool');
  console.log('   5. Check if the token is expired');
}

async function main() {
  console.log('🚀 Starting Bed Creation Authentication Test\n');
  
  await testBedCreationWithMockToken();
  await testMiddlewareChain();
  await simulateRealRequest();
  await checkBackendLogs();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Test completed');
  console.log('💡 Next steps:');
  console.log('   1. Login to the frontend application');
  console.log('   2. Copy the JWT token from browser cookies');
  console.log('   3. Run: REAL_TOKEN=your_token node test-bed-creation-auth.js');
  console.log('   4. This will help identify if the token is the issue');
  console.log('='.repeat(60));
}

// Load environment variables
require('dotenv').config();

// Run the test
main().catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});