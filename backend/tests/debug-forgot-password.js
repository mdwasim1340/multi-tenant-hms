const axios = require('axios');
require('dotenv').config();

const BACKEND_URL = 'http://localhost:3000';

console.log('🔍 DEBUGGING FORGOT PASSWORD FUNCTIONALITY');
console.log('==========================================');

async function debugForgotPassword() {
  const testEmails = [
    'noreply@exo.com.np',  // Verified email
    'test@example.com',    // Unverified email
    'admin@test.com'       // Another test email
  ];

  for (const email of testEmails) {
    console.log(`\n📧 Testing with email: ${email}`);
    try {
      const response = await axios.post(`${BACKEND_URL}/auth/forgot-password`, {
        email: email
      }, {
        headers: {
          'X-Tenant-ID': 'admin',
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ SUCCESS: ${response.data.message}`);
      
    } catch (error) {
      console.log(`❌ FAILED: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      
      if (error.response?.status === 500) {
        console.log('   This is a server error - checking backend logs...');
      }
    }
  }

  console.log('\n🔍 CHECKING BACKEND LOGS...');
  console.log('Check the backend terminal for detailed error messages.');
  
  console.log('\n💡 POSSIBLE CAUSES:');
  console.log('1. Database connection issues');
  console.log('2. Missing user_verification table');
  console.log('3. SES email sending failures');
  console.log('4. Environment variable issues');
}

debugForgotPassword();