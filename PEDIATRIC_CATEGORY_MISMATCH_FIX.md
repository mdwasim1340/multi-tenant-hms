# Pediatric Department Category Mismatch - FIXED

## Issue Summary
**Problem**: Pediatric Department page shows 35 beds (all tenant beds) instead of 2 beds (only Pediatric category beds)

**Root Cause**: URL parameter mismatch in category mapping
- URL uses: `/department/pediatric` (singular)
- Controller mapping expected: `pediatrics` (plural)
- Result: `categoryId` returned `undefined`, causing query to return ALL beds

## Database Verification
```sql
-- Pediatric category ID
SELECT id, name FROM bed_categories WHERE LOWER(name) = 'pediatric';
-- Result: id = 4

-- Beds with Pediatric category
SELECT COUNT(*) FROM beds WHERE category_id = 4;
-- Result: 2 beds (301-A, 301-B)

-- Total beds in tenant
SELECT COUNT(*) FROM beds;
-- Result: 35 beds
```

## Fix Applied

### File: `backend/src/controllers/bed-management.controller.ts`

**Before (Line 372-387)**:
```typescript
private getDepartmentCategoryId(departmentName: string): number | undefined {
  const categoryMap: { [key: string]: number } = {
    'cardiology': 8,
    'icu': 2,
    'general': 1,
    'pediatrics': 4,    // ❌ Only plural form
    'emergency': 3,
    'maternity': 5,
    'orthopedics': 9,   // ❌ Only plural form
    'neurology': 10,
    'oncology': 11,
    'surgery': 12
  };

  return categoryMap[departmentName.toLowerCase()];
}
```

**After (FIXED)**:
```typescript
private getDepartmentCategoryId(departmentName: string): number | undefined {
  const categoryMap: { [key: string]: number } = {
    'cardiology': 8,
    'icu': 2,
    'general': 1,
    'pediatric': 4,     // ✅ FIXED: Add singular form (URL uses this)
    'pediatrics': 4,    // Pediatrics category ID (plural form)
    'emergency': 3,
    'maternity': 5,
    'orthopedic': 9,    // ✅ FIXED: Add singular form
    'orthopedics': 9,   // Orthopedics category ID (plural form)
    'neurology': 10,
    'oncology': 11,
    'surgery': 12
  };

  return categoryMap[departmentName.toLowerCase()];
}
```

## How the Fix Works

### Before Fix:
1. Frontend navigates to: `/bed-management/department/pediatric`
2. Backend receives: `departmentName = "pediatric"`
3. Controller looks up: `categoryMap["pediatric"]` → `undefined`
4. Query executes: `WHERE category_id = undefined` → Returns ALL beds (35)
5. Result: Wrong bed count displayed

### After Fix:
1. Frontend navigates to: `/bed-management/department/pediatric`
2. Backend receives: `departmentName = "pediatric"`
3. Controller looks up: `categoryMap["pediatric"]` → `4` ✅
4. Query executes: `WHERE category_id = 4` → Returns only Pediatric beds (2)
5. Result: Correct bed count displayed

## Expected Results After Fix

### Pediatric Department Page
- **Total Beds**: 2 (was showing 35)
- **Beds List**: 301-A, 301-B (was showing all 35 beds)
- **Statistics**: Match the category page exactly

### Pediatric Category Page
- **Total Beds**: 2 ✅ Already correct
- **Beds List**: 301-A, 301-B ✅ Already correct

## Verification Steps

1. **Restart Backend Server** (if not auto-reloaded):
   ```bash
   cd backend
   npm run dev
   ```

2. **Navigate to Pediatric Department**:
   - Go to: http://localhost:3001/bed-management/department/pediatric
   - Expected: Shows 2 beds total

3. **Navigate to Pediatric Category**:
   - Go to: http://localhost:3001/bed-management/categories/4
   - Expected: Shows 2 beds total

4. **Verify Match**:
   - Both pages should show identical bed counts
   - Both pages should list the same beds (301-A, 301-B)

## API Endpoints Affected

### GET `/api/bed-management/departments/pediatric/beds`
**Before**: Returned 35 beds (all tenant beds)
**After**: Returns 2 beds (only Pediatric category beds)

### GET `/api/bed-management/departments/pediatric/stats`
**Before**: Showed stats for all 35 beds
**After**: Shows stats for only 2 Pediatric beds

## Additional Departments Fixed

The same fix was applied to **Orthopedics** department:
- Added `'orthopedic': 9` (singular form)
- Kept `'orthopedics': 9` (plural form)

This ensures consistent behavior across all departments regardless of URL format.

## Testing Checklist

- [ ] Pediatric department page shows 2 beds
- [ ] Pediatric category page shows 2 beds
- [ ] Both pages show same bed numbers (301-A, 301-B)
- [ ] Statistics match between department and category pages
- [ ] Orthopedics department also works correctly
- [ ] Other departments (Cardiology, ICU, etc.) still work

## Status
✅ **FIXED** - Backend controller updated to handle both singular and plural department names
🔄 **PENDING** - Verification in browser after backend restart

## Files Modified
1. `backend/src/controllers/bed-management.controller.ts` - Added singular forms to category mapping

## Related Issues
- Similar issue may exist for other departments if URLs use singular forms
- All department URLs should be checked for consistency

---

**Fix Date**: November 23, 2025
**Issue Type**: URL Parameter Mapping
**Severity**: High (Data Display Inconsistency)
**Resolution**: Add both singular and plural forms to category mapping
