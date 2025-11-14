# CSV Export & Advanced Filtering Implementation Guide

**Date:** November 14, 2025  
**Status:** ✅ IMPLEMENTED  
**Features:** CSV Export, Row Selection, Advanced Filters

---

## 🎯 Features Implemented

### 1. CSV Export System
- ✅ Backend CSV export endpoint (`/api/patients/export`)
- ✅ Reusable CSV utility functions
- ✅ Frontend export hook (`useExport`)
- ✅ Export button component
- ✅ Support for filtered exports
- ✅ Support for selected row exports

### 2. Row Selection
- ✅ Checkbox selection for individual rows
- ✅ Select all/none functionality
- ✅ Selection toolbar with count
- ✅ Export selected rows only

### 3. Advanced Filters
- ✅ Expandable filter panel
- ✅ Multiple filter types (text, select, date, number, daterange)
- ✅ Active filter count badge
- ✅ Clear all filters button
- ✅ Filter persistence across pages

---

## 📁 Files Created

### Backend Files:
1. **`backend/src/utils/csv-export.ts`** - CSV utility functions
2. **`backend/src/controllers/patient.controller.ts`** - Added `exportPatientsCSV` function
3. **`backend/src/routes/patients.routes.ts`** - Added `/export` route

### Frontend Files:
1. **`hospital-management-system/hooks/useExport.ts`** - Export hook
2. **`hospital-management-system/components/export/ExportButton.tsx`** - Export button component
3. **`hospital-management-system/components/filters/AdvancedFilters.tsx`** - Advanced filter component
4. **`hospital-management-system/components/selection/SelectionToolbar.tsx`** - Selection toolbar component

---

## 🚀 Usage Examples

### Example 1: Basic Export Button

```typescript
import { ExportButton } from '@/components/export/ExportButton';

<ExportButton
  endpoint="/api/patients/export"
  filename="patients.csv"
  totalCount={100}
/>
```

### Example 2: Export with Filters

```typescript
<ExportButton
  endpoint="/api/patients/export"
  filters={{
    status: 'active',
    gender: 'female',
    age_min: 18,
    age_max: 65,
  }}
  totalCount={50}
/>
```

### Example 3: Export Selected Rows

```typescript
<ExportButton
  endpoint="/api/patients/export"
  selectedIds={[1, 2, 3, 4, 5]}
  selectedCount={5}
  totalCount={100}
/>
```

### Example 4: Advanced Filters

```typescript
import { AdvancedFilters } from '@/components/filters/AdvancedFilters';

const filterFields = [
  { name: 'search', label: 'Search', type: 'text', placeholder: 'Search patients...' },
  { name: 'status', label: 'Status', type: 'select', options: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ]},
  { name: 'gender', label: 'Gender', type: 'select', options: [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
  ]},
  { name: 'age_min', label: 'Min Age', type: 'number', placeholder: '0' },
  { name: 'age_max', label: 'Max Age', type: 'number', placeholder: '150' },
  { name: 'created_at', label: 'Registration Date', type: 'daterange' },
];

<AdvancedFilters
  fields={filterFields}
  filters={filters}
  onFilterChange={setFilters}
  onClearFilters={() => setFilters({})}
/>
```

### Example 5: Selection Toolbar

```typescript
import { SelectionToolbar } from '@/components/selection/SelectionToolbar';

<SelectionToolbar
  selectedCount={selectedIds.length}
  totalCount={totalPatients}
  onSelectAll={handleSelectAll}
  onClearSelection={handleClearSelection}
>
  <ExportButton
    endpoint="/api/patients/export"
    selectedIds={selectedIds}
    selectedCount={selectedIds.length}
  />
</SelectionToolbar>
```

---

## 🔧 API Endpoints

### Export Patients to CSV

**Endpoint:** `GET /api/patients/export`  
**Authentication:** Required (JWT + Tenant ID)  
**Permissions:** `patients:read`

**Query Parameters:**
- `patient_ids` (string, optional) - Comma-separated list of patient IDs to export
- `search` (string, optional) - Search term
- `status` (string, optional) - Filter by status
- `gender` (string, optional) - Filter by gender
- `age_min` (number, optional) - Minimum age
- `age_max` (number, optional) - Maximum age
- `city` (string, optional) - Filter by city
- `state` (string, optional) - Filter by state
- `blood_type` (string, optional) - Filter by blood type
- `created_at_from` (date, optional) - Registration date from
- `created_at_to` (date, optional) - Registration date to

**Response:**
- Content-Type: `text/csv; charset=utf-8`
- Content-Disposition: `attachment; filename="patients_2025-11-14.csv"`
- Body: CSV file with UTF-8 BOM for Excel compatibility

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/patients/export?status=active&gender=female" \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: <tenant_id>" \
  --output patients.csv
```

**Example Request (Selected IDs):**
```bash
curl -X GET "http://localhost:3000/api/patients/export?patient_ids=1,2,3,4,5" \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: <tenant_id>" \
  --output selected_patients.csv
