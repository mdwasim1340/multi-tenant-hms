# Export & Filter Troubleshooting Guide

**Date:** November 14, 2025  
**Status:** Issues Identified and Fixed

---

## 🔍 Issues Found

### Issue 1: CSV Export Error ✅ FIXED
**Error:** `Cannot set headers after they are sent to the client`

**Location:** `backend/src/controllers/patient.controller.ts` line 551

**Cause:** Using both `res.write()` and `res.send()` which sends headers twice

**Before (Broken):**
```typescript
res.write('\uFEFF');
res.send(csv);
```

**After (Fixed):**
```typescript
res.send('\uFEFF' + csv);
```

**Status:** ✅ Fixed

---

### Issue 2: Missing Database Table (Separate Issue)
**Error:** `relation "tenant_subscriptions" does not exist`

**Cause:** This is a different issue - the subscription tables haven't been created yet

**Impact:** Doesn't affect patient export/filter functionality

**Solution:** This needs to be addressed separately (database migration)

---

## 🧪 Testing the Export Functionality

### Method 1: Using Browser

1. **Login to the hospital system**
   - Go to `http://localhost:3001`
   - Sign in with your credentials

2. **Get your authentication details**
   - Open browser console (F12)
   - Run: `document.cookie`
   - Note your `token` and `tenant_id`

3. **Test export in browser**
   - Navigate to patient management
   - The export button should download a CSV file

### Method 2: Using curl

```bash
# Replace with your actual token and tenant ID
TOKEN="your_jwt_token_here"
TENANT_ID="your_tenant_id_here"

# Test 1: Export all patients
curl -X GET "http://localhost:3000/api/patients/export" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  --output patients_all.csv

# Test 2: Export with status filter
curl -X GET "http://localhost:3000/api/patients/export?status=active" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  --output patients_active.csv

# Test 3: Export with gender filter
curl -X GET "http://localhost:3000/api/patients/export?gender=female" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  --output patients_female.csv

# Test 4: Export with age range
curl -X GET "http://localhost:3000/api/patients/export?age_min=18&age_max=65" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  --output patients_age_range.csv

# Test 5: Export specific patient IDs
curl -X GET "http://localhost:3000/api/patients/export?patient_ids=1,2,3,4,5" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  --output patients_selected.csv

# Test 6: Export with multiple filters
curl -X GET "http://localhost:3000/api/patients/export?status=active&gender=female&city=New%20York" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  --output patients_filtered.csv
```

### Method 3: Using Test Script

```bash
cd backend
node test-export.js
```

**Note:** Update TOKEN and TENANT_ID in the script first!

---

## 🔧 Common Issues & Solutions

### Issue: "Authentication required"
**Cause:** Missing or invalid JWT token

**Solution:**
1. Sign in to get a fresh token
2. Check token hasn't expired (1 hour lifetime)
3. Verify token is included in Authorization header

### Issue: "Tenant not found"
**Cause:** Invalid or missing tenant ID

**Solution:**
1. Verify tenant ID is correct
2. Check tenant exists in database
3. Ensure X-Tenant-ID header is set

### Issue: "Permission denied"
**Cause:** User doesn't have `patients:read` permission

**Solution:**
1. Check user's role has read permission
2. Verify role assignments in database
3. Contact admin to grant permission

### Issue: "No data exported"
**Cause:** No patients match the filters

**Solution:**
1. Check if patients exist in database
2. Verify filters are correct
3. Try exporting without filters first

### Issue: "CSV file is empty"
**Cause:** Query returned no results

**Solution:**
1. Check database has patient data
2. Verify tenant schema has patients table
3. Check filters aren't too restrictive

### Issue: "CSV encoding issues in Excel"
**Cause:** Missing UTF-8 BOM

**Solution:**
- Already fixed! The export now includes BOM: `\uFEFF`
- If still having issues, open CSV in Excel using:
  - Data > From Text/CSV
  - Select UTF-8 encoding

---

## 📊 Verifying Export Works

### Check 1: Backend Server Running
```bash
# Check if server is running on port 3000
netstat -ano | findstr ":3000"

# Should show LISTENING on port 3000
```

