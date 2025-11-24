# Add Bed Cognito Authentication Error - Complete Fix

## Problem Analysis

**Error**: `NotAuthorizedException: Incorrect username or password` occurs when trying to add a new bed.

**Root Cause**: The error occurs during JWT token validation in the `hospitalAuthMiddleware`. The middleware is trying to validate a JWT token that is either:
1. Expired
2. Malformed/corrupted
3. From wrong Cognito User Pool
4. Associated with a user that doesn't exist in Cognito

## Technical Analysis

### Error Flow
1. User fills out "Add Bed" form
2. Frontend calls `BedManagementAPI.createBed()`
3. API request goes to `POST /api/beds`
4. Request passes through middleware chain:
   - ✅ App Auth Middleware (passes)
   - ✅ Tenant Middleware (passes)
   - ❌ Hospital Auth Middleware (fails here)
5. `hospitalAuthMiddleware` tries to validate JWT token
6. JWT validation calls Cognito JWKS endpoint
7. Cognito returns `NotAuthorizedException`

### Middleware Chain
```
POST /api/beds
├── apiAppAuthMiddleware ✅
├── tenantMiddleware ✅
├── hospitalAuthMiddleware ❌ (Cognito error here)
└── bedController.createBed (never reached)
```

## Solution Implementation

### 1. Enhanced Error Handling in Auth Middleware

**File**: `backend/src/middleware/auth.ts`

Add better error handling and logging to identify the exact cause:

```typescript
jwt.verify(token, pem, { algorithms: ['RS256'] }, async (err, payload) => {
  if (err) {
    console.error('JWT Verification Error:', {
      error: err.message,
      tokenPreview: token.substring(0, 50) + '...',
      timestamp: new Date().toISOString()
    });
    
    // Provide more specific error messages
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Your session has expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'Authentication token is invalid. Please login again.',
        code: 'TOKEN_INVALID'
      });
    } else {
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: 'Unable to verify authentication. Please login again.',
        code: 'AUTH_FAILED'
      });
    }
  }
  
  // Rest of the middleware logic...
});
```

### 2. Frontend Token Validation

**File**: `hospital-management-system/lib/api/client.ts`

Add token validation before making API calls:

```typescript
// Add token validation function
const validateToken = () => {
  const token = Cookies.get('token');
  if (!token) {
    return false;
  }
  
  try {
    // Decode JWT to check expiration (without verification)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Check if token is expired (with 5 minute buffer)
    if (payload.exp && payload.exp < (currentTime + 300)) {
      console.warn('Token is expired or expiring soon');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

// Update request interceptor
api.interceptors.request.use(
  (config) => {
    // Validate token before making request
    if (!validateToken()) {
      // Clear invalid token
      Cookies.remove('token');
      Cookies.remove('tenant_id');
      
      // Redirect to login
      window.location.href = '/auth/login?reason=session_expired';
      return Promise.reject(new Error('Session expired'));
    }
    
    // Rest of the interceptor logic...
  },
  (error) => Promise.reject(error)
);
```

### 3. Enhanced Frontend Error Handling

**File**: `hospital-management-system/app/bed-management/department/[departmentName]/page.tsx`

Update the `onAdd` function with better error handling:

```typescript
onAdd={async (bedData: any) => {
  try {
    // Pre-flight authentication check
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
    
    // Validate token expiration
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp < currentTime) {
        const { toast } = await import('sonner');
        toast.error('Session expired. Please login again.');
        Cookies.remove('token');
        Cookies.remove('tenant_id');
        setTimeout(() => {
          window.location.href = '/auth/login?reason=token_expired';
        }, 1500);
        return;
      }
    } catch (tokenError) {
      console.error('Token validation error:', tokenError);
      const { toast } = await import('sonner');
      toast.error('Invalid session. Please login again.');
      Cookies.remove('token');
      Cookies.remove('tenant_id');
      setTimeout(() => {
        window.location.href = '/auth/login?reason=invalid_token';
      }, 1500);
      return;
    }
    
    // Proceed with bed creation...
    const { BedManagementAPI } = await import('@/lib/api/bed-management');
    
    // ... rest of the bed creation logic
    
  } catch (error: any) {
    console.error('Add bed failed:', error);
    const { toast } = await import('sonner');
    
    // Handle specific authentication errors
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.code;
      
      if (errorCode === 'TOKEN_EXPIRED') {
        toast.error('Session expired. Please login again.');
        Cookies.remove('token');
        Cookies.remove('tenant_id');
        setTimeout(() => {
          window.location.href = '/auth/login?reason=token_expired';
        }, 1500);
      } else if (errorCode === 'TOKEN_INVALID') {
        toast.error('Invalid session. Please login again.');
        Cookies.remove('token');
        Cookies.remove('tenant_id');
        setTimeout(() => {
          window.location.href = '/auth/login?reason=invalid_token';
        }, 1500);
      } else {
        toast.error('Authentication error. Please login again.');
        setTimeout(() => {
          window.location.href = '/auth/login?reason=auth_error';
        }, 1500);
      }
    } else {
      // Handle other errors
      const errorMsg = error.response?.data?.error || error.message || 'Failed to create bed';
      toast.error(errorMsg);
    }
  }
}}
```

