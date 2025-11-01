# AWS SES Setup Guide for Multi-Tenant Authentication

## 🎯 Overview

This guide will help you set up AWS Simple Email Service (SES) for the custom authentication flow, including tenant-specific FROM addresses and email verification.

## 📋 Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Domain ownership verification (for production)
- Access to your DNS settings

## 🔧 Step 1: AWS SES Console Setup

### 1.1 Access AWS SES Console
1. Go to [AWS SES Console](https://console.aws.amazon.com/ses/)
2. Select your preferred region (currently using `us-east-1`)
3. Navigate to "Configuration" → "Verified identities"

### 1.2 Verify Email Addresses (Development)
For development and testing:

```bash
# Add these email addresses in SES Console:
- noreply@exo.com.np (for admin tenant)
- your-development-email@domain.com (for testing)
```

**Steps:**
1. Click "Create identity"
2. Select "Email address"
3. Enter: `noreply@exo.com.np`
4. Click "Create identity"
5. Check email and click verification link

### 1.3 Verify Domain (Production)
For production with custom domains:

1. Click "Create identity"
2. Select "Domain"
3. Enter your domain: `exo.com.np`
4. Enable "Generate DKIM settings"
5. Add the provided DNS records to your domain

## 🔐 Step 2: IAM Permissions Setup

### 2.1 Create SES Policy
Create an IAM policy for SES access:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ses:SendEmail",
                "ses:SendRawEmail",
                "ses:GetSendQuota",
                "ses:GetSendStatistics"
            ],
            "Resource": "*"
        }
    ]
}
```

### 2.2 Attach Policy to User/Role
1. Go to IAM Console
2. Find your user/role used by the application
3. Attach the SES policy created above

## 📧 Step 3: Configure Email Templates

### 3.1 Create SES Templates (Optional)
You can create reusable email templates:

```bash
# AWS CLI command to create verification template
aws ses create-template --template '{
    "TemplateName": "EmailVerification",
    "Subject": "Verify your email address",
    "HtmlPart": "<h1>Email Verification</h1><p>Your verification code is: <strong>{{code}}</strong></p>",
    "TextPart": "Your verification code is: {{code}}"
}'
```

## 🚀 Step 4: Environment Configuration

### 4.1 Update .env File
Add these variables to your `backend/.env`:

```env
# AWS SES Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here

# Email Configuration
EMAIL_SENDER=noreply@exo.com.np
SES_CONFIGURATION_SET=default (optional)

# Tenant-specific email addresses
ADMIN_EMAIL_SENDER=noreply@exo.com.np
DEFAULT_EMAIL_SENDER=noreply@yourdomain.com
```

### 4.2 Verify Current Configuration
Your current `.env` already has AWS credentials. Verify they have SES permissions.

## 🧪 Step 5: Testing SES Setup

### 5.1 Create SES Test Script
Let me
 create a test script to verify your SES setup:

```javascript
// backend/tests/test-ses-setup.js
const { SESClient, SendEmailCommand, GetSendQuotaCommand } = require("@aws-sdk/client-ses");
require('dotenv').config();

const sesClient = new SESClient({ region: process.env.AWS_REGION });

async function testSESSetup() {
  console.log('🧪 Testing AWS SES Setup');
  console.log('========================');
  
  try {
    // Test 1: Check SES quota
    console.log('\n📊 1. Checking SES Send Quota...');
    const quotaCommand = new GetSendQuotaCommand({});
    const quotaResponse = await sesClient.send(quotaCommand);
    
    console.log(`✅ Daily Send Quota: ${quotaResponse.Max24HourSend}`);
    console.log(`✅ Sent in Last 24h: ${quotaResponse.SentLast24Hours}`);
    console.log(`✅ Send Rate: ${quotaResponse.MaxSendRate} emails/second`);
    
    // Test 2: Send test email
    console.log('\n📧 2. Sending Test Email...');
    const testEmail = {
      Source: process.env.EMAIL_SENDER || 'noreply@exo.com.np',
      Destination: {
        ToAddresses: [process.env.EMAIL_SENDER || 'noreply@exo.com.np'], // Send to self for testing
      },
      Message: {
        Subject: { Data: 'SES Test Email' },
        Body: {
          Text: { Data: 'This is a test email from your multi-tenant authentication system.' },
          Html: { Data: '<h1>SES Test</h1><p>This is a test email from your multi-tenant authentication system.</p>' }
        }
      }
    };
    
    const emailCommand = new SendEmailCommand(testEmail);
    const emailResponse = await sesClient.send(emailCommand);
    
    console.log(`✅ Test email sent successfully!`);
    console.log(`📧 Message ID: ${emailResponse.MessageId}`);
    
    console.log('\n🎉 SES Setup Test Results');
    console.log('=========================');
    console.log('✅ AWS SES Connection: WORKING');
    console.log('✅ Send Permissions: WORKING');
    console.log('✅ Email Delivery: WORKING');
    
  } catch (error) {
    console.error('\n❌ SES Setup Test Failed');
    console.error('=========================');
    console.error('Error:', error.message);
    
    if (error.name === 'MessageRejected') {
      console.error('🚨 Email was rejected. Check:');
      console.error('   - Email address is verified in SES');
      console.error('   - Account is out of SES sandbox');
    } else if (error.name === 'AccessDenied') {
      console.error('🚨 Access denied. Check:');
      console.error('   - AWS credentials have SES permissions');
      console.error('   - IAM policy includes ses:SendEmail');
    }
  }
}

testSESSetup();
```

## 🔧 Step 6: Sandbox vs Production

### 6.1 SES Sandbox Limitations
By default, SES accounts are in "sandbox mode":
- ❌ Can only send to verified email addresses
- ❌ Limited to 200 emails per day
- ❌ 1 email per second send rate

### 6.2 Request Production Access
To send to any email address:

1. Go to SES Console → "Account dashboard"
2. Click "Request production access"
3. Fill out the form with:
   - **Use case**: Transactional emails for user authentication
   - **Website URL**: Your application URL
   - **Expected volume**: Estimate daily emails
   - **Bounce/complaint handling**: Describe your process

## 🏢 Step 7: Tenant-Specific Configuration

### 7.1 Configure Multiple FROM Addresses
For different tenants, verify additional email addresses:

```bash
# Verify these in SES Console:
- admin@exo.com.np (for admin tenant)
- noreply@tenant1.com (for tenant1)
- support@tenant2.com (for tenant2)
```

### 7.2 Update Email Service
Your current email service already supports tenant-specific FROM addresses:

```typescript
// In auth.ts service
const fromEmail = tenantId === 'admin' ? 'noreply@exo.com.np' : process.env.EMAIL_SENDER;
```

## 🚨 Step 8: Troubleshooting Common Issues

### 8.1 "Email address not verified" Error
**Solution**: Verify the FROM email address in SES Console

### 8.2 "AccessDenied" Error
**Solution**: Check IAM permissions for SES actions

### 8.3 "MessageRejected" Error
**Solution**: Account might be in sandbox mode - request production access

### 8.4 "Throttling" Error
**Solution**: Implement retry logic or reduce send rate

## 📊 Step 9: Monitoring and Logging

### 9.1 Enable SES Event Publishing
1. Go to SES Console → "Configuration" → "Configuration sets"
2. Create a configuration set
3. Add event destinations (CloudWatch, SNS, etc.)

### 9.2 Monitor Email Metrics
Track:
- ✅ Delivery rate
- ❌ Bounce rate
- 🚫 Complaint rate
- 📊 Open rate (if tracking enabled)

## 🔐 Step 10: Security Best Practices

### 10.1 Use IAM Roles (Recommended)
Instead of access keys, use IAM roles for EC2/Lambda

### 10.2 Rotate Access Keys
Regularly rotate AWS access keys

### 10.3 Monitor Usage
Set up CloudWatch alarms for unusual sending patterns

## 🎯 Quick Setup Checklist

- [ ] Verify email addresses in SES Console
- [ ] Configure IAM permissions for SES
- [ ] Update environment variables
- [ ] Test email sending with test script
- [ ] Request production access (if needed)
- [ ] Configure tenant-specific FROM addresses
- [ ] Set up monitoring and logging

## 📞 Support Resources

- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [SES API Reference](https://docs.aws.amazon.com/ses/latest/APIReference/)
- [SES Troubleshooting Guide](https://docs.aws.amazon.com/ses/latest/DeveloperGuide/troubleshoot.html)

---

**🎉 Once configured, your custom authentication flow will have:**
- ✅ Working email verification
- ✅ Password reset emails
- ✅ Tenant-specific FROM addresses
- ✅ Production-ready email delivery