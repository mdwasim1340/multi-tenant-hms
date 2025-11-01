# Admin Dashboard OTP Password Reset - Usage Guide

## ✅ System Status: FULLY OPERATIONAL

**Date**: November 1, 2025  
**Status**: Complete OTP-based password reset flow implemented and working  

## How to Use the OTP Password Reset

### Step 1: Access the Reset Page
1. Navigate to the admin dashboard: `http://localhost:3002`
2. Click "Forgot password?" link on the sign-in page
3. Or go directly to: `http://localhost:3002/auth/forgot-password`

### Step 2: Enter Your Email Address
1. Enter your email address in the "Email Address" field
2. Click "Send Verification Code" button
3. Wait for the success message

**Note**: Only verified email addresses will work (due to SES sandbox mode)
- ✅ Working: `noreply@exo.com.np` (verified in SES)
- ❌ Blocked: Unverified emails will show helpful error message

### Step 3: Check Your Email
1. Check your email inbox for a message with subject "Reset your password"
2. Look for the 6-character verification code (e.g., "A1B2C3")
3. The email will say: "Your password reset token is: [CODE]"

### Step 4: Enter OTP and New Password
After submitting your email, the page will automatically switch to show:

1. **Verification Code Field**
   - Enter the 6-character code from your email
   - Code is automatically converted to uppercase
   - Example: "a1b2c3" becomes "A1B2C3"

2. **New Password Field**
   - Enter your new password (minimum 8 characters)
   - Must meet security requirements

3. **Confirm Password Field**
   - Re-enter your new password to confirm
   - Must match the new password exactly

4. Click "Reset Password" button

### Step 5: Success Confirmation
1. You'll see a success message: "Password Reset Successful!"
2. Click "Continue to Sign In" button
3. Sign in with your email and new password

## UI Flow Screenshots Description

### Screen 1: Email Input
```
┌─────────────────────────────────────┐
│           Reset Password            │
│  Enter your email address to       │
│  receive a verification code        │
│                                     │
│  Email Address                      │
│  [📧 admin@example.com        ]     │
│                                     │
│  [Send Verification Code]           │
│                                     │
│  ← Back to Sign In                  │
└─────────────────────────────────────┘
```

### Screen 2: OTP + Password Input
```
┌─────────────────────────────────────┐
│       Enter Verification Code       │
│  Check your email for the           │
│  verification code and enter your   │
│  new password                       │
│                                     │
│  We've sent a verification code to  │
│  noreply@exo.com.np                │
│  Check your email and enter the     │
│  code below along with your new     │
│  password.                          │
│                                     │
│  Verification Code                  │
│  [🔑    A B C 1 2 3         ]      │
│                                     │
│  New Password                       │
│  [🔒 ••••••••••••••••••••••  ]      │
│                                     │
│  Confirm New Password               │
│  [🔒 ••••••••••••••••••••••  ]      │
│                                     │
│  [Reset Password]                   │
│  [Back to Email]                    │
│                                     │
│  ← Back to Sign In                  │
└─────────────────────────────────────┘
```

### Screen 3: Success
```
┌─────────────────────────────────────┐
│      Password Reset Complete        │
│  Your password has been             │
│  successfully reset                 │
│                                     │
│           ✅                        │
│                                     │
│    Password Reset Successful!       │
│                                     │
│  Your password has been             │
│  successfully reset. You can now    │
│  sign in with your new password.    │
│                                     │
│  [Continue to Sign In]              │
└─────────────────────────────────────┘
```

## Error Handling

### Unverified Email Address
```
❌ This email address is not verified in our system. 
   Please contact your administrator or use a verified email address.
```

### Invalid OTP Code
```
❌ Invalid or expired verification code. 
   Please check your email and try again.
```

### Password Mismatch
```
❌ Passwords do not match
```

### Weak Password
```
❌ Password must be at least 8 characters long
```

## Technical Details

### Backend Integration
- **Email Request**: `POST /auth/forgot-password` with `X-Tenant-ID: admin`
- **Password Reset**: `POST /auth/reset-password` with email, code, and newPassword
- **OTP Generation**: 6-character alphanumeric codes (e.g., "A1B2C3")
- **OTP Expiration**: 1 hour from generation
- **Database Cleanup**: OTP codes are automatically removed after successful use

### Security Features
- Single-use OTP codes
- Automatic code expiration
- Password strength validation
- Secure transmission to AWS Cognito
- Database cleanup on completion

### Email Integration
- **Service**: AWS SES (Simple Email Service)
- **From Address**: `noreply@exo.com.np` (for admin tenant)
- **Subject**: "Reset your password"
- **Content**: "Your password reset token is: [CODE]"

## Troubleshooting

### OTP Input Not Visible
1. **Clear browser cache** and refresh the page
2. **Check browser console** for JavaScript errors
3. **Verify admin dashboard** is running on port 3002
4. **Ensure backend** is running on port 3000
5. **Try a hard refresh** (Ctrl+F5 or Cmd+Shift+R)

### Email Not Received
1. **Check spam folder** for the reset email
2. **Verify email address** is correct and verified in SES
3. **Wait a few minutes** for email delivery
4. **Contact administrator** to verify email in AWS SES Console

### Reset Not Working
1. **Check OTP code** is entered correctly (case-insensitive)
2. **Verify OTP hasn't expired** (1-hour limit)
3. **Ensure passwords match** and meet requirements
4. **Try requesting a new OTP** if current one has expired

## Administrator Setup

### For Production Use
1. **Move SES out of sandbox mode** to allow any email address
2. **Verify specific email addresses** in AWS SES Console for sandbox mode
3. **Configure proper DNS records** for email domain
4. **Monitor email delivery** through SES dashboard

### Current Configuration
- **SES Mode**: Sandbox (verified addresses only)
- **Verified Email**: `noreply@exo.com.np`
- **Region**: `us-east-1`
- **OTP Length**: 6 characters
- **OTP Expiration**: 1 hour

## Status Summary

✅ **FULLY FUNCTIONAL**: The admin dashboard OTP-based password reset is completely operational with:
- Multi-step user interface
- Email integration through AWS SES  
- Secure OTP generation and validation
- Comprehensive error handling
- User-friendly feedback messages
- Proper database cleanup
- Security best practices implemented

Users can now successfully reset their passwords using the verification codes sent to their email addresses.