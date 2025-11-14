# Bed Management System Integration - Requirements Document

## Introduction

The bed management system currently has frontend pages with mock/hardcoded data, but lacks backend API implementation and database tables. This spec addresses the complete implementation from database schema design to frontend integration, ensuring proper multi-tenant isolation, real-time bed occupancy tracking, and patient transfer management.

## Glossary

- **HMS**: Hospital Management System (frontend application)
- **Backend API**: Node.js/Express API server with PostgreSQL database (to be implemented)
- **Bed Entity**: A physical bed in a hospital department that can be assigned to patients
- **Bed Assignment**: The process of allocating a bed to a patient
- **Bed Transfer**: Moving a patient from one bed to another
- **Bed Status**: Current state (available, occupied, maintenance, reserved, cleaning)
- **Department**: Hospital unit or ward (Cardiology, ICU, Emergency, etc.)
- **Occupancy Rate**: Percentage of beds currently occupied
- **Tenant Context**: Multi-tenant isolation using X-Tenant-ID header
- **Mock Data**: Hardcoded bed data in frontend components (to be replaced)

## Requirements

### Requirement 1: Bed Database Schema Design

**User Story:** As a system architect, I want a well-designed database schema for bed management, so that bed data is properly structured and scalable.

#### Acceptance Criteria

1. THE System SHALL create a `beds` table in each tenant schema with fields for bed identification, department, status, and location
2. THE System SHALL create a `bed_assignments` table to track patient-bed relationships with timestamps
3. THE System SHALL create a `bed_transfers` table to log all bed transfer activities
4. THE System SHALL create a `departments` table to manage hospital departments and their bed capacity
5. THE System SHALL implement proper foreign key relationships between tables

### Requirement 2: Bed CRUD API Implementation

**User Story:** As a backend developer, I want RESTful API endpoints for bed management, so that frontend can perform all bed operations.

#### Acceptance Criteria

1. THE Backend SHALL implement GET `/api/beds` endpoint to list all beds with filtering and pagination
2. THE Backend SHALL implement POST `/api/beds` endpoint to create new beds
3. THE Backend SHALL implement GET `/api/beds/:id` endpoint to retrieve bed details
4. THE Backend SHALL implement PUT `/api/beds/:id` endpoint to update bed information
5. THE Backend SHALL implement DELETE `/api/beds/:id` endpoint to deactivate beds

### Requirement 3: Bed Assignment API Implementation

**User Story:** As a backend developer, I want API endpoints for bed assignments, so that patients can be assigned to beds programmatically.

#### Acceptance Criteria

1. THE Backend SHALL implement POST `/api/bed-assignments` endpoint to assign patient to bed
2. THE Backend SHALL validate bed availability before assignment
3. THE Backend SHALL prevent double-booking of beds
4. THE Backend SHALL implement PUT `/api/bed-assignments/:id` endpoint to update assignment
5. THE Backend SHALL implement DELETE `/api/bed-assignments/:id` endpoint to discharge patient from bed

### Requirement 4: Bed Transfer API Implementation

**User Story:** As a backend developer, I want API endpoints for bed transfers, so that patient transfers can be tracked and managed.

#### Acceptance Criteria

1. THE Backend SHALL implement POST `/api/bed-transfers` endpoint to initiate transfer
2. THE Backend SHALL validate source and destination bed availability
3. THE Backend SHALL update bed statuses atomically during transfer
4. THE Backend SHALL log transfer history with reason and timestamps
5. THE Backend SHALL implement GET `/api/bed-transfers` endpoint to retrieve transfer history

### Requirement 5: Department Management API

**User Story:** As a hospital administrator, I want to manage departments and their bed capacity, so that bed allocation is organized by department.

#### Acceptance Criteria

1. THE Backend SHALL implement GET `/api/departments` endpoint to list departments
2. THE Backend SHALL implement POST `/api/departments` endpoint to create departments
3. THE Backend SHALL calculate and return bed occupancy statistics per department
4. THE Backend SHALL validate department capacity constraints
5. THE Backend SHALL support department-specific bed filtering

### Requirement 6: Bed Occupancy Dashboard Integration

**User Story:** As a hospital staff member, I want to view real-time bed occupancy metrics from the database, so that I can make informed bed allocation decisions.

#### Acceptance Criteria

