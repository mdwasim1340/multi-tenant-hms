# Authentication Fix Guide

## 🔧 Issues Fixed

### 1. CORS Error: "Not allowed by CORS"
**Problem:** Backend was blocking requests from subdomain origins (e.g., `aajminpolyclinic.localhost:3001`)

**Solution:** Updated backend to allow subdomain origins in both CORS and app authentication middleware.

### 2. Missing Credentials in CORS Requests
**Problem:** Cookies weren't being sent with cross-origin requests

**Solution:** Added `withCredentials: true` to axios configuration.

### 3. No Test Users Available
**Problem:** Demo credentials removed, but no real users exist for testing

**Solution:** Created script to easily create test users in AWS Cognito.

---

## ✅ Changes Made

### 1. Updated API Client (`hospital-management-system/lib/api.ts`)
```typescript
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  withCredentials: true, // ✅ NEW: Enable sending cookies with CORS requests
});
```

### 2. Updated App Auth Middleware (`backend/src/middleware/appAuth.ts`)
```typescript
// ✅ NEW: Check if origin is a valid subdomain
const isValidSubdomainOrigin = (origin: string): boolean => {
  try {
    const url = new URL(origin);
    return url.hostname.endsWith('.localhost') && 
           (url.port === '3001' || url.port === '3002' || url.port === '3003');
  } catch {
    return false;
  }
};

// ✅ NEW: Allow requests from subdomain origins
if (origin && isValidSubdomainOrigin(origin)) {
  return next();
}
```

### 3. Created Test User Script (`backend/scripts/create-test-user.js`)
Easy script to create test users in AWS Cognito.

---

## 🚀 Quick Fix Steps

### Step 1: Restart Backend
The backend needs to reload with the updated middleware:

```bash
# Stop backend (Ctrl+C)
cd backend
npm run dev
```

### Step 2: Create Test User

```bash
cd backend
node scripts/create-test-user.js
```

**Default credentials created:**
- Email: `test@hospital.com`
- Password: `Test123!@#`
- Name: `Test User`

**Or create custom user:**
```bash
node scripts/create-test-user.js doctor@hospital.com Doctor123! "Dr. John Doe"
```

### Step 3: Test Login

1. Open: `http://localhost:3001/auth/login`
2. Or: `http://aajminpolyclinic.localhost:3001/auth/login`
3. Enter credentials:
   - Email: `test@hospital.com`
   - Password: `Test123!@#`
4. Click "Sign In"

**Expected Result:**
- ✅ No CORS errors
- ✅ Successful authentication
- ✅ Redirect to dashboard
- ✅ Token stored in cookies

---

## 🧪 Verification Checklist

### Backend Verification
- [ ] Backend running on port 3000
- [ ] No CORS errors in backend console
- [ ] Auth endpoints accessible (`/auth/signin`)
- [ ] Subdomain resolution working (`/api/tenants/by-subdomain/:subdomain`)

### Frontend Verification
- [ ] Frontend running on port 3001
- [ ] Login page loads without errors
- [ ] Can enter email and password
- [ ] Submit button works
- [ ] No CORS errors in browser console

### Authentication Flow
- [ ] Can login with test credentials
- [ ] Token stored in cookies (check DevTools → Application → Cookies)
- [ ] Redirects to dashboard after login
- [ ] Dashboard loads successfully
- [ ] API requests include Authorization header
- [ ] Can logout successfully

---

## 🐛 Troubleshooting

### Still Getting CORS Errors?

**Check 1: Backend is running**
```bash
# Should see: "Server is running on port 3000"
cd backend
npm run dev
```

**Check 2: Frontend origin**
Open browser console and check the request origin:
- Should be: `http://localhost:3001` or `http://aajminpolyclinic.localhost:3001`
- Not: `http://127.0.0.1:3001` (use localhost, not 127.0.0.1)

**Check 3: Clear browser cache**
```
1. Open DevTools
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"
```

---

### "Incorrect username or password"?

