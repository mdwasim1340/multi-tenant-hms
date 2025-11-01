const { SESClient, GetSendQuotaCommand } = require("@aws-sdk/client-ses");
require('dotenv').config();

console.log('⏳ WAITING FOR SES PERMISSIONS TO PROPAGATE');
console.log('==========================================');
console.log('This script will check every 30 seconds until SES permissions are working...');
console.log('Press Ctrl+C to stop');

const sesClient = new SESClient({ region: process.env.AWS_REGION });

async function checkPermissions() {
  try {
    const response = await sesClient.send(new GetSendQuotaCommand({}));
    console.log('\n🎉 SUCCESS! SES permissions are now working!');
    console.log(`📊 Daily quota: ${response.Max24HourSend} emails`);
    console.log(`📈 Send rate: ${response.MaxSendRate} emails/second`);
    
    if (response.Max24HourSend <= 200) {
      console.log('\n⚠️  Your account is in SES Sandbox mode');
      console.log('Next steps:');
      console.log('1. Verify email addresses in SES Console');
      console.log('2. Request production access');
      console.log('3. Test email sending');
    }
    
    console.log('\n🧪 Ready to test! Run:');
    console.log('node tests/test-ses-setup.js');
    
    process.exit(0);
  } catch (error) {
    if (error.message.includes('not authorized')) {
      console.log(`❌ ${new Date().toLocaleTimeString()}: Still waiting for permissions...`);
      console.log('   Make sure you attached the SES policy to wiggyz-s3-uploader user');
    } else {
      console.log(`❌ Unexpected error: ${error.message}`);
    }
  }
}

// Check immediately
checkPermissions();

// Then check every 30 seconds
const interval = setInterval(checkPermissions, 30000);

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n👋 Stopping permission check...');
  clearInterval(interval);
  process.exit(0);
});