### Check 2: Export Route Registered
```bash
# Check backend logs for route registration
# Should see: GET /api/patients/export
```

### Check 3: Database Has Patients
```sql
-- Connect to database
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db

-- Set tenant schema
SET search_path TO "your_tenant_id";

-- Check patients exist
SELECT COUNT(*) FROM patients;

-- Should return > 0
```

### Check 4: User Has Permission
```sql
-- Check user's permissions
SELECT p.resource, p.action
FROM user_roles ur
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE ur.user_id = YOUR_USER_ID;

-- Should include: patients | read
```

---

## 🎯 Filter Testing Checklist

### Basic Filters:
- [ ] Status filter (active, inactive, deceased)
- [ ] Gender filter (male, female, other)
- [ ] Search filter (name, email, phone)

### Advanced Filters:
- [ ] Age range (age_min, age_max)
- [ ] Location (city, state)
- [ ] Blood type
- [ ] Date range (created_at_from, created_at_to)

### Selection:
- [ ] Export all patients
- [ ] Export selected patient IDs
- [ ] Export with multiple filters combined

### CSV Format:
- [ ] File downloads successfully
- [ ] Opens in Excel without errors
- [ ] UTF-8 characters display correctly
- [ ] All 32 columns present
- [ ] Data is accurate

---

## 🚀 Next Steps

### Immediate:
1. ✅ Backend export error fixed
2. ⏳ Test export with actual data
3. ⏳ Integrate export button into UI
4. ⏳ Test filters in frontend

### Frontend Integration:
1. Add ExportButton component to patient directory page
2. Add AdvancedFilters component
3. Add SelectionToolbar component
4. Add checkboxes to patient table
5. Wire up state management

### Testing:
1. Test export with no filters
2. Test export with each filter type
3. Test export with multiple filters
4. Test export with selected rows
5. Test CSV opens correctly in Excel

---

## 📝 Backend Changes Made

### Files Modified:
1. **`backend/src/controllers/patient.controller.ts`**
   - Fixed: Changed `res.write() + res.send()` to single `res.send()`
   - Fixed: Removed unused `calculateAge` import
   - Status: ✅ No TypeScript errors

### Files Created:
1. **`backend/src/utils/csv-export.ts`** - CSV utility functions
2. **`backend/test-export.js`** - Test script for export functionality

### Routes Added:
1. **`GET /api/patients/export`** - Export patients to CSV

---

## 🔐 Security Verification

### Authentication: ✅
- Requires valid JWT token
- Token validated by auth middleware

### Authorization: ✅
- Requires `patients:read` permission
- Permission checked by authorization middleware

### Tenant Isolation: ✅
- Requires X-Tenant-ID header
- Tenant context validated
- Can only export own tenant's data

### SQL Injection Prevention: ✅
- All queries use parameterized statements
- No string concatenation in SQL

---

## 📞 Support

### If Export Still Not Working:

1. **Check Backend Logs:**
   ```bash
   # Look for errors in terminal where backend is running
   # Should show any SQL errors or validation errors
   ```

2. **Check Browser Console:**
   ```javascript
   // Open browser console (F12)
   // Look for network errors or API errors
   ```

3. **Verify API Endpoint:**
   ```bash
   # Test if endpoint is accessible
   curl -X GET http://localhost:3000/api/patients/export \
     -H "Authorization: Bearer TOKEN" \
     -H "X-Tenant-ID: TENANT_ID" \
     -v
   ```

4. **Check Database:**
   ```sql
   -- Verify patients table exists
   SET search_path TO "your_tenant_id";
   \dt patients
   
   -- Verify patients exist
   SELECT COUNT(*) FROM patients;
   ```

### If Filters Not Working:

1. **Check Query Parameters:**
   - Verify filter names match API expectations
   - Check values are in correct format
   - Ensure special characters are URL-encoded

2. **Check Backend Logs:**
   - Look for SQL query being executed
   - Verify WHERE clause includes filters
   - Check for SQL syntax errors

3. **Test Filters Individually:**
   - Test each filter one at a time
   - Identify which filter is causing issues
   - Check filter value is valid

---

**Status:** Export functionality fixed and ready for testing  
**Next:** Test with actual data and integrate into UI

