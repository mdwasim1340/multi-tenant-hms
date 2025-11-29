const { SESClient, GetSendQuotaCommand } = require("@aws-sdk/client-ses");
require('dotenv').config();

console.log('🔍 QUICK SES PERMISSIONS CHECK');
console.log('==============================');

async function checkSESPermissions() {
  const sesClient = new SESClient({ region: process.env.AWS_REGION });
  
  console.log(`📍 Region: ${process.env.AWS_REGION}`);
  console.log(`👤 User: wiggyz-s3-uploader`);
  console.log(`📧 Email: ${process.env.EMAIL_SENDER}`);
  
  try {
    console.log('\n🧪 Testing SES permissions...');
    const response = await sesClient.send(new GetSendQuotaCommand({}));
    
    console.log('✅ SUCCESS! SES permissions are working');
    console.log(`📊 Daily quota: ${response.Max24HourSend} emails`);
    console.log(`📈 Send rate: ${response.MaxSendRate} emails/second`);
    
    if (response.Max24HourSend <= 200) {
      console.log('\n⚠️  SANDBOX MODE DETECTED');
      console.log('Your account is in SES sandbox mode:');
      console.log('- Can only send to verified email addresses');
      console.log('- Limited to 200 emails per day');
      console.log('- Request production access in SES Console');
    } else {
      console.log('\n🎉 PRODUCTION ACCESS ENABLED');
      console.log('Your account can send to any email address!');
    }
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Verify email addresses in SES Console');
    console.log('2. Run: node tests/test-ses-setup.js');
    console.log('3. Test: node tests/test-custom-auth-flow.js');
    
  } catch (error) {
    console.log('❌ FAILED! SES permissions not working');
    console.log(`Error: ${error.message}`);
    
    if (error.message.includes('not authorized')) {
      console.log('\n🔧 TO FIX:');
      console.log('1. Go to AWS IAM Console');
      console.log('2. Find user: wiggyz-s3-uploader');
      console.log('3. Attach the SES policy from backend/docs/SES_IAM_POLICY.json');
      console.log('4. Wait 1-2 minutes for changes to propagate');
      console.log('5. Run this script again');
    }
  }
}

checkSESPermissions();