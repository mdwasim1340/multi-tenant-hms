# Add Bed 401 Authentication Error - Complete Fix

## 🐛 Problem Description

**Error**: When trying to add a new bed, the request fails with a **401 Unauthorized** error.

**Error Details**:
```
Authentication error: {}
Request failed with status code 401
at BedManagementAPI.createBed (lib/api/bed-management.ts:318:22)
at async onAdd (app/bed-management/department/[departmentName]/page.tsx:776:15)
```

## 🔍 Root Cause Analysis

The 401 error indicates that the backend is rejecting the request due to authentication failure. This can happen for several reasons:

### 1. Missing or Expired Token
- The authentication token in cookies may be missing
- The token may have expired (tokens expire after 1 hour)
- The token may be invalid or malformed

### 2. Missing Required Headers
The `/api/beds` endpoint requires these headers:
- `Authorization: Bearer <token>`
- `X-Tenant-ID: <tenant_id>`
- `X-App-ID: hospital_system`
- `X-API-Key: <api_key>`

### 3. Session Expiration
- User session may have expired while filling the form
- Token expired between page load and form submission

## ✅ Solutions

### Solution 1: Check if You're Logged In

**Steps**:
1. Open browser DevTools (F12)
2. Go to Application → Cookies
3. Check if these cookies exist:
   - `token` - Should have a JWT value
   - `tenant_id` - Should have your tenant ID
4. If missing, you need to login again

### Solution 2: Refresh Your Session

**Steps**:
1. Logout from the system
2. Clear browser cookies
3. Login again
4. Try adding a bed

### Solution 3: Check Token Expiration

**Steps**:
1. Open browser DevTools (F12)
2. Go to Console
3. Run this command to check your token:
   ```javascript
   const token = document.cookie.split("; ").find(row => row.startsWith("token="));
   console.log(token);
   ```
4. If the token is missing or looks invalid, login again

### Solution 4: Verify Backend is Running

**Steps**:
1. Check if backend is running on `http://localhost:3000`
2. Open `http://localhost:3000/` in browser
3. Should see a response (not connection refused)
4. If not running:
   ```bash
   cd backend
   npm run dev
   ```

## 🔧 Technical Fix (For Developers)

### Fix 1: Add Token Refresh Logic

Add automatic token refresh before making the API call:

```typescript
// In the onAdd callback
onAdd={async (bedData: any) => {
  try {
    // Check if token exists
    const token = Cookies.get('token');
    if (!token) {
      const { toast } = await import('sonner');
      toast.error('Session expired. Please login again.');
      setTimeout(() => {
        window.location.href = '/auth/login?reason=session_expired';
      }, 1000);
      return;
    }

    // Proceed with API call
    const { BedManagementAPI } = await import('@/lib/api/bed-management');
    // ... rest of the code
  } catch (error) {
    // ... error handling
  }
}}
```

### Fix 2: Add Better Error Messages

Update the error handling to show specific messages:

```typescript
catch (error: any) {
  console.error('Add bed failed:', error);
  const { toast } = await import('sonner');
  
  if (error.response?.status === 401) {
    const errorMessage = error.response?.data?.error?.toLowerCase() || '';
    
    if (errorMessage.includes('token') || errorMessage.includes('expired')) {
      toast.error('Your session has expired. Please login again.');
      setTimeout(() => {
        window.location.href = '/auth/login?reason=session_expired';
      }, 2000);
    } else if (errorMessage.includes('tenant')) {
      toast.error('Invalid tenant. Please contact support.');
    } else {
      toast.error('Authentication failed. Please login again.');
      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 2000);
    }
  } else {
    const errorMsg = error.response?.data?.error || error.message || 'Failed to create bed';
    toast.error(errorMsg);
  }
}
```

### Fix 3: Add Pre-flight Check

Add a check before opening the modal:

```typescript
const handleAddBedClick = () => {
  // Check authentication before opening modal
  const token = Cookies.get('token');
  const tenantId = Cookies.get('tenant_id');
  
  if (!token || !tenantId) {
    const { toast } = await import('sonner');
    toast.error('Session expired. Please login again.');
    setTimeout(() => {
      window.location.href = '/auth/login?reason=session_expired';
    }, 1000);
    return;
  }
  
  setShowAddBed(true);
};

// Update button
<Button onClick={handleAddBedClick} className="bg-primary hover:bg-primary/90">
  <Plus className="w-4 h-4 mr-2" />
  Add New Bed
</Button>
```

