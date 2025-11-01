require('dotenv').config();
const { CognitoIdentityProviderClient, SignUpCommand, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');

async function testCognitoDirect() {
  console.log('🧪 Direct Cognito API Test\n');
  
  const cognitoClient = new CognitoIdentityProviderClient({
    region: process.env.AWS_REGION,
  });
  
  // Test 1: Try to list existing users (to verify permissions)
  try {
    console.log('📋 Checking existing users...');
    const listCommand = new ListUsersCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Limit: 5
    });
    
    const listResponse = await cognitoClient.send(listCommand);
    console.log(`✅ Found ${listResponse.Users?.length || 0} existing users`);
    
    if (listResponse.Users && listResponse.Users.length > 0) {
      listResponse.Users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.Username} (${user.UserStatus})`);
      });
    }
  } catch (error) {
    console.error('❌ List users error:', error.message);
  }
  
  // Test 2: Try direct signup with secret hash
  try {
    console.log('\n🔐 Testing direct signup with secret hash...');
    const testEmail = `test-${Date.now()}@example.com`;
    
    // Generate secret hash
    const crypto = require('crypto');
    const clientId = process.env.COGNITO_CLIENT_ID;
    const clientSecret = process.env.COGNITO_SECRET;
    const secretHash = crypto.createHmac('sha256', clientSecret)
      .update(testEmail + clientId)
      .digest('base64');
    
    // Use a username that's not email format
    const username = `user_${Date.now()}`;
    const secretHashForUser = crypto.createHmac('sha256', clientSecret)
      .update(username + clientId)
      .digest('base64');
    
    const signupCommand = new SignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: username,
      Password: 'TempPassword123!',
      SecretHash: secretHashForUser,
      UserAttributes: [
        { Name: 'email', Value: testEmail }
      ]
    });
    
    const signupResponse = await cognitoClient.send(signupCommand);
    console.log('✅ Signup successful!');
    console.log('- User Sub:', signupResponse.UserSub);
    console.log('- Code Delivery:', signupResponse.CodeDeliveryDetails);
    
  } catch (error) {
    console.error('❌ Direct signup error:', error.name, '-', error.message);
    
    if (error.$metadata) {
      console.log('- HTTP Status:', error.$metadata.httpStatusCode);
      console.log('- Request ID:', error.$metadata.requestId);
    }
  }
}

testCognitoDirect().catch(console.error);