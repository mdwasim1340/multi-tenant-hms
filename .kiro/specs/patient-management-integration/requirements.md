# Patient Management System Integration - Requirements Document

## Introduction

The patient management system currently has a complete backend API with database tables and controllers, but the frontend is using mock/hardcoded data and is not connected to the backend. This spec addresses the integration gap and ensures full CRUD functionality for patient management across the hospital management system.

## Glossary

- **HMS**: Hospital Management System (frontend application)
- **Backend API**: Node.js/Express API server with PostgreSQL database
- **Patient Entity**: A person receiving medical care, stored in tenant-specific database schema
- **CRUD Operations**: Create, Read, Update, Delete operations for patient records
- **Tenant Context**: Multi-tenant isolation using X-Tenant-ID header
- **Mock Data**: Hardcoded patient data in frontend components (to be replaced)
- **Real Data**: Patient data fetched from backend API via HTTP requests

## Requirements

### Requirement 1: Patient Directory Integration

**User Story:** As a hospital staff member, I want to view a real-time list of all patients from the database, so that I can access accurate and up-to-date patient information.

#### Acceptance Criteria

1. WHEN the HMS loads the patient directory page, THE HMS SHALL fetch patient data from the backend API endpoint `/api/patients`
2. WHEN the patient data is successfully retrieved, THE HMS SHALL display all patients with their complete information including patient number, name, age, contact details, and status
3. WHEN the API request fails, THE HMS SHALL display an error message to the user with retry option
4. WHEN no patients exist in the database, THE HMS SHALL display an empty state message with option to register new patient
5. WHILE the patient data is loading, THE HMS SHALL display a loading skeleton or spinner

### Requirement 2: Patient Search and Filtering

**User Story:** As a hospital staff member, I want to search and filter patients by various criteria, so that I can quickly find specific patient records.

#### Acceptance Criteria

1. WHEN a user types in the search field, THE HMS SHALL send search query to backend API with debounced requests
2. THE HMS SHALL support searching by patient number, first name, last name, email, phone, and mobile phone
3. WHEN a user selects a status filter (Active/Inactive), THE HMS SHALL fetch filtered results from the backend
4. WHEN a user selects a risk level filter, THE HMS SHALL display patients matching that risk level
5. THE HMS SHALL support pagination with configurable page size (10, 25, 50, 100 records per page)

### Requirement 3: Patient Registration with Backend Integration

**User Story:** As a receptionist, I want to register new patients through a form that saves data to the database, so that patient records are permanently stored and accessible.

#### Acceptance Criteria

1. WHEN a user completes the patient registration form, THE HMS SHALL validate all required fields before submission
2. WHEN the form is valid, THE HMS SHALL send a POST request to `/api/patients` with patient data
3. WHEN the patient is successfully created, THE HMS SHALL display a success message and redirect to patient details page
4. IF a duplicate patient number exists, THEN THE HMS SHALL display a validation error message
5. WHEN the registration fails, THE HMS SHALL display specific error messages for each field

### Requirement 4: Patient Details View

**User Story:** As a healthcare provider, I want to view complete patient details including medical history and custom fields, so that I can make informed clinical decisions.

#### Acceptance Criteria

1. WHEN a user clicks on a patient record, THE HMS SHALL fetch complete patient details from `/api/patients/:id`
2. THE HMS SHALL display all patient demographic information, contact details, and emergency contacts
3. THE HMS SHALL display custom field values associated with the patient
4. THE HMS SHALL display patient's medical history, allergies, and current medications
5. THE HMS SHALL calculate and display patient age based on date of birth

### Requirement 5: Patient Record Updates

**User Story:** As a hospital staff member, I want to update patient information when details change, so that records remain accurate and current.

#### Acceptance Criteria

1. WHEN a user with write permissions clicks edit on a patient record, THE HMS SHALL display an editable form with current patient data
2. WHEN the user modifies fields and saves, THE HMS SHALL send a PUT request to `/api/patients/:id` with updated data
3. WHEN the update is successful, THE HMS SHALL display a success message and refresh the patient details
4. WHEN the update fails, THE HMS SHALL display error messages without losing user's changes
5. THE HMS SHALL validate all fields before allowing submission

### Requirement 6: Patient Record Deactivation

