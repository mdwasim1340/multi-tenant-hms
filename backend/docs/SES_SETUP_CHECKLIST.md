# 📋 AWS SES Setup Checklist

## 🎯 Current Status
- ✅ Custom authentication flow: IMPLEMENTED
- ✅ AWS credentials: CONFIGURED  
- ❌ SES permissions: MISSING
- ❌ Email addresses: NOT VERIFIED

## 🚀 Action Items (Complete in Order)

### 1. ⚡ URGENT: Add SES Permissions (5 minutes)

**Go to AWS IAM Console:**
1. Visit: https://console.aws.amazon.com/iam/
2. Navigate to "Users" → "wiggyz-s3-uploader"
3. Click "Add permissions" → "Attach policies directly"
4. Click "Create policy" → "JSON" tab
5. Copy policy from `backend/docs/SES_IAM_POLICY.json`
6. Name: "SESEmailSendingPolicy"
7. Attach to your user

**Test permissions:**
```bash
cd backend
node verify-ses-permissions.js
```

### 2. 📧 Verify Email Addresses (10 minutes)

**Go to AWS SES Console:**
1. Visit: https://console.aws.amazon.com/ses/
2. Ensure region is "US East (N. Virginia) us-east-1"
3. Go to "Configuration" → "Verified identities"
4. Click "Create identity" → "Email address"
5. Add: `noreply@exo.com.np`
6. Check email and click verification link

**Test email verification:**
```bash
cd backend
node tests/test-ses-setup.js
```

### 3. 🚀 Request Production Access (2 minutes to submit)

**In SES Console:**
1. Go to "Account dashboard"
2. Click "Request production access"
3. Fill form:
   - Use case: "User authentication emails"
   - Volume: "50-100 emails/day"
   - Website: Your app URL
4. Submit (AWS reviews in 24-48 hours)

### 4. 🧪 Test Complete Authentication Flow

**Run comprehensive tests:**
```bash
cd backend
node tests/test-custom-auth-flow.js
node tests/CUSTOM_AUTH_FLOW_REPORT.js
```

## 📊 Expected Results After Setup

### ✅ Working Features
- Email verification codes sent to users
- Password reset tokens delivered
- Tenant-specific FROM addresses
- HTML formatted emails
- Automatic code cleanup after use

### 📈 Email Capabilities
- **Sandbox Mode**: 200 emails/day to verified addresses
- **Production Mode**: 50,000+ emails/day to any address
- **Send Rate**: 1-14 emails/second (depending on mode)

## 🔧 Troubleshooting Commands

```bash
# Quick permission check
node verify-ses-permissions.js

# Full SES setup test
node tests/test-ses-setup.js

# Setup wizard
node setup-ses.js

# Test auth flow
node tests/test-custom-auth-flow.js
```

## 📞 Support Resources

- **AWS SES Console**: https://console.aws.amazon.com/ses/
- **IAM Console**: https://console.aws.amazon.com/iam/
- **Documentation**: `backend/docs/AWS_SES_SETUP_GUIDE.md`
- **Troubleshooting**: `backend/docs/SES_SETUP_INSTRUCTIONS.md`

## 🎉 Success Criteria

When setup is complete, you should see:
- ✅ SES Connection: WORKING
- ✅ Email Sending: WORKING  
- ✅ Authentication Flow: WORKING
- ✅ Tenant Isolation: WORKING

---

**⏱️ Total Setup Time: ~30 minutes (plus AWS review time for production access)**