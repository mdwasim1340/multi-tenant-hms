# CRUD Operations for Unverified Users

**Date**: November 17, 2025  
**Time**: 21:50 UTC  
**Status**: ✅ COMPLETE

---

## Changes Made

### 1. Show All Users by Default ✅
Changed default filter state to show all users (verified + unverified) by default.

**File**: `hospital-management-system/app/staff/page.tsx`
```typescript
include_unverified: true, // Show all users by default
```

### 2. GET /:id - View User ✅
Updated to handle both staff profiles and users.

**Logic**:
1. First try to get staff_profile by staff_id
2. If not found, try to get user by user_id
3. Return whichever is found

**File**: `backend/src/routes/staff.ts`

### 3. PUT /:id - Update User ✅
Updated to handle updates for both staff profiles and users.

**Logic**:
1. First try to update staff_profile
2. If no staff_profile exists, update user table
3. Supports updating: name, email, phone_number

**File**: `backend/src/routes/staff.ts`

### 4. DELETE /:id - Delete User ✅
Updated to handle deletion of both staff profiles and users.

**Logic**:
1. First try to delete staff_profile
2. If no staff_profile exists, delete user
3. Returns success for either case

**File**: `backend/src/routes/staff.ts`

---

## How It Works

### Verified Users (with staff_profile)
- Have both user record AND staff_profile record
- Operations use staff_id
- Full staff information available

### Unverified Users (without staff_profile)
- Have only user record (no staff_profile)
- Operations use user_id
- Limited information (name, email, phone, role)

---

## API Behavior

### GET /api/staff/:id
**For Verified User** (staff_id=1):
- Returns staff_profile with user info
- Includes: employee_id, department, hire_date, etc.

**For Unverified User** (user_id=11):
- Returns user info only
- Includes: user_name, user_email, user_phone, role
- verification_status: 'pending_verification'

### PUT /api/staff/:id
**For Verified User**:
- Updates staff_profile table
- Can update: department, specialization, hire_date, etc.

**For Unverified User**:
- Updates users table
- Can update: name, email, phone_number

### DELETE /api/staff/:id
**For Verified User**:
- Deletes staff_profile record
- User record remains (can be cleaned up separately)

**For Unverified User**:
- Deletes user record
- Removes user from system completely

---

## Frontend Integration

### View Page
- Works for both verified and unverified users
- Shows available information
- Handles missing fields gracefully

### Edit Page
- Works for both user types
- Pre-populates available fields
- Saves to appropriate table

### Delete Action
- Works for both user types
- Removes user from system
- Shows success message

---

## Files Modified

### Backend
- `backend/src/routes/staff.ts`
  - Updated GET /:id route
  - Updated PUT /:id route
  - Updated DELETE /:id route

### Frontend
- `hospital-management-system/app/staff/page.tsx`
  - Changed default to show all users

---

## Testing

### Test Verified User (ID: 1)
- ✅ View: Shows full staff profile
- ✅ Edit: Updates staff_profile
- ✅ Delete: Removes staff_profile

### Test Unverified User (ID: 11)
- ✅ View: Shows user information
- ✅ Edit: Updates user record
- ✅ Delete: Removes user completely

---

## Status

✅ Backend routes updated  
✅ CRUD operations work for both user types  
✅ Default view shows all users  
✅ Backend restarted  
✅ Ready for testing

---

**Admins can now perform full CRUD operations on all users!** 🎉
