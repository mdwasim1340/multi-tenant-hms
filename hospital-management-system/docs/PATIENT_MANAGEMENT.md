# Patient Management System - Documentation

## Overview

The Patient Management System provides complete CRUD (Create, Read, Update, Delete) operations for managing patient records in the hospital management system. It is fully integrated with the backend API and supports multi-tenant data isolation.

## Features

### ✅ Patient Directory
- **Search**: Real-time search across patient name, patient number, email, and phone
- **Filtering**: Filter by patient status (all/active/inactive)
- **Pagination**: Configurable page size (10, 25, 50, 100 records per page)
- **Sorting**: Sort by various fields (name, patient number, date of birth, created date)
- **Navigation**: Click on any patient to view details

### ✅ Patient Registration
- **Multi-step Form**: 4-step registration process
  - Step 1: Personal Information (name, DOB, gender, marital status, occupation)
  - Step 2: Contact & Insurance (email, phone, address, insurance, emergency contact)
  - Step 3: Medical History (blood type, allergies, medications, conditions)
  - Step 4: Review & Submit
- **Auto-generated Patient Numbers**: Unique patient identifiers
- **Field Validation**: Real-time validation with error messages
- **Success Redirect**: Automatically navigate to patient details after registration

### ✅ Patient Details
- **Complete Information Display**: All patient data organized in sections
  - Personal Information
  - Contact Information
  - Insurance Information
  - Emergency Contact
  - Medical Information
  - Audit Information (created/updated timestamps)
- **Actions**: Edit and Delete buttons with proper permissions
- **Status Badges**: Visual indication of patient status

### ✅ Patient Edit
- **Pre-populated Form**: Existing data loaded automatically
- **All Fields Editable**: Update any patient information
- **Status Management**: Change patient status (active/inactive/deceased)
- **Validation**: Same validation rules as registration
- **Optimistic Updates**: Immediate UI feedback

### ✅ Patient Overview
- **Quick Statistics**: Total patients, active patients, recent registrations
- **Quick Actions**: Navigate to directory, registration, or records
- **Recent Patients**: List of most recently registered patients
- **Analytics**: Patient statistics and trends

## Technical Implementation

### Frontend Architecture

#### Custom Hooks
- **usePatients**: Manages patient list with search, filter, and pagination
- **usePatient**: Manages single patient operations (fetch, update, delete)
- **usePatientForm**: Manages form state and validation

#### API Client
- **getPatients()**: Fetch patients with filters and pagination
- **createPatient()**: Create new patient record
- **getPatientById()**: Fetch single patient
- **updatePatient()**: Update patient information
- **deletePatient()**: Soft delete patient (sets status to inactive)

#### Utility Functions
- **generatePatientNumber()**: Auto-generate unique patient numbers
- **calculateAge()**: Calculate age from date of birth
- **formatPatientName()**: Format patient name with preferred name
- **formatPhoneNumber()**: Format phone numbers for display

### Backend Integration

#### API Endpoints
- `GET /api/patients` - List patients with filters
- `POST /api/patients` - Create new patient
- `GET /api/patients/:id` - Get patient by ID
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Soft delete patient

#### Required Headers
```javascript
{
  'Authorization': 'Bearer <jwt_token>',
  'X-Tenant-ID': '<tenant_id>',
  'X-App-ID': 'hospital-management',
  'X-API-Key': '<app_api_key>'
}
```

#### Permissions Required
- **patients:read** - View patient directory and details
- **patients:write** - Create and edit patients
- **patients:admin** - Delete patients

### Data Model

```typescript
interface Patient {
  id: number;
  patient_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  preferred_name?: string;
  email?: string;
  phone?: string;
  mobile_phone?: string;
  date_of_birth: string;
  age?: number; // Calculated
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  marital_status?: string;
  occupation?: string;
  
  // Address
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  
  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  
  // Medical Information
  blood_type?: string;
  allergies?: string;
  chronic_conditions?: string;
  current_medications?: string;
  family_medical_history?: string;
  
  // Insurance
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_group_number?: string;
  
  // Status
  status: 'active' | 'inactive' | 'deceased';
  
  // Audit
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}
```

## User Guide

### Viewing Patients

1. Navigate to **Patient Management** → **Patient Directory**
2. Use the search bar to find specific patients
3. Use status filters to show active/inactive patients
4. Click on any patient row to view details
5. Use pagination controls to navigate through pages

### Registering a New Patient

