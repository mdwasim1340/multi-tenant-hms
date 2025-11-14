# Appointment Management Integration - Implementation Tasks

## Task Overview

This implementation plan converts the appointment management integration design into executable tasks for connecting the frontend to the backend API, implementing calendar views, conflict detection, and replacing all mock data with real database operations.

---

## Phase 1: Infrastructure Setup

### Task 1.1: Create TypeScript Interfaces and Types

**Objective:** Define all TypeScript interfaces for appointment data structures

**Requirements:** Requirements 1, 3, 5

**Steps:**
1. Create `hospital-management-system/types/appointment.ts`
2. Define Appointment interface with all fields
3. Define AppointmentSearchParams interface
4. Define CreateAppointmentData interface
5. Define UpdateAppointmentData interface
6. Define AppointmentsResponse interface
7. Define AppointmentConflict interface
8. Define TimeSlot interface
9. Define AppointmentStatus type
10. Export all interfaces

**Verification:**
```bash
cd hospital-management-system
npx tsc --noEmit
```

**Commit:** `feat(appointment): Add TypeScript interfaces for appointment management`

---

### Task 1.2: Create Appointment API Client Functions

**Objective:** Create API client functions for all appointment operations

**Requirements:** Requirements 1, 3, 5, 6, 7

**Steps:**
1. Create `hospital-management-system/lib/appointments.ts`
2. Import api client from `lib/api.ts`
3. Implement `getAppointments(params)` function
4. Implement `createAppointment(data)` function
5. Implement `getAppointmentById(id)` function
6. Implement `updateAppointment(id, data)` function
7. Implement `cancelAppointment(id, reason)` function
8. Implement `getAvailableTimeSlots(params)` function
9. Implement `getProviderSchedule(providerId, date)` function
10. Implement `getPatientAppointments(patientId)` function
11. Implement `updateAppointmentStatus(id, status)` function
12. Add proper error handling for each function
13. Add JSDoc comments for all functions

**Verification:**
```bash
# Test API functions
curl -X GET http://localhost:3000/api/appointments \
  -H "Authorization: Bearer TOKEN" \
  -H "X-Tenant-ID: TENANT_ID"
```

**Commit:** `feat(appointment): Add API client functions for appointment operations`

---

### Task 1.3: Create useAppointments Custom Hook

**Objective:** Create custom hook for fetching and managing appointment list

**Requirements:** Requirements 1, 2

**Steps:**
1. Create `hospital-management-system/hooks/useAppointments.ts`
2. Define UseAppointmentsOptions interface
3. Define UseAppointmentsReturn interface
4. Implement useState for appointments, loading, error, pagination
5. Implement useEffect for data fetching
6. Implement setPage function
7. Implement setFilters function
8. Implement refetch function
9. Add error handling
10. Add support for date range filtering
11. Add support for provider filtering
12. Return all state and functions

**Verification:**
```typescript
// Test in component
const { appointments, loading, error } = useAppointments({ 
  date_from: '2024-01-01',
  date_to: '2024-01-31'
});
console.log('Appointments:', appointments);
```

**Commit:** `feat(appointment): Add useAppointments custom hook for list management`

---

### Task 1.4: Create useAppointment Custom Hook

**Objective:** Create custom hook for single appointment operations

**Requirements:** Requirements 5, 6, 7, 8

**Steps:**
1. Create `hospital-management-system/hooks/useAppointment.ts`
2. Define UseAppointmentReturn interface
3. Implement useState for appointment, loading, error
4. Implement useEffect for fetching appointment by ID
5. Implement updateAppointment function with optimistic updates
6. Implement cancelAppointment function
7. Implement updateStatus function
8. Implement refetch function
9. Add error handling
10. Add success toast notifications
11. Return all state and functions

**Verification:**
```typescript
// Test in component
const { appointment, updateAppointment, cancelAppointment } = useAppointment(123);
```

**Commit:** `feat(appointment): Add useAppointment custom hook for CRUD operations`

---

### Task 1.5: Create useTimeSlots Custom Hook

**Objective:** Create custom hook for fetching available time slots

**Requirements:** Requirements 3, 4

