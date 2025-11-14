# Patient Management - Quick Reference

## Quick Links

- **Patient Directory**: `/patient-management/patient-directory`
- **Register Patient**: `/patient-registration`
- **Patient Details**: `/patient-management/:id`
- **Edit Patient**: `/patient-management/:id/edit`

## Common Tasks

### Search for a Patient
1. Go to Patient Directory
2. Type in search box (searches name, patient number, email, phone)
3. Results update automatically after 300ms

### Register New Patient
1. Click "New Patient" button
2. Fill Step 1: Personal Info (required: name, DOB, gender)
3. Fill Step 2: Contact & Insurance
4. Fill Step 3: Medical History
5. Review Step 4 and Submit

### Edit Patient Info
1. Find patient in directory
2. Click to view details
3. Click "Edit" button
4. Update fields
5. Click "Save Changes"

### Deactivate Patient
1. View patient details
2. Click "Delete" button
3. Confirm in dialog
4. Patient status → inactive

## Keyboard Shortcuts

- **Search**: Focus on search box and start typing
- **Escape**: Close dialogs
- **Enter**: Submit forms (when focused on input)

## Permissions Required

| Action | Permission |
|--------|-----------|
| View patients | `patients:read` |
| Create patient | `patients:write` |
| Edit patient | `patients:write` |
| Delete patient | `patients:admin` |

## API Endpoints

```
GET    /api/patients          # List patients
POST   /api/patients          # Create patient
GET    /api/patients/:id      # Get patient
PUT    /api/patients/:id      # Update patient
DELETE /api/patients/:id      # Delete patient
```

## Search Parameters

```javascript
{
  page: 1,              // Page number
  limit: 25,            // Records per page
  search: "john",       // Search query
  status: "active",     // active | inactive
  gender: "male",       // male | female | other
  age_min: 18,          // Minimum age
  age_max: 65,          // Maximum age
  sort_by: "created_at", // Field to sort by
  sort_order: "desc"    // asc | desc
}
```

## Required Fields

### Registration
- First Name
- Last Name
- Date of Birth
- Gender

### Optional but Recommended
- Email
- Phone
- Address
- Emergency Contact
- Insurance Information
- Medical History

## Status Values

- **active**: Patient is currently active
- **inactive**: Patient record deactivated
- **deceased**: Patient is deceased

## Common Error Messages

| Error | Solution |
|-------|----------|
| "Patient number already exists" | System auto-generates unique numbers |
| "Failed to fetch patients" | Check internet connection |
| "Validation error" | Check required fields |
| "Permission denied" | Contact administrator |

## Tips & Tricks

1. **Use filters** to narrow down patient lists
2. **Adjust page size** for faster browsing (10-100 records)
3. **Search is debounced** - wait 300ms for results
4. **Click patient row** to quickly view details
5. **Use status filter** to find inactive patients
6. **Patient numbers** are auto-generated and unique
7. **Soft delete** preserves all patient data
8. **Age is calculated** automatically from DOB

## Data Validation Rules

- **Email**: Must be valid email format
- **Phone**: Must be at least 10 digits
- **Date of Birth**: Cannot be in the future
- **Names**: Minimum 2 characters
- **Patient Number**: Auto-generated, unique

## Performance Tips

- Use pagination for large datasets
- Apply filters to reduce result set
- Search is optimized with debouncing
- Page size affects load time (smaller = faster)

## Mobile Usage

- All pages are responsive
- Touch-friendly buttons and inputs
- Swipe gestures supported
- Optimized for tablets and phones

---

**Need Help?** Check the full documentation in `PATIENT_MANAGEMENT.md`