**This is expected!** You need to create a test user first.

**Solution:**
```bash
cd backend
node scripts/create-test-user.js
```

Then login with:
- Email: `test@hospital.com`
- Password: `Test123!@#`

---

### "Invalid response from server"?

**Check backend logs** for the actual error:
```bash
# Look for error messages in backend console
# Common issues:
# - AWS Cognito not configured
# - Missing environment variables
# - Database connection issues
```

**Verify environment variables:**
```bash
cd backend
cat .env | grep COGNITO
```

Should see:
```
COGNITO_USER_POOL_ID=...
COGNITO_CLIENT_ID=...
AWS_REGION=...
```

---

### Token not stored in cookies?

**Check cookie settings:**
1. Open DevTools → Application → Cookies
2. Look for `token` cookie
3. If missing, check:
   - `withCredentials: true` in API client
   - `credentials: true` in backend CORS config
   - Cookie domain matches (should be `localhost`)

---

## 📋 Creating Multiple Test Users

### For Different Roles

**Doctor:**
```bash
node scripts/create-test-user.js doctor@hospital.com Doctor123! "Dr. John Doe"
```

**Nurse:**
```bash
node scripts/create-test-user.js nurse@hospital.com Nurse123! "Jane Smith"
```

**Admin:**
```bash
node scripts/create-test-user.js admin@hospital.com Admin123! "Admin User"
```

**Receptionist:**
```bash
node scripts/create-test-user.js reception@hospital.com Reception123! "Reception Desk"
```

---

## 🔒 Password Requirements

AWS Cognito requires passwords to meet these criteria:
- ✅ Minimum 8 characters
- ✅ At least 1 uppercase letter
- ✅ At least 1 lowercase letter
- ✅ At least 1 number
- ✅ At least 1 special character (!@#$%^&*)

**Valid examples:**
- `Test123!@#`
- `Doctor123!`
- `Nurse@2025`
- `Admin#Pass1`

**Invalid examples:**
- `test123` (no uppercase, no special char)
- `Test123` (no special char)
- `Test!@#` (no number)

---

## 🎯 Next Steps

### 1. Test Authentication Flow
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Create test user
cd backend
node scripts/create-test-user.js

# Terminal 3: Frontend
cd hospital-management-system
npm run dev

# Browser: Test login
http://localhost:3001/auth/login
```

### 2. Verify Subdomain Routing
```bash
# Test subdomain login
http://aajminpolyclinic.localhost:3001/auth/login

# Should work the same as localhost
```

### 3. Test Protected Routes
```bash
# After login, try accessing:
http://localhost:3001/dashboard
http://localhost:3001/patients
http://localhost:3001/appointments

# Should all work with authentication
```

---

## 📊 Success Indicators

### Backend Console
```
✅ Server is running on port 3000
✅ Redis connected successfully
✅ WebSocket server initialized
(No CORS errors)
```

### Browser Console
```
✅ Detected subdomain: aajminpolyclinic
✅ Tenant resolved: { id: "...", name: "..." }
✅ Tenant context set: tenant_xxxxx
(No CORS errors)
(No authentication errors)
```

### Browser Network Tab
```
✅ POST /auth/signin → 200 OK
✅ Response includes: { token: "...", user: {...} }
✅ Cookies set: token, user_email, user_name
```

### Browser Cookies
```
✅ token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
✅ user_email: test@hospital.com
✅ user_name: Test User
✅ tenant_id: tenant_xxxxx (if subdomain used)
```

---

## 🎉 All Fixed!

Once you complete these steps:
- ✅ CORS errors resolved
- ✅ Test users created
- ✅ Authentication working
- ✅ Subdomain routing functional
- ✅ No demo credentials

You can now:
- Login with real credentials
- Access protected routes
- Test all hospital management features
- Deploy to production with confidence

---

**Status:** ✅ Ready to Test
**Last Updated:** November 2025
**Version:** 2.1.0 (Authentication Fix)
