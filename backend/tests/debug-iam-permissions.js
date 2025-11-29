const { SESClient, GetSendQuotaCommand } = require("@aws-sdk/client-ses");
require('dotenv').config();

console.log('🔍 AWS IAM PERMISSIONS DEBUGGER');
console.log('================================');

async function debugIAMPermissions() {
  try {
    console.log('\n📋 1. Environment Configuration...');
    console.log(`   AWS_REGION: ${process.env.AWS_REGION}`);
    console.log(`   AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? '✅ Set (starts with: ' + process.env.AWS_ACCESS_KEY_ID.substring(0, 8) + '...)' : '❌ Missing'}`);
    console.log(`   AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Expected User: wiggyz-s3-uploader`);

    // Test SES permissions
    console.log('\n🔐 2. Testing SES Permissions...');
    const sesClient = new SESClient({ region: process.env.AWS_REGION });
    
    const permissions = [
      { action: 'ses:GetSendQuota', command: new GetSendQuotaCommand({}) },
    ];
    
    for (const perm of permissions) {
      try {
        console.log(`   Testing ${perm.action}...`);
        const result = await sesClient.send(perm.command);
        console.log(`   ✅ ${perm.action}: ALLOWED`);
        if (perm.action === 'ses:GetSendQuota') {
          console.log(`      Daily Quota: ${result.Max24HourSend}`);
          console.log(`      Send Rate: ${result.MaxSendRate}/sec`);
        }
      } catch (error) {
        console.log(`   ❌ ${perm.action}: DENIED`);
        console.log(`      Error: ${error.message}`);
      }
    }

    console.log('\n📋 3. Environment Configuration...');
    console.log(`   AWS_REGION: ${process.env.AWS_REGION}`);
    console.log(`   AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing'}`);
    console.log(`   AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing'}`);

    console.log('\n🔧 4. Troubleshooting Steps...');
    console.log('If SES permissions are still denied:');
    console.log('');
    console.log('OPTION 1: AWS Console Method');
    console.log('1. Go to: https://console.aws.amazon.com/iam/');
    console.log('2. Click "Users" → "wiggyz-s3-uploader"');
    console.log('3. Click "Permissions" tab');
    console.log('4. Click "Add permissions" → "Attach policies directly"');
    console.log('5. Search for "AmazonSESFullAccess" and attach it');
    console.log('6. Wait 2-3 minutes and test again');
    console.log('');
    console.log('OPTION 2: Custom Policy Method');
    console.log('1. In IAM Console, click "Create policy"');
    console.log('2. Select "JSON" tab');
    console.log('3. Copy content from backend/docs/SES_IAM_POLICY.json');
    console.log('4. Name it "CustomSESPolicy"');
    console.log('5. Attach to wiggyz-s3-uploader user');
    console.log('');
    console.log('OPTION 3: AWS CLI Method');
    console.log('aws iam attach-user-policy \\');
    console.log('  --user-name wiggyz-s3-uploader \\');
    console.log('  --policy-arn arn:aws:iam::aws:policy/AmazonSESFullAccess');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugIAMPermissions();