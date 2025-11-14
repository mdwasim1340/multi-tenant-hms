# Authentication Required - User Guide

**Issue:** Patient registration showing "Authentication required" error  
**Status:** ⚠️ **USER ACTION REQUIRED**

---

## 🔍 The Problem

You're seeing a **401 Unauthorized** error because:
1. ❌ You're not logged in
2. ❌ No authentication token is present
3. ❌ No tenant context is set

The patient registration page requires authentication to work.

---

## ✅ Solution: Log In First!

### Step-by-Step Instructions

#### 1. Open the Login Page
Navigate to: **`http://localhost:3001/auth/login`**

#### 2. Enter Your Credentials
Use one of these test accounts:

**Option 1: Aajmin Polyclinic Admin**
- Email: `mdwasimkrm13@gmail.com`
- Password: `Admin@123` (or your actual password)
- Tenant: `aajmin_polyclinic`

**Option 2: Wasim Akram**
- Email: `mdwasimakram44@gmail.com`
- Password: Your password
- Tenant: `aajmin_polyclinic`

**Option 3: Other Test Users**
- `admin@testcomplete2.com` (Complete Test Hospital)
- `admin@autoid.com` (Auto ID Hospital)
- `admin@complexform.com` (Complex Form Hospital)
- `admin@mdwasim.com` (Md Wasim Akram)

#### 3. Check Login Success
After successful login, you should see:
- ✅ Redirect to dashboard
- ✅ Console log: "✅ Tenant context set: [tenant_id]"
- ✅ Token stored in cookies
- ✅ Tenant ID stored in cookies and localStorage

#### 4. Navigate to Patient Registration
Now you can go to: **`http://localhost:3001/patient-registration`**

#### 5. Fill Out the Form
The form should now work! Fill in:
- Patient Number (auto-generated)
- First Name, Last Name
- Date of Birth
- Contact information
- Medical history
- Insurance information

#### 6. Submit
Click "Register Patient" - it should work now! ✅

---

## 🔍 Debug Your Authentication

If you're still having issues, use the **Debug Page**:

### Access Debug Page
Navigate to: **`http://localhost:3001/debug-auth`**

### What to Check

#### ✅ Good State (Ready to Use)
```
Is Authenticated: ✅ Yes
Has Token: ✅ Yes
Tenant ID (getTenantContext): ✅ aajmin_polyclinic
Tenant ID (Cookie): ✅ aajmin_polyclinic
Tenant ID (localStorage): ✅ aajmin_polyclinic
User Email: ✅ mdwasimkrm13@gmail.com
```

#### ❌ Bad State (Need to Log In)
```
Is Authenticated: ❌ No
Has Token: ❌ No
Tenant ID (getTenantContext): ❌ Not Set
Tenant ID (Cookie): ❌ Not Set
Tenant ID (localStorage): ❌ Not Set
User Email: ❌ Not Set
```

---

## 🔄 Complete Flow

### What Happens When You Log In

```
1. User enters email + password
     ↓
2. Frontend sends to /auth/signin
     ↓
3. Backend validates credentials
     ↓
4. Backend returns:
   - JWT token
   - User info (including tenant_id)
   - Permissions
   - Roles
     ↓
5. Frontend stores in cookies:
   - token
   - tenant_id ✅
   - user_email
   - user_name
   - permissions
   - roles
     ↓
6. Frontend also stores in localStorage:
   - tenant_id ✅
     ↓
7. Console shows: "✅ Tenant context set: aajmin_polyclinic"
     ↓
8. User redirected to dashboard
     ↓
9. Now ALL API requests include:
   - Authorization: Bearer [token]
   - X-Tenant-ID: aajmin_polyclinic
     ↓
10. Patient registration works! ✅
```

---

## 🚨 Common Issues

### Issue 1: "Authentication required" Error
**Cause:** Not logged in  
**Solution:** Go to `/auth/login` and log in first

### Issue 2: "X-Tenant-ID header is required" Error
**Cause:** Tenant context not set (old login session)  
**Solution:** Log out and log in again

### Issue 3: Token Expired
**Cause:** JWT token expired (1 hour lifetime)  
**Solution:** Log in again

### Issue 4: Wrong Credentials
**Cause:** Invalid email or password  
**Solution:** Check your credentials or contact admin

---

## 🛠️ Troubleshooting Steps

### Step 1: Clear Everything
```javascript
// In browser console:
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
localStorage.clear();
sessionStorage.clear();
```

### Step 2: Refresh Page
Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### Step 3: Log In Fresh
Go to `/auth/login` and log in with valid credentials

### Step 4: Verify Auth State
Go to `/debug-auth` and check all values are set

### Step 5: Try Patient Registration
Go to `/patient-registration` and try again

---

## 📊 What Gets Stored on Login

### Cookies (Sent with Every Request)
```
token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
tenant_id=aajmin_polyclinic
user_email=mdwasimkrm13@gmail.com
user_name=Aajmin Admin
user_permissions=[{"resource":"patients","action":"read"}...]
user_roles=[{"id":1,"name":"Admin"}...]
accessible_apps=[{"application_id":"hospital_system"}...]
```

### localStorage (Client-Side Only)
```
tenant_id: "aajmin_polyclinic"
tenant_name: "Aajmin Polyclinic"
```

---

## ✅ Success Indicators

After logging in, you should see:

### In Browser Console
```
✅ Tenant context set: aajmin_polyclinic
✅ Authentication check passed
✅ Tenant context: aajmin_polyclinic
```

### In Network Tab (API Requests)
```
Request Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  X-Tenant-ID: aajmin_polyclinic
  X-App-ID: hospital-management
  X-API-Key: hospital-dev-key-123
```

### In Application
- ✅ Can access patient registration
- ✅ Can submit patient form
- ✅ Can view patient directory
- ✅ No authentication errors

---

## 🎯 Quick Test

### Test Authentication Flow
```bash
# 1. Check if logged in
Open: http://localhost:3001/debug-auth

# 2. If not logged in, go to login
Open: http://localhost:3001/auth/login

# 3. Log in with credentials
Email: mdwasimkrm13@gmail.com
Password: Admin@123

# 4. Verify auth state
Open: http://localhost:3001/debug-auth
Should see all ✅ green checkmarks

# 5. Try patient registration
Open: http://localhost:3001/patient-registration
Should work without errors!
```

---

## 📝 Summary

**The Issue:**
- Patient registration requires authentication
- You need to log in first before using the system

**The Solution:**
1. Go to `/auth/login`
2. Enter valid credentials
3. Login sets token + tenant_id
4. Now you can use patient registration

**Debug Tools:**
- `/debug-auth` - Check authentication state
- Browser console - See auth logs
- Network tab - Verify headers are sent

**Status:** System is working correctly, just needs user to log in first! ✅

---

## 🚀 Next Steps

1. **Log in** at `/auth/login`
2. **Verify** auth state at `/debug-auth`
3. **Use** patient registration at `/patient-registration`
4. **Enjoy** the fully functional patient management system! 🎉