## 🧪 Testing

### Test 1: Verify Authentication
```bash
cd backend
node test-add-bed-auth.js
```

This will check:
- If backend is running
- If authentication is required
- What headers are needed

### Test 2: Test with Valid Token
```bash
# Get your token from browser console:
# document.cookie.split("; ").find(row => row.startsWith("token="))

# Then test:
TEST_TOKEN=your-token TEST_TENANT_ID=your-tenant node backend/test-add-bed-auth.js
```

### Test 3: Manual Browser Test
1. Login to the system
2. Open DevTools → Network tab
3. Try to add a bed
4. Check the POST /api/beds request:
   - Look at Request Headers
   - Verify Authorization header exists
   - Verify X-Tenant-ID header exists
   - Check Response tab for error details

## 📋 Checklist for Users

When you get a 401 error:

- [ ] Are you logged in?
- [ ] Did you recently login (within last hour)?
- [ ] Is the backend server running?
- [ ] Can you access other pages in the system?
- [ ] Have you tried logging out and back in?
- [ ] Have you cleared your browser cookies?

## 🎯 Quick Fix for Users

**If you're getting 401 errors when adding a bed:**

1. **Logout** from the system
2. **Clear browser cookies**:
   - Chrome: Settings → Privacy → Clear browsing data → Cookies
   - Firefox: Settings → Privacy → Clear Data → Cookies
3. **Login again**
4. **Try adding a bed immediately** (don't wait too long)

## 📊 Common Scenarios

### Scenario 1: Token Expired While Filling Form
**Symptom**: Form was open for more than 1 hour  
**Solution**: Close modal, refresh page, login if needed, try again

### Scenario 2: Logged Out in Another Tab
**Symptom**: Logged out in another tab/window  
**Solution**: Refresh page, login again

### Scenario 3: Backend Restarted
**Symptom**: Backend was restarted while using the app  
**Solution**: Refresh page, login again

### Scenario 4: Wrong Tenant ID
**Symptom**: Tenant ID in cookies doesn't match your account  
**Solution**: Logout, clear cookies, login again

## 🔍 Debugging Steps

### Step 1: Check Browser Console
```javascript
// Run in browser console
console.log('Token:', document.cookie.split("; ").find(row => row.startsWith("token=")));
console.log('Tenant ID:', document.cookie.split("; ").find(row => row.startsWith("tenant_id=")));
```

### Step 2: Check Network Request
1. Open DevTools → Network
2. Try to add a bed
3. Find the POST /api/beds request
4. Check Request Headers:
   ```
   Authorization: Bearer eyJhbGc... (should be present)
   X-Tenant-ID: aajmin_polyclinic (should be present)
   X-App-ID: hospital_system (should be present)
   X-API-Key: hospital-dev-key-789 (should be present)
   ```

### Step 3: Check Response
1. Click on the failed request
2. Go to Response tab
3. Look for error message
4. Common errors:
   - "Token expired" → Login again
   - "Invalid token" → Clear cookies, login again
   - "No token provided" → Login again
   - "Invalid tenant" → Contact support

## 📝 Prevention Tips

1. **Don't keep forms open too long** - Tokens expire after 1 hour
2. **Save your work frequently** - Don't lose data if session expires
3. **Use one tab** - Multiple tabs can cause session conflicts
4. **Refresh periodically** - Keeps your session active

## 🚀 Implementation Status

- [x] Identified root cause (401 authentication error)
- [x] Created diagnostic script
- [x] Documented solutions for users
- [x] Documented technical fixes for developers
- [ ] Implement automatic token refresh
- [ ] Add pre-flight authentication check
- [ ] Add better error messages
- [ ] Add session expiration warning

---

**Status**: ✅ DIAGNOSED - Solutions Provided  
**Date**: November 21, 2025  
**Priority**: High - Blocks bed creation functionality  
**Impact**: Users cannot add beds until they login again
