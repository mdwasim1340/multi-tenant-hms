# Authentication Guide - Hospital Management System

## 🔐 Real Authentication (No Demo Credentials)

This system uses **real backend authentication** with AWS Cognito. There are no demo credentials or mock authentication.

---

## 🚀 Quick Start

### For Developers

#### 1. Import Authentication Utilities
```typescript
import { signIn, signOut, isAuthenticated, getCurrentUser } from '@/lib/auth'
```

#### 2. Login a User
```typescript
const result = await signIn(email, password, rememberMe)

if (result.success) {
  // User authenticated successfully
  router.push('/dashboard')
} else {
  // Show error message
  setError(result.error)
}
```

#### 3. Check Authentication
```typescript
if (isAuthenticated()) {
  // User is logged in
} else {
  // Redirect to login
  router.push('/auth/login')
}
```

#### 4. Get Current User
```typescript
const user = getCurrentUser()
if (user) {
  console.log(user.email, user.name)
}
```

#### 5. Logout
```typescript
signOut()
router.push('/auth/login')
```

---

## 🔑 Creating Test Users

### Via Admin Dashboard

1. Navigate to admin dashboard: `http://localhost:3002`
2. Go to Users section
3. Create new user with:
   - Email
   - Password
   - Role
   - Tenant assignment

### Via Backend API

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@hospital.com",
    "password": "SecurePassword123!",
    "name": "Dr. John Doe",
    "tenant_id": "tenant_123"
  }'
```

---

## 🧪 Testing Authentication

### Test Login Flow

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev  # Port 3000
   ```

2. **Start Frontend:**
   ```bash
   cd hospital-management-system
   npm run dev  # Port 3001
   ```

3. **Access Login:**
   ```
   http://localhost:3001/auth/login
   ```

4. **Login with Real Credentials:**
   - Email: [user from database]
   - Password: [user's password]

5. **Verify Success:**
   - Should redirect to dashboard
   - Check cookies: `token`, `user_email`, `user_name`
   - Check API requests include `Authorization` header

### Test Logout Flow

1. Navigate to: `http://localhost:3001/auth/logout`
2. Click "Yes, Log Me Out"
3. Verify:
   - All cookies cleared
   - Redirected to login
   - Cannot access dashboard

### Test Protected Routes

1. Clear all cookies
2. Try to access: `http://localhost:3001/dashboard`
3. Should redirect to login page

---

## 🔒 Security Features

### Token Storage
- ✅ Stored in secure HTTP-only cookies
- ✅ Not accessible by JavaScript
- ✅ Protected with `sameSite: 'lax'`
- ✅ Secure flag in production
- ✅ Automatic expiration (1 or 30 days)

### API Integration
- ✅ Token automatically included in all API requests
- ✅ Tenant context automatically set
- ✅ App identification headers included
- ✅ Error handling for expired tokens

### Session Management
- ✅ Remember me option (30 days)
- ✅ Default session (1 day)
- ✅ Clean logout (clears all data)
- ✅ Automatic redirect on auth failure

---

## 📚 API Reference

### `signIn(email, password, rememberMe)`
Authenticate user with backend API.

**Parameters:**
- `email` (string) - User email
- `password` (string) - User password
- `rememberMe` (boolean) - Optional, default false

**Returns:**
```typescript
{
  success: boolean
  error?: string
  user?: {
    id: string
    email: string
    name: string
    role?: string
    tenant_id?: string
  }
}
```

**Example:**
```typescript
const result = await signIn('user@example.com', 'password123', true)
if (result.success) {
  console.log('Logged in:', result.user)
}
```

---

### `signOut()`
Clear all authentication data and logout user.

**Parameters:** None

**Returns:** void

**Example:**
```typescript
signOut()
router.push('/auth/login')
```

---

### `isAuthenticated()`
Check if user has valid authentication token.

**Parameters:** None

**Returns:** boolean

**Example:**
```typescript
if (!isAuthenticated()) {
  router.push('/auth/login')
}
```

---

### `getAuthToken()`
Get current JWT authentication token.

**Parameters:** None

**Returns:** string | undefined

**Example:**
```typescript
const token = getAuthToken()
if (token) {
  console.log('Token:', token)
}
```

---

### `getCurrentUser()`
Get current user information from cookies.

**Parameters:** None

**Returns:** Partial<User> | null

**Example:**
```typescript
const user = getCurrentUser()
if (user) {
  console.log('User:', user.email, user.name)
}
```

---

### `requireAuth(router)`
Redirect to login if not authenticated.

**Parameters:**
- `router` - Next.js router instance

**Returns:** boolean (true if authenticated)

**Example:**
```typescript
import { useRouter } from 'next/navigation'
import { requireAuth } from '@/lib/auth'

const router = useRouter()
if (!requireAuth(router)) {
  return null // Will redirect to login
}
```

---

## 🛠️ Troubleshooting

### "Invalid email or password"
**Cause:** Incorrect credentials or user doesn't exist

**Solution:**
1. Verify user exists in database
2. Check password is correct
3. Create user via admin dashboard if needed

---

### "Failed to sign in"
**Cause:** Backend API not accessible

**Solution:**
1. Ensure backend is running: `npm run dev` in backend folder
2. Check backend URL: `http://localhost:3000`
3. Verify CORS is configured for frontend origin
4. Check browser console for network errors

---

### "Token not included in API requests"
**Cause:** Cookie not set or API interceptor not working

**Solution:**
1. Check cookies in DevTools → Application → Cookies
2. Verify `token` cookie exists
3. Check API client configuration in `lib/api.ts`
4. Ensure `Cookies.get('token')` returns value

---

### "Redirect loop"
**Cause:** Authentication check failing repeatedly

**Solution:**
1. Clear all cookies
2. Clear browser cache
3. Try incognito mode
4. Check for errors in browser console

---

## 🎯 Best Practices

### 1. Always Use Auth Utilities
```typescript
// ✅ GOOD
import { signIn, signOut, isAuthenticated } from '@/lib/auth'

// ❌ BAD
localStorage.setItem('token', ...)
```

### 2. Check Authentication in Protected Pages
```typescript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'

export default function ProtectedPage() {
  const router = useRouter()
  
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login')
    }
  }, [router])
  
  // Page content...
}
```

### 3. Handle Errors Gracefully
```typescript
const result = await signIn(email, password)

if (!result.success) {
  // Show user-friendly error message
  setError(result.error || 'Failed to sign in')
  return
}

// Continue with success flow
```

### 4. Clear Sensitive Data on Logout
```typescript
// Auth utility handles this automatically
signOut() // Clears cookies, localStorage, sessionStorage
```

---

## 📖 Related Documentation

- **Backend Authentication:** `backend/docs/AUTHENTICATION_AND_S3_TEST_RESULTS.md`
- **API Development:** `.kiro/steering/api-development-patterns.md`
- **Security Patterns:** `.kiro/steering/backend-security-patterns.md`
- **Cleanup Summary:** `docs/AUTHENTICATION_CLEANUP_SUMMARY.md`

---

## ✅ Checklist for New Features

When adding new features that require authentication:

- [ ] Import auth utilities from `@/lib/auth`
- [ ] Check authentication before rendering protected content
- [ ] Handle unauthenticated state (redirect to login)
- [ ] Include error handling for auth failures
- [ ] Test with real user credentials
- [ ] Verify token is included in API requests
- [ ] Test logout clears all data

---

**Status:** ✅ Production Ready
**Authentication:** Real backend with AWS Cognito
**Demo Credentials:** None (removed)
**Last Updated:** November 2025
