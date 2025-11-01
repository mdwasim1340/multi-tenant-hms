const axios = require('axios');

const BACKEND_URL = 'http://localhost:3000';
const TEST_EMAILS = [
  'mdwasimkrm13@gmail.com',  // The email from the logs
  'noreply@exo.com.np',      // Known existing user
  'definitely.not.existing@fake.domain.com'  // Definitely non-existing
];

console.log('🔍 DEBUGGING USER EXISTENCE CHECK');
console.log('=================================');

async function debugUserExistenceCheck() {
  for (const email of TEST_EMAILS) {
    console.log(`\n📧 Testing email: ${email}`);
    
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
      console.log('   → This means the user EXISTS in Cognito');
      console.log('   → Email was sent (or attempted to be sent)');
      
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message;
      const details = error.response?.data?.details;
      
      console.log(`❌ FAILED: Status ${status}`);
      console.log(`   Message: ${message}`);
      if (details) {
        console.log(`   Details: ${details}`);
      }
      
      if (status === 404) {
        console.log('   → This means the user DOES NOT EXIST in Cognito');
      } else if (status === 400) {
        console.log('   → This means the user EXISTS but email is not verified in SES');
      } else if (status === 500) {
        console.log('   → This means there was a server error');
      }
    }
  }
  
  console.log('\n🎯 ANALYSIS');
  console.log('===========');
  console.log('If mdwasimkrm13@gmail.com gets a 400 error (not 404):');
  console.log('→ The user EXISTS in Cognito');
  console.log('→ The email is just not verified in SES');
  console.log('→ This is expected behavior');
  console.log('');
  console.log('If mdwasimkrm13@gmail.com gets a 404 error:');
  console.log('→ The user does NOT exist in Cognito');
  console.log('→ No email should be sent');
  console.log('→ This is the correct behavior');
  console.log('');
  console.log('If mdwasimkrm13@gmail.com gets a 200 success:');
  console.log('→ The user EXISTS and email is verified');
  console.log('→ Email was sent successfully');
  console.log('→ This is expected for existing verified users');
}

debugUserExistenceCheck();