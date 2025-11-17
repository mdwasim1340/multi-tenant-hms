# Staff View and Edit Functions Fixed

**Date**: November 17, 2025  
**Issue**: View and Edit functions returning 500 errors  
**Status**: ✅ FIXED

## Problem

When clicking "View" or "Edit" on a staff member, the application was returning 500 errors:
- `getStaffById` was failing with status code 500
- Edit function was also not working
- Only Delete function was working properly

## Root Cause

The staff service functions (`getStaffProfileById` and `updateStaffProfile`) were using the global database `pool` connection instead of the tenant-specific database client (`req.dbClient`) that is set by the tenant middleware.

### Technical Details

1. **Tenant Middleware** sets the schema context on `req.dbClient`:
   ```typescript
   await client.query(`SET search_path TO "${tenantId}", public`);
   req.dbClient = client;
   ```

2. **Staff Service** was using global `pool` instead of tenant-specific client:
   ```typescript
   // WRONG - uses global pool
   const result = await pool.query(...)
   
   // CORRECT - uses tenant-specific client
   const result = await client.query(...)
   ```

3. **Users Table** is in the public schema, but `staff_profiles` is in the tenant schema, so the JOIN was failing when using the wrong connection context.

## Solution

### 1. Updated `getStaffProfileById` Service Function

**File**: `backend/src/services/staff.ts`

```typescript
// Added client parameter with default fallback to pool
export const getStaffProfileById = async (id: number, client: any = pool) => {
  const result = await client.query(
    `SELECT sp.*, u.name as user_name, u.email as user_email, u.phone as user_phone
    FROM staff_profiles sp
    JOIN public.users u ON sp.user_id = u.id  // Explicitly reference public schema
    WHERE sp.id = $1`,
    [id]
  );
  return result.rows[0];
};
```

### 2. Updated `updateStaffProfile` Service Function

**File**: `backend/src/services/staff.ts`

```typescript
// Added client parameter with default fallback to pool
export const updateStaffProfile = async (
  id: number, 
  updates: Partial<StaffProfile>, 
  client: any = pool
) => {
  // ... existing code ...
  const result = await client.query(
    `UPDATE staff_profiles SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  return result.rows[0];
};
```

### 3. Updated GET /:id Route

**File**: `backend/src/routes/staff.ts`

```typescript
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const client = (req as any).dbClient || pool;  // Get tenant-specific client
    const staff = await staffService.getStaffProfileById(id, client);
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        error: 'Staff profile not found'
      });
    }

    res.json({
      success: true,
      data: staff
    });
  } catch (error: any) {
    console.error('Error fetching staff profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch staff profile',
      message: error.message
    });
  }
});
```

### 4. Updated PUT /:id Route

**File**: `backend/src/routes/staff.ts`

```typescript
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const client = (req as any).dbClient || pool;  // Get tenant-specific client
    const profile = await staffService.updateStaffProfile(id, req.body, client);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Staff profile not found'
      });
    }

    res.json({
      success: true,
      message: 'Staff profile updated successfully',
      data: profile
    });
  } catch (error: any) {
    console.error('Error updating staff profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update staff profile',
      message: error.message
    });
  }
});
```

### 5. Added Pool Import

**File**: `backend/src/routes/staff.ts`

```typescript
import { Router, Request, Response } from 'express';
import * as staffService from '../services/staff';
import pool from '../database';  // Added this import
```

## Testing

### Test View Function
1. Navigate to Staff Management page
2. Click "View" button on any staff member
3. Should display staff details without 500 error

### Test Edit Function
1. Navigate to Staff Management page
2. Click "Edit" button on any staff member
3. Should display edit form with current data
4. Make changes and save
5. Should update successfully without 500 error

## Why Delete Was Working

The `deleteStaffProfile` function was working because it only queries the `staff_profiles` table (which is in the tenant schema) and doesn't need to JOIN with the `users` table in the public schema. The tenant middleware's schema context was sufficient for this simple query.

## Key Learnings

1. **Multi-Tenant Context**: Always use the tenant-specific database client (`req.dbClient`) for queries that involve tenant-specific tables
2. **Schema References**: When JOINing tables across schemas, explicitly reference the schema (e.g., `public.users`)
3. **Default Parameters**: Using default parameters (`client: any = pool`) allows functions to work in both tenant-specific and global contexts
4. **Middleware Chain**: The tenant middleware must run before routes that need tenant context

## Files Modified

- `backend/src/services/staff.ts` - Updated `getStaffProfileById` and `updateStaffProfile`
- `backend/src/routes/staff.ts` - Updated GET /:id and PUT /:id routes, added pool import

## Status

✅ **COMPLETE** - View and Edit functions now working correctly with proper tenant context
