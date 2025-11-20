# Staff Onboarding with Email Verification & Password Setup

**Date**: November 17, 2025  
**Feature**: Complete staff onboarding flow with email OTP verification  
**Status**: ✅ IMPLEMENTED

---

## Overview

The new staff onboarding system implements a secure 3-step process:

1. **Admin creates staff** → System sends verification email with OTP
2. **Staff verifies email** → System sends password setup link
3. **Staff sets password** → Account activated, ready to use

This ensures:
- ✅ Email addresses are verified
- ✅ Only the actual staff member can set their password
- ✅ Secure onboarding process
- ✅ No temporary passwords shared insecurely

---

## The 3-Step Onboarding Flow

### Step 1: Admin Creates Staff Member

**Endpoint**: `POST /api/staff` (requires admin authentication)

**Request**:
```json
{
  "name": "Dr. John Doe",
  "email": "john.doe@hospital.com",
  "role": "Doctor",
  "employee_id": "EMP001",
  "department": "Cardiology",
  "specialization": "Interventional Cardiology",
  "hire_date": "2025-01-01",
  "employment_type": "full-time"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Staff member created successfully. Verification email sent to john.doe@hospital.com",
  "data": {
    "user_id": 123,
    "email": "john.doe@hospital.com",
    "name": "Dr. John Doe",
    "otp_sent": true
  },
  "onboarding_required": true
}
```

**What Happens**:
1. User account created with status `pending_verification`
2. Staff profile created
3. Role assigned
4. 6-digit OTP generated (expires in 15 minutes)
5. Email sent to staff member with OTP

**Email Sent to Staff**:
```
Subject: Welcome to the Team - Verify Your Email

Hello Dr. John Doe,

Welcome to our hospital management system! Your account has been created.

To complete your registration and set up your password, please verify your 
email address using the code below:

Verification Code: 123456

This code will expire in 15 minutes.

After verifying your email, you'll be able to set up your password and 
access the system.

Your Account Details:
- Email: john.doe@hospital.com
- Employee ID: EMP001
- Role: Doctor
- Department: Cardiology

If you did not expect this email, please contact your system administrator.

Best regards,
Hospital Management Team
```

---

### Step 2: Staff Verifies Email with OTP

**Endpoint**: `POST /api/staff-onboarding/verify-otp` (public, no auth required)

**Request**:
```json
{
  "email": "john.doe@hospital.com",
  "otp": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Email verified successfully. Password setup link sent to your email.",
  "data": {
    "reset_token": "abc123def456...",
    "email": "john.doe@hospital.com"
  }
}
```

**What Happens**:
1. OTP validated (checks if expired, already used, or invalid)
2. Email marked as verified
3. Password reset token generated (expires in 24 hours)
4. Email sent with password setup link

**Email Sent to Staff**:
```
Subject: Set Up Your Password

Hello Dr. John Doe,

Your email has been verified successfully!

Now you need to set up your password to access the system.

Click the link below to set your password:
http://localhost:3001/auth/set-password?token=abc123def456...

This link will expire in 24 hours.

If you did not request this, please contact your system administrator immediately.

Best regards,
Hospital Management Team
```

---

### Step 3: Staff Sets Password

**Endpoint**: `POST /api/staff-onboarding/set-password` (public, no auth required)

**Request**:
```json
{
  "token": "abc123def456...",
  "password": "SecurePassword123!"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Password set successfully. You can now log in.",
  "data": {
    "email": "john.doe@hospital.com"
  }
}
```

**What Happens**:
1. Token validated (checks if expired or invalid)
2. Password hashed with bcrypt
3. User status changed to `active`
4. Reset token cleared
5. Welcome email sent

**Email Sent to Staff**:
```
Subject: Welcome! Your Account is Ready

Hello Dr. John Doe,

Your password has been set successfully! Your account is now active.

You can now log in to the hospital management system using:
- Email: john.doe@hospital.com
- Password: (the password you just created)

Login URL: http://localhost:3001/auth/login

If you have any questions or need assistance, please contact your 
system administrator.

Best regards,
Hospital Management Team
```

---

## Additional Features

### Resend OTP

If the staff member didn't receive the OTP or it expired:

**Endpoint**: `POST /api/staff-onboarding/resend-otp` (public)

**Request**:
```json
{
  "email": "john.doe@hospital.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "New verification code sent to your email"
}
```

---

## Database Schema

### user_verification Table

```sql
CREATE TABLE user_verification (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  verification_code VARCHAR(10),           -- 6-digit OTP
  expires_at TIMESTAMP,                    -- OTP expiration (15 minutes)
  verified_at TIMESTAMP,                   -- When email was verified
  reset_token VARCHAR(255),                -- Password setup token
  reset_token_expires_at TIMESTAMP,        -- Token expiration (24 hours)
  verification_type VARCHAR(50),           -- 'staff_onboarding', 'password_reset', etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);
```

### User Status Flow

```
pending_verification → (email verified) → (password set) → active
```

---

## Security Features

### 1. OTP Security
- ✅ 6-digit random code
- ✅ Expires in 15 minutes
- ✅ One-time use only
- ✅ Stored securely in database
- ✅ Can be resent if expired

### 2. Password Setup Token Security
- ✅ 64-character random hex string
- ✅ Expires in 24 hours
- ✅ One-time use only
- ✅ Cleared after password is set
- ✅ Cannot be reused

