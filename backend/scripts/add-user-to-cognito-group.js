/**
 * Add User to Cognito Group
 * Adds test user to hospital-admin group in Cognito
 */

require('dotenv').config();
const { CognitoIdentityProviderClient, AdminAddUserToGroupCommand, AdminListGroupsForUserCommand } = require('@aws-sdk/client-cognito-identity-provider');

const TEST_USERNAME = 'testintegration';
const GROUP_NAME = 'hospital-admin';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function addUserToGroup() {
  console.log('\n🔧 Adding User to Cognito Group\n');
  console.log('='.repeat(60));
  
  try {
    // Check current groups
    console.log('\n📝 Step 1: Checking current groups...');
    const listGroupsResponse = await cognitoClient.send(new AdminListGroupsForUserCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: TEST_USERNAME
    }));
    
    const currentGroups = listGroupsResponse.Groups?.map(g => g.GroupName) || [];
    console.log(`   Current groups: ${currentGroups.length > 0 ? currentGroups.join(', ') : 'None'}`);
    
    if (currentGroups.includes(GROUP_NAME)) {
      console.log(`✅ User is already in ${GROUP_NAME} group`);
      return;
    }
    
    // Add to group
    console.log(`\n📝 Step 2: Adding user to ${GROUP_NAME} group...`);
    await cognitoClient.send(new AdminAddUserToGroupCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: TEST_USERNAME,
      GroupName: GROUP_NAME
    }));
    
    console.log(`✅ User added to ${GROUP_NAME} group`);
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ User successfully added to Cognito group!');
    console.log('\nThe test user can now access hospital management endpoints.');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.name === 'ResourceNotFoundException') {
      console.error(`\n⚠️  Group "${GROUP_NAME}" does not exist in Cognito.`);
      console.error('You may need to create the group first.');
    }
  }
}

addUserToGroup();