**User Story:** As an administrator, I want to deactivate patient records instead of permanently deleting them, so that historical data is preserved for compliance.

#### Acceptance Criteria

1. WHEN a user with admin permissions clicks delete on a patient record, THE HMS SHALL display a confirmation dialog
2. WHEN the user confirms deletion, THE HMS SHALL send a DELETE request to `/api/patients/:id`
3. THE HMS SHALL perform a soft delete by setting patient status to 'inactive'
4. WHEN deactivation is successful, THE HMS SHALL remove the patient from active list and display success message
5. THE HMS SHALL maintain patient data in database for audit and compliance purposes

### Requirement 7: Patient Transfers Management

**User Story:** As a hospital coordinator, I want to manage patient transfers between departments or facilities, so that patient care continuity is maintained.

#### Acceptance Criteria

1. WHEN a user accesses the patient transfers page, THE HMS SHALL display all active transfer requests
2. WHEN a user initiates a transfer, THE HMS SHALL create a transfer record with source and destination information
3. THE HMS SHALL update patient status to reflect transfer in progress
4. WHEN a transfer is completed, THE HMS SHALL update patient location and status
5. THE HMS SHALL maintain transfer history for each patient

### Requirement 8: Patient Records Access

**User Story:** As a healthcare provider, I want to access patient medical records, so that I can review clinical history and treatment plans.

#### Acceptance Criteria

1. WHEN a user clicks on patient records, THE HMS SHALL fetch medical records from `/api/medical-records` filtered by patient ID
2. THE HMS SHALL display records in chronological order with most recent first
3. THE HMS SHALL show visit dates, diagnoses, treatments, and prescriptions
4. WHEN no records exist, THE HMS SHALL display empty state with option to create first record
5. THE HMS SHALL support filtering records by date range and record type

### Requirement 9: Permission-Based Access Control

**User Story:** As a system administrator, I want patient management features to respect user permissions, so that data security and privacy are maintained.

#### Acceptance Criteria

1. THE HMS SHALL check user permissions before displaying patient management features
2. WHEN a user lacks 'patients:read' permission, THE HMS SHALL hide patient directory and details pages
3. WHEN a user lacks 'patients:write' permission, THE HMS SHALL hide create and edit buttons
4. WHEN a user lacks 'patients:admin' permission, THE HMS SHALL hide delete functionality
5. WHEN unauthorized access is attempted, THE HMS SHALL display permission denied message

### Requirement 10: Error Handling and User Feedback

**User Story:** As a hospital staff member, I want clear feedback when operations succeed or fail, so that I understand the system state and can take appropriate action.

#### Acceptance Criteria

1. WHEN any API operation succeeds, THE HMS SHALL display a success toast notification
2. WHEN any API operation fails, THE HMS SHALL display an error message with specific details
3. WHEN network connectivity is lost, THE HMS SHALL display offline indicator and queue operations
4. WHEN tenant context is missing, THE HMS SHALL redirect user to tenant selection page
5. THE HMS SHALL log all errors to console for debugging purposes

### Requirement 11: Real-Time Data Synchronization

**User Story:** As a hospital staff member, I want patient data to refresh automatically, so that I always see the most current information.

#### Acceptance Criteria

1. WHEN a patient record is updated by another user, THE HMS SHALL refresh the patient list within 30 seconds
2. WHEN viewing patient details, THE HMS SHALL provide a manual refresh button
3. THE HMS SHALL implement optimistic updates for better user experience
4. WHEN conflicts occur, THE HMS SHALL prompt user to resolve or reload data
5. THE HMS SHALL cache patient data locally for improved performance

### Requirement 12: Custom Fields Integration

**User Story:** As a hospital administrator, I want custom fields to be displayed and editable in patient forms, so that hospital-specific data requirements are met.

#### Acceptance Criteria

1. WHEN displaying patient forms, THE HMS SHALL fetch custom field definitions from `/api/custom-fields?applies_to=patients`
2. THE HMS SHALL render custom fields based on field type (text, number, date, select, etc.)
3. WHEN saving patient data, THE HMS SHALL include custom field values in the request payload
4. THE HMS SHALL validate custom fields based on their validation rules
5. THE HMS SHALL display custom field values in patient details view