```

---

## 📊 CSV Export Format

### Columns Included:
1. Patient Number
2. First Name
3. Last Name
4. Middle Name
5. Preferred Name
6. Age
7. Date of Birth
8. Gender
9. Marital Status
10. Occupation
11. Email
12. Phone
13. Mobile Phone
14. Address Line 1
15. Address Line 2
16. City
17. State
18. Postal Code
19. Country
20. Emergency Contact Name
21. Emergency Contact Relationship
22. Emergency Contact Phone
23. Emergency Contact Email
24. Blood Type
25. Allergies
26. Current Medications
27. Medical History
28. Family Medical History
29. Insurance Provider
30. Insurance Policy Number
31. Status
32. Registration Date

### CSV Features:
- ✅ UTF-8 encoding with BOM (Excel compatible)
- ✅ Proper escaping of commas, quotes, and newlines
- ✅ Date formatting (YYYY-MM-DD)
- ✅ Null/undefined values shown as empty strings
- ✅ Objects/arrays converted to JSON strings

---

## 🎨 UI Components

### Export Button States:
1. **Default:** "Export to CSV" or "Export All (100)"
2. **Selected:** "Export Selected (5)"
3. **Exporting:** "Exporting..." with spinner
4. **Success:** "Exported!" with checkmark (3 seconds)
5. **Error:** Error message displayed below button
6. **Disabled:** When no data to export

### Advanced Filters States:
1. **Collapsed:** Shows "Advanced Filters" with active count badge
2. **Expanded:** Shows all filter fields in grid layout
3. **Active Filters:** Blue badge showing count
4. **Clear Button:** Appears when filters are active

### Selection Toolbar:
1. **Hidden:** When no rows selected
2. **Visible:** Shows selected count and actions
3. **Select All:** Button to select all rows (if not all selected)
4. **Clear Selection:** Button to deselect all rows

---

## 🧪 Testing Checklist

### Backend Testing:
- [ ] Export all patients (no filters)
- [ ] Export with status filter
- [ ] Export with gender filter
- [ ] Export with age range filter
- [ ] Export with location filters
- [ ] Export with date range filter
- [ ] Export specific patient IDs
- [ ] Export with multiple filters combined
- [ ] Verify CSV format is correct
- [ ] Verify UTF-8 encoding works in Excel
- [ ] Verify special characters are escaped
- [ ] Verify dates are formatted correctly

### Frontend Testing:
- [ ] Export button shows correct text
- [ ] Export button disabled when no data
- [ ] Export progress indicator works
- [ ] Success message appears after export
- [ ] Error message appears on failure
- [ ] File downloads with correct filename
- [ ] CSV opens correctly in Excel
- [ ] Advanced filters expand/collapse
- [ ] Filter values persist
- [ ] Clear filters button works
- [ ] Active filter count is accurate
- [ ] Selection checkboxes work
- [ ] Select all button works
- [ ] Clear selection button works
- [ ] Selection toolbar appears/disappears
- [ ] Export selected rows works

---

## 🔐 Security Considerations

### Backend Security:
- ✅ Requires authentication (JWT token)
- ✅ Requires tenant context (X-Tenant-ID header)
- ✅ Requires read permission (`patients:read`)
- ✅ Tenant isolation enforced (can only export own tenant's data)
- ✅ SQL injection prevention (parameterized queries)
- ✅ No sensitive data exposure in errors

### Frontend Security:
- ✅ API calls include authentication headers
- ✅ Tenant context validated before export
- ✅ No sensitive data stored in browser
- ✅ File download uses secure blob URLs
- ✅ URLs revoked after download

---

## 📈 Performance Considerations

### Backend Optimization:
- ✅ No pagination limit for exports (exports all matching records)
- ✅ Efficient SQL queries with proper indexes
- ✅ Streaming response for large datasets
- ✅ Connection pooling for database

### Frontend Optimization:
- ✅ Debounced filter inputs (prevents excessive API calls)
- ✅ Lazy loading of filter options
- ✅ Efficient state management
- ✅ Memoized filter components

### Recommendations:
- For very large exports (>10,000 records), consider:
  - Background job processing
  - Email delivery of CSV file
  - Chunked exports with progress indicator
  - Compression (ZIP) for large files

---

## 🎯 Next Steps

### Immediate:
1. Test export functionality end-to-end
2. Verify CSV format in Excel
3. Test with different filter combinations
4. Test selection and export of selected rows

### Short-term:
1. Add export functionality to other list pages (appointments, medical records, etc.)
2. Add column selection (let users choose which columns to export)
3. Add export format options (CSV, Excel, PDF)
4. Add scheduled exports

### Long-term:
1. Add export templates (predefined column sets)
2. Add export history (track what was exported and when)
3. Add bulk operations (delete, update status for selected rows)
4. Add import functionality (CSV import for bulk patient creation)

---

## 📞 Support

### If Export Fails:
1. Check backend logs for errors
2. Verify authentication token is valid
3. Verify tenant context is set
4. Check user has `patients:read` permission
5. Verify database connection is working

### If CSV Format Issues:
1. Check UTF-8 encoding (should have BOM)
2. Verify special characters are escaped
3. Check date format (should be YYYY-MM-DD)
4. Verify commas in data are properly quoted

### If Selection Not Working:
1. Check state management in parent component
2. Verify checkbox onChange handlers
3. Check selection toolbar visibility logic
4. Verify selectedIds array is being updated

---

**Implementation Status:** ✅ COMPLETE  
**Ready for Testing:** YES  
**Production Ready:** After testing

