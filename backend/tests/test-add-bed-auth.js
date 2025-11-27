/**
 * Test Script: Diagnose Add Bed Authentication Issue
 * 
 * This script helps diagnose why the add bed operation returns 401
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

async function testAuthentication() {
  console.log('🔍 Diagnosing Add Bed Authentication Issue');
  console.log('═'.repeat(70));

  // Test 1: Check if backend is running
  console.log('\n📡 Test 1: Check Backend Status');
  console.log('─'.repeat(70));
  try {
    const response = await axios.get(`${API_BASE_URL}/`, {
      validateStatus: () => true
    });
    console.log(`✅ Backend is running (Status: ${response.status})`);
  } catch (error) {
    console.log('❌ Backend is not running or not accessible');
    console.log('   Please start the backend: cd backend && npm run dev');
    return;
  }

  // Test 2: Check authentication headers
  console.log('\n🔑 Test 2: Check Required Headers');
  console.log('─'.repeat(70));
  console.log('Required headers for /api/beds POST:');
  console.log('  1. Authorization: Bearer <token>');
  console.log('  2. X-Tenant-ID: <tenant_id>');
  console.log('  3. X-App-ID: hospital_system');
  console.log('  4. X-API-Key: <api_key>');
  console.log('');
  console.log('⚠️  Please check your browser cookies:');
  console.log('  - Open DevTools → Application → Cookies');
  console.log('  - Look for: token, tenant_id');
  console.log('  - If missing, you need to login first');

  // Test 3: Try with missing auth
  console.log('\n🧪 Test 3: Test Without Authentication');
  console.log('─'.repeat(70));
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/beds`,
      {
        bed_number: 'TEST-001',
        department_id: 1,
        bed_type: 'Standard'
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        validateStatus: () => true
      }
    );
    console.log(`Status: ${response.status}`);
    if (response.status === 401) {
      console.log('✅ Expected 401 - Authentication is required');
      console.log(`   Error: ${response.data.error || 'Unauthorized'}`);
    } else {
      console.log('❌ Unexpected status - should be 401');
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }

  // Test 4: Instructions for getting token
  console.log('\n📝 Test 4: How to Get Your Auth Token');
  console.log('─'.repeat(70));
  console.log('1. Login to the hospital management system');
  console.log('2. Open browser DevTools (F12)');
  console.log('3. Go to Console tab');
  console.log('4. Run this command:');
  console.log('   document.cookie.split("; ").find(row => row.startsWith("token="))');
  console.log('5. Copy the token value');
  console.log('6. Also get tenant_id:');
  console.log('   document.cookie.split("; ").find(row => row.startsWith("tenant_id="))');

  // Test 5: Test with environment variables
  console.log('\n🔐 Test 5: Test With Environment Variables');
  console.log('─'.repeat(70));
  
  const token = process.env.TEST_TOKEN;
  const tenantId = process.env.TEST_TENANT_ID || 'aajmin_polyclinic';
  const apiKey = process.env.TEST_API_KEY || 'hospital-dev-key-789';

  if (!token) {
    console.log('⚠️  No TEST_TOKEN environment variable set');
    console.log('   Set it like this:');
    console.log('   TEST_TOKEN=your-token TEST_TENANT_ID=your-tenant node test-add-bed-auth.js');
    console.log('');
    console.log('📋 Summary of Issue:');
    console.log('─'.repeat(70));
    console.log('The 401 error occurs because:');
    console.log('1. The /api/beds endpoint requires authentication');
    console.log('2. Your browser cookies may be missing or expired');
    console.log('3. The token needs to be valid and not expired');
    console.log('');
    console.log('🔧 Solutions:');
    console.log('1. Make sure you are logged in');
    console.log('2. Check if your session has expired');
    console.log('3. Try logging out and logging back in');
    console.log('4. Clear browser cookies and login again');
    return;
  }

  console.log('Testing with provided credentials...');
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/beds`,
      {
        bed_number: 'TEST-001',
        department_id: 1,
        bed_type: 'Standard',
        floor_number: '1',
        room_number: '101',
        wing: 'A'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
          'X-App-ID': 'hospital_system',
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        validateStatus: () => true
      }
    );

    console.log(`Status: ${response.status}`);
    
    if (response.status === 201) {
      console.log('✅ SUCCESS! Bed created successfully');
      console.log('   Response:', JSON.stringify(response.data, null, 2));
    } else if (response.status === 401) {
      console.log('❌ STILL 401 - Token may be invalid or expired');
      console.log('   Error:', response.data.error || 'Unauthorized');
      console.log('');
      console.log('🔧 Try these solutions:');
      console.log('1. Get a fresh token by logging in again');
      console.log('2. Check if the token format is correct (should be a JWT)');
      console.log('3. Verify the tenant_id matches your account');
    } else if (response.status === 400) {
      console.log('⚠️  400 Bad Request - Check your data');
      console.log('   Error:', response.data.error || 'Bad Request');
    } else {
      console.log(`⚠️  Unexpected status: ${response.status}`);
      console.log('   Response:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', JSON.stringify(error.response.data, null, 2));
    }
  }

  console.log('\n═'.repeat(70));
  console.log('📊 Diagnosis Complete');
  console.log('═'.repeat(70));
}

// Run the diagnostic
testAuthentication().catch(error => {
  console.error('Diagnostic failed:', error);
  process.exit(1);
});