**Steps:**
1. Create `hospital-management-system/hooks/useTimeSlots.ts`
2. Define UseTimeSlotsOptions interface
3. Define UseTimeSlotsReturn interface
4. Implement useState for timeSlots, loading, error
5. Implement useEffect for fetching time slots
6. Implement conflict checking logic
7. Implement refetch function
8. Add caching (1 minute)
9. Add error handling
10. Return all state and functions

**Verification:**
```typescript
// Test in component
const { timeSlots, loading } = useTimeSlots({
  doctor_id: 1,
  date: '2024-01-15',
  duration_minutes: 30
});
```

**Commit:** `feat(appointment): Add useTimeSlots custom hook for availability checking`

---

### Task 1.6: Create useAppointmentForm Custom Hook

**Objective:** Create custom hook for appointment form state and validation

**Requirements:** Requirements 3, 6

**Steps:**
1. Create `hospital-management-system/hooks/useAppointmentForm.ts`
2. Define UseAppointmentFormOptions interface
3. Define UseAppointmentFormReturn interface
4. Implement useState for formData, errors, loading, conflicts
5. Implement setFormData function
6. Implement validateField function
7. Implement checkConflicts function
8. Implement handleSubmit function
9. Implement resetForm function
10. Add support for edit mode
11. Add error handling
12. Add success/error callbacks

**Verification:**
```typescript
// Test in component
const { formData, errors, handleSubmit, checkConflicts } = useAppointmentForm();
```

**Commit:** `feat(appointment): Add useAppointmentForm custom hook for form management`

---


## Phase 2: Calendar View Integration

### Task 2.1: Install and Configure Calendar Library

**Objective:** Set up react-big-calendar for appointment visualization

**Requirements:** Requirement 1

**Steps:**
1. Install react-big-calendar: `npm install react-big-calendar`
2. Install date-fns for date manipulation: `npm install date-fns`
3. Install calendar types: `npm install --save-dev @types/react-big-calendar`
4. Create calendar configuration file
5. Import calendar CSS styles
6. Configure date adapter (date-fns)
7. Set up calendar theme customization

**Verification:**
```bash
npm list react-big-calendar
# Verify package installed
```

**Commit:** `feat(appointment): Install and configure react-big-calendar`

---

### Task 2.2: Create Calendar Event Mapper

**Objective:** Convert appointments to calendar events

**Requirements:** Requirement 1

**Steps:**
1. Create `hospital-management-system/lib/calendarUtils.ts`
2. Define CalendarEvent interface
3. Implement `mapAppointmentToEvent` function
4. Implement `mapEventsToAppointments` function
5. Add color coding by status
6. Add color coding by priority
7. Implement event tooltip formatting
8. Add event duration display

**Verification:**
```typescript
// Test mapping
const event = mapAppointmentToEvent(appointment);
console.log('Calendar Event:', event);
```

**Commit:** `feat(appointment): Add calendar event mapping utilities`

---

### Task 2.3: Update Appointments Page with Calendar View

**Objective:** Replace mock data with real calendar integration

**Requirements:** Requirement 1

**Steps:**
1. Open `hospital-management-system/app/appointments/page.tsx`
2. Import useAppointments hook
3. Import Calendar component from react-big-calendar
4. Remove all mock appointment data
5. Call useAppointments hook with date range
6. Map appointments to calendar events
7. Implement calendar view rendering
8. Add loading skeleton while fetching
9. Add error message display
10. Add empty state when no appointments

**Verification:**
```bash
# Start frontend and backend
cd hospital-management-system && npm run dev
cd backend && npm run dev
# Navigate to /appointments
# Verify real appointment data in calendar
```

**Commit:** `feat(appointment): Connect appointments calendar to backend API`

---

### Task 2.4: Implement Calendar View Switching

**Objective:** Add day, week, month view switching

**Requirements:** Requirement 1

**Steps:**
1. Add view state management
2. Create view switcher buttons (Day, Week, Month, Agenda)
3. Implement view change handler
4. Configure calendar for each view type
5. Persist selected view in localStorage
6. Add keyboard shortcuts for view switching (optional)
7. Style view switcher buttons

**Verification:**
```bash
# Click view switcher buttons
# Verify calendar changes views
# Refresh page and verify view persists
```

**Commit:** `feat(appointment): Add calendar view switching (day/week/month)`

---

### Task 2.5: Implement Date Navigation

**Objective:** Add date navigation controls

**Requirements:** Requirement 1

**Steps:**
1. Add date navigation state
2. Create previous/next buttons
3. Create today button
4. Implement date picker for quick navigation
5. Update appointments when date changes
6. Add keyboard shortcuts (arrow keys)
7. Display current date range in header

**Verification:**
```bash
# Click previous/next buttons
# Verify appointments update
# Click today button
# Use date picker
```

**Commit:** `feat(appointment): Add date navigation controls to calendar`

---

### Task 2.6: Implement Appointment Details Modal

**Objective:** Show appointment details when clicking calendar event

**Requirements:** Requirement 5

**Steps:**
1. Create AppointmentDetailsModal component
2. Add modal state management
3. Implement onSelectEvent handler
4. Fetch full appointment details on click
5. Display patient information
6. Display provider information
7. Display appointment details (time, type, status)
8. Add Reschedule button
9. Add Cancel button
10. Add Close button

**Verification:**
```bash
# Click on calendar event
# Verify modal opens with appointment details
# Check all information displays correctly
```

**Commit:** `feat(appointment): Add appointment details modal to calendar`

---

### Task 2.7: Implement Calendar Filtering

**Objective:** Add filters for provider, status, and type

**Requirements:** Requirement 2

**Steps:**
1. Add filter state management
2. Create filter panel component
3. Add provider filter dropdown
4. Add status filter checkboxes
5. Add appointment type filter
6. Implement filter application
7. Update calendar when filters change
8. Add clear filters button
9. Show active filter badges

**Verification:**
```bash
# Apply filters
# Verify calendar updates
# Check filtered appointments display
```

**Commit:** `feat(appointment): Add filtering to appointment calendar`

---

## Phase 3: Appointment Creation Integration

### Task 3.1: Update Appointment Creation Form - Step 1

**Objective:** Connect patient selection step to backend

**Requirements:** Requirement 3

**Steps:**
1. Open `hospital-management-system/app/appointment-creation/page.tsx`
2. Import useAppointmentForm hook
3. Replace local formData state with hook
4. Add patient search/selection
5. Fetch patient list from API
6. Implement patient autocomplete
7. Display selected patient info
8. Add validation for patient selection
9. Update form data on patient select

**Verification:**
```bash
# Navigate to appointment creation
# Search for patient
# Select patient
# Verify patient info displays
```

**Commit:** `feat(appointment): Connect creation step 1 to form hook`

---

### Task 3.2: Update Appointment Creation Form - Step 2

**Objective:** Connect provider and type selection to backend

**Requirements:** Requirement 3

**Steps:**
1. Fetch providers from API (users with doctor role)
2. Display provider list with specialties
3. Add appointment type selection
4. Fetch appointment types from configuration
5. Auto-populate duration based on type
6. Add provider availability indicator
7. Implement provider filtering by specialty
8. Add validation for provider and type

**Verification:**
```bash
# View provider list
# Select provider
# Select appointment type
# Verify duration auto-populates
```

**Commit:** `feat(appointment): Connect creation step 2 to backend`

---

### Task 3.3: Implement Time Slot Selection

**Objective:** Add time slot selection with availability checking

**Requirements:** Requirements 3, 4

**Steps:**
1. Import useTimeSlots hook
2. Add date picker for appointment date
3. Fetch available time slots when date/provider selected
4. Display time slots in grid layout
5. Show unavailable slots as disabled
6. Add reason tooltip for unavailable slots
7. Highlight recommended time slots
8. Implement time slot selection
9. Show loading state while fetching slots

**Verification:**
```bash
# Select date and provider
# Verify time slots load
# Check unavailable slots are disabled
# Select time slot
```

**Commit:** `feat(appointment): Implement time slot selection with availability`

---

### Task 3.4: Implement Conflict Detection

**Objective:** Add real-time conflict checking

**Requirements:** Requirement 3

**Steps:**
1. Implement checkConflicts function in form hook
2. Call conflict check when time slot selected
3. Display conflict warning if detected
4. Show conflicting appointment details
5. Suggest alternative time slots
6. Allow user to override (with permission)
7. Add conflict resolution UI
8. Prevent submission if unresolved conflicts

**Verification:**
```bash
# Select time slot with conflict
# Verify conflict warning displays
# Check alternative suggestions
# Resolve conflict
```

