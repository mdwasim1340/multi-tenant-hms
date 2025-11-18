Staff Management Fixes - Complete Summary

 FIXED: View Staff Function (was returning 500 error)
 FIXED: Edit Staff Function (was returning 500 error)

WHAT WAS WRONG:
- Backend was using global database pool
- Should have used tenant-specific client
- Multi-tenant context was lost

WHAT WAS FIXED:
- Updated getStaffProfileById() to use tenant client
- Updated updateStaffProfile() to use tenant client
- Routes now pass req.dbClient to services

FILES CHANGED:
- backend/src/services/staff.ts
- backend/src/routes/staff.ts

TESTING:
1. Go to http://localhost:3001/staff
2. Click 'View' on any staff - should work now
3. Click 'Edit' on any staff - should work now
4. Make changes and save - should work now

DOCUMENTATION:
- STAFF_FIXES_COMPLETE.md - Full details
- QUICK_TEST_CHECKLIST.md - Quick test guide
- docs/STAFF_VIEW_EDIT_FIX.md - Technical details

STATUS: Ready for testing!
