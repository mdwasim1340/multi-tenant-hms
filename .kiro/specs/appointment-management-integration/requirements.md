# Appointment Management System Integration - Requirements Document

## Introduction

The appointment management system has a complete backend API with database tables, controllers, and services, but the frontend is using mock/hardcoded data and is not connected to the backend. This spec addresses the integration gap and ensures full CRUD functionality for appointment management with proper multi-tenant isolation, conflict detection, and calendar views.

## Glossary

- **HMS**: Hospital Management System (frontend application)
- **Backend API**: Node.js/Express API server with PostgreSQL database
- **Appointment Entity**: A scheduled meeting between a patient and healthcare provider
- **CRUD Operations**: Create, Read, Update, Delete operations for appointment records
- **Tenant Context**: Multi-tenant isolation using X-Tenant-ID header
- **Mock Data**: Hardcoded appointment data in frontend components (to be replaced)
- **Real Data**: Appointment data fetched from backend API via HTTP requests
- **Conflict Detection**: System to prevent double-booking of providers
- **Time Slot**: Available time period for scheduling appointments
- **Appointment Status**: Current state (scheduled, confirmed, completed, cancelled, no_show)

## Requirements

### Requirement 1: Appointment Calendar Integration

**User Story:** As a hospital staff member, I want to view appointments in a calendar format with real-time data from the database, so that I can see the complete schedule at a glance.

#### Acceptance Criteria

1. WHEN the HMS loads the appointments calendar page, THE HMS SHALL fetch appointment data from the backend API endpoint `/api/appointments`
2. THE HMS SHALL display appointments in calendar view (day, week, month views)
3. WHEN appointments are successfully retrieved, THE HMS SHALL show patient name, provider, time, and appointment type
4. WHEN the API request fails, THE HMS SHALL display an error message with retry option
5. WHEN no appointments exist for selected date range, THE HMS SHALL display empty state message

### Requirement 2: Appointment List View with Filtering

**User Story:** As a receptionist, I want to view and filter appointments by various criteria, so that I can quickly find specific appointments.

#### Acceptance Criteria

1. WHEN a user accesses the appointment list view, THE HMS SHALL fetch appointments from backend API
2. THE HMS SHALL support filtering by date range, patient, provider, status, and appointment type
3. WHEN a user applies filters, THE HMS SHALL send filtered query to backend API
4. THE HMS SHALL support pagination with configurable page size
5. THE HMS SHALL display appointment details including patient info, provider, time, status, and priority

### Requirement 3: Appointment Creation with Conflict Detection

**User Story:** As a receptionist, I want to create new appointments with automatic conflict detection, so that providers are not double-booked.

#### Acceptance Criteria

1. WHEN a user completes the appointment creation form, THE HMS SHALL validate all required fields
2. WHEN the form is valid, THE HMS SHALL send a POST request to `/api/appointments` with appointment data
3. WHEN a scheduling conflict exists, THE HMS SHALL display conflict error with details
4. WHEN the appointment is successfully created, THE HMS SHALL display success message and update calendar
5. THE HMS SHALL check provider availability before allowing time slot selection

### Requirement 4: Available Time Slots Display

**User Story:** As a receptionist, I want to see available time slots for a selected provider and date, so that I can schedule appointments efficiently.

#### Acceptance Criteria

1. WHEN a user selects a provider and date, THE HMS SHALL fetch available time slots from backend
2. THE HMS SHALL display only available (non-conflicting) time slots
3. THE HMS SHALL show blocked time slots (existing appointments, time off)
4. WHEN a time slot is selected, THE HMS SHALL validate availability before proceeding
5. THE HMS SHALL update available slots in real-time as appointments are created

### Requirement 5: Appointment Details View

**User Story:** As a healthcare provider, I want to view complete appointment details including patient information and notes, so that I can prepare for the visit.

#### Acceptance Criteria

1. WHEN a user clicks on an appointment, THE HMS SHALL fetch complete details from `/api/appointments/:id`
2. THE HMS SHALL display patient demographics, contact information, and medical history summary
3. THE HMS SHALL show appointment type, scheduled time, duration, and status
4. THE HMS SHALL display chief complaint, notes, and special instructions
5. THE HMS SHALL show provider information and assigned room (if applicable)

