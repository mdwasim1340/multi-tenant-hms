# Patient Management Integration - Implementation Tasks

## Task Overview

This implementation plan converts the patient management integration design into executable tasks for connecting the frontend to the backend API, replacing all mock data with real database operations.

---

## Phase 1: Infrastructure Setup

### Task 1.1: Create TypeScript Interfaces and Types

**Objective:** Define all TypeScript interfaces for patient data structures

**Requirements:** Requirements 1, 4, 5

**Steps:**
1. Create `hospital-management-system/types/patient.ts`
2. Define Patient interface with all fields
3. Define PatientSearchParams interface
4. Define CreatePatientData interface
5. Define UpdatePatientData interface
6. Define PatientsResponse interface
7. Define PaginationInfo interface
8. Export all interfaces

**Verification:**
```bash
cd hospital-management-system
npx tsc --noEmit
```

**Commit:** `feat(patient): Add TypeScript interfaces for patient management`

---

### Task 1.2: Create Patient API Client Functions

**Objective:** Create API client functions for all patient operations

**Requirements:** Requirements 1, 3, 4, 5, 6

**Steps:**
1. Create `hospital-management-system/lib/patients.ts`
2. Import api client from `lib/api.ts`
3. Implement `getPatients(params)` function
4. Implement `createPatient(data)` function
5. Implement `getPatientById(id)` function
6. Implement `updatePatient(id, data)` function
7. Implement `deletePatient(id)` function
8. Add proper error handling for each function
9. Add JSDoc comments for all functions

**Verification:**
```bash
# Test API functions
curl -X GET http://localhost:3000/api/patients \
  -H "Authorization: Bearer TOKEN" \
  -H "X-Tenant-ID: TENANT_ID"
```

**Commit:** `feat(patient): Add API client functions for patient operations`

---


### Task 1.3: Create usePatients Custom Hook

**Objective:** Create custom hook for fetching and managing patient list

**Requirements:** Requirements 1, 2

**Steps:**
1. Create `hospital-management-system/hooks/usePatients.ts`
2. Define UsePatientsOptions interface
3. Define UsePatientsReturn interface
4. Implement useState for patients, loading, error, pagination
5. Implement useEffect for data fetching
6. Implement debounced search (300ms)
7. Implement setPage function
8. Implement setSearch function
9. Implement setFilters function
10. Implement refetch function
11. Add error handling
12. Return all state and functions

**Verification:**
```typescript
// Test in component
const { patients, loading, error } = usePatients({ page: 1, limit: 25 });
console.log('Patients:', patients);
```

**Commit:** `feat(patient): Add usePatients custom hook for list management`

---

### Task 1.4: Create usePatient Custom Hook

**Objective:** Create custom hook for single patient operations

**Requirements:** Requirements 4, 5, 6

**Steps:**
1. Create `hospital-management-system/hooks/usePatient.ts`
2. Define UsePatientReturn interface
3. Implement useState for patient, loading, error
4. Implement useEffect for fetching patient by ID
5. Implement updatePatient function with optimistic updates
6. Implement deletePatient function
7. Implement refetch function
8. Add error handling
9. Add success toast notifications
10. Return all state and functions

**Verification:**
```typescript
// Test in component
const { patient, updatePatient, deletePatient } = usePatient(123);
```

**Commit:** `feat(patient): Add usePatient custom hook for CRUD operations`

---

### Task 1.5: Create usePatientForm Custom Hook

**Objective:** Create custom hook for patient form state and validation

**Requirements:** Requirements 3, 5

**Steps:**
1. Create `hospital-management-system/hooks/usePatientForm.ts`
2. Define UsePatientFormOptions interface
3. Define UsePatientFormReturn interface
4. Implement useState for formData, errors, loading
5. Implement setFormData function
6. Implement validateField function (required fields, email format, phone format)
7. Implement handleSubmit function
8. Implement resetForm function
9. Add support for edit mode (load existing patient data)
10. Add error handling
11. Add success/error callbacks

**Verification:**
```typescript
// Test in component
const { formData, errors, handleSubmit } = usePatientForm();
```

**Commit:** `feat(patient): Add usePatientForm custom hook for form management`

---

## Phase 2: Patient Directory Integration

### Task 2.1: Update Patient Directory Page with Real Data

**Objective:** Replace mock data with API calls in patient directory

**Requirements:** Requirements 1, 2

