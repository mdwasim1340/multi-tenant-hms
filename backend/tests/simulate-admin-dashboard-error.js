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

console.log('🔍 SIMULATING ADMIN DASHBOARD ERROR SCENARIO');
console.log('============================================');

async function simulateAdminDashboardError() {
  try {
    console.log('\n📋 STEP 1: Request password reset (like admin dashboard does)...');
    
    // Clear any existing verification codes
    await pool.query('DELETE FROM user_verification WHERE email = $1 AND type = $2', [TEST_EMAIL, 'reset']);
    
    // Request password reset exactly like admin dashboard
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

    console.log('\n📋 STEP 2: Test common password reset scenarios...');
    
    const scenarios = [
      {
        name: 'Valid strong password',
        email: TEST_EMAIL,
        code: otpCode,
        password: 'StrongPassword123!',
        expectedResult: 'success'
      },
      {
        name: 'Wrong OTP code',
        email: TEST_EMAIL,
        code: 'WRONG1',
        password: 'StrongPassword123!',
        expectedResult: 'invalid_code'
      },
      {
        name: 'Weak password',
        email: TEST_EMAIL,
        code: otpCode,
        password: 'weak',
        expectedResult: 'weak_password'
      },
      {
        name: 'Empty password',
        email: TEST_EMAIL,
        code: otpCode,
        password: '',
        expectedResult: 'empty_password'
      }
    ];

    for (const scenario of scenarios) {
      console.log(`\n🔍 Testing: ${scenario.name}`);
      console.log(`   Email: ${scenario.email}`);
      console.log(`   Code: ${scenario.code}`);
      console.log(`   Password: "${scenario.password}"`);
      
      try {
        const response = await axios.post(`${BACKEND_URL}/auth/reset-password`, {
          email: scenario.email,
          code: scenario.code,
          newPassword: scenario.password
        }, {
          headers: {
            'X-Tenant-ID': 'admin',
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ SUCCESS');
        console.log(`   Status: ${response.status}`);
        console.log(`   Message: ${response.data.message}`);
        
        if (scenario.expectedResult !== 'success') {
          console.log('⚠️  UNEXPECTED: This should have failed');
        }
        
        break; // Stop after first success to avoid using up the OTP
        
      } catch (error) {
        const status = error.response?.status;
        const message = error.response?.data?.message;
        const details = error.response?.data?.details;
        const requirements = error.response?.data?.requirements;
        
        console.log(`❌ FAILED`);
        console.log(`   Status: ${status}`);
        console.log(`   Message: ${message}`);
        
        if (details) {
          console.log(`   Details: ${details}`);
        }
        
        if (requirements) {
          console.log('   Requirements:');
          requirements.forEach(req => console.log(`     • ${req}`));
        }
        
        // Check if this matches expected result
        if (scenario.expectedResult === 'invalid_code' && status === 400 && message?.includes('Invalid verification code')) {
          console.log('✅ Expected error for wrong OTP');
        } else if (scenario.expectedResult === 'weak_password' && status === 400 && message?.includes('Password requirements')) {
          console.log('✅ Expected error for weak password');
        } else if (scenario.expectedResult === 'empty_password' && status === 400) {
          console.log('✅ Expected error for empty password');
        } else {
          console.log('⚠️  Unexpected error type');
        }
      }
    }

    console.log('\n🎯 DEBUGGING SUMMARY');
    console.log('====================');
    console.log('This test simulates the exact admin dashboard flow.');
    console.log('If you see a 400 error in the admin dashboard, it should match one of these scenarios.');
    console.log('');
    console.log('Common 400 error causes:');
    console.log('1. Invalid/expired OTP code');
    console.log('2. Password not meeting requirements');
    console.log('3. Empty or malformed request data');
    console.log('4. User trying to reuse an already-used OTP');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

simulateAdminDashboardError();