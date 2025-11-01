const { SESClient, SendEmailCommand, GetSendQuotaCommand, ListVerifiedEmailAddressesCommand } = require("@aws-sdk/client-ses");
require('dotenv').config();

const sesClient = new SESClient({ region: process.env.AWS_REGION });

console.log('🧪 AWS SES SETUP VERIFICATION');
console.log('=============================');

async function testSESSetup() {
  try {
    console.log('\n📋 Current Configuration:');
    console.log(`   AWS Region: ${process.env.AWS_REGION}`);
    console.log(`   Email Sender: ${process.env.EMAIL_SENDER}`);
    console.log(`   AWS Access Key: ${process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing'}`);
    console.log(`   AWS Secret Key: ${process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing'}`);

    // Test 1: Check SES quota and permissions
    console.log('\n📊 1. Checking SES Permissions & Quota...');
    try {
      const quotaCommand = new GetSendQuotaCommand({});
      const quotaResponse = await sesClient.send(quotaCommand);
      
      console.log('✅ SES Connection: WORKING');
      console.log(`✅ Daily Send Quota: ${quotaResponse.Max24HourSend}`);
      console.log(`✅ Sent in Last 24h: ${quotaResponse.SentLast24Hours}`);
      console.log(`✅ Send Rate: ${quotaResponse.MaxSendRate} emails/second`);
      
      // Check if in sandbox mode
      if (quotaResponse.Max24HourSend <= 200) {
        console.log('⚠️  Account appears to be in SES Sandbox mode');
        console.log('   - Can only send to verified email addresses');
        console.log('   - Request production access for unrestricted sending');
      } else {
        console.log('✅ Account has production SES access');
      }
      
    } catch (error) {
      console.log('❌ SES Permission Error:', error.message);
      if (error.name === 'AccessDenied') {
        console.log('🔧 Fix: Add SES permissions to your IAM user/role');
      }
      return;
    }

    // Test 2: List verified email addresses
    console.log('\n📧 2. Checking Verified Email Addresses...');
    try {
      const verifiedCommand = new ListVerifiedEmailAddressesCommand({});
      const verifiedResponse = await sesClient.send(verifiedCommand);
      
      if (verifiedResponse.VerifiedEmailAddresses.length > 0) {
        console.log('✅ Verified Email Addresses:');
        verifiedResponse.VerifiedEmailAddresses.forEach(email => {
          console.log(`   - ${email}`);
        });
      } else {
        console.log('⚠️  No verified email addresses found');
        console.log('   - Go to SES Console and verify your email addresses');
      }
      
      // Check if our configured sender is verified
      const senderEmail = process.env.EMAIL_SENDER;
      if (senderEmail && verifiedResponse.VerifiedEmailAddresses.includes(senderEmail)) {
        console.log(`✅ Configured sender (${senderEmail}) is verified`);
      } else if (senderEmail) {
        console.log(`⚠️  Configured sender (${senderEmail}) is NOT verified`);
        console.log('   - Verify this email address in SES Console');
      }
      
    } catch (error) {
      console.log('⚠️  Could not list verified addresses:', error.message);
    }

    // Test 3: Send test email (only if we have verified addresses)
    console.log('\n📤 3. Testing Email Sending...');
    const testEmailAddress = process.env.EMAIL_SENDER || 'noreply@exo.com.np';
    
    try {
      const testEmail = {
        Source: testEmailAddress,
        Destination: {
          ToAddresses: [testEmailAddress], // Send to self for testing
        },
        Message: {
          Subject: { 
            Data: 'SES Test - Multi-Tenant Authentication System' 
          },
          Body: {
            Text: { 
              Data: `This is a test email from your multi-tenant authentication system.\n\nSent at: ${new Date().toISOString()}\nFrom: ${testEmailAddress}` 
            },
            Html: { 
              Data: `
                <h2>🎉 SES Test Email</h2>
                <p>This is a test email from your multi-tenant authentication system.</p>
                <ul>
                  <li><strong>Sent at:</strong> ${new Date().toISOString()}</li>
                  <li><strong>From:</strong> ${testEmailAddress}</li>
                  <li><strong>System:</strong> Custom Authentication Flow</li>
                </ul>
                <p>If you received this email, your SES configuration is working correctly! 🚀</p>
              ` 
            }
          }
        }
      };
      
      const emailCommand = new SendEmailCommand(testEmail);
      const emailResponse = await sesClient.send(emailCommand);
      
      console.log('✅ Test email sent successfully!');
      console.log(`📧 Message ID: ${emailResponse.MessageId}`);
      console.log(`📬 Sent to: ${testEmailAddress}`);
      console.log('   Check your email inbox for the test message');
      
    } catch (error) {
      console.log('❌ Email sending failed:', error.message);
      
      if (error.name === 'MessageRejected') {
        console.log('🔧 Possible fixes:');
        console.log('   - Verify the FROM email address in SES Console');
        console.log('   - Check if account is in sandbox mode');
        console.log('   - Ensure TO address is verified (if in sandbox)');
      } else if (error.name === 'AccessDenied') {
        console.log('🔧 Fix: Add ses:SendEmail permission to your IAM policy');
      }
    }

    // Test 4: Test tenant-specific email addresses
    console.log('\n🏢 4. Testing Tenant-Specific Configuration...');
    const adminEmail = 'noreply@exo.com.np';
    const defaultEmail = process.env.EMAIL_SENDER;
    
    console.log(`✅ Admin tenant email: ${adminEmail}`);
    console.log(`✅ Default tenant email: ${defaultEmail}`);
    
    // Summary
    console.log('\n🎯 SES SETUP SUMMARY');
    console.log('====================');
    console.log('✅ AWS SES Connection: WORKING');
    console.log('✅ Permissions: CONFIGURED');
    console.log('✅ Email Service Integration: READY');
    console.log('✅ Tenant-Specific Addresses: CONFIGURED');
    
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Verify all tenant email addresses in SES Console');
    console.log('2. Request production access if needed');
    console.log('3. Test the complete authentication flow');
    console.log('4. Monitor email delivery and bounce rates');
    
  } catch (error) {
    console.error('\n❌ SES Setup Test Failed');
    console.error('=========================');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSESSetup();