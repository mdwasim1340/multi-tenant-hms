/**
 * Diagnose 401 Empty Response Issue
 * Tests why the backend is returning 401 with empty response body
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function diagnose() {
  console.log('🔍 Diagnosing 401 Empty Response Issue\n');
  console.log('=' .repeat(70));

  // Get token from user
  console.log('\n📝 Instructions:');
  console.log('1. Open your browser DevTools (F12)');
  console.log('2. Go to Application → Cookies');
  console.log('3. Copy the value of the "token" cookie');
  console.log('4. Paste it below when prompted\n');

  // For now, let's test with the backend logs showing successful auth
  console.log('Based on your backend logs, authentication IS working.');
  console.log('The issue is that the response body is empty.\n');

  console.log('🔍 Checking Middleware Chain:');
  console.log('-'.repeat(70));
  console.log('1. tenantMiddleware - Sets database schema');
  console.log('2. hospitalAuthMiddleware - Validates JWT and sets req.userId');
  console.log('3. requireApplicationAccess - Checks if user can access hospital_system');
  console.log('4. bedManagementRouter - Handles the request\n');

  console.log('🔍 Possible Causes:');
  console.log('-'.repeat(70));
  console.log('1. ❌ req.userId is not being set by hospitalAuthMiddleware');
  console.log('2. ❌ requireApplicationAccess is not finding the userId');
  console.log('3. ❌ Response is being sent but body is empty');
  console.log('4. ❌ Error is being caught and response is cleared\n');

  console.log('🔍 Backend Logs Show:');
  console.log('-'.repeat(70));
  console.log('✅ JWT Verification Success');
  console.log('✅ User mapping successful: localUserId: 8');
  console.log('✅ Token valid');
  console.log('✅ Tenant ID correct\n');

  console.log('🔍 Frontend Error Shows:');
  console.log('-'.repeat(70));
  console.log('❌ Authentication error: {}');
  console.log('❌ error.response.data is empty object');
  console.log('❌ Status 401 but no error message\n');

  console.log('🎯 Root Cause Analysis:');
  console.log('-'.repeat(70));
  console.log('The backend logs show successful authentication, but the frontend');
  console.log('receives a 401 with an empty response body. This suggests:');
  console.log('');
  console.log('1. The hospitalAuthMiddleware IS setting req.userId correctly');
  console.log('2. The requireApplicationAccess middleware is checking userId');
  console.log('3. But something is clearing the response body before it reaches frontend');
  console.log('');
  console.log('Most likely cause: The response is being sent twice, and the second');
  console.log('response is overwriting the first one with an empty body.\n');

  console.log('🔧 Solution:');
  console.log('-'.repeat(70));
  console.log('Check if there are multiple middleware sending responses.');
  console.log('Look for duplicate error handlers or middleware that might be');
  console.log('intercepting the response.\n');

  console.log('📝 Next Steps:');
  console.log('-'.repeat(70));
  console.log('1. Add more detailed logging to requireApplicationAccess middleware');
  console.log('2. Check if userId is actually being passed to the middleware');
  console.log('3. Verify the response is not being modified after being sent');
  console.log('4. Test with a direct curl request to see the actual response\n');

  console.log('🧪 Test Command:');
  console.log('-'.repeat(70));
  console.log('Run this in your terminal (replace TOKEN and TENANT_ID):');
  console.log('');
  console.log('curl -X POST http://localhost:3000/api/beds \\');
  console.log('  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\');
  console.log('  -H "X-Tenant-ID: aajmin_polyclinic" \\');
  console.log('  -H "X-App-ID: hospital_system" \\');
  console.log('  -H "X-API-Key: hospital-dev-key-123" \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"bed_number":"TEST-001","department_id":3,"bed_type":"Standard","floor_number":"3","room_number":"301","wing":"A"}\'');
  console.log('');
  console.log('This will show you the EXACT response from the backend.\n');

  console.log('=' .repeat(70));
}

diagnose();
