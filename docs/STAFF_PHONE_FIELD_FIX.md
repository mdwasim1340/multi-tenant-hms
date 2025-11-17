# Staff Phone Field Fix

**Date**: November 17, 2025  
**Issue**: Column name mismatch  
**Status**: ✅ FIXED

## Problem

After fixing the tenant context issue, a new error appeared:
```
Error: column u.phone does not exist
```

## Root Cause

The `users` table has a column named `phone_number`, not `phone`. The query was using the wrong column name.

**Database Schema**:
```sql
Table "public.users"
Column              | Type
--------------------+-----------------------------
phone_number        | character varying(50)  -- CORRECT
```

**Query was using**:
```sql
SELECT u.phone as user_phone  -- WRONG - column doesn't exist
```

## Solution

Updated the query to use the correct column name:

```typescript
// Before (WRONG)
SELECT sp.*, u.name as user_name, u.email as user_email, u.phone as user_phone

// After (CORRECT)
SELECT sp.*, u.name as user_name, u.email as user_email, u.phone_number as user_phone
```

## Files Modified

- `backend/src/services/staff.ts` - Updated `getStaffProfileById` query

## Testing

Now the View and Edit functions should work correctly:
1. Navigate to Staff Management
2. Click "View" on any staff member
3. Should display staff details including phone number
4. Click "Edit" on any staff member
5. Should load edit form with all data

## Status

✅ **FIXED** - Backend restarted with correct column name