### Requirement 6: Appointment Rescheduling

**User Story:** As a receptionist, I want to reschedule appointments with conflict detection, so that schedule changes are handled smoothly.

#### Acceptance Criteria

1. WHEN a user clicks reschedule on an appointment, THE HMS SHALL display available time slots
2. WHEN a new time is selected, THE HMS SHALL check for conflicts
3. WHEN no conflicts exist, THE HMS SHALL send PUT request to `/api/appointments/:id` with new time
4. WHEN rescheduling is successful, THE HMS SHALL update calendar and notify relevant parties
5. THE HMS SHALL maintain appointment history showing original and rescheduled times

### Requirement 7: Appointment Cancellation

**User Story:** As a receptionist, I want to cancel appointments with a reason, so that cancellations are properly documented.

#### Acceptance Criteria

1. WHEN a user clicks cancel on an appointment, THE HMS SHALL display cancellation reason dialog
2. WHEN a cancellation reason is provided, THE HMS SHALL send DELETE request to `/api/appointments/:id`
3. THE HMS SHALL update appointment status to 'cancelled' (not delete from database)
4. WHEN cancellation is successful, THE HMS SHALL remove appointment from active calendar view
5. THE HMS SHALL maintain cancellation history with reason and timestamp

### Requirement 8: Appointment Status Management

**User Story:** As a healthcare provider, I want to update appointment status (confirmed, completed, no-show), so that appointment lifecycle is tracked.

#### Acceptance Criteria

1. WHEN a user updates appointment status, THE HMS SHALL send PUT request with new status
2. THE HMS SHALL support status transitions: scheduled → confirmed → completed
3. THE HMS SHALL support marking appointments as no-show
4. WHEN status is updated, THE HMS SHALL display success message and refresh view
5. THE HMS SHALL track status change history with timestamps

### Requirement 9: Provider Schedule View

**User Story:** As a healthcare provider, I want to view my personal schedule, so that I can see my appointments for the day.

#### Acceptance Criteria

1. WHEN a provider accesses their schedule, THE HMS SHALL filter appointments by provider ID
2. THE HMS SHALL display appointments in chronological order
3. THE HMS SHALL show upcoming appointments with countdown timers
4. THE HMS SHALL highlight current/next appointment
5. THE HMS SHALL show daily summary (total appointments, completed, remaining)

### Requirement 10: Patient Appointment History

**User Story:** As a healthcare provider, I want to view a patient's appointment history, so that I can see their visit patterns.

#### Acceptance Criteria

1. WHEN viewing patient details, THE HMS SHALL fetch appointment history from `/api/appointments?patient_id=X`
2. THE HMS SHALL display appointments in reverse chronological order
3. THE HMS SHALL show appointment dates, providers, types, and outcomes
4. THE HMS SHALL indicate cancelled and no-show appointments
5. THE HMS SHALL calculate and display appointment adherence rate

### Requirement 11: Appointment Search

**User Story:** As a receptionist, I want to search for appointments by patient name or appointment number, so that I can quickly locate specific appointments.

#### Acceptance Criteria

1. WHEN a user types in the search field, THE HMS SHALL send debounced search query to backend
2. THE HMS SHALL support searching by patient name, appointment number, and provider name
3. WHEN search results are returned, THE HMS SHALL display matching appointments
4. THE HMS SHALL highlight search terms in results
5. THE HMS SHALL show "No results found" when search returns empty

### Requirement 12: Appointment Reminders and Notifications

**User Story:** As a system administrator, I want to configure appointment reminders, so that patients receive timely notifications.

#### Acceptance Criteria

1. WHEN creating an appointment, THE HMS SHALL allow setting reminder preferences
2. THE HMS SHALL support email and SMS reminders
3. THE HMS SHALL allow configuring reminder timing (24 hours, 1 hour before)
4. WHEN reminders are sent, THE HMS SHALL log notification status
5. THE HMS SHALL display reminder status in appointment details

### Requirement 13: Appointment Type Management

**User Story:** As a hospital administrator, I want to define appointment types with durations, so that scheduling is standardized.

#### Acceptance Criteria