1. WHEN the HMS loads the bed management page, THE HMS SHALL fetch bed occupancy metrics from backend API
2. THE HMS SHALL display total beds, occupied beds, available beds, and occupancy rate
3. THE HMS SHALL show department-wise bed occupancy breakdown
4. WHEN the API request fails, THE HMS SHALL display error message with retry option
5. THE HMS SHALL auto-refresh occupancy data every 30 seconds

### Requirement 7: Bed List View Integration

**User Story:** As a hospital staff member, I want to view all beds with real-time status from the database, so that I can see current bed availability.

#### Acceptance Criteria

1. WHEN a user accesses the bed details tab, THE HMS SHALL fetch beds from backend API
2. THE HMS SHALL display bed number, department, status, and patient information
3. THE HMS SHALL support filtering by department and status
4. THE HMS SHALL support searching by bed number or patient name
5. THE HMS SHALL implement pagination for large bed lists

### Requirement 8: Bed Assignment Integration

**User Story:** As a receptionist, I want to assign patients to available beds through the UI, so that bed allocation is tracked in the system.

#### Acceptance Criteria

1. WHEN a user clicks "Assign Bed", THE HMS SHALL display available beds
2. WHEN a user selects patient and bed, THE HMS SHALL validate availability
3. WHEN assignment is valid, THE HMS SHALL send POST request to `/api/bed-assignments`
4. WHEN assignment succeeds, THE HMS SHALL update bed status and display success message
5. WHEN bed is unavailable, THE HMS SHALL display error with alternative suggestions

### Requirement 9: Bed Transfer Integration

**User Story:** As a nurse, I want to transfer patients between beds through the UI, so that transfers are properly documented.

#### Acceptance Criteria

1. WHEN a user initiates transfer, THE HMS SHALL display transfer form with current bed info
2. WHEN a user selects destination bed, THE HMS SHALL validate availability
3. WHEN transfer is submitted, THE HMS SHALL send POST request to `/api/bed-transfers`
4. WHEN transfer succeeds, THE HMS SHALL update both bed statuses and show confirmation
5. THE HMS SHALL display transfer history with timestamps and reasons

### Requirement 10: Department Overview Integration

**User Story:** As a hospital manager, I want to view department-wise bed statistics from the database, so that I can monitor department capacity.

#### Acceptance Criteria

1. WHEN a user views department overview, THE HMS SHALL fetch department statistics from API
2. THE HMS SHALL display total beds, occupied beds, available beds per department
3. THE HMS SHALL show occupancy rate as percentage and visual progress bar
4. THE HMS SHALL highlight departments with critical occupancy (>90%)
5. THE HMS SHALL allow drilling down to department-specific bed list

### Requirement 11: Bed Status Management

**User Story:** As a hospital staff member, I want to update bed status (maintenance, cleaning, reserved), so that bed availability is accurate.

#### Acceptance Criteria

1. WHEN a user updates bed status, THE HMS SHALL send PUT request to backend
2. THE HMS SHALL support status transitions: available ↔ maintenance ↔ cleaning
3. THE HMS SHALL prevent status changes for occupied beds without discharge
4. WHEN status update succeeds, THE HMS SHALL refresh bed list
5. THE HMS SHALL log status change history with timestamps

### Requirement 12: Bed Search and Filtering

**User Story:** As a hospital staff member, I want to search and filter beds by various criteria, so that I can quickly find specific beds.

#### Acceptance Criteria

1. WHEN a user types in search field, THE HMS SHALL send debounced search query to backend
2. THE HMS SHALL support searching by bed number, patient name, and department
3. THE HMS SHALL support filtering by status (available, occupied, maintenance)
4. THE HMS SHALL support filtering by department
5. THE HMS SHALL display filtered results with count

### Requirement 13: Real-Time Bed Availability

**User Story:** As a receptionist, I want to see real-time bed availability, so that I can make immediate assignment decisions.

#### Acceptance Criteria

1. THE HMS SHALL implement auto-refresh of bed data every 30 seconds
2. THE HMS SHALL highlight recently changed bed statuses
3. THE HMS SHALL show timestamp of last update
4. THE HMS SHALL provide manual refresh button
5. THE HMS SHALL use optimistic updates for better UX

### Requirement 14: Bed Assignment History

**User Story:** As a hospital administrator, I want to view bed assignment history, so that I can track bed utilization patterns.

#### Acceptance Criteria