**Steps:**
1. Open `hospital-management-system/app/patient-management/patient-directory/page.tsx`
2. Import usePatients hook
3. Remove all mock patient data
4. Call usePatients hook with initial params
5. Update patient list rendering to use real data
6. Add loading skeleton while fetching
7. Add error message display
8. Add empty state when no patients
9. Update search input to use setSearch from hook
10. Update filter tabs to use setFilters from hook

**Verification:**
```bash
# Start frontend and backend
cd hospital-management-system && npm run dev
cd backend && npm run dev
# Navigate to /patient-management/patient-directory
# Verify real patient data is displayed
```

**Commit:** `feat(patient): Connect patient directory to backend API`

---

### Task 2.2: Implement Pagination Controls

**Objective:** Add pagination controls to patient directory

**Requirements:** Requirement 2

**Steps:**
1. Import pagination component or create custom
2. Extract pagination data from usePatients hook
3. Add pagination controls at bottom of patient list
4. Implement page change handler using setPage
5. Add page size selector (10, 25, 50, 100)
6. Display total records and current page info
7. Add previous/next buttons
8. Disable buttons when at first/last page

**Verification:**
```bash
# Test pagination
# Click next/previous buttons
# Change page size
# Verify API calls with correct params
```

**Commit:** `feat(patient): Add pagination controls to patient directory`

---

### Task 2.3: Implement Search Functionality

**Objective:** Add real-time search with debouncing

**Requirements:** Requirement 2

**Steps:**
1. Update search input to use controlled component
2. Connect search input to setSearch from usePatients
3. Verify debouncing works (300ms delay)
4. Add search icon and clear button
5. Show loading indicator during search
6. Display "No results found" when search returns empty
7. Highlight search terms in results (optional)

**Verification:**
```bash
# Type in search box
# Verify debounced API calls
# Check network tab for search params
```

**Commit:** `feat(patient): Implement debounced search in patient directory`

---

### Task 2.4: Implement Filter Controls

**Objective:** Add status and risk level filters

**Requirements:** Requirement 2

**Steps:**
1. Update filter tabs to use setFilters from hook
2. Implement status filter (all, active, inactive)
3. Implement risk level filter (all, high, medium, low)
4. Add filter badges showing active filters
5. Add clear all filters button
6. Update URL params to reflect filters (optional)
7. Persist filters in localStorage (optional)

**Verification:**
```bash
# Click filter tabs
# Verify API calls with filter params
# Check filtered results
```

**Commit:** `feat(patient): Add status and risk level filters`

---


## Phase 3: Patient Registration Integration

### Task 3.1: Update Patient Registration Form - Step 1

**Objective:** Connect personal information step to backend

**Requirements:** Requirement 3

**Steps:**
1. Open `hospital-management-system/app/patient-registration/page.tsx`
2. Import usePatientForm hook
3. Replace local formData state with hook
4. Update all input fields to use formData from hook
5. Add onChange handlers using setFormData
6. Implement field validation on blur
7. Display validation errors below fields
8. Generate unique patient_number automatically
9. Add duplicate detection check (optional)

**Verification:**
```bash
# Fill out step 1 fields
# Verify validation errors
# Check formData state
```

**Commit:** `feat(patient): Connect registration step 1 to form hook`

---

### Task 3.2: Update Patient Registration Form - Step 2

**Objective:** Connect contact and insurance step to backend

**Requirements:** Requirement 3

**Steps:**
1. Update step 2 fields to use formData from hook
2. Add email validation (format check)
3. Add phone validation (format check)
4. Add address fields
5. Add insurance fields
6. Add emergency contact fields
7. Implement field validation
8. Display validation errors

**Verification:**
```bash
# Fill out step 2 fields
# Verify email/phone validation
# Check all fields save to formData
```

**Commit:** `feat(patient): Connect registration step 2 to form hook`

---

### Task 3.3: Update Patient Registration Form - Step 3

**Objective:** Connect medical history step to backend

**Requirements:** Requirement 3

**Steps:**
1. Update step 3 fields to use formData from hook
2. Add blood type selector
3. Add allergies textarea
4. Add chronic conditions textarea
5. Add current medications textarea
6. Add family medical history textarea
7. Implement validation for medical fields

**Verification:**
```bash
# Fill out step 3 fields
# Verify all medical data saves
```

**Commit:** `feat(patient): Connect registration step 3 to form hook`

---

### Task 3.4: Implement Form Submission

**Objective:** Submit patient registration to backend API

**Requirements:** Requirement 3