1. WHEN creating an appointment, THE HMS SHALL display available appointment types
2. THE HMS SHALL fetch appointment types from backend configuration
3. WHEN an appointment type is selected, THE HMS SHALL auto-populate duration
4. THE HMS SHALL support custom appointment types per specialty
5. THE HMS SHALL validate appointment duration against provider availability

### Requirement 14: Waitlist Management

**User Story:** As a receptionist, I want to add patients to a waitlist when no slots are available, so that cancellations can be filled quickly.

#### Acceptance Criteria

1. WHEN no time slots are available, THE HMS SHALL offer waitlist option
2. WHEN a patient is added to waitlist, THE HMS SHALL record preferred dates and times
3. WHEN an appointment is cancelled, THE HMS SHALL notify waitlist patients
4. THE HMS SHALL allow converting waitlist entries to confirmed appointments
5. THE HMS SHALL display waitlist status in appointment management view

### Requirement 15: Multi-Tenant Isolation

**User Story:** As a system administrator, I want appointments to be completely isolated between tenants, so that data security is maintained.

#### Acceptance Criteria

1. THE HMS SHALL include X-Tenant-ID header in all appointment API requests
2. THE HMS SHALL validate tenant context before displaying appointments
3. WHEN tenant context is missing, THE HMS SHALL redirect to tenant selection
4. THE HMS SHALL prevent cross-tenant appointment access
5. THE HMS SHALL log all appointment access for audit purposes

### Requirement 16: Permission-Based Access Control

**User Story:** As a system administrator, I want appointment features to respect user permissions, so that access is properly controlled.

#### Acceptance Criteria

1. THE HMS SHALL check user permissions before displaying appointment features
2. WHEN a user lacks 'appointments:read' permission, THE HMS SHALL hide appointment views
3. WHEN a user lacks 'appointments:write' permission, THE HMS SHALL hide create/edit buttons
4. WHEN unauthorized access is attempted, THE HMS SHALL display permission denied message
5. THE HMS SHALL allow providers to view only their own appointments unless admin

### Requirement 17: Appointment Analytics and Insights

**User Story:** As a hospital manager, I want to view appointment analytics, so that I can optimize scheduling and resource allocation.

#### Acceptance Criteria

1. WHEN accessing appointment analytics, THE HMS SHALL fetch statistics from backend
2. THE HMS SHALL display no-show rates, cancellation rates, and utilization metrics
3. THE HMS SHALL show provider efficiency and average wait times
4. THE HMS SHALL display appointment trends over time
5. THE HMS SHALL provide AI-powered scheduling recommendations

### Requirement 18: Recurring Appointments

**User Story:** As a receptionist, I want to create recurring appointments, so that regular follow-ups are automatically scheduled.

#### Acceptance Criteria

1. WHEN creating an appointment, THE HMS SHALL offer recurring appointment option
2. THE HMS SHALL support daily, weekly, monthly recurrence patterns
3. WHEN creating recurring appointments, THE HMS SHALL check conflicts for all instances
4. THE HMS SHALL allow editing single instance or entire series
5. THE HMS SHALL allow cancelling single instance or entire series

### Requirement 19: Appointment Queue Management

**User Story:** As a healthcare provider, I want to see my appointment queue for the day, so that I can manage patient flow efficiently.

#### Acceptance Criteria

1. WHEN a provider accesses appointment queue, THE HMS SHALL show today's appointments
2. THE HMS SHALL display queue in order of scheduled time
3. THE HMS SHALL show patient arrival status (waiting, in-room, completed)
4. THE HMS SHALL allow marking patients as arrived
5. THE HMS SHALL calculate and display estimated wait times

### Requirement 20: Error Handling and User Feedback

**User Story:** As a hospital staff member, I want clear feedback when operations succeed or fail, so that I understand the system state.

#### Acceptance Criteria

1. WHEN any appointment operation succeeds, THE HMS SHALL display success toast notification
2. WHEN any appointment operation fails, THE HMS SHALL display error message with specific details
3. WHEN network connectivity is lost, THE HMS SHALL display offline indicator
4. WHEN scheduling conflicts occur, THE HMS SHALL show conflict details with alternative suggestions
5. THE HMS SHALL log all errors to console for debugging purposes
