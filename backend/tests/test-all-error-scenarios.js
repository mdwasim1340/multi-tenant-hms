const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

const BACKEND_URL = 'http://localhost:3000';
const TEST_EMAIL = 'noreply@exo.com.np';

// Database connection for managing OTP codes
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

console.log('🔍 TESTING ALL ERROR SCENARIOS');
console.log('==============================');

async function testAllErrorScenarios() {
  try {
    console.log('\n📋 STEP 1: Setup - Request fresh OTP...');
    
    // Clear any existing verification codes
    await pool.query('DELETE FROM user_verification WHERE email = $1 AND type = $2', [TEST_EMAIL, 'reset']);
    
    // Request password reset
    await axios.post(`${BACKEND_URL}/auth/forgot-password`, {
      email: TEST_EMAIL
    }, {
      headers: {
        'X-Tenant-ID': 'admin',
        'Content-Type': 'application/json'
      }
    });
    
    // Get OTP from database
    const otpResult = await pool.query(
      'SELECT code FROM user_verification WHERE email = $1 AND type = $2 ORDER BY created_at DESC LIMIT 1',
      [TEST_EMAIL, 'reset']
    );
    
    const validOTP = otpResult.rows[0].code;
    console.log(`✅ Valid OTP: ${validOTP}`);

    console.log('\n📋 STEP 2: Test all error scenarios...');
    
    const errorScenarios = [
      {
        name: '400 - Invalid OTP Code',
        data: { email: TEST_EMAIL, code: 'INVALID', newPassword: 'StrongPassword123!' },
        expectedStatus: 400,
        expectedMessage: 'Invalid verification code'
      },
      {
        name: '400 - Empty OTP Code',
        data: { email: TEST_EMAIL, code: '', newPassword: 'StrongPassword123!' },
        expectedStatus: 400,
        expectedMessage: 'Invalid'
      },
      {
        name: '400 - Weak Password (too short)',
        data: { email: TEST_EMAIL, code: validOTP, newPassword: '123' },
        expectedStatus: 400,
        expectedMessage: 'Password requirements not met'
      },
      {
        name: '400 - Weak Password (no uppercase)',
        data: { email: TEST_EMAIL, code: validOTP, newPassword: 'password123!' },
        expectedStatus: 400,
        expectedMessage: 'Password requirements not met'
      },
      {
        name: '400 - Weak Password (no special chars)',
        data: { email: TEST_EMAIL, code: validOTP, newPassword: 'Password123' },
        expectedStatus: 400,
        expectedMessage: 'Password requirements not met'
      },
      {
        name: '200 - Valid Request (should work)',
        data: { email: TEST_EMAIL, code: validOTP, newPassword: 'StrongPassword123!' },
        expectedStatus: 200,
        expectedMessage: 'Password reset successfully'
      }
    ];

    for (const scenario of errorScenarios) {
      console.log(`\n🔍 Testing: ${scenario.name}`);
      
      try {
        const response = await axios.post(`${BACKEND_URL}/auth/reset-password`, scenario.data, {
          headers: {
            'X-Tenant-ID': 'admin',
            'Content-Type': 'application/json'
          }
        });
        
        if (scenario.expectedStatus === 200) {
          console.log('✅ SUCCESS (as expected)');
          console.log(`   Status: ${response.status}`);
          console.log(`   Message: ${response.data.message}`);
          break; // Stop after successful password reset
        } else {
          console.log('⚠️  UNEXPECTED SUCCESS (should have failed)');
          console.log(`   Status: ${response.status}`);
          console.log(`   Message: ${response.data.message}`);
        }
        
      } catch (error) {
        const status = error.response?.status;
        const message = error.response?.data?.message;
        const details = error.response?.data?.details;
        const requirements = error.response?.data?.requirements;
        
        console.log(`❌ ERROR (checking if expected)`);
        console.log(`   Status: ${status}`);
        console.log(`   Message: ${message}`);
        
        if (status === scenario.expectedStatus) {
          if (message?.includes(scenario.expectedMessage)) {
            console.log('✅ Expected error - correct handling');
          } else {
            console.log('⚠️  Expected status but different message');
            console.log(`   Expected message to contain: "${scenario.expectedMessage}"`);
          }
        } else {
          console.log('❌ Unexpected error status');
          console.log(`   Expected: ${scenario.expectedStatus}, Got: ${status}`);
        }
        
        if (details) {
          console.log(`   Details: ${details}`);
        }
        
        if (requirements) {
          console.log('   Requirements provided:');
          requirements.forEach(req => console.log(`     • ${req}`));
        }
      }
    }

    console.log('\n🎯 ERROR HANDLING SUMMARY');
    console.log('=========================');
    console.log('✅ 400 errors: Should provide specific feedback');
    console.log('✅ Password validation: Should include requirements');
    console.log('✅ OTP validation: Should guide user to request new code');
    console.log('✅ Success cases: Should work with strong passwords');
    
    console.log('\n📱 ADMIN DASHBOARD GUIDANCE');
    console.log('===========================');
    console.log('When users see 400 errors in the admin dashboard:');
    console.log('1. Check browser console for detailed error info');
    console.log('2. Verify OTP code is correct and not expired');
    console.log('3. Ensure password meets all requirements');
    console.log('4. Use "Request New Code" if OTP is invalid');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testAllErrorScenarios();