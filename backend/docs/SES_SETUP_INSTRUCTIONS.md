# 🚨 IMMEDIATE ACTION REQUIRED: SES Permissions Setup

## Current Issue
Your AWS user `wiggyz-s3-uploader` doesn't have SES permissions. Here's how to fix it:

## 🔧 Step 1: Add SES Permissions to Your IAM User

### Option A: Using AWS Console (Recommended)

1. **Go to AWS IAM Console**
   - Visit: https://console.aws.amazon.com/iam/
   - Navigate to "Users" → "wiggyz-s3-uploader"

2. **Create SES Policy**
   - Click "Add permissions" → "Attach policies directly"
   - Click "Create policy"
   - Select "JSON" tab
   - Copy and paste the policy from `backend/docs/SES_IAM_POLICY.json`
   - Name it: `SESEmailSendingPolicy`
   - Click "Create policy"

3. **Attach Policy to User**
   - Go back to your user "wiggyz-s3-uploader"
   - Click "Add permissions" → "Attach policies directly"
   - Search for "SESEmailSendingPolicy"
   - Select it and click "Add permissions"

### Option B: Using AWS CLI

```bash
# Create the policy
aws iam create-policy \
    --policy-name SESEmailSendingPolicy \
    --policy-document file://backend/docs/SES_IAM_POLICY.json

# Attach policy to user (replace ACCOUNT-ID with your AWS account ID)
aws iam attach-user-policy \
    --user-name wiggyz-s3-uploader \
    --policy-arn arn:aws:iam::276209672601:policy/SESEmailSendingPolicy
```

## 🔧 Step 2: Verify Email Addresses in SES

1. **Go to AWS SES Console**
   - Visit: https://console.aws.amazon.com/ses/
   - Make sure you're in the `us-east-1` region

2. **Verify Email Addresses**
   - Go to "Configuration" → "Verified identities"
   - Click "Create identity"
   - Select "Email address"
   - Add: `noreply@exo.com.np`
   - Click "Create identity"
   - Check your email and click the verification link

3. **Verify Additional Addresses** (if needed)
   - Add any other email addresses you plan to use
   - Each FROM address must be verified

## 🔧 Step 3: Request Production Access (Important!)

Your account is likely in SES Sandbox mode, which means:
- ❌ Can only send to verified email addresses
- ❌ Limited to 200 emails per day

**To fix this:**
1. Go to SES Console → "Account dashboard"
2. Click "Request production access"
3. Fill out the form:
   - **Use case**: "Transactional emails for user authentication in multi-tenant application"
   - **Website URL**: Your application URL
   - **Expected volume**: "50-100 emails per day for user verification and password resets"
   - **Bounce handling**: "We monitor bounce rates and remove invalid addresses"

## 🧪 Step 4: Test the Setup

After completing the above steps, run:

```bash
cd backend
node tests/test-ses-setup.js
```

You should see:
- ✅ SES Connection: WORKING
- ✅ Permissions: CONFIGURED
- ✅ Email sending: WORKING

## 🚀 Step 5: Test Authentication Flow

Once SES is working, test the complete authentication flow:

```bash
cd backend
node tests/test-custom-auth-flow.js
```

## ⏱️ Expected Timeline

- **IAM Policy**: Immediate (5 minutes)
- **Email Verification**: Immediate (check your email)
- **Production Access**: 24-48 hours (AWS review)

## 🆘 If You Need Help

If you encounter issues:

1. **Check IAM Policy**: Ensure all SES actions are allowed
2. **Verify Region**: Make sure you're using `us-east-1`
3. **Check Email**: Verify the FROM addresses in SES Console
4. **Test Permissions**: Run `node tests/test-ses-setup.js`

## 📞 Quick Support Commands

```bash
# Test SES setup
node tests/test-ses-setup.js

# Run SES setup wizard
node setup-ses.js

# Test complete auth flow
node tests/test-custom-auth-flow.js
```

---

**🎯 Once completed, your authentication system will be able to send:**
- ✅ Email verification codes
- ✅ Password reset tokens  
- ✅ Tenant-specific emails
- ✅ Production-ready email delivery