**Commit:** `feat(appointment): Add real-time conflict detection`

---

### Task 3.5: Implement Form Submission

**Objective:** Submit appointment creation to backend API

**Requirements:** Requirement 3

**Steps:**
1. Update step 4 review section with all form data
2. Connect submit button to handleSubmit from hook
3. Show loading spinner during submission
4. Handle success response (show toast, redirect to calendar)
5. Handle conflict error (show alternatives)
6. Handle validation errors (display field errors)
7. Add confirmation dialog before submit
8. Implement form reset after success

**Verification:**
```bash
# Complete all steps
# Click submit
# Verify API POST request
# Check appointment created in database
# Verify redirect to calendar
```

**Commit:** `feat(appointment): Implement appointment creation submission`

---


## Phase 4: Appointment Details and Management

### Task 4.1: Create Appointment Details Page

**Objective:** Create page to display complete appointment information

**Requirements:** Requirement 5

**Steps:**
1. Create `hospital-management-system/app/appointments/[id]/page.tsx`
2. Import useAppointment hook
3. Get appointment ID from URL params
4. Fetch appointment data using hook
5. Display loading skeleton while fetching
6. Display error message if not found
7. Create appointment details layout with sections:
   - Patient Information
   - Provider Information
   - Appointment Details (date, time, type, duration)
   - Status and Priority
   - Chief Complaint and Notes
   - Special Instructions
8. Add Reschedule button
9. Add Cancel button
10. Add Update Status dropdown

**Verification:**
```bash
# Navigate to /appointments/123
# Verify appointment details displayed
# Check all sections render correctly
```

**Commit:** `feat(appointment): Create appointment details page`

---

### Task 4.2: Implement Appointment Rescheduling

**Objective:** Add rescheduling functionality with conflict detection

**Requirements:** Requirement 6

**Steps:**
1. Create reschedule modal component
2. Add reschedule button to details page
3. Load current appointment data into form
4. Fetch available time slots for new date
5. Implement time slot selection
6. Check conflicts for new time
7. Submit reschedule request to API
8. Handle success (update calendar, show toast)
9. Handle conflicts (show alternatives)
10. Update appointment history

**Verification:**
```bash
# Click reschedule button
# Select new date and time
# Verify conflict checking
# Submit reschedule
# Check appointment updated
```

**Commit:** `feat(appointment): Implement appointment rescheduling`

---

### Task 4.3: Implement Appointment Cancellation

**Objective:** Add cancellation functionality with reason tracking

**Requirements:** Requirement 7

**Steps:**
1. Create cancellation dialog component
2. Add cancel button to details page
3. Implement cancellation reason input
4. Add confirmation step
5. Call cancelAppointment from hook
6. Show loading state during cancellation
7. Handle success (show toast, redirect to calendar)
8. Handle error (show error message)
9. Update appointment status to 'cancelled'
10. Add permission check (appointments:write required)

**Verification:**
```bash
# Click cancel button
# Enter cancellation reason
# Confirm cancellation
# Verify API DELETE request
# Check appointment status = 'cancelled'
# Verify redirect to calendar
```

**Commit:** `feat(appointment): Implement appointment cancellation`

---

### Task 4.4: Implement Status Management

**Objective:** Add status update functionality

**Requirements:** Requirement 8

**Steps:**
1. Add status dropdown to details page
2. Implement status change handler
3. Call updateStatus from hook
4. Show loading state during update
5. Handle success (update UI, show toast)
6. Handle error (show error message)
7. Implement status transition validation
8. Add status change history display
9. Add permission check for status updates

**Verification:**
```bash
# Select new status from dropdown
# Verify API PUT request
# Check status updated in database
# Verify UI updates
```

**Commit:** `feat(appointment): Implement appointment status management`

---

## Phase 5: Provider and Patient Views

### Task 5.1: Create Provider Schedule View

**Objective:** Create provider-specific schedule page

**Requirements:** Requirement 9

**Steps:**
1. Create `hospital-management-system/app/appointments/provider-schedule/page.tsx`
2. Get current user's provider ID
3. Fetch appointments filtered by provider
4. Display appointments in chronological order
5. Show upcoming appointments with countdown
6. Highlight current/next appointment
7. Display daily summary (total, completed, remaining)
8. Add date navigation
9. Add quick status update buttons
10. Implement auto-refresh (every 30 seconds)

