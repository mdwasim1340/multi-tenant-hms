/**
 * Setup MedChat Mobile App Admin User in Cognito
 * 
 * Creates the admin user for the MedChat mobile app tenant
 * 
 * Run: node scripts/setup-medchat-user.js
 */

require('dotenv').config();
const {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

const USER = {
  email: 'admin@medchat.ai',
  password: 'MedChat@2025!',
  name: 'MedChat Admin',
  tenant: 'tenant_medchat_mobile',
};

// Convert email to Cognito username format (required for email alias pools)
const emailToUsername = (email) => {
  return email.replace('@', '_').replace(/\./g, '_');
};

async function setupMedChatUser() {
  const username = emailToUsername(USER.email);
  
  console.log('🚀 Setting up MedChat Admin User in Cognito...\n');
  console.log(`📧 Email: ${USER.email}`);
  console.log(`👤 Username: ${username}`);
  console.log(`🏢 Tenant: ${USER.tenant}`);
  console.log('');
  
  try {
    // Check if user already exists
    let userExists = false;
    try {
      const getUserCommand = new AdminGetUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: username,
      });
      await cognitoClient.send(getUserCommand);
      userExists = true;
      console.log('ℹ️  User already exists in Cognito');
    } catch (error) {
      if (error.name !== 'UserNotFoundException') {
        throw error;
      }
    }
    
    if (userExists) {
      // Update existing user
      console.log('📝 Updating existing user...');
      
      // Update password
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: username,
        Password: USER.password,
        Permanent: true,
      });
      await cognitoClient.send(setPasswordCommand);
      console.log('   ✅ Password updated');
      
      // Update attributes
      const updateAttributesCommand = new AdminUpdateUserAttributesCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: username,
        UserAttributes: [
          { Name: 'email', Value: USER.email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'name', Value: USER.name },
        ],
      });
      await cognitoClient.send(updateAttributesCommand);
      console.log('   ✅ Attributes updated');
      
    } else {
      // Create new user
      console.log('📝 Creating new user...');
      
      const createCommand = new AdminCreateUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: username,
        UserAttributes: [
          { Name: 'email', Value: USER.email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'name', Value: USER.name },
        ],
        MessageAction: 'SUPPRESS', // Don't send welcome email
        TemporaryPassword: USER.password,
      });
      await cognitoClient.send(createCommand);
      console.log('   ✅ User created');
      
      // Set permanent password
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: username,
        Password: USER.password,
        Permanent: true,
      });
      await cognitoClient.send(setPasswordCommand);
      console.log('   ✅ Password set');
    }
    
    console.log('\n============================================================');
    console.log('✅ MedChat Admin User Setup Complete!');
    console.log('============================================================');
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log(`   Email: ${USER.email}`);
    console.log(`   Password: ${USER.password}`);
    console.log(`   Tenant: ${USER.tenant}`);
    console.log('');
    console.log('📱 Test in Flutter App:');
    console.log('   1. Run: flutter run');
    console.log('   2. Navigate to Sign In');
    console.log('   3. Enter credentials above');
    console.log('============================================================');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

setupMedChatUser();
