require('dotenv').config();
const { CognitoIdentityProviderClient, AdminDeleteUserCommand, AdminCreateUserCommand, AdminSetUserPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');
const crypto = require('crypto');

const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

// Function to generate secret hash
function generateSecretHash(username, clientId, clientSecret) {
  return crypto
    .createHmac('SHA256', clientSecret)
    .update(username + clientId)
    .digest('base64');
}

async function fixAdminUser() {
  const email = 'mdwasimkrm13@gmail.com';
  const password = 'Advanture101$';
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const clientId = process.env.COGNITO_CLIENT_ID;
  const clientSecret = process.env.COGNITO_SECRET;

  // Correct username format (same as auth service)
  const correctUsername = email.replace('@', '_').replace(/\./g, '_');
  const oldUsername = 'admin_1761986558054';

  console.log('🔧 Fixing Admin User...');
  console.log(`Email: ${email}`);
  console.log(`Old Username: ${oldUsername}`);
  console.log(`Correct Username: ${correctUsername}`);

  try {
    // Delete the old user
    console.log('\n🗑️  Deleting old user...');
    try {
      const deleteCommand = new AdminDeleteUserCommand({
        UserPoolId: userPoolId,
        Username: oldUsername
      });
      await client.send(deleteCommand);
      console.log('✅ Old user deleted successfully!');
    } catch (deleteError) {
      console.log('⚠️  Could not delete old user (might not exist):', deleteError.message);
    }

    // Create user with correct username
    console.log('\n👤 Creating user with correct username...');
    const secretHash = generateSecretHash(correctUsername, clientId, clientSecret);

    const createUserCommand = new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: correctUsername,
      UserAttributes: [
        {
          Name: 'email',
          Value: email
        },
        {
          Name: 'email_verified',
          Value: 'true'
        }
      ],
      MessageAction: 'SUPPRESS', // Don't send welcome email
      TemporaryPassword: password
    });

    const createResult = await client.send(createUserCommand);
    console.log('✅ User created successfully!');
    console.log('Username:', createResult.User.Username);

    // Set permanent password
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: correctUsername,
      Password: password,
      Permanent: true
    });

    await client.send(setPasswordCommand);
    console.log('✅ Password set as permanent!');

    console.log('\n🎉 Admin user fixed successfully!');
    console.log('Credentials:');
    console.log(`Email: ${email}`);
    console.log(`Username: ${correctUsername}`);
    console.log(`Password: ${password}`);

  } catch (error) {
    console.error('❌ Error fixing user:', error.message);
  }
}

fixAdminUser();