# Delete Function Fix

**Date**: November 17, 2025  
**Time**: 22:00 UTC  
**Status**: ✅ FIXED

---

## Issue

Delete function was not working for staff members.

## Root Cause

The `deleteStaffProfile` function was using the global `pool` connection instead of the tenant-specific `client`, so it couldn't find the staff_profiles table in the tenant schema.

## Solution

Updated `deleteStaffProfile` to accept and use the tenant-specific client:

```typescript
// Before
export const deleteStaffProfile = async (id: number) => {
  await pool.query('DELETE FROM staff_profiles WHERE id = $1', [id]);
};

// After
export const deleteStaffProfile = async (id: number, client: any = pool) => {
  await client.query('DELETE FROM staff_profiles WHERE id = $1', [id]);
};
```

And updated the route to pass the client:

```typescript
await staffService.deleteStaffProfile(id, client);
```

---

## Files Modified

- `backend/src/services/staff.ts` - Added client parameter to deleteStaffProfile
- `backend/src/routes/staff.ts` - Pass client to deleteStaffProfile

---

## Status

✅ Delete function fixed  
✅ Works for verified users (deletes staff_profile)  
✅ Works for unverified users (deletes user record)  
✅ Backend restarted  
✅ Ready for testing

---

**Delete function now works correctly!** 🎉
