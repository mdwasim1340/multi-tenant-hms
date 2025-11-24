# Test Add Bed Fix - Quick Guide

## 🎯 What Was Fixed
The automatic logout issue when clicking "Add Bed" has been fixed. The error handling is now more selective and won't log you out unless there's a real authentication failure.

---

## ✅ Quick Test Steps

### 1. Restart Frontend (if needed)
```bash
cd hospital-management-system
npm run dev
```

### 2. Test Normal Flow
1. Open browser: `http://localhost:3001`
2. Login with your credentials
3. Navigate to: **Bed Management** → **Cardiology**
4. Click **"Add New Bed"** button
5. Fill out the form:
   - Bed Number: `TEST-001`
   - Bed Type: `Standard`
   - Floor: `3`
   - Wing: `A`
   - Room: `301`
6. Click **"Add Bed"**

**Expected Result**: 
- ✅ Either success message OR error message
- ✅ You should **STAY LOGGED IN**
- ✅ No automatic redirect to login page

### 3. Test With Invalid Data
1. Click **"Add New Bed"** again
2. Use the same bed number: `TEST-001` (duplicate)
3. Click **"Add Bed"**

**Expected Result**:
- ✅ Error message: "Bed number already exists" (or similar)
- ✅ You should **STAY LOGGED IN**
- ✅ Modal should stay open so you can fix the error

---

## 🔍 What Changed

### Before Fix
```
User clicks "Add Bed" → Any error occurs → Automatic logout → Redirect to login
```

### After Fix
```
User clicks "Add Bed" → Error occurs → Check error type:
  - Real auth error (TOKEN_EXPIRED, etc.) → Logout
  - Other error (validation, database, etc.) → Show error, stay logged in
```

---

## 📊 Backend Logs to Watch

When you click "Add Bed", you should see these logs in the backend terminal:

```
Hospital Auth Middleware: {
  hasToken: true,
  tokenPreview: 'eyJraWQiOiJBMCtSN2Zy...',
  tenantId: 'aajmin_polyclinic',
  appId: 'hospital_system',
  url: '/api/beds',
  method: 'POST'
}

JWT Verification Success: {
  userId: 'c4a844b8-d051-70a6-ae76-2e56857d527f',
  email: 'mdwasimkrm13@gmail.com',
  groups: [ 'hospital-admin' ]
}

User mapping successful: {
  email: 'mdwasimkrm13@gmail.com',
  localUserId: 8
}
```

These logs confirm authentication is working!

---

## 🐛 If You Still Get Logged Out

### Check These Things:

1. **Clear Browser Cache**
   - Press `Ctrl + Shift + Delete`
   - Clear cookies and cache
   - Restart browser

2. **Check Token in Cookies**
   - Open DevTools (F12)
   - Go to Application → Cookies
   - Verify `token` and `tenant_id` exist

3. **Check Console for Errors**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for error messages

4. **Check Network Tab**
   - Open DevTools (F12)
   - Go to Network tab
   - Click "Add Bed"
   - Look at the POST request to `/api/beds`
   - Check the response status and data

---

## 📝 Error Messages You Might See

### ✅ Good Errors (Won't Logout)
- "Bed number already exists"
- "Invalid bed type"
- "Department not found"
- "Failed to create bed"
- "Database error"

### ⚠️ Auth Errors (Will Logout)
- "Session expired. Please login again."
- "Invalid session. Please login again."
- "Token expired"
- "Token invalid"

---

## 🎉 Success Indicators

You'll know the fix is working when:
1. ✅ You can click "Add Bed" without being logged out
2. ✅ Error messages appear but you stay logged in
3. ✅ You can retry adding a bed without re-logging in
4. ✅ Backend logs show successful authentication

---

## 📞 If Issues Persist

If you're still experiencing logout issues:

1. **Share the error message** you see
2. **Share the backend logs** when you click "Add Bed"
3. **Share the browser console logs** (F12 → Console)
4. **Share the network request details** (F12 → Network → POST /api/beds)

This will help diagnose any remaining issues!

---

## 🚀 Ready to Test!

The fix is now in place. Try adding a bed and let me know if you still experience the logout issue!
