require('dotenv').config();
const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');
const crypto = require('crypto');

const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

// Function to generate secret hash
function generateSecretHash(username, clientId, clientSecret) {
  return crypto
    .createHmac('SHA256', clientSecret)
    .update(username + clientId)
    .digest('base64');
}

async function createAdminUser() {
  const email = 'mdwasimkrm13@gmail.com';
  const password = 'Advanture101$';
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const clientId = process.env.COGNITO_CLIENT_ID;
  const clientSecret = process.env.COGNITO_SECRET;

  console.log('🔧 Creating Admin User...');
  console.log(`Email: ${email}`);
  console.log(`User Pool: ${userPoolId}`);

  try {
    // Generate username in the same format as the auth service
    const username = email.replace('@', '_').replace(/\./g, '_');
    console.log(`Username: ${username}`);
    
    // Generate secret hash
    const secretHash = generateSecretHash(username, clientId, clientSecret);
    const createUserCommand = new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: username,
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
    console.log('User Sub:', createResult.User.Username);

    // Set permanent password
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: username,
      Password: password,
      Permanent: true
    });

    await client.send(setPasswordCommand);
    console.log('✅ Password set as permanent!');

    console.log('\n🎉 Admin user created successfully!');
    console.log('Credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('Role: admin');

  } catch (error) {
    if (error.name === 'UsernameExistsException') {
      console.log('⚠️  User already exists. Updating password...');
      
      try {
        const setPasswordCommand = new AdminSetUserPasswordCommand({
          UserPoolId: userPoolId,
          Username: email, // For existing users, use email
          Password: password,
          Permanent: true
        });

        await client.send(setPasswordCommand);
        console.log('✅ Password updated successfully!');
        console.log('\n🎉 Admin user is ready!');
        console.log('Credentials:');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
      } catch (updateError) {
        console.error('❌ Error updating password:', updateError.message);
      }
    } else {
      console.error('❌ Error creating user:', error.message);
    }
  }
}

createAdminUser();