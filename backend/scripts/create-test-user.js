#!/usr/bin/env node

/**
 * Create Test User Script
 * Creates a test user in AWS Cognito for authentication testing
 */

const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');
require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Cognito configuration
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

async function createTestUser(email, password, name) {
  console.log('\n' + '='.repeat(60));
  log('Creating Test User in AWS Cognito', 'cyan');
  console.log('='.repeat(60) + '\n');

  if (!USER_POOL_ID) {
    log('❌ Error: COGNITO_USER_POOL_ID not found in environment variables', 'red');
    log('Please set COGNITO_USER_POOL_ID in backend/.env', 'yellow');
    process.exit(1);
  }

  try {
    // Generate a unique username (not email format)
    // Use timestamp to ensure uniqueness
    const username = `user_${Date.now()}`;
    
    log(`Creating user with email: ${email}`, 'yellow');
    log(`Username: ${username}`, 'blue');
    
    // Step 1: Create user
    const createUserCommand = new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username, // Use non-email username
      UserAttributes: [
        {
          Name: 'email',
          Value: email
        },
        {
          Name: 'email_verified',
          Value: 'true'
        },
        {
          Name: 'name',
          Value: name
        }
      ],
      MessageAction: 'SUPPRESS', // Don't send welcome email
      TemporaryPassword: password
    });

    await cognitoClient.send(createUserCommand);
    log('✅ User created successfully', 'green');

    // Step 2: Set permanent password
    log('Setting permanent password...', 'yellow');
    
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: username, // Use same username
      Password: password,
      Permanent: true
    });

    await cognitoClient.send(setPasswordCommand);
    log('✅ Password set successfully', 'green');

    // Success summary
    console.log('\n' + '='.repeat(60));
    log('Test User Created Successfully!', 'green');
    console.log('='.repeat(60) + '\n');

    log('Login Credentials:', 'cyan');
    log(`  Email:    ${email}`, 'blue');
    log(`  Password: ${password}`, 'blue');
    log(`  Name:     ${name}`, 'blue');

    log('\n⚠️  IMPORTANT: Login with EMAIL, not username!', 'yellow');
    log('Your Cognito User Pool uses email alias.', 'cyan');
    
    log('\nYou can now login at:', 'cyan');
    log('  http://localhost:3001/auth/login', 'blue');
    log('  http://aajminpolyclinic.localhost:3001/auth/login', 'blue');

    log('\nNext Steps:', 'cyan');
    log('  1. Open the login page', 'yellow');
    log('  2. Enter the EMAIL and password (not username)', 'yellow');
    log('  3. You should be authenticated successfully', 'yellow');

  } catch (error) {
    if (error.name === 'UsernameExistsException') {
      log(`\n⚠️  User with email ${email} already exists`, 'yellow');
      log('You can use this user to login with the email and password.', 'yellow');
      log('\nTo delete and recreate, use AWS CLI:', 'cyan');
      log(`aws cognito-idp admin-delete-user --user-pool-id ${USER_POOL_ID} --username [username]`, 'cyan');
      log('\nOr find the username in AWS Cognito Console and delete from there.', 'cyan');
    } else if (error.name === 'InvalidParameterException' && error.message.includes('email format')) {
      log(`\n❌ Error: ${error.message}`, 'red');
      log('\nThis error has been fixed in the script. Please try again.', 'yellow');
    } else {
      log(`\n❌ Error creating user: ${error.message}`, 'red');
      console.error(error);
    }
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  // Default test user
  const defaultEmail = 'test@hospital.com';
  const defaultPassword = 'Test123!@#';
  const defaultName = 'Test User';

  log('Creating default test user...', 'cyan');
  log(`Email: ${defaultEmail}`, 'blue');
  log(`Password: ${defaultPassword}`, 'blue');
  log(`Name: ${defaultName}`, 'blue');
  log('\nTo create a custom user, run:', 'yellow');
  log('node create-test-user.js <email> <password> <name>', 'cyan');
  console.log('');

  createTestUser(defaultEmail, defaultPassword, defaultName);
} else if (args.length === 3) {
  // Custom user
  const [email, password, name] = args;
  createTestUser(email, password, name);
} else {
  log('Usage:', 'cyan');
  log('  node create-test-user.js                           # Create default test user', 'yellow');
  log('  node create-test-user.js <email> <password> <name> # Create custom user', 'yellow');
  log('\nExamples:', 'cyan');
  log('  node create-test-user.js', 'blue');
  log('  node create-test-user.js doctor@hospital.com Doctor123! "Dr. John Doe"', 'blue');
  process.exit(1);
}
