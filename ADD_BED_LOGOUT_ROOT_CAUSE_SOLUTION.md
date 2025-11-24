# Add Bed Logout Issue - Root Cause & Solution

## Problem Summary
User is automatically logged out when clicking "Add Bed" button, even though backend authentication is successful.

## Root Cause Analysis

### What's Happening:
1. ✅ User clicks "Add New Bed" button
2. ✅ Authentication check passes (token and tenant_id exist)
3. ✅ Modal opens successfully
4. ✅ User fills out the form
5. ✅ User clicks "Add Bed" to submit
6. ✅ Backend receives request with valid token
7. ✅ Backend JWT verification succeeds
8. ✅ Backend user mapping succeeds
9. ❌ **BUT** - Something in the response triggers the frontend error handling
10. ❌ Frontend error handler treats it as authentication failure
11. ❌ Frontend removes cookies and redirects to login

### The Real Problem:
The error handling in `page.tsx` is **too aggressive**. It's treating ANY error during bed creation as a potential authentication error and logging the user out.

## Evidence from Backend Logs

```
Hospital Auth Middleware: {
  hasToken: true,
  tokenPreview: 'eyJraWQiOiJBMCtSN2Zy...',
  tenantId: 'aajmin_polyclinic',
  appId: 'hospital_system',
  url: '/',
  method: 'POST',
  timestamp: '2025-11-21T16:34:18.155Z'
}

JWT Verification Success: {
  userId: 'c4a844b8-d051-70a6-ae76-2e56857d527f',
  email: 'mdwasimkrm13@gmail.com',
  groups: [ 'hospital-admin' ],
  timestamp: '2025-11-21T16:34:18.157Z'
}

User mapping successful: {
  email: 'mdwasimkrm13@gmail.com',
  localUserId: 8,
  cognitoUserId: 'c4a844b8-d051-70a6-ae76-2e56857d527f'
}
```

**Authentication is working perfectly!** The issue is in the frontend error handling.

## The Problematic Code

### Location: `hospital-management-system/app/bed-management/department/[departmentName]/page.tsx`

```typescript
onAdd={async (bedData: any) => {
  try {
    // ... bed creation code ...
  } catch (error: any) {
    console.error('Add bed failed:', error)
    const { toast } = await import('sonner')
    
    // ❌ PROBLEM: This catches ALL errors, not just auth errors
    if (error.response?.status === 401) {
      // ... removes cookies and redirects to login ...
    }
  }
}
```

## Solution Options

### Option 1: Less Aggressive Error Handling (RECOMMENDED)
Only logout on SPECIFIC authentication errors, not all 401s:

```typescript
if (error.response?.status === 401) {
  const errorCode = error.response?.data?.code;
  
  // Only logout on these specific codes
  if (errorCode === 'TOKEN_EXPIRED' || 
      errorCode === 'TOKEN_INVALID' || 
      errorCode === 'TOKEN_MALFORMED') {
    // Clear session and redirect
  } else {
    // Just show error message, don't logout
    toast.error(error.response?.data?.message || 'Failed to create bed');
  }
}
```

### Option 2: Check Token Before Showing Error
Verify the token is actually invalid before logging out:

```typescript
if (error.response?.status === 401) {
  // Re-check if token still exists
  const token = Cookies.get('token');
  if (!token) {
    // Token is actually missing, logout is appropriate
    window.location.href = '/auth/login?reason=session_expired';
  } else {
    // Token exists, this is a different error
    toast.error('Failed to create bed. Please try again.');
  }
}
```

### Option 3: Remove Automatic Logout Entirely
Let the API client interceptor handle authentication errors:

```typescript
catch (error: any) {
  console.error('Add bed failed:', error)
  const { toast } = await import('sonner')
  
  // Just show the error, don't handle authentication here
  const errorMsg = error.response?.data?.error || 
                   error.response?.data?.message || 
                   'Failed to create bed';
  toast.error(errorMsg);
  
  // The API client interceptor will handle 401s if they're real auth errors
}
```

## Recommended Fix

I recommend **Option 3** because:
1. The API client interceptor already handles authentication errors
2. It prevents false positives (logging out when you shouldn't)
3. It's simpler and more maintainable
4. It follows the single responsibility principle

## Implementation

Update the error handling in the `onAdd` callback to be less aggressive:

```typescript
onAdd={async (bedData: any) => {
  try {
    // Check authentication before making API call
    const Cookies = (await import('js-cookie')).default;
    const token = Cookies.get('token');
    const tenantId = Cookies.get('tenant_id');
    
    if (!token || !tenantId) {
      const { toast } = await import('sonner');
      toast.error('Session expired. Please login again.');
      setTimeout(() => {
        window.location.href = '/auth/login?reason=session_expired';
      }, 1500);
      return;
    }
    
    // ... bed creation code ...
    
  } catch (error: any) {
    console.error('Add bed failed:', error)
    const { toast } = await import('sonner')
    
    // Show error message but DON'T automatically logout
    // Let the API client interceptor handle real authentication errors
    const errorMsg = error.response?.data?.error || 
                     error.response?.data?.message || 
                     error.message || 
                     'Failed to create bed';
    toast.error(errorMsg);
    
    // Only logout if the error is specifically about authentication
    // and the token is actually missing
    if (error.response?.status === 401) {
      const token = Cookies.get('token');
      if (!token) {
        setTimeout(() => {
          window.location.href = '/auth/login?reason=session_expired';
        }, 1500);
      }
    }
  }
}
```

## Testing the Fix

After implementing the fix:

1. Login to the application
2. Navigate to Bed Management → Cardiology
3. Click "Add New Bed"
4. Fill out the form
5. Click "Add Bed"
6. **Expected**: Either success message OR error message, but NO automatic logout
7. **Verify**: You should still be logged in and able to try again

## Additional Improvements

1. **Better Error Messages**: Show specific error messages from the backend
2. **Retry Logic**: Allow users to retry failed operations without re-logging in
3. **Loading States**: Show loading indicator during bed creation
4. **Validation**: Add frontend validation to catch errors before API call

## Conclusion

The logout issue is caused by overly aggressive error handling that treats all errors as authentication failures. The fix is to be more selective about when to logout, and let the API client interceptor handle real authentication errors.