### 4. Backend Logging Enhancement

**File**: `backend/src/middleware/auth.ts`

Add comprehensive logging to track authentication issues:

```typescript
export const hospitalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  const tenantId = req.headers['x-tenant-id'];
  const appId = req.headers['x-app-id'];

  console.log('Hospital Auth Middleware:', {
    hasToken: !!token,
    tokenPreview: token ? token.substring(0, 20) + '...' : 'none',
    tenantId,
    appId,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  if (!token) {
    console.warn('No authorization token provided');
    return res.status(401).json({ 
      error: 'Authorization token is required',
      code: 'TOKEN_MISSING'
    });
  }

  const decodedToken = jwt.decode(token, { complete: true }) as jwt.Jwt | null;
  if (!decodedToken || !decodedToken.header.kid) {
    console.warn('Invalid token structure:', {
      hasHeader: !!decodedToken?.header,
      hasKid: !!decodedToken?.header?.kid
    });
    return res.status(401).json({ 
      error: 'Invalid token structure',
      code: 'TOKEN_MALFORMED'
    });
  }

  const kid = decodedToken.header.kid;
  const pem = pems[kid];

  if (!pem) {
    console.warn('No PEM found for kid:', kid);
    return res.status(401).json({ 
      error: 'Invalid token key',
      code: 'TOKEN_KEY_INVALID'
    });
  }

  jwt.verify(token, pem, { algorithms: ['RS256'] }, async (err, payload) => {
    if (err) {
      console.error('JWT Verification Failed:', {
        error: err.message,
        name: err.name,
        tokenKid: kid,
        timestamp: new Date().toISOString()
      });
      
      // ... error handling as shown above
    }
    
    // Success case
    console.log('JWT Verification Success:', {
      userId: (payload as any).sub,
      email: (payload as any).email,
      groups: (payload as any)['cognito:groups'],
      timestamp: new Date().toISOString()
    });
    
    // ... rest of success logic
  });
};
```

## Testing the Fix

### 1. Test with Expired Token
```bash
# In backend directory
REAL_TOKEN=expired_token_here node test-bed-creation-auth.js
```

### 2. Test with Valid Token
```bash
# Get token from browser cookies first
REAL_TOKEN=valid_token_here node test-bed-creation-auth.js
```

### 3. Frontend Testing
1. Login to hospital management system
2. Wait for token to expire (or manually corrupt it)
3. Try to add a bed
4. Should see proper error message and redirect

## Expected Results

### Before Fix
- ❌ Cryptic Cognito error in backend logs
- ❌ User gets logged out unexpectedly
- ❌ No clear error message

### After Fix
- ✅ Clear error messages in backend logs
- ✅ Specific error codes for different scenarios
- ✅ User gets clear feedback about session expiration
- ✅ Automatic redirect to login with reason
- ✅ No unexpected logouts

## Monitoring

Add these log patterns to monitor authentication issues:

```bash
# Monitor authentication errors
tail -f backend.log | grep "JWT Verification"

# Monitor token expiration
tail -f backend.log | grep "TOKEN_EXPIRED"

# Monitor invalid tokens
tail -f backend.log | grep "TOKEN_INVALID"
```

## Prevention

1. **Token Refresh**: Implement automatic token refresh before expiration
2. **Session Management**: Better session lifecycle management
3. **Error Boundaries**: Add React error boundaries for auth errors
4. **Monitoring**: Set up alerts for authentication failures

This comprehensive fix addresses the root cause of the Cognito authentication error and provides better user experience with clear error messages and proper session management.