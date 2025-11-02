const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const cognito = new AWS.CognitoIdentityServiceProvider();

const addUserToAdminGroup = async () => {
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const username = 'auth-test_enterprise-corp_com'; // The username from our test user
  
  try {
    console.log('🔧 Adding user to admin group...');
    
    // First, check if admin group exists
    try {
      await cognito.getGroup({
        GroupName: 'admin',
        UserPoolId: userPoolId
      }).promise();
      console.log('✅ Admin group exists');
    } catch (error) {
      if (error.code === 'ResourceNotFoundException') {
        console.log('📝 Creating admin group...');
        await cognito.createGroup({
          GroupName: 'admin',
          UserPoolId: userPoolId,
          Description: 'Administrator group for tenant management'
        }).promise();
        console.log('✅ Admin group created');
      } else {
        throw error;
      }
    }
    
    // Add user to admin group
    await cognito.adminAddUserToGroup({
      UserPoolId: userPoolId,
      Username: username,
      GroupName: 'admin'
    }).promise();
    
    console.log('✅ User added to admin group successfully');
    
    // Verify user is in admin group
    const userGroups = await cognito.adminListGroupsForUser({
      UserPoolId: userPoolId,
      Username: username
    }).promise();
    
    console.log('👤 User groups:');
    userGroups.Groups.forEach(group => {
      console.log(`  • ${group.GroupName}: ${group.Description || 'No description'}`);
    });
    
    const isAdmin = userGroups.Groups.some(group => group.GroupName === 'admin');
    if (isAdmin) {
      console.log('\n🎉 User is now an admin and can manage tenants!');
    } else {
      console.log('\n❌ Failed to add user to admin group');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'UserNotFoundException') {
      console.log('💡 Make sure the user exists and the username is correct');
      console.log(`   Username used: ${username}`);
    }
  }
};

addUserToAdminGroup();