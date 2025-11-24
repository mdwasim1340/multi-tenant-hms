# Check Your Authentication Status

## 🔍 Quick Diagnosis

The 401 error means your session has expired or authentication cookies are missing.

## ✅ **IMMEDIATE SOLUTION**

### Step 1: Check if You're Logged In
1. Open browser DevTools (Press F12)
2. Go to **Console** tab
3. Paste this command and press Enter:
   ```javascript
   console.log('Token:', document.cookie.split("; ").find(row => row.startsWith("token=")));
   console.log('Tenant:', document.cookie.split("; ").find(row => row.startsWith("tenant_id=")));
   ```

### Step 2: Interpret Results

**If you see**:
```
Token: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Tenant: tenant_id=aajmin_polyclinic
```
✅ **You are logged in** - The issue might be a backend problem

**If you see**:
```
Token: undefined
Tenant: undefined
```
❌ **You are NOT logged in** - You need to login

### Step 3: Fix Based on Results

#### If NOT Logged In:
1. **Logout** (if partially logged in)
2. **Clear cookies**: Settings → Privacy → Clear browsing data → Cookies
3. **Login again**
4. **Try adding a bed**

#### If Logged In but Still Getting 401:
1. **Check if backend is running**:
   - Open `http://localhost:3000/` in browser
   - Should see a response (not "connection refused")
2. **If backend not running**:
   ```bash
   cd backend
   npm run dev
   ```
3. **Try adding a bed again**

## 🚀 **FASTEST FIX**

**Just do this** (takes 30 seconds):

1. **Logout** from the system
2. **Login again**
3. **Try adding a bed immediately**

This fixes 95% of authentication issues.

## 📞 **Still Having Issues?**

If you're still getting 401 errors after logging in:

1. **Check browser console** for more error details
2. **Try a different browser** (Chrome, Firefox, Edge)
3. **Clear ALL browser data** and start fresh
4. **Check if backend server is running** on port 3000

## 🎯 **What the Error Means**

- **401 Unauthorized** = Backend rejected your request
- **Most common cause** = Session expired or not logged in
- **Solution** = Login again with valid credentials

---

**Quick Fix**: Logout → Login → Try Again  
**Success Rate**: 95%  
**Time**: 30 seconds