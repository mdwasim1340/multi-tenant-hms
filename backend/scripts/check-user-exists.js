#!/usr/bin/env node

/**
 * Check if User Exists in Cognito
 * Checks if a user with given email exists in AWS Cognito
 */

const { CognitoIdentityProviderClient, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');
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

async function checkUserExists(email) {
  console.log('\n' + '='.repeat(60));
  log('Checking User in AWS Cognito', 'cyan');
  console.log('='.repeat(60) + '\n');

  if (!USER_POOL_ID) {
    log('❌ Error: COGNITO_USER_POOL_ID not found in environment variables', 'red');
    process.exit(1);
  }

  try {
    log(`Searching for user with email: ${email}`, 'yellow');
    
    // Search by email attribute
    const command = new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Filter: `email = "${email}"`
    });

    const response = await cognitoClient.send(command);
    
    if (response.Users && response.Users.length > 0) {
      log(`\n✅ User found!`, 'green');
      
      response.Users.forEach(user => {
        log(`\nUser Details:`, 'cyan');
        log(`  Username: ${user.Username}`, 'blue');
        log(`  Status: ${user.UserStatus}`, 'blue');
        log(`  Enabled: ${user.Enabled}`, 'blue');
        log(`  Created: ${user.UserCreateDate}`, 'blue');
        
        log(`\n  Attributes:`, 'cyan');
        user.Attributes?.forEach(attr => {
          log(`    ${attr.Name}: ${attr.Value}`, 'blue');
        });
      });
      
      log(`\n✅ You can login with this email`, 'green');
      log(`If you forgot the password, you can reset it.`, 'yellow');
      
    } else {
      log(`\n❌ User NOT found with email: ${email}`, 'red');
      log(`\nTo create this user, run:`, 'cyan');
      log(`node scripts/create-test-user.js ${email} YourPassword123! "Your Name"`, 'yellow');
    }
    
  } catch (error) {
    log(`\n❌ Error checking user: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Get email from command line or use default
const email = process.argv[2] || 'mdwasimakram44@gmail.com';

checkUserExists(email);
