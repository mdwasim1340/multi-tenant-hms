#!/usr/bin/env node

/**
 * Diagnostic Script: Bed Management Authentication Issue
 * 
 * This script helps diagnose the Cognito authentication error that occurs
 * when trying to add a new bed.
 */

const axios = require('axios');
const fs = require('fs');

console.log('🔍 Diagnosing Bed Management Authentication Issue...\n');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_TENANT_ID = 'aajmin_polyclinic';

async function testAuthenticationFlow() {
  console.log('1. Testing Authentication Flow...');
  
  try {
    // Test 1: Check if backend is running
    console.log('   ✓ Testing backend connectivity...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log(`   ✓ Backend is running: ${healthResponse.data.status}`);
    
    // Test 2: Try to access bed endpoint without authentication
    console.log('   ✓ Testing bed endpoint without auth (should fail)...');
    try {
      await axios.get(`${BASE_URL}/api/beds`);
      console.log('   ❌ ERROR: Bed endpoint accessible without auth!');
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('   ✓ Bed endpoint properly protected');
      } else {
        console.log(`   ⚠️  Unexpected error: ${error.response?.status} - ${error.response?.data?.error}`);
      }
    }
    
    // Test 3: Try to access bed endpoint with invalid token
    console.log('   ✓ Testing bed endpoint with invalid token...');
    try {
      await axios.get(`${BASE_URL}/api/beds`, {
        headers: {
          'Authorization': 'Bearer invalid-token',
          'X-Tenant-ID': TEST_TENANT_ID,
          'X-App-ID': 'hospital_system',
          'X-API-Key': process.env.HOSPITAL_APP_API_KEY || 'hospital-dev-key-123'
        }
      });
      console.log('   ❌ ERROR: Bed endpoint accessible with invalid token!');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ✓ Invalid token properly rejected');
      } else {
        console.log(`   ⚠️  Unexpected error: ${error.response?.status} - ${error.response?.data?.error}`);
      }
    }
    
  } catch (error) {
    console.log(`   ❌ Backend connectivity test failed: ${error.message}`);
    return false;
  }
  
  return true;
}

async function testCognitoConfiguration() {
  console.log('\n2. Testing Cognito Configuration...');
  
  const requiredEnvVars = [
    'AWS_REGION',
    'COGNITO_USER_POOL_ID',
    'COGNITO_CLIENT_ID'
  ];
  
  let allConfigured = true;
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`   ✓ ${envVar}: ${process.env[envVar]}`);
    } else {
      console.log(`   ❌ ${envVar}: NOT SET`);
      allConfigured = false;
    }
  }
  
  if (!allConfigured) {
    console.log('   ❌ Missing required Cognito configuration');
    return false;
  }
  
  // Test JWKS endpoint
  try {
    console.log('   ✓ Testing JWKS endpoint...');
    const jwksUrl = `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`;
    const response = await axios.get(jwksUrl);
    
    if (response.data && response.data.keys && response.data.keys.length > 0) {
      console.log(`   ✓ JWKS endpoint accessible, ${response.data.keys.length} keys found`);
    } else {
      console.log('   ❌ JWKS endpoint returned invalid data');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ JWKS endpoint test failed: ${error.message}`);
    return false;
  }
  
  return true;
}

async function testTokenValidation() {
  console.log('\n3. Testing Token Validation Process...');
  
  // This would require a valid token to test properly
  console.log('   ⚠️  Token validation test requires a valid JWT token');
  console.log('   💡 To test this manually:');
  console.log('      1. Login to the frontend application');
  console.log('      2. Open browser dev tools');
  console.log('      3. Check cookies for "token" value');
  console.log('      4. Use that token to test API calls');
  
  return true;
}

async function analyzeErrorPattern() {
  console.log('\n4. Analyzing Error Pattern...');
  
  console.log('   📋 Error Analysis:');
  console.log('      - Error: "NotAuthorizedException: Incorrect username or password"');
  console.log('      - This suggests a Cognito authentication call is being made');
  console.log('      - The error occurs during bed creation, not during login');
  console.log('      - This indicates the JWT token validation process is triggering the error');
  
  console.log('\n   🔍 Possible Causes:');
  console.log('      1. JWT token is expired or invalid');
  console.log('      2. Cognito User Pool configuration mismatch');
  console.log('      3. JWKS keys are not properly cached/fetched');
  console.log('      4. Token format or structure is incorrect');
  console.log('      5. User does not exist in Cognito User Pool');
  
  console.log('\n   💡 Recommended Solutions:');
  console.log('      1. Check if user is properly logged in with valid session');
  console.log('      2. Verify Cognito User Pool settings');
  console.log('      3. Check if JWT token is being sent correctly from frontend');
  console.log('      4. Verify JWKS endpoint is accessible');
  console.log('      5. Check if user exists in the correct Cognito User Pool');
  
  return true;
}

async function generateDiagnosticReport() {
  console.log('\n5. Generating Diagnostic Report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    issue: 'Bed Management Authentication Error',
    error: 'NotAuthorizedException: Incorrect username or password',
    context: 'Error occurs when trying to add a new bed after filling form',
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      awsRegion: process.env.AWS_REGION || 'NOT SET',
      cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID || 'NOT SET',
      cognitoClientId: process.env.COGNITO_CLIENT_ID || 'NOT SET'
    },
    recommendations: [
      'Verify user is properly authenticated in frontend',
      'Check JWT token validity and expiration',
      'Verify Cognito User Pool configuration',
      'Test JWKS endpoint accessibility',
      'Check if user exists in Cognito User Pool',
      'Verify middleware chain is working correctly'
    ]
  };
  
  const reportPath = './bed-auth-diagnostic-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`   ✓ Diagnostic report saved to: ${reportPath}`);
  
  return true;
}

async function main() {
  console.log('🚀 Starting Bed Management Authentication Diagnosis\n');
  
  const tests = [
    testAuthenticationFlow,
    testCognitoConfiguration,
    testTokenValidation,
    analyzeErrorPattern,
    generateDiagnosticReport
  ];
  
  let allPassed = true;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (!result) {
        allPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ Test failed: ${error.message}`);
      allPassed = false;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ Diagnosis completed successfully');
    console.log('💡 Check the recommendations in the diagnostic report');
  } else {
    console.log('❌ Some tests failed - check the output above');
    console.log('🔧 Fix the identified issues and run the diagnosis again');
  }
  console.log('='.repeat(60));
}

// Load environment variables
require('dotenv').config();

// Run the diagnostic
main().catch(error => {
  console.error('❌ Diagnostic script failed:', error);
  process.exit(1);
});