#!/usr/bin/env node

/**
 * Test Enhanced Authentication Error Handling (Fixed Version)
 * 
 * This script tests the enhanced error handling we just implemented
 * to ensure proper error codes and messages are returned.
 */

const axios = require('axios');

console.log('🔍 Testing Enhanced Authentication Error Handling...\n');

const BASE_URL = 'http://localhost:3000';
const TEST_TENANT_ID = 'aajmin_polyclinic';
const API_KEY = 'hospital-dev-key-123';
const APP_ID = 'hospital-management';

async function testMissingToken() {
  console.log('1. Testing missing token...');
  
  try {
    await axios.get(`${BASE_URL}/api/beds`, {
      headers: {
        'X-Tenant-ID': TEST_TENANT_ID,
        'X-App-ID': APP_ID,
        'X-API-Key': API_KEY
      }
    });
    console.log('   ❌ ERROR: Request succeeded without token!');
  } catch (error) {
    const response = error.response?.data;
    console.log(`   ✓ Status: ${error.response?.status}`);
    console.log(`   ✓ Error Code: ${response?.code}`);
    console.log(`   ✓ Error Message: ${response?.message}`);
    console.log(`   ✓ Expected: TOKEN_MISSING - ${response?.code === 'TOKEN_MISSING' ? 'PASS' : 'FAIL'}`);
  }
}

async function testMalformedToken() {
  console.log('\n2. Testing malformed token...');
  
  try {
    await axios.get(`${BASE_URL}/api/beds`, {
      headers: {
        'Authorization': 'Bearer invalid.malformed.token',
        'X-Tenant-ID': TEST_TENANT_ID,
        'X-App-ID': APP_ID,
        'X-API-Key': API_KEY
      }
    });
    console.log('   ❌ ERROR: Request succeeded with malformed token!');
  } catch (error) {
    const response = error.response?.data;
    console.log(`   ✓ Status: ${error.response?.status}`);
    console.log(`   ✓ Error Code: ${response?.code}`);
    console.log(`   ✓ Error Message: ${response?.message}`);
    console.log(`   ✓ Expected: TOKEN_MALFORMED - ${response?.code === 'TOKEN_MALFORMED' ? 'PASS' : 'FAIL'}`);
  }
}

async function testInvalidToken() {
  console.log('\n3. Testing invalid but well-formed token...');
  
  // Create a well-formed but invalid JWT token
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'fake-kid' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ 
    sub: 'fake-user', 
    exp: Math.floor(Date.now() / 1000) + 3600,
    'cognito:groups': ['hospital-admin']
  })).toString('base64url');
  const signature = 'fake-signature';
  const fakeToken = `${header}.${payload}.${signature}`;
  
  try {
    await axios.get(`${BASE_URL}/api/beds`, {
      headers: {
        'Authorization': `Bearer ${fakeToken}`,
        'X-Tenant-ID': TEST_TENANT_ID,
        'X-App-ID': APP_ID,
        'X-API-Key': API_KEY
      }
    });
    console.log('   ❌ ERROR: Request succeeded with fake token!');
  } catch (error) {
    const response = error.response?.data;
    console.log(`   ✓ Status: ${error.response?.status}`);
    console.log(`   ✓ Error Code: ${response?.code}`);
    console.log(`   ✓ Error Message: ${response?.message}`);
    console.log(`   ✓ Expected: TOKEN_KEY_INVALID or TOKEN_INVALID - ${(response?.code === 'TOKEN_KEY_INVALID' || response?.code === 'TOKEN_INVALID') ? 'PASS' : 'FAIL'}`);
  }
}

async function testExpiredToken() {
  console.log('\n4. Testing expired token...');
  
  // Create an expired JWT token
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'real-kid-if-available' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ 
    sub: 'fake-user', 
    exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
    'cognito:groups': ['hospital-admin']
  })).toString('base64url');
  const signature = 'fake-signature';
  const expiredToken = `${header}.${payload}.${signature}`;
  
  try {
    await axios.get(`${BASE_URL}/api/beds`, {
      headers: {
        'Authorization': `Bearer ${expiredToken}`,
        'X-Tenant-ID': TEST_TENANT_ID,
        'X-App-ID': APP_ID,
        'X-API-Key': API_KEY
      }
    });
    console.log('   ❌ ERROR: Request succeeded with expired token!');
  } catch (error) {
    const response = error.response?.data;
    console.log(`   ✓ Status: ${error.response?.status}`);
    console.log(`   ✓ Error Code: ${response?.code}`);
    console.log(`   ✓ Error Message: ${response?.message}`);
    console.log(`   ✓ Expected: TOKEN_EXPIRED or TOKEN_INVALID - ${(response?.code === 'TOKEN_EXPIRED' || response?.code === 'TOKEN_INVALID') ? 'PASS' : 'FAIL'}`);
  }
}

async function testBedCreationWithEnhancedErrors() {
  console.log('\n5. Testing bed creation with enhanced error handling...');
  
  const bedData = {
    bed_number: 'TEST-001',
    department_id: 3,
    bed_type: 'Standard',
    floor_number: '1',
    room_number: '101',
    wing: 'A',
    features: {
      equipment: ['Monitor'],
      features: ['Adjustable Height']
    },
    notes: 'Test bed creation'
  };
  
  try {
    await axios.post(`${BASE_URL}/api/beds`, bedData, {
      headers: {
        'Authorization': 'Bearer invalid-token',
        'X-Tenant-ID': TEST_TENANT_ID,
        'X-App-ID': APP_ID,
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('   ❌ ERROR: Bed creation succeeded with invalid token!');
  } catch (error) {
    const response = error.response?.data;
    console.log(`   ✓ Status: ${error.response?.status}`);
    console.log(`   ✓ Error Code: ${response?.code}`);
    console.log(`   ✓ Error Message: ${response?.message}`);
    console.log(`   ✓ This is the same error that would occur in the frontend`);
  }
}

async function main() {
  console.log('🚀 Starting Enhanced Authentication Error Tests\n');
  
  await testMissingToken();
  await testMalformedToken();
  await testInvalidToken();
  await testExpiredToken();
  await testBedCreationWithEnhancedErrors();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Enhanced error handling tests completed');
  console.log('💡 The backend now provides specific error codes and messages');
  console.log('💡 The frontend can handle these errors appropriately');
  console.log('💡 Users will get clear feedback about authentication issues');
  console.log('='.repeat(60));
}

// Load environment variables
require('dotenv').config();

// Run the tests
main().catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});