**Verification:**
```bash
# Login as provider
# Navigate to provider schedule
# Verify only provider's appointments shown
# Check countdown timers
# Verify auto-refresh
```

**Commit:** `feat(appointment): Create provider schedule view`

---

### Task 5.2: Implement Patient Appointment History

**Objective:** Add appointment history to patient details

**Requirements:** Requirement 10

**Steps:**
1. Open patient details page
2. Add appointment history section
3. Fetch patient appointments using API
4. Display appointments in reverse chronological order
5. Show appointment dates, providers, types
6. Indicate cancelled and no-show appointments
7. Calculate appointment adherence rate
8. Add filter by date range
9. Add "Schedule New Appointment" button
10. Link to appointment details

**Verification:**
```bash
# View patient details
# Check appointment history section
# Verify appointments fetched from API
# Check adherence rate calculation
```

**Commit:** `feat(appointment): Add patient appointment history`

---

### Task 5.3: Implement Appointment Queue

**Objective:** Create appointment queue for daily patient flow

**Requirements:** Requirement 19

**Steps:**
1. Open `hospital-management-system/app/appointments/appointment-queue/page.tsx`
2. Remove mock data
3. Fetch today's appointments for provider
4. Display queue in scheduled time order
5. Add patient arrival status tracking
6. Implement "Mark as Arrived" button
7. Show estimated wait times
8. Add status indicators (waiting, in-room, completed)
9. Implement drag-and-drop reordering (optional)
10. Add auto-refresh

**Verification:**
```bash
# Navigate to appointment queue
# Verify today's appointments shown
# Mark patient as arrived
# Check status updates
```

**Commit:** `feat(appointment): Implement appointment queue management`

---

## Phase 6: Search and Filtering

### Task 6.1: Implement Appointment Search

**Objective:** Add search functionality for appointments

**Requirements:** Requirement 11

**Steps:**
1. Add search input to appointments page
2. Implement debounced search (300ms)
3. Search by patient name, appointment number, provider name
4. Send search query to backend API
5. Display search results
6. Highlight search terms in results
7. Add clear search button
8. Show "No results found" message
9. Add search history (optional)

**Verification:**
```bash
# Type in search box
# Verify debounced API calls
# Check search results
# Clear search
```

**Commit:** `feat(appointment): Implement appointment search`

---

### Task 6.2: Implement Advanced Filtering

**Objective:** Add comprehensive filtering options

**Requirements:** Requirement 2

**Steps:**
1. Create filter panel component
2. Add date range filter
3. Add provider multi-select filter
4. Add status multi-select filter
5. Add appointment type filter
6. Add priority filter
7. Implement filter application
8. Add filter badges showing active filters
9. Add clear all filters button
10. Persist filters in URL params

**Verification:**
```bash
# Apply multiple filters
# Verify API calls with filter params
# Check filtered results
# Clear filters
```

**Commit:** `feat(appointment): Add advanced filtering options`

---

## Phase 7: Permission-Based Access Control

### Task 7.1: Implement Permission Checks in UI

**Objective:** Hide/show features based on user permissions

**Requirements:** Requirement 16

**Steps:**
1. Create `checkPermission` utility function
2. Get user permissions from auth context
3. Add permission checks to:
   - Appointment calendar (appointments:read)
   - New appointment button (appointments:write)
   - Reschedule button (appointments:write)
   - Cancel button (appointments:write)
   - Status update (appointments:write)
4. Hide features when permission missing
5. Show permission denied message when accessed directly
6. Implement provider-only view (providers see only their appointments)

**Verification:**
```bash
# Login as user with different roles
# Verify features shown/hidden based on permissions
# Try direct URL access without permission
```

**Commit:** `feat(appointment): Implement permission-based access control`

---

### Task 7.2: Add Permission Denied Pages

**Objective:** Create user-friendly permission denied pages

**Requirements:** Requirement 16

**Steps:**
1. Create permission denied component
2. Display when user lacks required permission
3. Show which permission is required
4. Add "Go Back" button
5. Add "Request Access" button (optional)
6. Style consistently with app theme

**Verification:**
```bash
# Access appointment page without permission
# Verify permission denied page shown
```

**Commit:** `feat(appointment): Add permission denied pages`

