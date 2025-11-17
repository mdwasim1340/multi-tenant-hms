# Staff Creation Error Fix

**Date**: November 17, 2025  
**Issue**: Staff creation failing with no proper error message  
**Status**: ✅ FIXED

---

## Problem

When creating a new staff member, the system was failing with a 500 Internal Server Error and showing a generic "Failed to create staff" message. The actual error was:

```
TypeError: authService.createUser is not a function
```

### Root Cause

The `createStaffWithUser` function in `backend/src/services/staff.ts` was trying to call `authService.createUser()`, but this function doesn't exist in the auth service. The correct function is `userService.createUser()`.

---

## Solution

### 1. Fixed Import Statement

**File**: `backend/src/services/staff.ts`

```typescript
// Added missing import
import * as userService from './userService';
```

### 2. Updated createStaffWithUser Function

**Changes**:
- Changed from `authService.createUser()` to `userService.createUser()`
- Added tenant_id parameter to the function
- Added role lookup to get role_id from role name
- Improved error handling with try-catch
- Added descriptive error messages

**Before**:
```typescript
export const createStaffWithUser = async (data: {...}) => {
  const user = await authService.createUser({...}); // ❌ Wrong service
  // ...
}
```

**After**:
```typescript
export const createStaffWithUser = async (data: {...}, tenantId: string) => {
  try {
    // Get role_id from role name
    const roleResult = await pool.query(
      'SELECT id FROM roles WHERE name = $1',
      [data.role]
    );
    
    if (roleResult.rows.length === 0) {
      throw new Error(`Role '${data.role}' not found`);
    }
    
    const role_id = roleResult.rows[0].id;
    
    // Create user in database
    const user = await userService.createUser({
      name: data.name,
      email: data.email,
      password: temporaryPassword,
      status: 'active',
      tenant_id: tenantId,
      role_id: role_id
    });
    // ...
  } catch (error: any) {
    throw new Error(`Failed to create staff with user: ${error.message}`);
  }
}
```

### 3. Updated Route Handler

**File**: `backend/src/routes/staff.ts`

**Changes**:
- Added tenant_id extraction from headers
- Added tenant_id validation
- Pass tenant_id to createStaffWithUser
- Improved error handling with specific status codes

```typescript
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'X-Tenant-ID header is required'
      });
    }
    
    if (req.body.name && req.body.email && req.body.role) {
      const result = await staffService.createStaffWithUser(req.body, tenantId);
      // ...
    }
  } catch (error: any) {
    // Improved error handling with specific status codes
    let errorMessage = 'Failed to create staff';
    let statusCode = 500;
    
    if (error.message.includes('not found')) {
      errorMessage = error.message;
      statusCode = 404;
    } else if (error.message.includes('already exists')) {
      errorMessage = error.message;
      statusCode = 409;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      message: error.message,
      details: error.stack ? error.stack.split('\n')[0] : undefined
    });
  }
});
```

### 4. Improved Frontend Error Handling

**File**: `hospital-management-system/lib/staff.ts`

**Changes**:
- Added specific handling for 500 errors
- Show detailed server error messages
- Better error message extraction

```typescript
// Handle server errors with detailed message
if (error.response?.status === 500) {
  const errorMessage = error.response?.data?.message || 
                       error.response?.data?.error || 
                       'Internal server error';
  throw new Error(`Server error: ${errorMessage}`);
}

// Handle other errors
const errorMessage = error.response?.data?.message || 
                     error.response?.data?.error || 
                     'Failed to create staff';
throw new Error(errorMessage);
```

---

## Error Messages Now Shown

### Before Fix
- ❌ Generic: "Failed to create staff"
- ❌ No indication of what went wrong
- ❌ User has no idea how to fix the issue

### After Fix
Users now see specific error messages:

1. **Missing Tenant ID**:
   ```
   X-Tenant-ID header is required
   ```

2. **Role Not Found**:
   ```
   Role 'InvalidRole' not found
   ```

3. **Duplicate Email**:
   ```
   Email already exists in the system
   ```

4. **Server Error**:
   ```
   Server error: Failed to create staff with user: [specific reason]
   ```

5. **Authentication Error**:
   ```
   Authentication required. Please log in to continue.
   ```

---

## Testing

### Test Case 1: Create Staff with Valid Data
```bash
POST /api/staff
Headers:
  X-Tenant-ID: aajmin_polyclinic
  Authorization: Bearer [token]
Body:
  {
    "name": "Dr. John Doe",
    "email": "john.doe@hospital.com",
    "role": "Doctor",
    "employee_id": "EMP001",
    "department": "Cardiology",
    "hire_date": "2025-01-01"
  }

Expected: ✅ 201 Created with credentials
```

### Test Case 2: Create Staff with Invalid Role
```bash
POST /api/staff
Body:
  {
    "name": "Dr. Jane Smith",
    "email": "jane.smith@hospital.com",
    "role": "InvalidRole",
    ...
  }

Expected: ❌ 404 Not Found
Message: "Role 'InvalidRole' not found"
```

### Test Case 3: Create Staff without Tenant ID
```bash
POST /api/staff
Headers:
  Authorization: Bearer [token]
  (Missing X-Tenant-ID)

Expected: ❌ 400 Bad Request
Message: "X-Tenant-ID header is required"
```

---

## Files Modified

1. ✅ `backend/src/services/staff.ts`
   - Added userService import
   - Fixed createStaffWithUser function
   - Added tenant_id parameter
   - Improved error handling

2. ✅ `backend/src/routes/staff.ts`
   - Added tenant_id extraction
   - Added tenant_id validation
   - Improved error responses
   - Added specific status codes

3. ✅ `hospital-management-system/lib/staff.ts`
   - Improved error message extraction
   - Added 500 error handling
   - Better error display

---

## Benefits

### For Users
- ✅ Clear error messages explaining what went wrong
- ✅ Actionable information on how to fix issues
- ✅ Better user experience during staff creation

### For Developers
- ✅ Easier debugging with detailed error messages
- ✅ Proper error codes for different scenarios
- ✅ Better error tracking and logging

### For System
- ✅ Proper multi-tenant isolation
- ✅ Role validation before user creation
- ✅ Consistent error handling across the system

---

## Next Steps

### Recommended Enhancements
1. Add email validation before user creation
2. Check for duplicate employee IDs
3. Add phone number validation
4. Implement email notification to new staff members
5. Add audit logging for staff creation

### Testing Checklist
- [x] Test with valid data
- [x] Test with invalid role
- [x] Test without tenant ID
- [ ] Test with duplicate email
- [ ] Test with duplicate employee ID
- [ ] Test with invalid email format
- [ ] Test with missing required fields

---

## Conclusion

The staff creation error has been fixed by:
1. Using the correct service (userService instead of authService)
2. Adding proper tenant_id handling
3. Implementing comprehensive error handling
4. Providing clear, actionable error messages

Users will now see exactly what went wrong and can take appropriate action to fix the issue.

---

**Status**: ✅ FIXED AND TESTED  
**Impact**: High - Critical functionality now working  
**Priority**: P0 - Production blocker resolved
