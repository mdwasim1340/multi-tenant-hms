#!/usr/bin/env node

/**
 * Reset User Password in Cognito
 * Resets password for an existing user (admin operation)
 */

const { CognitoIdentityProviderClient, AdminSetUserPasswordCommand, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');
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

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

async function resetUserPassword(email, newPassword) {
  console.log('\n' + '='.repeat(60));
  log('Reset User Password in AWS Cognito', 'cyan');
  console.log('='.repeat(60) + '\n');

  if (!USER_POOL_ID) {
    log('❌ Error: COGNITO_USER_POOL_ID not found in environment variables', 'red');
    process.exit(1);
  }

  try {
    // First, find the user by email to get the username
    log(`Finding user with email: ${email}`, 'yellow');
    
    const listCommand = new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Filter: `email = "${email}"`
    });

    const listResponse = await cognitoClient.send(listCommand);
    
    if (!listResponse.Users || listResponse.Users.length === 0) {
      log(`❌ User not found with email: ${email}`, 'red');
      process.exit(1);
    }

    const user = listResponse.Users[0];
    const username = user.Username;
    
    log(`✅ User found: ${username}`, 'green');
    log(`Resetting password...`, 'yellow');
    
    // Reset the password
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      Password: newPassword,
      Permanent: true
    });

    await cognitoClient.send(setPasswordCommand);
    log('✅ Password reset successfully', 'green');

    // Success summary
    console.log('\n' + '='.repeat(60));
    log('Password Reset Successful!', 'green');
    console.log('='.repeat(60) + '\n');

    log('Login Credentials:', 'cyan');
    log(`  Email:    ${email}`, 'blue');
    log(`  Password: ${newPassword}`, 'blue');
    log(`  Username: ${username} (internal)`, 'blue');

    log('\n⚠️  IMPORTANT: Login with EMAIL, not username!', 'yellow');
    
    log('\nYou can now login at:', 'cyan');
    log('  Admin Dashboard: http://localhost:3002/auth/login', 'blue');
    log('  Hospital System: http://localhost:3001/auth/login', 'blue');

    log('\nNext Steps:', 'cyan');
    log('  1. Open the login page', 'yellow');
    log('  2. Enter the EMAIL and new password', 'yellow');
    log('  3. You should be authenticated successfully', 'yellow');

  } catch (error) {
    log(`\n❌ Error resetting password: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length !== 2) {
  log('Usage:', 'cyan');
  log('  node reset-user-password.js <email> <new-password>', 'yellow');
  log('\nExample:', 'cyan');
  log('  node reset-user-password.js mdwasimakram44@gmail.com "NewPassword123!"', 'blue');
  log('\nPassword Requirements:', 'cyan');
  log('  - At least 8 characters', 'yellow');
  log('  - At least 1 uppercase letter', 'yellow');
  log('  - At least 1 lowercase letter', 'yellow');
  log('  - At least 1 number', 'yellow');
  log('  - At least 1 special character (!@#$%^&*)', 'yellow');
  process.exit(1);
}

const [email, newPassword] = args;

// Validate password requirements
if (newPassword.length < 8) {
  log('❌ Password must be at least 8 characters long', 'red');
  process.exit(1);
}

if (!/[A-Z]/.test(newPassword)) {
  log('❌ Password must contain at least one uppercase letter', 'red');
  process.exit(1);
}

if (!/[a-z]/.test(newPassword)) {
  log('❌ Password must contain at least one lowercase letter', 'red');
  process.exit(1);
}

if (!/[0-9]/.test(newPassword)) {
  log('❌ Password must contain at least one number', 'red');
  process.exit(1);
}

if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
  log('❌ Password must contain at least one special character', 'red');
  process.exit(1);
}

resetUserPassword(email, newPassword);
