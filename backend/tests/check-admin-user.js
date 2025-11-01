require('dotenv').config();
const { CognitoIdentityProviderClient, AdminGetUserCommand, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');

const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

async function checkAdminUser() {
  const email = 'mdwasimkrm13@gmail.com';
  const username = email.replace('@', '_').replace(/\./g, '_');
  const userPoolId = process.env.COGNITO_USER_POOL_ID;

  console.log('🔍 Checking Admin User...');
  console.log(`Email: ${email}`);
  console.log(`Expected Username: ${username}`);
  console.log(`User Pool: ${userPoolId}`);

  try {
    // List all users to see what's available
    console.log('\n📋 Listing all users...');
    const listCommand = new ListUsersCommand({
      UserPoolId: userPoolId,
      Limit: 20
    });

    const listResult = await client.send(listCommand);
    console.log(`Found ${listResult.Users.length} users:`);
    
    listResult.Users.forEach((user, index) => {
      console.log(`${index + 1}. Username: ${user.Username}`);
      console.log(`   Status: ${user.UserStatus}`);
      console.log(`   Email: ${user.Attributes?.find(attr => attr.Name === 'email')?.Value || 'N/A'}`);
      console.log(`   Created: ${user.UserCreateDate}`);
      console.log('');
    });

    // Try to get the specific user
    console.log(`\n🔍 Checking specific user: ${username}`);
    try {
      const getUserCommand = new AdminGetUserCommand({
        UserPoolId: userPoolId,
        Username: username
      });

      const userResult = await client.send(getUserCommand);
      console.log('✅ User found!');
      console.log(`Status: ${userResult.UserStatus}`);
      console.log(`Enabled: ${userResult.Enabled}`);
      console.log('Attributes:');
      userResult.UserAttributes.forEach(attr => {
        console.log(`  ${attr.Name}: ${attr.Value}`);
      });

    } catch (getUserError) {
      console.log('❌ User not found with expected username');
      console.log('Error:', getUserError.message);
    }

  } catch (error) {
    console.error('❌ Error checking users:', error.message);
  }
}

checkAdminUser();