/**
 * Setup Cognito Users for Hospital Management System
 * 
 * This script creates the required test users in AWS Cognito with proper roles and groups.
 * 
 * Users to create:
 * 1. mdwasimkrm13@gmail.com - Hospital Admin for 'aajmin polyclinic' tenant
 * 2. mdwasimakram44@gmail.com - System Admin for admin dashboard
 */

require('dotenv').config();
const {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  CreateGroupCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

const USERS = [
  {
    email: 'mdwasimkrm13@gmail.com',
    password: 'Advanture101$',
    name: 'Wasim Akram',
    role: 'hospital-admin',
    tenant: 'aajmin polyclinic',
    description: 'Hospital Administrator for Aajmin Polyclinic'
  },
  {
    email: 'mdwasimakram44@gmail.com',
    password: 'Advanture101$',
    name: 'Wasim Akram',
    role: 'system-admin',
    tenant: 'admin',
    description: 'System Administrator for Admin Dashboard'
  }
];

// Convert email to Cognito username format
const emailToUsername = (email) => {
  return email.replace('@', '_').replace(/\./g, '_');
};

// Create Cognito group if it doesn't exist
async function ensureGroupExists(groupName) {
  try {
    const command = new CreateGroupCommand({
      GroupName: groupName,
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Description: groupName === 'admin' 
        ? 'System administrators with full access' 
        : 'Hospital administrators with tenant-specific access',
    });
    
    await cognitoClient.send(command);
    console.log(`✅ Created group: ${groupName}`);
  } catch (error) {
    if (error.name === 'GroupExistsException') {
      console.log(`ℹ️  Group already exists: ${groupName}`);
    } else {
      console.error(`❌ Error creating group ${groupName}:`, error.message);
      throw error;
    }
  }
}

// Check if user exists
async function userExists(username) {
  try {
    const command = new AdminGetUserCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: username,
    });
    
    await cognitoClient.send(command);
    return true;
  } catch (error) {
    if (error.name === 'UserNotFoundException') {
      return false;
    }
    throw error;
  }
}

// Create user in Cognito
async function createUser(user) {
  const username = emailToUsername(user.email);
  
  console.log(`\n📝 Processing user: ${user.email}`);
  console.log(`   Username: ${username}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Tenant: ${user.tenant}`);
  
  try {
    // Check if user already exists
    const exists = await userExists(username);
    
    if (exists) {
      console.log(`ℹ️  User already exists: ${user.email}`);
      console.log(`   Updating password and attributes...`);
      
      // Update password
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: username,
        Password: user.password,
        Permanent: true,
      });
      
      await cognitoClient.send(setPasswordCommand);
      console.log(`✅ Password updated for: ${user.email}`);
      
      // Update user attributes (only standard attributes, no custom ones)
      const updateAttributesCommand = new AdminUpdateUserAttributesCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: username,
        UserAttributes: [
          { Name: 'email', Value: user.email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'name', Value: user.name },
        ],
      });
      
      await cognitoClient.send(updateAttributesCommand);
      console.log(`✅ Attributes updated for: ${user.email}`);
      
    } else {
      // Create new user
      const createCommand = new AdminCreateUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: username,
        UserAttributes: [
          { Name: 'email', Value: user.email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'name', Value: user.name },
          { Name: 'custom:tenant', Value: user.tenant },
          { Name: 'custom:role', Value: user.role },
        ],
        MessageAction: 'SUPPRESS', // Don't send welcome email
        TemporaryPassword: user.password,
      });
      
      await cognitoClient.send(createCommand);
      console.log(`✅ User created: ${user.email}`);
      
      // Set permanent password
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: username,
        Password: user.password,
        Permanent: true,
      });
      
      await cognitoClient.send(setPasswordCommand);
      console.log(`✅ Password set for: ${user.email}`);
    }
    
    // Ensure group exists
    await ensureGroupExists(user.role);
    
    // Add user to group
    const addToGroupCommand = new AdminAddUserToGroupCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: username,
      GroupName: user.role,
    });
    
    await cognitoClient.send(addToGroupCommand);
    console.log(`✅ User added to group: ${user.role}`);
    
    console.log(`\n✅ Successfully configured user: ${user.email}`);
    console.log(`   Description: ${user.description}`);
    console.log(`   Login credentials:`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Password: ${user.password}`);
    
  } catch (error) {
    console.error(`\n❌ Error processing user ${user.email}:`, error.message);
    throw error;
  }
}

// Main setup function
async function setupCognitoUsers() {
  console.log('🚀 Starting Cognito User Setup');
  console.log('================================\n');
  
  console.log('Configuration:');
  console.log(`- User Pool ID: ${process.env.COGNITO_USER_POOL_ID}`);
  console.log(`- Region: ${process.env.AWS_REGION}`);
  console.log(`- Users to create: ${USERS.length}\n`);
  
  try {
    // Create all users
    for (const user of USERS) {
      await createUser(user);
    }
    
    console.log('\n\n🎉 Cognito User Setup Complete!');
    console.log('================================\n');
    
    console.log('📋 Summary:');
    console.log(`✅ ${USERS.length} users configured successfully\n`);
    
    console.log('🔐 Login Credentials:\n');
    USERS.forEach((user, index) => {
      console.log(`${index + 1}. ${user.description}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Tenant: ${user.tenant}\n`);
    });
    
    console.log('📝 Next Steps:');
    console.log('1. Test login with hospital admin: mdwasimkrm13@gmail.com');
    console.log('2. Test login with system admin: mdwasimakram44@gmail.com');
    console.log('3. Verify tenant isolation is working correctly');
    console.log('4. Test role-based access control (RBAC)');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupCognitoUsers();
