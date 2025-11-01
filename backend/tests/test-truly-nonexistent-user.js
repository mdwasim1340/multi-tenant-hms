const axios = require('axios');

const BACKEND_URL = 'http://localhost:3000';

// These emails should definitely not exist in Cognito
const NON_EXISTING_EMAILS = [
  'absolutely.fake.user@nonexistent.domain',
  'test.user.that.does.not.exist@fake.com',
  'random.email.address@nowhere.net'
];

console.log('🔍 TESTING TRULY NON-EXISTING USERS');
console.log('===================================');

async function testTrulyNonExistentUsers() {
  console.log('Testing emails that should definitely not exist in Cognito...\n');
  
  for (const email of NON_EXISTING_EMAILS) {
    console.log(`📧 Testing: ${email}`);
    
    try {
      const response = await axios.post(`${BACKEND_URL}/auth/forgot-password`, {
        email: email
      }, {
        headers: {
          'X-Tenant-ID': 'admin',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🚨 PROBLEM: Email was sent to non-existing user!');
      console.log(`   Response: ${response.data.message}`);
      console.log('   This should NOT happen - indicates a bug in user validation');
      
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message;
      
      if (status === 404) {
        console.log('✅ CORRECT: User properly rejected (404 - Account not found)');
        console.log(`   Message: ${message}`);
      } else {
        console.log(`❌ UNEXPECTED ERROR: Status ${status}`);
        console.log(`   Message: ${message}`);
      }
    }
    console.log('');
  }
  
  console.log('🎯 CONCLUSION');
  console.log('=============');
  console.log('If all non-existing users get 404 errors:');
  console.log('→ User existence validation is working correctly');
  console.log('→ noreply@exo.com.np actually exists in Cognito (which is why it works)');
  console.log('');
  console.log('If any non-existing users get success responses:');
  console.log('→ There is a bug in the user existence validation');
  console.log('→ Need to investigate the checkUserExists function');
}

testTrulyNonExistentUsers();