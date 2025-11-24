# Add Bed 401 Error - Final Fix

## Problem Summary

When clicking "Add Bed" button after filling the form, the user receives a 401 error with an empty response body `{}`, causing automatic logout.

## Root Cause Analysis

The 401 error is coming from the `requireApplicationAccess('hospital_system')` middleware, which runs AFTER the authentication middleware. The issue is:

1. **Authentication succeeds** - JWT token is valid
2. **User mapping may fail** - `getUserByEmail()` might return null if user doesn't exist in local database
3. **Fallback to Cognito sub** - System falls back to Cognito UUID
4. **Authorization check fails** - The authorization service can't find permissions for the Cognito UUID

## Middleware Chain

```
POST /api/beds
  ↓
1. apiAppAuthMiddleware (✅ passes)
  ↓
2. tenantMiddleware (✅ passes)
  ↓
3. hospitalAuthMiddleware (✅ passes, sets userId)
  ↓
4. requireApplicationAccess('hospital_system') (❌ FAILS HERE)
  ↓
5. bedController.createBed (never reached)
```

## The Fix

### 1. Enhanced User Mapping in hospitalAuthMiddleware

**File**: `backend/src/middleware/auth.ts`

**Changes**:
- Added detailed logging for user mapping process
- Added critical checks to ensure userId is never null/undefined
- Added fallback error responses if user mapping completely fails
- Log the final userId value and its type

```typescript
// Now logs:
✅ User mapping successful: {
  email: 'user@example.com',
  localUserId: 123,
  cognitoUserId: 'uuid-string',
  finalUserId: 123,
  userIdType: 'number'
}
```

### 2. Enhanced Authorization Middleware Logging

**File**: `backend/src/middleware/authorization.ts`

**Changes**:
- Added detailed request logging when userId is missing
- Enhanced error messages with more context
- Added details field to help debugging

```typescript
// Now returns:
{
  error: 'Authentication required',
  code: 'USER_ID_MISSING',
  message: 'User authentication failed. Please logout and login again.',
  details: 'User ID not found in request after authentication'
}
```

### 3. Diagnostic Scripts

Created two diagnostic scripts to help identify the issue:

**`backend/diagnose-user-permissions.js`**
- Checks all users in database
- Verifies role assignments
- Confirms hospital_system:access permissions
- Lists all available permissions and roles

**`backend/test-bed-creation-with-user.js`**
- Simulates the exact frontend flow
- Tests login → bed creation
- Provides detailed error information

## Verification Steps

### Step 1: Check Backend Logs

When you try to create a bed, the backend should now log:

```
Hospital Auth Middleware: {
  hasToken: true,
  tenantId: 'aajmin_polyclinic',
  appId: 'hospital_system',
  ...
}

JWT Verification Success: {
  userId: 'cognito-uuid',
  email: 'user@example.com',
  groups: ['hospital-admin']
}

✅ User mapping successful: {
  email: 'user@example.com',
  localUserId: 123,  // ← This should be a number, not null
  cognitoUserId: 'uuid',
  finalUserId: 123,
  userIdType: 'number'
}

🔐 requireApplicationAccess: {
  applicationId: 'hospital_system',
  userId: 123,  // ← Should match localUserId above
  userIdType: 'number',
  path: '/api/beds',
  method: 'POST'
}
```

### Step 2: Run Diagnostic Script

```bash
cd backend
node diagnose-user-permissions.js
```

This will show:
- All users in database
- Their role assignments
- Who has hospital_system:access permission

### Step 3: Check User Exists in Database

The logged-in user MUST exist in the `users` table with:
- Correct email address
- Assigned role (Admin, Hospital Admin, Doctor, etc.)
- Role must have `hospital_system:access` permission

## Common Issues & Solutions

### Issue 1: User Not in Database

**Symptom**: `localUserId: null` in logs

**Solution**: 
```sql
-- Check if user exists
SELECT * FROM users WHERE email = 'your-email@example.com';

-- If not, create user (or use signup endpoint)
INSERT INTO users (name, email, tenant_id, created_at)
VALUES ('User Name', 'email@example.com', 'tenant_id', NOW());
```

### Issue 2: User Has No Role

**Symptom**: Authorization check fails even though user exists

**Solution**:
```sql
-- Assign Hospital Admin role
INSERT INTO user_roles (user_id, role_id)
SELECT 
  (SELECT id FROM users WHERE email = 'email@example.com'),
  (SELECT id FROM roles WHERE name = 'Hospital Admin');
```

### Issue 3: Role Has No Permissions

**Symptom**: User has role but still can't access

**Solution**:
```sql
-- Check role permissions
SELECT r.name, p.resource, p.action
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'Hospital Admin';

-- Should include: hospital_system:access
```

### Issue 4: Email Mismatch

**Symptom**: JWT email doesn't match database email

**Solution**: Ensure the email in Cognito matches the email in the database exactly (case-sensitive).

## Testing the Fix

### Test 1: Check Logs

1. Open backend terminal
2. Try to add a bed
3. Look for the log messages above
4. Verify `localUserId` is a number, not null

### Test 2: Run Test Script

```bash
cd backend
node test-bed-creation-with-user.js
```

Update the script with your actual email and password.

### Test 3: Manual API Test

```bash
# 1. Login
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}'

# 2. Use the token to create bed
curl -X POST http://localhost:3000/api/beds \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "X-Tenant-ID: your_tenant_id" \
  -H "X-App-ID: hospital_system" \
  -H "X-API-Key: hospital-dev-key-789" \
  -H "Content-Type: application/json" \
  -d '{
    "bed_number": "TEST-001",
    "bed_type": "Standard",
    "department": "Cardiology",
    "floor": "3",
    "wing": "A",
    "room_number": "301",
    "status": "Available"
  }'
```

## Next Steps

1. **Restart backend server** to apply the changes
2. **Try to add a bed** and check the backend logs
3. **Share the logs** with me so I can see exactly what's happening
4. **Run diagnostic script** to verify user permissions

## Expected Outcome

After this fix:
- Backend logs will show detailed information about user mapping
- Error messages will be more helpful
- We can identify exactly where the authentication/authorization is failing
- The 401 error will include proper error details instead of empty `{}`

## Status

✅ Code changes applied
✅ Diagnostic scripts created
⏳ Waiting for backend restart and testing
⏳ Need to verify user exists in database with correct permissions

---

**Last Updated**: November 21, 2025
**Files Modified**:
- `backend/src/middleware/auth.ts`
- `backend/src/middleware/authorization.ts`

**Files Created**:
- `backend/diagnose-user-permissions.js`
- `backend/test-bed-creation-with-user.js`