**Steps:**
1. Update step 4 review section to display all formData
2. Connect submit button to handleSubmit from hook
3. Show loading spinner during submission
4. Handle success response (show toast, redirect to patient details)
5. Handle error response (show error messages)
6. Handle duplicate patient number error
7. Add confirmation dialog before submit
8. Implement form reset after successful submission

**Verification:**
```bash
# Complete all steps
# Click submit
# Verify API POST request
# Check patient created in database
# Verify redirect to patient details
```

**Commit:** `feat(patient): Implement patient registration form submission`

---

### Task 3.5: Add Custom Fields to Registration Form

**Objective:** Integrate custom fields into registration

**Requirements:** Requirement 12

**Steps:**
1. Fetch custom fields for 'patients' entity
2. Render custom fields in appropriate step
3. Add custom field validation
4. Include custom_fields in form submission
5. Handle different field types (text, number, date, select)
6. Display custom field errors

**Verification:**
```bash
# Create custom field in admin dashboard
# Verify field appears in registration form
# Submit form with custom field value
# Check custom field saved in database
```

**Commit:** `feat(patient): Add custom fields support to registration`

---

## Phase 4: Patient Details and Edit

### Task 4.1: Create Patient Details Page

**Objective:** Create new page to display complete patient information

**Requirements:** Requirement 4

**Steps:**
1. Create `hospital-management-system/app/patient-management/[id]/page.tsx`
2. Import usePatient hook
3. Get patient ID from URL params
4. Fetch patient data using usePatient hook
5. Display loading skeleton while fetching
6. Display error message if patient not found
7. Create patient details layout with sections:
   - Personal Information
   - Contact Information
   - Emergency Contact
   - Insurance Information
   - Medical History
   - Custom Fields
8. Add Edit button (navigate to edit page)
9. Add Delete button (with confirmation)
10. Display patient age (calculated from DOB)

**Verification:**
```bash
# Navigate to /patient-management/123
# Verify patient details displayed
# Check all sections render correctly
```

**Commit:** `feat(patient): Create patient details page`

---

### Task 4.2: Create Patient Edit Page

**Objective:** Create page to edit existing patient information

**Requirements:** Requirement 5

**Steps:**
1. Create `hospital-management-system/app/patient-management/[id]/edit/page.tsx`
2. Import usePatient and usePatientForm hooks
3. Get patient ID from URL params
4. Load existing patient data into form
5. Create editable form with all patient fields
6. Implement field validation
7. Add Save button
8. Add Cancel button (navigate back)
9. Handle update submission
10. Show success message and redirect on save

**Verification:**
```bash
# Navigate to /patient-management/123/edit
# Verify form pre-filled with patient data
# Edit fields and save
# Verify API PUT request
# Check patient updated in database
```

**Commit:** `feat(patient): Create patient edit page`

---

### Task 4.3: Implement Patient Deletion

**Objective:** Add soft delete functionality for patients

**Requirements:** Requirement 6

**Steps:**
1. Add delete button to patient details page
2. Implement confirmation dialog
3. Call deletePatient from usePatient hook
4. Show loading state during deletion
5. Handle success (show toast, redirect to directory)
6. Handle error (show error message)
7. Verify soft delete (status = 'inactive')
8. Add permission check (patients:admin required)

**Verification:**
```bash
# Click delete button
# Confirm deletion
# Verify API DELETE request
# Check patient status = 'inactive' in database
# Verify redirect to directory
```

**Commit:** `feat(patient): Implement patient soft delete`

---

### Task 4.4: Add Navigation Between Pages

**Objective:** Connect all patient pages with proper navigation

**Requirements:** Requirements 1, 4, 5

**Steps:**
1. Update patient directory to link to details page
2. Add breadcrumbs to details and edit pages
3. Add back button to details page
4. Add cancel button to edit page
5. Update "New Patient" button to navigate to registration
6. Add "View All Patients" link in registration success
7. Implement browser back button handling

**Verification:**
```bash
# Test navigation flow:
# Directory → Details → Edit → Details → Directory
# Registration → Success → Directory
```

**Commit:** `feat(patient): Add navigation between patient pages`

---


## Phase 5: Patient Management Page Integration

### Task 5.1: Update Patient Management Overview Page

**Objective:** Connect patient management main page to real data

**Requirements:** Requirement 1

**Steps:**
1. Open `hospital-management-system/app/patient-management/page.tsx`
2. Import usePatients hook
3. Remove mock patient data
4. Fetch real patients using hook
5. Update patient list rendering
6. Add loading states
7. Add error handling
8. Update "New Patient" button to navigate to registration
9. Update patient cards to link to details page

