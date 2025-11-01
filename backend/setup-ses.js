const { SESClient, VerifyEmailIdentityCommand, GetSendQuotaCommand } = require("@aws-sdk/client-ses");
const readline = require('readline');
require('dotenv').config();

const sesClient = new SESClient({ region: process.env.AWS_REGION });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 AWS SES QUICK SETUP WIZARD');
console.log('==============================');

async function setupSES() {
  try {
    // Check current SES status
    console.log('\n📊 Checking current SES configuration...');
    
    try {
      const quotaResponse = await sesClient.send(new GetSendQuotaCommand({}));
      console.log('✅ SES Connection: WORKING');
      console.log(`📈 Daily Quota: ${quotaResponse.Max24HourSend} emails`);
      
      if (quotaResponse.Max24HourSend <= 200) {
        console.log('⚠️  Your account is in SES Sandbox mode');
        console.log('   You can only send emails to verified addresses');
      }
    } catch (error) {
      console.log('❌ SES Connection failed:', error.message);
      console.log('\n🔧 Please check:');
      console.log('1. AWS credentials are configured correctly');
      console.log('2. IAM user has SES permissions');
      console.log('3. AWS region is correct');
      return;
    }

    // Get email addresses to verify
    console.log('\n📧 Email Address Verification');
    console.log('=============================');
    
    const emailsToVerify = [
      'noreply@exo.com.np', // Admin tenant
      process.env.EMAIL_SENDER || 'your-email@domain.com'
    ];

    console.log('The following email addresses need to be verified:');
    emailsToVerify.forEach((email, index) => {
      console.log(`${index + 1}. ${email}`);
    });

    const answer = await askQuestion('\nWould you like to send verification emails now? (y/n): ');
    
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      console.log('\n📤 Sending verification emails...');
      
      for (const email of emailsToVerify) {
        try {
          await sesClient.send(new VerifyEmailIdentityCommand({ EmailAddress: email }));
          console.log(`✅ Verification email sent to: ${email}`);
        } catch (error) {
          console.log(`❌ Failed to send verification to ${email}:`, error.message);
        }
      }
      
      console.log('\n📬 Check your email inboxes and click the verification links!');
    }

    // Production access information
    console.log('\n🚀 PRODUCTION ACCESS');
    console.log('===================');
    console.log('For production use, you need to:');
    console.log('1. Go to AWS SES Console → Account Dashboard');
    console.log('2. Click "Request production access"');
    console.log('3. Fill out the form with your use case');
    console.log('4. Wait for AWS approval (usually 24-48 hours)');

    // Configuration summary
    console.log('\n⚙️  CONFIGURATION SUMMARY');
    console.log('========================');
    console.log(`AWS Region: ${process.env.AWS_REGION}`);
    console.log(`Admin Email: noreply@exo.com.np`);
    console.log(`Default Email: ${process.env.EMAIL_SENDER}`);
    
    console.log('\n🧪 TESTING');
    console.log('==========');
    console.log('Run this command to test your SES setup:');
    console.log('node tests/test-ses-setup.js');
    
    console.log('\n🎉 SES Setup Complete!');
    console.log('After verifying your email addresses, your authentication system will be able to send:');
    console.log('✅ Email verification codes');
    console.log('✅ Password reset tokens');
    console.log('✅ Tenant-specific emails');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

setupSES();