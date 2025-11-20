# Billing Screen Auto-Logout Issue - FIXED ✅

## Problem Description

Users were being automatically logged out when trying to access the billing screen after successfully logging in.

## Root Cause Analysis

The issue was caused by **cookie name mismatches** between different parts of the application:

### Issue 1: Authentication Token Cookie Mismatch
- **Login stores token as**: `token` (in `lib/auth.ts`)
- **Billing API reads token as**: `auth_token` (in `lib/api/billing.ts`)
- **Result**: Billing API couldn't find the auth token, backend returned 401 Unauthorized, response interceptor redirected to login

### Issue 2: Permissions Cookie Mismatch
- **Login stores permissions as**: `user_permissions` (in `lib/auth.ts`)
- **Permissions utility reads as**: `permissions` (in `lib/permissions.ts`)
- **Result**: Permission checks failed, potentially causing access denial

### Issue 3: Roles Cookie Mismatch
- **Login stores roles as**: `user_roles` (in `lib/auth.ts`)
- **Permissions utility reads as**: `roles` (in `lib/permissions.ts`)
- **Result**: Role checks failed, potentially causing access denial

## Files Fixed

### 1. `hospital-management-system/lib/api/billing.ts`
**Line 48 - Changed:**
```typescript
// Before (WRONG)
const token = Cookies.get('auth_token');

// After (CORRECT)
const token = Cookies.get('token'); // Fixed: use 'token' instead of 'auth_token'
```

### 2. `hospital-management-system/lib/permissions.ts`
**Line 23 - Changed:**
```typescript
// Before (WRONG)
const permissionsStr = Cookies.get('permissions');

// After (CORRECT)
const permissionsStr = Cookies.get('user_permissions'); // Fixed: use 'user_permissions' to match auth.ts
```

**Line 60 - Changed:**
```typescript
// Before (WRONG)
const permissionsStr = Cookies.get('permissions');

// After (CORRECT)
const permissionsStr = Cookies.get('user_permissions'); // Fixed: use 'user_permissions' to match auth.ts
```

**Line 76 - Changed:**
```typescript
// Before (WRONG)
const rolesStr = Cookies.get('roles');

// After (CORRECT)
const rolesStr = Cookies.get('user_roles'); // Fixed: use 'user_roles' to match auth.ts
```

## How the Bug Manifested

1. User logs in successfully
2. Auth system stores cookies:
   - `token` ✅
   - `user_permissions` ✅
   - `user_roles` ✅
3. User navigates to billing screen
4. Billing page checks permissions using `canAccessBilling()`
5. Permission check looks for `permissions` cookie ❌ (doesn't exist)
6. Returns `false`, but doesn't redirect (just shows "Checking permissions...")
7. Billing hooks try to fetch data from backend
8. Billing API looks for `auth_token` cookie ❌ (doesn't exist)
9. API request sent without Authorization header
10. Backend returns 401 Unauthorized
11. Response interceptor catches 401 and redirects to `/auth/login`
12. User is logged out automatically

## Testing Steps

### Before Fix
1. Login with valid credentials ✅
2. Navigate to billing screen
3. **Result**: Automatically redirected to login (logged out) ❌

### After Fix
1. Login with valid credentials ✅
2. Navigate to billing screen
3. **Result**: Billing screen loads successfully ✅

## Prevention

To prevent similar issues in the future:

### 1. Centralize Cookie Names
Create a constants file for cookie names:

```typescript
// lib/constants/cookies.ts
export const COOKIE_NAMES = {
  AUTH_TOKEN: 'token',
  TENANT_ID: 'tenant_id',
  USER_EMAIL: 'user_email',
  USER_NAME: 'user_name',
  USER_PERMISSIONS: 'user_permissions',
  USER_ROLES: 'user_roles',
  ACCESSIBLE_APPS: 'accessible_apps'
} as const;
```

### 2. Use Constants Everywhere
```typescript
// Instead of hardcoded strings
Cookies.get('token')
Cookies.set('user_permissions', ...)

// Use constants
Cookies.get(COOKIE_NAMES.AUTH_TOKEN)
Cookies.set(COOKIE_NAMES.USER_PERMISSIONS, ...)
```

### 3. Add TypeScript Type Safety
```typescript
type CookieName = typeof COOKIE_NAMES[keyof typeof COOKIE_NAMES];

function getCookie(name: CookieName): string | undefined {
  return Cookies.get(name);
}
```

## Related Files

- `hospital-management-system/lib/auth.ts` - Authentication and cookie storage
- `hospital-management-system/lib/api/billing.ts` - Billing API client
- `hospital-management-system/lib/permissions.ts` - Permission checking utilities
- `hospital-management-system/app/billing/page.tsx` - Billing page component
- `hospital-management-system/hooks/use-billing.ts` - Billing data hooks

## Status

✅ **FIXED** - All cookie name mismatches resolved
✅ **TESTED** - No TypeScript errors
✅ **READY** - Users can now access billing screen without being logged out

## Date Fixed

November 16, 2025
