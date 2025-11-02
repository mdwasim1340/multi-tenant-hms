const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const cognito = new AWS.CognitoIdentityServiceProvider();

const checkUserAdminAccess = async () => {
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const testUsers = [
    'mdwasimkrm13@gmail.com',
    'auth-test@enterprise-corp.com'
  ];
  
  console.log('🔍 CHECKING USER ADMIN ACCESS');
  console.log('='.repeat(50));
  
  for (const email of testUsers) {
    try {
      console.log(`\n👤 Checking user: ${email}`);
      
      // Convert email to username format (Cognito uses email as username but with underscores)
      const username = email.replace('@', '_').replace(/\./g, '_');
      
      try {
        // Check if user exists
        const userDetails = await cognito.adminGetUser({
          UserPoolId: userPoolId,
          Username: username
        }).promise();
        
        console.log('✅ User exists in Cognito');
        console.log(`   Username: ${userDetails.Username}`);
        console.log(`   Status: ${userDetails.UserStatus}`);
        
        // Check user groups
        const userGroups = await cognito.adminListGroupsForUser({
          UserPoolId: userPoolId,
          Username: username
        }).promise();
        
        console.log(`   Groups: ${userGroups.Groups.length} found`);
        userGroups.Groups.forEach(group => {
          console.log(`     • ${group.GroupName}: ${group.Description || 'No description'}`);
        });
        
        const isAdmin = userGroups.Groups.some(group => group.GroupName === 'admin');
        console.log(`   Is Admin: ${isAdmin ? 'YES' : 'NO'}`);
        
        if (!isAdmin) {
          console.log('🔧 Adding user to admin group...');
          await cognito.adminAddUserToGroup({
            UserPoolId: userPoolId,
            Username: username,
            GroupName: 'admin'
          }).promise();
          console.log('✅ User added to admin group');
        }
        
      } catch (userError) {
        if (userError.code === 'UserNotFoundException') {
          console.log('❌ User not found in Cognito');
          console.log('💡 User needs to sign up first');
        } else {
          console.log('❌ Error checking user:', userError.message);
        }
      }
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ User admin access check completed');
};

checkUserAdminAccess();