---

## Phase 8: Error Handling and User Feedback

### Task 8.1: Implement Toast Notifications

**Objective:** Add toast notifications for all operations

**Requirements:** Requirement 20

**Steps:**
1. Ensure toast library is installed (from patient spec)
2. Implement success toasts:
   - Appointment created
   - Appointment rescheduled
   - Appointment cancelled
   - Status updated
3. Implement error toasts:
   - Scheduling conflicts
   - Validation errors
   - Network errors
4. Add loading toasts for long operations
5. Style toasts consistently

**Verification:**
```bash
# Perform appointment operations
# Verify toast notifications appear
# Check success and error scenarios
```

**Commit:** `feat(appointment): Add toast notifications for user feedback`

---

### Task 8.2: Implement Error Boundaries

**Objective:** Add error boundaries to catch React errors

**Requirements:** Requirement 20

**Steps:**
1. Create ErrorBoundary component (if not exists)
2. Wrap appointment pages with error boundary
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

**Commit:** `feat(appointment): Add error boundaries for appointment pages`

---

### Task 8.3: Implement Loading States

**Objective:** Add consistent loading states across all pages

**Requirements:** Requirement 20

**Steps:**
1. Create loading skeleton components for:
   - Calendar view
   - Appointment list
   - Appointment details
   - Time slot grid
2. Add loading spinners to buttons during submission
3. Add progress indicators for multi-step forms
4. Implement optimistic updates where appropriate

**Verification:**
```bash
# Navigate to appointment pages
# Verify loading states shown
# Check smooth transitions
```

**Commit:** `feat(appointment): Add loading states to appointment pages`

---

### Task 8.4: Implement Empty States

**Objective:** Add empty states for no data scenarios

**Requirements:** Requirement 20

**Steps:**
1. Create empty state component
2. Add empty states to:
   - Calendar (no appointments)
   - Search results (no matches)
   - Provider schedule (no appointments)
   - Patient history (no appointments)
3. Add helpful messages and actions
4. Add illustrations or icons
5. Style consistently

**Verification:**
```bash
# View pages with no data
# Verify empty states shown
# Check helpful messages
```

**Commit:** `feat(appointment): Add empty states to appointment pages`

---

## Phase 9: Advanced Features

### Task 9.1: Implement Waitlist Management

**Objective:** Add waitlist functionality for fully booked slots

**Requirements:** Requirement 14

**Steps:**
1. Create waitlist modal component
2. Add "Join Waitlist" button when no slots available
3. Implement waitlist form (preferred dates/times)
4. Submit waitlist entry to backend
5. Display waitlist status in appointment management
6. Implement waitlist notification system
7. Add convert waitlist to appointment functionality

**Verification:**
```bash
# Try to book fully booked slot
# Join waitlist
# Verify waitlist entry created
# Convert waitlist to appointment
```

**Commit:** `feat(appointment): Implement waitlist management`

---

### Task 9.2: Implement Recurring Appointments

**Objective:** Add recurring appointment functionality

**Requirements:** Requirement 18

**Steps:**
1. Add recurring appointment option to creation form
2. Implement recurrence pattern selection (daily, weekly, monthly)
3. Add end date or occurrence count
4. Check conflicts for all recurring instances
5. Create all recurring appointments in backend
6. Display recurring appointment indicator
7. Implement edit single vs edit series
8. Implement cancel single vs cancel series

**Verification:**
```bash
# Create recurring appointment
# Verify all instances created
# Edit single instance
# Cancel series
```

**Commit:** `feat(appointment): Implement recurring appointments`

---

### Task 9.3: Implement Appointment Analytics

**Objective:** Add analytics and insights dashboard

**Requirements:** Requirement 17

**Steps:**
1. Create analytics page
2. Fetch appointment statistics from backend
3. Display no-show rates
4. Display cancellation rates
5. Display provider utilization
6. Display average wait times
7. Show appointment trends over time
8. Add AI-powered scheduling recommendations
9. Implement date range filtering for analytics

**Verification:**
```bash
# Navigate to analytics page
# Verify statistics displayed
# Check charts and graphs
# Apply date filters
```

**Commit:** `feat(appointment): Add appointment analytics dashboard`

---

## Phase 10: Testing and Optimization

### Task 10.1: Write Unit Tests for Hooks

