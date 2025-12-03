// Setup Cognito Users for All Tenants
// December 3, 2025

const {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  CreateGroupCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

require('dotenv').config();

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

// Tenant admin credentials
const ADMIN_USERS = [
  {
    email: 'admin@aajmin.hospital',
    password: 'AajminAdmin@2024',
    name: 'Aajmin Admin',
    tenant: 'aajmin_polyclinic',
  },
  {
    email: 'admin@sunrise.hospital',
    password: 'SunriseAdmin@2024',
    name: 'Sunrise Admin',
    tenant: 'sunrise_medical',
  },
  {
    email: 'admin@city.hospital',
    password: 'CityAdmin@2024',
    name: 'City Admin',
    tenant: 'city_general',
  },
  {
    email: 'admin@valley.hospital',
    password: 'ValleyAdmin@2024',
    name: 'Valley Admin',
    tenant: 'green_valley',
  },
  {
    email: 'admin@riverside.hospital',
    password: 'RiversideAdmin@2024',
    name: 'Riverside Admin',
    tenant: 'riverside_medical',
  },
  {
    email: 'admin@general.hospital',
    password: 'GeneralAdmin@2024',
    name: 'General Admin',
    tenant: 'general_hospital',
  },
];

async function ensureGroupExists(groupName) {
  try {
    const command = new CreateGroupCommand({
      GroupName: groupName,
      UserPoolId: USER_POOL_ID,
      Description: `${groupName} group`,
    });
    await cognitoClient.send(command);
    console.log(`✅ Group created: ${groupName}`);
  } catch (error) {
    if (error.name === 'GroupExistsException') {
      console.log(`ℹ️  Group already exists: ${groupName}`);
    } else {
      console.error(`❌ Error creating group ${groupName}:`, error.message);
    }
  }
}

async function createCognitoUser(user) {
  const username = user.email;

  try {
    // Create user
    const createCommand = new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      UserAttributes: [
        { Name: 'email', Value: user.email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'name', Value: user.name },
      ],
      MessageAction: 'SUPPRESS', // Don't send welcome email
    });

    await cognitoClient.send(createCommand);
    console.log(`✅ User created: ${user.email}`);

    // Set permanent password
    const passwordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      Password: user.password,
      Permanent: true,
    });

    await cognitoClient.send(passwordCommand);
    console.log(`✅ Password set for: ${user.email}`);

    // Add to hospital-admin group
    const groupCommand = new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      GroupName: 'hospital-admin',
    });

    await cognitoClient.send(groupCommand);
    console.log(`✅ Added to hospital-admin group: ${user.email}`);

    return true;
  } catch (error) {
    if (error.name === 'UsernameExistsException') {
      console.log(`ℹ️  User already exists: ${user.email}`);
      
      // Try to set password for existing user
      try {
        const passwordCommand = new AdminSetUserPasswordCommand({
          UserPoolId: USER_POOL_ID,
          Username: username,
          Password: user.password,
          Permanent: true,
        });
        await cognitoClient.send(passwordCommand);
        console.log(`✅ Password updated for existing user: ${user.email}`);
      } catch (pwdError) {
        console.error(`❌ Error updating password for ${user.email}:`, pwdError.message);
      }
      
      return true;
    } else {
      console.error(`❌ Error creating user ${user.email}:`, error.message);
      return false;
    }
  }
}

async function setupAllUsers() {
  console.log('🚀 Setting up Cognito users for all tenants...\n');

  // Ensure hospital-admin group exists
  await ensureGroupExists('hospital-admin');
  console.log('');

  // Create all admin users
  for (const user of ADMIN_USERS) {
    console.log(`\n📝 Processing: ${user.email} (${user.tenant})`);
    await createCognitoUser(user);
  }

  console.log('\n\n✅ All users setup complete!\n');
  console.log('📋 Credentials Summary:\n');
  console.log('═'.repeat(80));
  
  ADMIN_USERS.forEach((user, index) => {
    console.log(`\n${index + 1}. ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${user.password}`);
    console.log(`   Tenant: ${user.tenant}`);
    console.log(`   Subdomain: ${user.tenant.split('_')[0]}`);
  });
  
  console.log('\n' + '═'.repeat(80));
  console.log('\n🌐 Access URLs:');
  console.log('   http://aajmin.exo.com.np');
  console.log('   http://sunrise.exo.com.np');
  console.log('   http://city.exo.com.np');
  console.log('   http://valley.exo.com.np');
  console.log('   http://riverside.exo.com.np');
  console.log('   http://general.exo.com.np');
  console.log('');
}

// Run setup
setupAllUsers().catch(console.error);
