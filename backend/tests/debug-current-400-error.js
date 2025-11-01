const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

const BACKEND_URL = 'http://localhost:3000';
const TEST_EMAIL = 'noreply@exo.com.np';

// Database connection for getting OTP codes
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

console.log('🔍 DEBUGGING CURRENT 400 ERROR');
console.log('==============================');

async function debugCurrent400Error() {
  try {
    console.log('\n📋 STEP 1: Request fresh OTP...');
    
    // Clear any existing verification codes
    await pool.query('DELETE FROM user_verification WHERE email = $1 AND type = $2', [TEST_EMAIL, 'reset']);
    
    // Request password reset
    const forgotResponse = await axios.post(`${BACKEND_URL}/auth/forgot-password`, {
      email: TEST_EMAIL
    }, {
      headers: {
        'X-Tenant-ID': 'admin',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Password reset requested successfully');

    // Get OTP from database
    const otpResult = await pool.query(
      'SELECT code FROM user_verification WHERE email = $1 AND type = $2 ORDER BY created_at DESC LIMIT 1',
      [TEST_EMAIL, 'reset']
    );
    
    const otpCode = otpResult.rows[0].code;
    console.log(`✅ OTP retrieved: ${otpCode}`);

    console.log('\n📋 STEP 2: Test password reset with different passwords...');
    
    const testPasswords = [
      'Password123!',  // Should work
      'weakpass',      // Should fail
      'STRONGPASSWORD123!', // Should work
      'NoSpecialChar123'    // Should fail
    ];

    for (const password of testPasswords) {
      console.log(`\n🔍 Testing password: "${password}"`);
      
      try {
        const response = await axios.post(`${BACKEND_URL}/auth/reset-password`, {
          email: TEST_EMAIL,
          code: otpCode,
          newPassword: password
        }, {
          headers: {
            'X-Tenant-ID': 'admin',
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ SUCCESS: Password accepted');
        console.log(`   Response: ${response.data.message}`);
        break; // Stop after first successful password
        
      } catch (error) {
        const status = error.response?.status;
        const message = error.response?.data?.message;
        const details = error.response?.data?.details;
        const requirements = error.response?.data?.requirements;
        
        console.log(`❌ FAILED: Status ${status}`);
        console.log(`   Message: ${message}`);
        if (details) {
          console.log(`   Details: ${details}`);
        }
        if (requirements) {
          console.log('   Requirements:');
          requirements.forEach(req => console.log(`     • ${req}`));
        }
        
        // Log the full error response for debugging
        console.log('   Full error response:', JSON.stringify(error.response?.data, null, 2));
      }
    }

    console.log('\n🎯 ANALYSIS');
    console.log('===========');
    console.log('This test shows the exact 400 error response structure.');
    console.log('The frontend should handle these specific error messages.');
    console.log('');
    console.log('Expected 400 error types:');
    console.log('1. "Password requirements not met" - with requirements array');
    console.log('2. "Invalid verification code" - for expired/wrong OTP');
    console.log('3. "Invalid password format" - for format issues');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

debugCurrent400Error();