**Verification:**
```bash
# Navigate to /patient-management
# Verify real patient data displayed
# Click patient card → navigates to details
# Click "New Patient" → navigates to registration
```

**Commit:** `feat(patient): Connect patient management page to backend`

---

### Task 5.2: Implement Patient Records Access

**Objective:** Add medical records section to patient details

**Requirements:** Requirement 8

**Steps:**
1. Create API function `getPatientRecords(patientId)`
2. Add medical records section to patient details page
3. Fetch medical records when viewing patient
4. Display records in chronological order
5. Show visit dates, diagnoses, treatments
6. Add "View Full Record" button for each record
7. Add "Create New Record" button
8. Handle empty state (no records)

**Verification:**
```bash
# View patient details
# Check medical records section
# Verify records fetched from API
```

**Commit:** `feat(patient): Add medical records access to patient details`

---

### Task 5.3: Implement Patient Transfers Management

**Objective:** Create patient transfers functionality

**Requirements:** Requirement 7

**Steps:**
1. Create `hospital-management-system/app/patient-management/transfers/page.tsx`
2. Create API functions for transfers
3. Display active transfer requests
4. Add "Initiate Transfer" button
5. Create transfer form (source, destination, reason)
6. Implement transfer submission
7. Update patient status during transfer
8. Add transfer history view
9. Implement transfer completion

**Verification:**
```bash
# Navigate to /patient-management/transfers
# Initiate new transfer
# Verify transfer created
# Complete transfer
# Check patient status updated
```

**Commit:** `feat(patient): Implement patient transfers management`

---

## Phase 6: Permission-Based Access Control

### Task 6.1: Implement Permission Checks in UI

**Objective:** Hide/show features based on user permissions

**Requirements:** Requirement 9

**Steps:**
1. Create `checkPermission` utility function
2. Get user permissions from auth context
3. Add permission checks to:
   - Patient directory (patients:read)
   - New patient button (patients:write)
   - Edit button (patients:write)
   - Delete button (patients:admin)
4. Hide features when permission missing
5. Show permission denied message when accessed directly

**Verification:**
```bash
# Login as user with different roles
# Verify features shown/hidden based on permissions
# Try direct URL access without permission
```

**Commit:** `feat(patient): Implement permission-based access control`

---

### Task 6.2: Add Permission Denied Pages

**Objective:** Create user-friendly permission denied pages

**Requirements:** Requirement 9

**Steps:**
1. Create permission denied component
2. Display when user lacks required permission
3. Show which permission is required
4. Add "Go Back" button
5. Add "Request Access" button (optional)
6. Style consistently with app theme

**Verification:**
```bash
# Access patient page without permission
# Verify permission denied page shown
```

**Commit:** `feat(patient): Add permission denied pages`

---

## Phase 7: Error Handling and User Feedback

### Task 7.1: Implement Toast Notifications

**Objective:** Add toast notifications for all operations

**Requirements:** Requirement 10

**Steps:**
1. Install toast library (react-hot-toast or sonner)
2. Add toast provider to app layout
3. Implement success toasts:
   - Patient created
   - Patient updated
   - Patient deleted
4. Implement error toasts:
   - API errors
   - Validation errors
   - Network errors
5. Add loading toasts for long operations
6. Style toasts consistently

**Verification:**
```bash
# Perform patient operations
# Verify toast notifications appear
# Check success and error scenarios
```

**Commit:** `feat(patient): Add toast notifications for user feedback`

---

### Task 7.2: Implement Error Boundaries

**Objective:** Add error boundaries to catch React errors

**Requirements:** Requirement 10

**Steps:**
1. Create ErrorBoundary component
2. Wrap patient pages with error boundary
3. Display user-friendly error message
4. Add "Reload Page" button
5. Log errors to console
6. Add error reporting (optional)

**Verification:**
```bash
# Trigger React error
# Verify error boundary catches it
# Check error message displayed
```

**Commit:** `feat(patient): Add error boundaries for patient pages`

---

### Task 7.3: Implement Loading States

**Objective:** Add consistent loading states across all pages

**Requirements:** Requirement 10

**Steps:**
1. Create loading skeleton components
2. Add loading skeletons to:
   - Patient directory
   - Patient details
   - Patient form
3. Add loading spinners to buttons during submission
4. Add progress indicators for multi-step forms
5. Implement optimistic updates where appropriate

**Verification:**
```bash
# Navigate to patient pages
# Verify loading states shown
# Check smooth transitions
```

