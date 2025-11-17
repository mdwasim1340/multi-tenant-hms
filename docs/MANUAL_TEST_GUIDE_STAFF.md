# Manual Testing Guide - Staff Management

**Purpose**: Verify that View and Edit functions are working correctly after the bug fixes  
**Date**: November 17, 2025  
**Estimated Time**: 5-10 minutes

---

## Prerequisites

1. ✅ Backend server running on port 3000
2. ✅ Frontend server running on port 3001
3. ✅ Signed in to hospital management system
4. ✅ At least one staff member exists in the system

---

## Test 1: View Staff Details (Previously 500 Error)

### Steps:
1. Navigate to **Staff Management** page
   - URL: `http://localhost:3001/staff`

2. Locate any staff member in the list

3. Click the **"View"** button (eye icon) for that staff member

### Expected Results:
- ✅ Page navigates to `/staff/[id]` without errors
- ✅ Staff details page loads successfully
- ✅ All information displays correctly:
  - Name
  - Email
  - Phone
  - Employee ID
  - Department
  - Specialization
  - Hire Date
  - Employment Type
  - Status
  - Emergency Contact (if available)

### Previous Behavior:
- ❌ 500 Internal Server Error
- ❌ "Failed to fetch staff profile" error message
- ❌ Page showed error state

### If Test Fails:
1. Open browser console (F12)
2. Check for error messages
3. Verify backend is running
4. Check backend logs for errors

---

## Test 2: Edit Staff Information (Previously 500 Error)

### Steps:
1. From the Staff Management page, click the **"Edit"** button (pencil icon) for any staff member

2. Verify the edit form loads with current data

3. Make a change to any field (e.g., change Department from "Cardiology" to "Emergency")

4. Click **"Update Staff"** button

### Expected Results:
- ✅ Edit page loads at `/staff/[id]/edit` without errors
- ✅ Form is pre-filled with current staff data
- ✅ All fields are editable
- ✅ After clicking "Update Staff":
  - Success toast notification appears
  - Page redirects back to staff list
  - Changes are saved in database

### Previous Behavior:
- ❌ 500 Internal Server Error when loading edit page
- ❌ "Failed to fetch staff profile" error message
- ❌ Form didn't load

### Verification:
1. After updating, click "View" on the same staff member
2. Verify the changes you made are displayed
3. Changes should persist after page refresh

---

## Test 3: Delete Staff (Should Still Work)

### Steps:
1. From the Staff Management page, click the **"Delete"** button (trash icon) for a test staff member

2. Confirm the deletion in the dialog

### Expected Results:
- ✅ Confirmation dialog appears
- ✅ After confirming, staff member is removed from list
- ✅ Success toast notification appears
- ✅ Staff member is deleted from database

### Note:
This function was already working before the fixes and should continue to work.

---

## Test 4: Create New Staff (Should Still Work)

### Steps:
1. Click **"Add Staff Member"** button

2. Fill in all required fields:
   - Name
   - Email (use a unique email)
   - Role
   - Employee ID (use a unique ID)
   - Department
   - Hire Date

3. Click **"Create Staff"** button

### Expected Results:
- ✅ Form validates correctly
- ✅ Success message appears
- ✅ Email verification sent message displays
- ✅ New staff member appears in list
- ✅ Verification email sent to staff member

### Note:
This function was already working and should continue to work.

---

## Test 5: Complete CRUD Workflow

### Steps:
1. **Create**: Add a new staff member named "Test User"
2. **Read**: Click "View" to see their details
3. **Update**: Click "Edit" and change their department
4. **Delete**: Remove the test user

### Expected Results:
- ✅ All operations complete without errors
- ✅ No 500 errors at any step
- ✅ All toast notifications appear correctly
- ✅ Data persists correctly between operations

---

## Common Issues and Solutions

### Issue: "Failed to fetch staff profile"
**Possible Causes**:
- Backend not running
- Wrong tenant ID
- Database connection issue

**Solutions**:
1. Check backend is running: `http://localhost:3000`
2. Check browser console for errors
3. Verify you're signed in correctly

### Issue: Changes not saving
**Possible Causes**:
- Form validation errors
- Network issues
- Backend errors

**Solutions**:
1. Check all required fields are filled
2. Check browser console for errors
3. Check backend logs for errors

### Issue: 500 Error still appearing
**Possible Causes**:
- Backend not restarted after fixes
- Old code still cached

**Solutions**:
1. Restart backend server
2. Clear browser cache
3. Hard refresh page (Ctrl+Shift+R)

---

## Success Criteria

All tests pass if:
- ✅ View function loads staff details without 500 error
- ✅ Edit function loads form and saves changes without 500 error
- ✅ Delete function continues to work
- ✅ Create function continues to work
- ✅ All toast notifications appear correctly
- ✅ No console errors
- ✅ Data persists correctly

---

## Reporting Issues

If any test fails, please provide:
1. Which test failed
2. Error message from browser console
3. Error message from backend logs
4. Steps to reproduce
5. Screenshot of error (if applicable)

---

## Technical Details (For Reference)

### What Was Fixed:

**Problem**: The `getStaffProfileById` and `updateStaffProfile` functions were using the global database `pool` instead of the tenant-specific `req.dbClient`.

**Solution**: Updated both functions to accept and use the tenant-specific database client:

```typescript
// Before (WRONG)
const result = await pool.query(...)

// After (CORRECT)
const result = await client.query(...)
```

**Why This Matters**: 
- The `staff_profiles` table is in the tenant schema
- The `users` table is in the public schema
- The query JOINs these two tables
- Without the correct schema context, the JOIN fails
- This caused the 500 errors

### Files Modified:
- `backend/src/services/staff.ts` - Added client parameter to functions
- `backend/src/routes/staff.ts` - Pass req.dbClient to service functions

---

**Test Status**: Ready for manual testing  
**Expected Duration**: 5-10 minutes  
**Priority**: High (Critical bug fixes)