**Objective:** Test custom hooks functionality

**Steps:**
1. Install testing libraries (if not installed)
2. Write tests for useAppointments hook
3. Write tests for useAppointment hook
4. Write tests for useTimeSlots hook
5. Write tests for useAppointmentForm hook
6. Test error scenarios
7. Test loading states
8. Achieve >80% code coverage

**Verification:**
```bash
npm run test
```

**Commit:** `test(appointment): Add unit tests for custom hooks`

---

### Task 10.2: Write Integration Tests

**Objective:** Test complete appointment workflows

**Steps:**
1. Write test for appointment creation flow
2. Write test for appointment rescheduling
3. Write test for appointment cancellation
4. Write test for status updates
5. Test conflict detection
6. Test permission-based access
7. Test error handling

**Verification:**
```bash
npm run test:integration
```

**Commit:** `test(appointment): Add integration tests for appointment workflows`

---

### Task 10.3: Optimize Performance

**Objective:** Improve appointment management performance

**Steps:**
1. Implement React.memo for appointment cards
2. Optimize calendar rendering with virtualization
3. Optimize re-renders with useMemo and useCallback
4. Implement request cancellation for outdated requests
5. Add data caching with SWR or React Query
6. Optimize bundle size with code splitting
7. Add performance monitoring
8. Optimize time slot calculation

**Verification:**
```bash
# Run Lighthouse audit
# Check performance metrics
# Verify no unnecessary re-renders
```

**Commit:** `perf(appointment): Optimize appointment management performance`

---

## Phase 11: Documentation and Cleanup

### Task 11.1: Update Documentation

**Objective:** Document appointment management integration

**Steps:**
1. Update README with appointment features
2. Document API endpoints used
3. Document custom hooks usage
4. Add code examples
5. Document permission requirements
6. Add troubleshooting guide
7. Document calendar library usage

**Verification:**
```bash
# Review documentation
# Verify all features documented
```

**Commit:** `docs(appointment): Update documentation for appointment management`

---

### Task 11.2: Remove Mock Data and Cleanup

**Objective:** Remove all mock data and unused code

**Steps:**
1. Search for all mock appointment data
2. Remove hardcoded appointment arrays
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

**Commit:** `chore(appointment): Remove mock data and cleanup code`

---

### Task 11.3: Final Testing and Verification

**Objective:** Comprehensive testing of all appointment features

**Steps:**
1. Test complete appointment creation flow
2. Test calendar views (day, week, month)
3. Test appointment rescheduling
4. Test appointment cancellation
5. Test status management
6. Test provider schedule view
7. Test patient appointment history
8. Test appointment queue
9. Test search and filtering
10. Test permission-based access
11. Test conflict detection
12. Test waitlist management
13. Test recurring appointments
14. Test analytics dashboard
15. Test with different user roles
16. Test multi-tenant isolation
17. Verify all requirements met

**Verification:**
```bash
# Manual testing checklist
# Automated test suite
# User acceptance testing
```

**Commit:** `test(appointment): Final verification of appointment management integration`

---

## Summary

**Total Tasks:** 45 tasks across 11 phases

**Estimated Timeline:**
- Phase 1 (Infrastructure): 3 days
- Phase 2 (Calendar): 3-4 days
- Phase 3 (Creation): 3 days
- Phase 4 (Details/Management): 2-3 days
- Phase 5 (Provider/Patient Views): 2 days
- Phase 6 (Search/Filtering): 2 days
- Phase 7 (Permissions): 1 day
- Phase 8 (Error Handling): 2 days
- Phase 9 (Advanced Features): 3 days
- Phase 10 (Testing): 2-3 days
- Phase 11 (Documentation): 1 day

**Total Estimated Time:** 24-28 days

**Key Deliverables:**
- ✅ Complete appointment CRUD operations
- ✅ Calendar views (day, week, month, agenda)
- ✅ Real-time conflict detection
- ✅ Time slot availability checking
- ✅ Provider schedule management
- ✅ Patient appointment history
- ✅ Appointment queue for daily flow
- ✅ Search and advanced filtering
- ✅ Permission-based access control
- ✅ Waitlist management
- ✅ Recurring appointments
- ✅ Analytics and insights
- ✅ Comprehensive testing
- ✅ Complete documentation