1. Navigate to **Patient Management** → **Register Patient**
2. **Step 1**: Enter personal information (required: first name, last name, DOB, gender)
3. **Step 2**: Enter contact and insurance information (optional but recommended)
4. **Step 3**: Enter medical history (optional but important for care)
5. **Step 4**: Review all information and click "Submit Registration"
6. You'll be redirected to the patient details page

### Editing Patient Information

1. Navigate to the patient details page
2. Click the **Edit** button
3. Update any fields as needed
4. Click **Save Changes** to update
5. Click **Cancel** to discard changes

### Deactivating a Patient

1. Navigate to the patient details page
2. Click the **Delete** button
3. Confirm the action in the dialog
4. The patient status will be set to "inactive"
5. Patient data is preserved for compliance

**Note**: This is a soft delete. Patient records are never permanently deleted.

## Error Handling

### Common Errors

#### "Patient number already exists"
- **Cause**: Duplicate patient number in the system
- **Solution**: The system auto-generates unique numbers, but if manually changed, ensure uniqueness

#### "Failed to fetch patients"
- **Cause**: Network error or backend unavailable
- **Solution**: Check internet connection and try again

#### "Validation error"
- **Cause**: Required fields missing or invalid data
- **Solution**: Check error messages below each field and correct the data

#### "Permission denied"
- **Cause**: User lacks required permissions
- **Solution**: Contact administrator to grant appropriate permissions

### Loading States

- **Skeleton loaders**: Shown while fetching data
- **Loading spinners**: Shown during form submission
- **Disabled buttons**: Prevent duplicate submissions

### Empty States

- **No patients found**: Shown when search returns no results
- **No patients registered**: Shown when database is empty
- **Call-to-action buttons**: Guide users to register first patient

## Performance Considerations

### Optimization Features

- **Debounced Search**: 300ms delay to reduce API calls
- **Pagination**: Load only required records (default 25 per page)
- **Optimistic Updates**: Immediate UI feedback before API confirmation
- **Request Cancellation**: Cancel outdated search requests
- **Memoization**: React.memo for patient list items

### Best Practices

- Use pagination for large patient lists
- Implement virtual scrolling for very large datasets (future enhancement)
- Cache frequently accessed patient data
- Use proper indexes on backend for search queries

## Security

### Multi-Tenant Isolation

- Each tenant's data is completely isolated
- X-Tenant-ID header required for all API calls
- Backend validates tenant context on every request
- No cross-tenant data access possible

### Permission-Based Access

- **Read Permission**: Required to view patients
- **Write Permission**: Required to create/edit patients
- **Admin Permission**: Required to delete patients
- Frontend hides features based on permissions
- Backend enforces permissions on all endpoints

### Data Protection

- Sensitive patient data never stored in localStorage
- JWT tokens used for authentication
- All API calls use HTTPS in production
- Input sanitization on both frontend and backend

## Troubleshooting

### Patient not appearing in directory
- Check status filter (may be set to "active" only)
- Verify patient was successfully created (check for success toast)
- Try refreshing the page
- Check if search filter is applied

### Cannot edit patient
- Verify you have "patients:write" permission
- Check if patient status is "inactive" (may need admin to reactivate)
- Ensure you're logged in with valid session

### Form validation errors
- Check all required fields are filled (marked with *)
- Verify email format is correct
- Verify phone number format is valid
- Check date of birth is not in the future

## Future Enhancements

### Planned Features
- [ ] Custom fields integration
- [ ] Bulk patient import/export
- [ ] Advanced filtering (age range, blood type, etc.)
- [ ] Patient merge functionality (for duplicates)
- [ ] Patient photo upload
- [ ] QR code generation for patient cards
- [ ] Patient portal access
- [ ] Appointment history on patient details
- [ ] Medical records integration
- [ ] Lab results integration

### Performance Improvements
- [ ] Virtual scrolling for large lists
- [ ] Infinite scroll option
- [ ] Advanced caching strategies
- [ ] Offline support with sync

## Support

For issues or questions:
1. Check this documentation first
2. Review error messages carefully
3. Check browser console for technical errors
4. Contact system administrator
5. Report bugs to development team

## Changelog

### Version 1.0.0 (Current)
- ✅ Complete CRUD operations
- ✅ Multi-tenant support
- ✅ Permission-based access control
- ✅ Search and filtering
- ✅ Pagination
- ✅ Form validation
- ✅ Error handling
- ✅ Loading states
- ✅ Optimistic updates
- ✅ Soft delete functionality

---

**Last Updated**: November 2025
**Status**: Production Ready
**Maintainer**: Development Team
