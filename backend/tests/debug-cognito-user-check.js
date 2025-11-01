const { CognitoIdentityProviderClient, AdminGetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
require('dotenv').config();

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

const TEST_EMAILS = [
  'noreply@exo.com.np',
  'mdwasimkrm13@gmail.com',
  'definitely.not.existing@fake.domain.com'
];

console.log('🔍 DIRECT COGNITO USER EXISTENCE CHECK');
console.log('======================================');

async function checkCognitoUsers() {
  for (const email of TEST_EMAILS) {
    console.log(`\n📧 Checking email: ${email}`);
    
    try {
      const username = email.replace('@', '_').replace(/\./g, '_');
      console.log(`   Username format: ${username}`);
      
      const command = new AdminGetUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: username,
      });
      
      const result = await cognitoClient.send(command);
      
      console.log('✅ USER EXISTS in Cognito');
      console.log(`   User Status: ${result.UserStatus}`);
      console.log(`   Enabled: ${result.Enabled}`);
      console.log(`   Created: ${result.UserCreateDate}`);
      
      if (result.UserAttributes) {
        const emailAttr = result.UserAttributes.find(attr => attr.Name === 'email');
        const emailVerified = result.UserAttributes.find(attr => attr.Name === 'email_verified');
        
        if (emailAttr) {
          console.log(`   Email Attribute: ${emailAttr.Value}`);
        }
        if (emailVerified) {
          console.log(`   Email Verified: ${emailVerified.Value}`);
        }
      }
      
    } catch (error) {
      if (error.name === 'UserNotFoundException') {
        console.log('❌ USER DOES NOT EXIST in Cognito');
      } else {
        console.log('❌ ERROR checking user:');
        console.log(`   Error Name: ${error.name}`);
        console.log(`   Error Message: ${error.message}`);
      }
    }
  }
  
  console.log('\n🎯 SUMMARY');
  console.log('==========');
  console.log('This test directly queries Cognito to see which users actually exist.');
  console.log('If noreply@exo.com.np shows as "USER EXISTS", then the user existence');
  console.log('check is working correctly and the user really does exist in Cognito.');
  console.log('');
  console.log('If noreply@exo.com.np shows as "USER DOES NOT EXIST", then there is');
  console.log('a bug in our checkUserExists function.');
}

checkCognitoUsers();