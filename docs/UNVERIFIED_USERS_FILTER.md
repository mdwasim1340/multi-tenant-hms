# Unverified Users Filter Feature

**Date**: November 17, 2025  
**Time**: 21:35 UTC  
**Status**: ✅ COMPLETE

---

## Feature Added

Added a filter button to allow viewing all users including those who haven't completed email verification.

---

## Implementation

### Backend Changes

**New Function**: `getAllUsers()` in `backend/src/services/staff.ts`
- Returns all users with LEFT JOIN to staff_profiles
- Includes verification_status field ('verified' or 'pending_verification')
- Supports filtering by verification_status

**Updated Route**: `GET /api/staff` in `backend/src/routes/staff.ts`
- Added `include_unverified` query parameter
- Added `verification_status` query parameter
- Uses `getAllUsers()` when include_unverified=true
- Uses `getStaffProfiles()` when include_unverified=false (default)

### Frontend Changes

**Updated API Client**: `hospital-management-system/lib/staff.ts`
- Added `include_unverified` parameter to getStaff()
- Added `verification_status` parameter to getStaff()

**Updated Hook**: `hospital-management-system/hooks/use-staff.ts`
- Added support for new filter parameters
- Passes parameters to API client

**Updated Page**: `hospital-management-system/app/staff/page.tsx`
- Added filter controls card above staff list
- "Show All Users" toggle button
- "Verified Only" and "Pending Only" filter buttons (when showing all users)
- Badge showing count of users/staff members

---

## How It Works

### Default Behavior (Verified Staff Only)
- Shows only users who have completed email verification
- These users have staff_profiles created
- Button shows "Show All Users"

### When "Show All Users" is Enabled
- Shows all users in the tenant (verified + unverified)
- Unverified users show as "pending_verification"
- Additional filter buttons appear:
  - "Verified Only" - Show only users with staff profiles
  - "Pending Only" - Show only users without staff profiles
- Badge updates to show "X users" instead of "X staff members"

---

## UI Components

### Filter Card
```
┌─────────────────────────────────────────────────────┐
│  [Show All Users]  [Verified Only]  [Pending Only]  │  6 users
└─────────────────────────────────────────────────────┘
```

### Button States
- **Show All Users** (outline) → Click to enable
- **Showing All Users** (filled) → Click to disable
- **Verified Only** (ghost/filled) → Toggle verified filter
- **Pending Only** (ghost/filled) → Toggle pending filter

---

## Data Structure

### Verified User (has staff_profile)
```json
{
  "user_id": 8,
  "user_name": "Aajmin Admin",
  "user_email": "mdwasimkrm13@gmail.com",
  "staff_id": 1,
  "employee_id": "EMP001",
  "department": "Administration",
  "verification_status": "verified",
  "role": "Hospital Admin"
}
```

### Unverified User (no staff_profile)
```json
{
  "user_id": 11,
  "user_name": "Wasim Akram",
  "user_email": "mdwasimakram44@gmail.com",
  "staff_id": null,
  "employee_id": null,
  "department": null,
  "verification_status": "pending_verification",
  "role": "Doctor"
}
```

---

## Files Modified

### Backend
- `backend/src/services/staff.ts` - Added getAllUsers() function
- `backend/src/routes/staff.ts` - Updated GET / route

### Frontend
- `hospital-management-system/lib/staff.ts` - Added parameters
- `hospital-management-system/hooks/use-staff.ts` - Added parameters
- `hospital-management-system/app/staff/page.tsx` - Added filter UI

---

## Testing

1. **Default View** (Verified Only):
   - Should show 1 staff member (Aajmin Admin)
   - Button shows "Show All Users"

2. **All Users View**:
   - Click "Show All Users"
   - Should show 6 users (all users in tenant)
   - Button shows "Showing All Users"
   - Additional filter buttons appear

3. **Verified Filter**:
   - Click "Verified Only"
   - Should show only 1 user (with staff_profile)

4. **Pending Filter**:
   - Click "Pending Only"
   - Should show 5 users (without staff_profiles)

5. **Toggle Back**:
   - Click "Showing All Users" again
   - Should return to verified-only view

---

## Status

✅ Backend updated with getAllUsers function  
✅ Frontend updated with filter UI  
✅ Backend restarted  
✅ Ready for testing

---

**Feature complete! Users can now view all users including unverified ones.** 🎉