1. WHEN viewing bed details, THE HMS SHALL fetch assignment history from API
2. THE HMS SHALL display all past assignments with patient names and dates
3. THE HMS SHALL calculate average occupancy duration
4. THE HMS SHALL show total number of assignments
5. THE HMS SHALL support filtering history by date range

### Requirement 15: Patient Bed History

**User Story:** As a healthcare provider, I want to view a patient's bed history, so that I can see their hospital stay progression.

#### Acceptance Criteria

1. WHEN viewing patient details, THE HMS SHALL fetch bed assignment history
2. THE HMS SHALL display all beds patient has occupied with dates
3. THE HMS SHALL show transfer reasons and timestamps
4. THE HMS SHALL calculate total hospital stay duration
5. THE HMS SHALL link to bed details for each assignment

### Requirement 16: Bed Capacity Planning

**User Story:** As a hospital manager, I want to view bed capacity analytics, so that I can plan for future capacity needs.

#### Acceptance Criteria

1. THE HMS SHALL display historical occupancy trends
2. THE HMS SHALL show peak occupancy times and patterns
3. THE HMS SHALL calculate average length of stay per department
4. THE HMS SHALL predict capacity needs based on trends
5. THE HMS SHALL provide capacity utilization reports

### Requirement 17: Multi-Tenant Isolation

**User Story:** As a system administrator, I want bed data to be completely isolated between tenants, so that data security is maintained.

#### Acceptance Criteria

1. THE HMS SHALL include X-Tenant-ID header in all bed API requests
2. THE Backend SHALL validate tenant context before processing requests
3. WHEN tenant context is missing, THE HMS SHALL redirect to tenant selection
4. THE Backend SHALL prevent cross-tenant bed access
5. THE Backend SHALL log all bed access for audit purposes

### Requirement 18: Permission-Based Access Control

**User Story:** As a system administrator, I want bed management features to respect user permissions, so that access is properly controlled.

#### Acceptance Criteria

1. THE HMS SHALL check user permissions before displaying bed management features
2. WHEN a user lacks 'beds:read' permission, THE HMS SHALL hide bed views
3. WHEN a user lacks 'beds:write' permission, THE HMS SHALL hide assignment/transfer buttons
4. WHEN unauthorized access is attempted, THE HMS SHALL display permission denied message
5. THE HMS SHALL allow nurses to manage only their department's beds (optional)

### Requirement 19: Bed Maintenance Scheduling

**User Story:** As a facilities manager, I want to schedule bed maintenance, so that maintenance activities are tracked and beds are unavailable during maintenance.

#### Acceptance Criteria

1. WHEN scheduling maintenance, THE HMS SHALL mark bed as unavailable
2. THE HMS SHALL record maintenance reason and expected completion time
3. THE HMS SHALL send notifications when maintenance is due
4. WHEN maintenance is complete, THE HMS SHALL update bed status to available
5. THE HMS SHALL maintain maintenance history for each bed

### Requirement 20: Emergency Bed Allocation

**User Story:** As an emergency room staff, I want to quickly find and assign available beds during emergencies, so that critical patients are accommodated immediately.

#### Acceptance Criteria

1. THE HMS SHALL provide emergency bed allocation mode
2. THE HMS SHALL prioritize showing nearest available beds
3. THE HMS SHALL allow bypassing normal assignment workflow
4. THE HMS SHALL flag emergency assignments for review
5. THE HMS SHALL send notifications to relevant staff

### Requirement 21: Bed Reservation System

**User Story:** As a hospital administrator, I want to reserve beds for scheduled admissions, so that bed availability is guaranteed for planned procedures.

#### Acceptance Criteria

1. THE HMS SHALL allow reserving beds for future dates
2. THE HMS SHALL prevent assignment of reserved beds to other patients
3. THE HMS SHALL automatically release reservations if not used within timeframe
4. THE HMS SHALL send reminders for upcoming reservations
5. THE HMS SHALL track reservation utilization rates

### Requirement 22: Error Handling and User Feedback

**User Story:** As a hospital staff member, I want clear feedback when operations succeed or fail, so that I understand the system state.

#### Acceptance Criteria

1. WHEN any bed operation succeeds, THE HMS SHALL display success toast notification
2. WHEN any bed operation fails, THE HMS SHALL display error message with specific details
3. WHEN network connectivity is lost, THE HMS SHALL display offline indicator
4. WHEN bed conflicts occur, THE HMS SHALL show conflict details with alternatives
5. THE HMS SHALL log all errors to console for debugging purposes