**Commit:** `feat(patient): Add loading states to patient pages`

---

### Task 7.4: Implement Empty States

**Objective:** Add empty states for no data scenarios

**Requirements:** Requirement 10

**Steps:**
1. Create empty state component
2. Add empty states to:
   - Patient directory (no patients)
   - Search results (no matches)
   - Medical records (no records)
   - Transfers (no transfers)
3. Add helpful messages and actions
4. Add illustrations or icons
5. Style consistently

**Verification:**
```bash
# View pages with no data
# Verify empty states shown
# Check helpful messages
```

**Commit:** `feat(patient): Add empty states to patient pages`

---

## Phase 8: Testing and Optimization

### Task 8.1: Write Unit Tests for Hooks

**Objective:** Test custom hooks functionality

**Steps:**
1. Install testing libraries (@testing-library/react-hooks)
2. Write tests for usePatients hook
3. Write tests for usePatient hook
4. Write tests for usePatientForm hook
5. Test error scenarios
6. Test loading states
7. Achieve >80% code coverage

**Verification:**
```bash
npm run test
```

**Commit:** `test(patient): Add unit tests for custom hooks`

---

### Task 8.2: Write Integration Tests

**Objective:** Test complete patient workflows

**Steps:**
1. Write test for patient registration flow
2. Write test for patient search and filter
3. Write test for patient update flow
4. Write test for patient deletion flow
5. Test permission-based access
6. Test error handling

**Verification:**
```bash
npm run test:integration
```

**Commit:** `test(patient): Add integration tests for patient workflows`

---

### Task 8.3: Optimize Performance

**Objective:** Improve patient management performance

**Steps:**
1. Implement React.memo for patient list items
2. Add virtual scrolling for large lists (optional)
3. Optimize re-renders with useMemo and useCallback
4. Implement request cancellation for outdated requests
5. Add data caching with SWR or React Query
6. Optimize bundle size with code splitting
7. Add performance monitoring

**Verification:**
```bash
# Run Lighthouse audit
# Check performance metrics
# Verify no unnecessary re-renders
```

**Commit:** `perf(patient): Optimize patient management performance`

---

## Phase 9: Documentation and Cleanup

### Task 9.1: Update Documentation

**Objective:** Document patient management integration

**Steps:**
1. Update README with patient management features
2. Document API endpoints used
3. Document custom hooks usage
4. Add code examples
5. Document permission requirements
6. Add troubleshooting guide

**Verification:**
```bash
# Review documentation
# Verify all features documented
```

**Commit:** `docs(patient): Update documentation for patient management`

---

### Task 9.2: Remove Mock Data and Cleanup

**Objective:** Remove all mock data and unused code

**Steps:**
1. Search for all mock patient data
2. Remove hardcoded patient arrays
3. Remove unused components
4. Remove commented code
5. Clean up console.logs
6. Update imports
7. Run linter and fix issues

**Verification:**
```bash
npm run lint
npm run build
```

**Commit:** `chore(patient): Remove mock data and cleanup code`

---

### Task 9.3: Final Testing and Verification

**Objective:** Comprehensive testing of all patient features

**Steps:**
1. Test complete patient registration flow
2. Test patient directory with search and filters
3. Test patient details view
4. Test patient edit functionality
5. Test patient deletion
6. Test permission-based access
7. Test error scenarios
8. Test with different user roles
9. Test multi-tenant isolation
10. Verify all requirements met

**Verification:**
```bash
# Manual testing checklist
# Automated test suite
# User acceptance testing
```

**Commit:** `test(patient): Final verification of patient management integration`

---

## Summary

**Total Tasks:** 33 tasks across 9 phases

**Estimated Timeline:**
- Phase 1 (Infrastructure): 2-3 days
- Phase 2 (Directory): 2 days
- Phase 3 (Registration): 2-3 days
- Phase 4 (Details/Edit): 2-3 days
- Phase 5 (Management): 2 days
- Phase 6 (Permissions): 1 day
- Phase 7 (Error Handling): 2 days
- Phase 8 (Testing): 2-3 days
- Phase 9 (Documentation): 1 day

**Total Estimated Time:** 16-20 days

**Key Deliverables:**
- ✅ Complete patient CRUD operations
- ✅ Real-time data from backend API
- ✅ Search, filter, and pagination
- ✅ Permission-based access control
- ✅ Error handling and user feedback
- ✅ Custom fields integration
- ✅ Medical records access
- ✅ Patient transfers management
- ✅ Comprehensive testing
- ✅ Complete documentation