### 3. Password Requirements
- ✅ Minimum 8 characters
- ✅ Hashed with bcrypt (10 rounds)
- ✅ Never stored in plain text
- ✅ Never sent via email

### 4. Email Verification
- ✅ Ensures email address is valid
- ✅ Confirms staff member received the email
- ✅ Prevents typos in email addresses
- ✅ Required before password setup

---

## Frontend Implementation

### 1. Admin Creates Staff (Existing Form)

The existing staff creation form works as-is. After submission:

```typescript
// In staff creation page
const handleSubmit = async (data: any) => {
  try {
    const result = await createStaff(data);
    
    if (result.onboarding_required) {
      toast.success(
        `Staff member created! Verification email sent to ${data.email}`,
        { duration: 8000 }
      );
      
      // Show info about next steps
      toast.info(
        'The staff member will receive an email with instructions to verify their email and set up their password.',
        { duration: 10000 }
      );
    }
    
    router.push('/staff');
  } catch (error: any) {
    toast.error(error.message);
  }
};
```

### 2. Email Verification Page (New)

**File**: `hospital-management-system/app/auth/verify-email/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/staff-onboarding/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Email verified! Redirecting to password setup...');
        router.push(`/auth/set-password?token=${data.data.reset_token}`);
      } else {
        toast.error(data.error);
      }
    } catch (error: any) {
      toast.error('Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const response = await fetch('/api/staff-onboarding/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('New verification code sent!');
      } else {
        toast.error(data.error);
      }
    } catch (error: any) {
      toast.error('Failed to resend code');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="text-3xl font-bold">Verify Your Email</h2>
          <p className="mt-2 text-gray-600">
            We sent a 6-digit code to {email}
          </p>
        </div>
        
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Enter 6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            className="w-full px-4 py-2 border rounded"
          />
          
          <button
            onClick={handleVerify}
            disabled={isLoading || otp.length !== 6}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </button>
          
          <button
            onClick={handleResend}
            className="w-full text-blue-600"
          >
            Resend Code
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 3. Set Password Page (New)

**File**: `hospital-management-system/app/auth/set-password/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export default function SetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSetPassword = async () => {
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/staff-onboarding/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Password set successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else {
        toast.error(data.error);
      }
    } catch (error: any) {
      toast.error('Failed to set password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="text-3xl font-bold">Set Your Password</h2>
          <p className="mt-2 text-gray-600">
            Create a secure password for your account
          </p>
        </div>
        
        <div className="space-y-4">
          <input
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded"
          />
          
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded"
          />
          
          <button
            onClick={handleSetPassword}
            disabled={isLoading || !password || !confirmPassword}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            {isLoading ? 'Setting Password...' : 'Set Password'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## API Endpoints Summary

| Endpoint | Method | Auth Required | Purpose |
|----------|--------|---------------|---------|
| `/api/staff` | POST | ✅ Yes (Admin) | Create staff & send verification email |
| `/api/staff-onboarding/verify-otp` | POST | ❌ No | Verify email with OTP |
| `/api/staff-onboarding/set-password` | POST | ❌ No | Set password with token |
| `/api/staff-onboarding/resend-otp` | POST | ❌ No | Resend verification OTP |

---

## Testing the Flow

### Test 1: Complete Onboarding Flow ✅

```bash
# Step 1: Admin creates staff
curl -X POST http://localhost:3000/api/staff \
  -H "Authorization: Bearer admin_token" \
  -H "X-Tenant-ID: tenant_id" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Test",
    "email": "test@hospital.com",
    "role": "Doctor",
    "employee_id": "TEST001",
    "department": "Cardiology",
    "hire_date": "2025-01-01"
  }'

# Step 2: Staff verifies email (check email for OTP)
curl -X POST http://localhost:3000/api/staff-onboarding/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@hospital.com",
    "otp": "123456"
  }'

# Step 3: Staff sets password (use token from step 2)
curl -X POST http://localhost:3000/api/staff-onboarding/set-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123def456...",
    "password": "SecurePassword123!"
  }'

# Step 4: Staff logs in
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@hospital.com",
    "password": "SecurePassword123!"
  }'
```

---

## Benefits

### For Security
- ✅ Email addresses verified before account activation
- ✅ No temporary passwords shared via insecure channels
- ✅ Only the actual staff member can set their password
- ✅ Time-limited tokens prevent unauthorized access
- ✅ One-time use codes prevent replay attacks

### For Staff Members
- ✅ Professional onboarding experience
- ✅ Control over their own password
- ✅ Clear step-by-step instructions
- ✅ Can resend codes if needed
- ✅ 24 hours to complete setup

### For Administrators
- ✅ No need to share temporary passwords
- ✅ Automated email notifications
- ✅ Audit trail of onboarding steps
- ✅ Reduced support burden
- ✅ Professional system image

---

## Environment Variables Required

```env
# Email Service (AWS SES)
SES_FROM_EMAIL=noreply@hospital.com
AWS_REGION=us-east-1

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:3001
```

---

## Conclusion

The new staff onboarding system provides a secure, professional, and user-friendly way to add new staff members to the hospital management system. It ensures email verification, secure password setup, and a great first impression for new team members.

---

**Status**: ✅ IMPLEMENTED  
**Security**: ✅ Email verified, secure password setup  
**User Experience**: ✅ Professional onboarding flow  
**Ready for**: Production deployment
