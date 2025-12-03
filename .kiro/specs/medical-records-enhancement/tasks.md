# Implementation Plan

## Phase 1: Database Schema and Backend Foundation

- [x] 1. Create database migrations for EMR tables
  - [x] 1.1 Create clinical_notes table migration
    - Create table with patient_id, provider_id, note_type, content, status, signed_at fields
    - Add foreign key constraints and indexes
    - _Requirements: 2.3_
  - [x] 1.2 Create clinical_note_versions table migration
    - Create table for version history with note_id, version_number, content, changed_by
    - _Requirements: 2.5_
  - [x] 1.3 Create note_templates table migration
    - Create table with name, category, content, is_active fields
    - _Requirements: 2.4_
  - [x] 1.4 Create imaging_reports and imaging_report_files tables migration
    - Create tables with proper relationships and indexes
    - _Requirements: 4.2, 4.3_
  - [x] 1.5 Create prescriptions table migration
    - Create table with medication details, refills, status fields
    - _Requirements: 5.2, 5.3_
  - [x] 1.6 Create medical_history table migration
    - Create table with category, name, severity, reaction fields
    - _Requirements: 6.2, 6.3_
  - [x] 1.7 Create record_shares table migration
    - Create table for secure sharing with access_token, expires_at
    - _Requirements: 9.3_
  - [x] 1.8 Write property test for database schema
    - **Property 9: S3 Path Tenant Isolation**
    - **Validates: Requirements 3.5**

- [x] 2. Implement Clinical Notes Backend
  - [x] 2.1 Create clinical note types and interfaces
    - Define TypeScript types for ClinicalNote, ClinicalNoteVersion, NoteTemplate
    - _Requirements: 2.1, 2.2_
  - [x] 2.2 Implement clinical note service
    - Create, read, update, delete operations
    - Version history creation on updates
    - _Requirements: 2.3, 2.5_
  - [x] 2.3 Write property test for clinical note persistence
    - **Property 3: Clinical Note Persistence Round-Trip**
    - **Validates: Requirements 2.3, 2.6**
  - [x] 2.4 Implement clinical note controller
    - Handle HTTP requests with validation
    - _Requirements: 2.2_
  - [x] 2.5 Write property test for required fields validation
    - **Property 2: Clinical Note Required Fields Validation**
    - **Validates: Requirements 2.2**
  - [x] 2.6 Create clinical notes routes
    - GET /api/clinical-notes, POST, PUT, DELETE endpoints
    - POST /api/clinical-notes/:id/sign endpoint
    - _Requirements: 2.1, 2.3_
  - [x] 2.7 Write unit tests for clinical notes API
    - Test CRUD operations and validation
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.







- [x] 4. Implement Note Templates Backend
  - [x] 4.1 Create template service
    - CRUD operations for note templates
    - _Requirements: 2.4_
  - [x] 4.2 Create template controller and routes
    - GET /api/note-templates, POST, PUT, DELETE endpoints
    - _Requirements: 2.4_
  - [x] 4.3 Write property test for template population
    - **Property 4: Template Population Consistency**
    - **Validates: Requirements 2.4**

- [x] 5. Implement Imaging Reports Backend
  - [x] 5.1 Create imaging report types and interfaces
    - Define TypeScript types for ImagingReport, ImagingReportFile
    - _Requirements: 4.1, 4.2_
  - [x] 5.2 Implement imaging report service
    - CRUD operations with file attachment support
    - _Requirements: 4.2, 4.3_
  - [x] 5.3 Implement imaging report controller and routes
    - GET /api/imaging-reports, POST, PUT endpoints
    - File upload integration with S3
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 5.4 Write property test for search filter accuracy
    - **Property 11: Search Filter Accuracy**
    - **Validates: Requirements 4.5**
  - [x] 5.5 Write unit tests for imaging reports API
    - Test CRUD and file operations
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 6. Implement Prescriptions Backend
  - [x] 6.1 Create prescription types and interfaces
    - Define TypeScript types for Prescription, DrugInteraction
    - _Requirements: 5.1, 5.2_
  - [x] 6.2 Implement prescription service
    - CRUD operations with drug interaction checking
    - Status management (active, expired, discontinued)
    - _Requirements: 5.2, 5.3, 5.4_
  - [x] 6.3 Implement prescription controller and routes
    - GET /api/prescriptions, POST, PUT endpoints
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 6.4 Write property test for prescription status indicators
    - **Property 12: Prescription Status Indicators**
    - **Validates: Requirements 5.5**
  - [x] 6.5 Write unit tests for prescriptions API
    - Test CRUD and status transitions
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement Medical History Backend
  - [x] 8.1 Create medical history types and interfaces
    - Define TypeScript types for MedicalCondition, Surgery, Allergy, FamilyHistory
    - _Requirements: 6.1, 6.2_
  - [x] 8.2 Implement medical history service
    - CRUD operations for all history categories
    - Critical allergy flagging
    - _Requirements: 6.2, 6.3, 6.4_
  - [x] 8.3 Implement medical history controller and routes
    - GET /api/medical-history, POST, PUT, DELETE endpoints
    - _Requirements: 6.1, 6.2_
  - [x] 8.4 Write property test for critical allergy warning
    - **Property 13: Critical Allergy Warning Display**
    - **Validates: Requirements 6.4**
  - [x] 8.5 Write unit tests for medical history API
    - Test CRUD and allergy severity handling
    - _Requirements: 6.1, 6.2, 6.3_

## Phase 2: File Upload and S3 Integration

- [x] 9. Implement Report File Upload
  - [x] 9.1 Create file validation utilities
    - Validate file type (PDF, DOCX, JPG, PNG)
    - Validate file size (max 25MB)
    - _Requirements: 3.2, 3.3_
  - [x] 9.2 Write property test for file format validation
    - **Property 6: File Upload Format Validation**
    - **Validates: Requirements 3.2**
  - [x] 9.3 Write property test for file size validation
    - **Property 7: File Upload Size Validation**
    - **Validates: Requirements 3.3**
  - [x] 9.4 Implement report upload service
    - S3 presigned URL generation with tenant path prefix
    - Metadata storage in database
    - _Requirements: 3.4, 3.5_
  - [x] 9.5 Write property test for report metadata validation
    - **Property 8: Report Metadata Validation**
    - **Validates: Requirements 3.4**
  - [x] 9.6 Implement report upload controller and routes
    - POST /api/reports/upload-url endpoint
    - POST /api/reports endpoint for metadata
    - _Requirements: 3.1, 3.4, 3.5_
  - [x] 9.7 Write property test for presigned URL generation
    - **Property 10: Presigned URL Generation**
    - **Validates: Requirements 3.6, 4.4**

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Audit Logging and Sharing

- [x] 11. Implement Audit Logging
  - [x] 11.1 Create audit logging middleware
    - Log all EMR record views, modifications, downloads
    - Include user ID, timestamp, action type, record identifiers
    - _Requirements: 8.1, 8.2, 8.3_
  - [x] 11.2 Write property test for audit log completeness
    - **Property 16: Audit Log Completeness**
    - **Validates: Requirements 8.1, 8.2, 8.3**
  - [x] 11.3 Implement audit log viewing and export
    - GET /api/audit-logs endpoint with filtering
    - Export to CSV/PDF functionality
    - _Requirements: 8.4, 8.5_
  - [x] 11.4 Write unit tests for audit logging
    - Test log creation for various actions
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 12. Implement Secure Sharing
  - [x] 12.1 Create record sharing service
    - Generate time-limited access tokens
    - Verify recipient is healthcare provider
    - _Requirements: 9.1, 9.2, 9.3_
  - [x] 12.2 Implement sharing controller and routes
    - POST /api/records/share endpoint
    - GET /api/records/shared/:token endpoint
    - _Requirements: 9.1, 9.3_
  - [x] 12.3 Write property test for shared link expiration
    - **Property 17: Shared Link Expiration**
    - **Validates: Requirements 9.4**
  - [x] 12.4 Implement shared access logging
    - Log access via shared links
    - _Requirements: 9.5_
  - [x] 12.5 Write unit tests for secure sharing
    - Test token generation, validation, expiration
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Frontend API Client and Hooks

- [x] 14. Create EMR API Client
  - [x] 14.1 Create clinical notes API client
    - Functions for CRUD operations on clinical notes
    - Template fetching functions
    - _Requirements: 2.1, 2.3, 2.4_
  - [x] 14.2 Create imaging reports API client
    - Functions for CRUD and file operations
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 14.3 Create prescriptions API client
    - Functions for CRUD operations
    - Drug interaction fetching
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 14.4 Create medical history API client
    - Functions for all history categories
    - _Requirements: 6.1, 6.2_
  - [x] 14.5 Create report upload API client
    - Presigned URL request and file upload functions
    - _Requirements: 3.1, 3.5, 3.6_
  - [x] 14.6 Write unit tests for API clients
    - Test API client functions with mocked responses
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 15. Create React Hooks for EMR Data
  - [x] 15.1 Create useClinicalNotes hook
    - Fetch, create, update clinical notes
    - Handle loading and error states
    - _Requirements: 2.1, 2.3_
  - [x] 15.2 Create useImagingReports hook
    - Fetch, create imaging reports with files
    - _Requirements: 4.1, 4.2_
  - [x] 15.3 Create usePrescriptions hook
    - Fetch prescriptions with interactions
    - _Requirements: 5.1, 5.4_
  - [x] 15.4 Create useMedicalHistory hook
    - Fetch all history categories
    - _Requirements: 6.1_
  - [x] 15.5 Create usePatientContext hook
    - Manage selected patient state
    - Clear data on patient switch
    - _Requirements: 7.3, 7.4_
  - [x] 15.6 Write property test for patient context isolation
    - **Property 15: Patient Context Isolation**
    - **Validates: Requirements 7.4**

- [x] 16. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.




## Phase 5: Frontend Components

- [x] 17. Implement Patient Selector Component
  - [x] 17.1 Create PatientSelector component
    - Search by name, patient number, DOB
    - Display patient info and critical allergies
    - _Requirements: 7.1, 7.2, 7.5_
  - [x] 17.2 Write property test for patient search
    - **Property 14: Patient Search Multi-Criteria**
    - **Validates: Requirements 7.2**
  - [x] 17.3 Write unit tests for PatientSelector
    - Test search functionality and selection
    - _Requirements: 7.1, 7.2_

- [x] 18. Implement Rich Text Editor Component
  - [x] 18.1 Create RichTextEditor component
    - Integrate rich text library (TipTap or similar)
    - Support bold, italic, lists, headings
    - _Requirements: 2.1_
  - [x] 18.2 Add template selection to editor
    - Template dropdown with preview
    - Populate editor on selection
    - _Requirements: 2.4_
  - [x] 18.3 Write unit tests for RichTextEditor
    - Test formatting and template population
    - _Requirements: 2.1, 2.4_

- [x] 19. Implement Clinical Notes Form
  - [x] 19.1 Create ClinicalNoteForm component
    - Patient selection, note type, provider fields
    - Rich text editor integration
    - _Requirements: 2.1, 2.2_
  - [x] 19.2 Add version history display
    - Show previous versions with diff view
    - _Requirements: 2.5_
  - [x] 19.3 Write property test for version history preservation
    - **Property 5: Version History Preservation**
    - **Validates: Requirements 2.5**
  - [x] 19.4 Write unit tests for ClinicalNoteForm
    - Test form validation and submission
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 20. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 21. Implement Report Upload Component
  - [x] 21.1 Create ReportUpload component
    - File selection with drag-and-drop
    - File type and size validation
    - Progress indicator
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 21.2 Add metadata form to upload
    - Report type, date, author fields
    - _Requirements: 3.4_
  - [x] 21.3 Write unit tests for ReportUpload
    - Test file validation and upload flow
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 22. Implement Imaging Report Components
  - [x] 22.1 Create ImagingReportsList component
    - Display reports with search and filters
    - _Requirements: 4.1, 4.5_
  - [x] 22.2 Create ImagingReportForm component
    - Patient, imaging type, radiologist, findings fields
    - File attachment support
    - _Requirements: 4.2_
  - [x] 22.3 Create ImagingReportDetails component
    - Display report with image viewer
    - Secure download links
    - _Requirements: 4.4_
  - [x] 22.4 Write unit tests for imaging components
    - Test list, form, and details functionality
    - _Requirements: 4.1, 4.2, 4.4_

- [x] 23. Implement Prescription Components
  - [x] 23.1 Create PrescriptionsList component
    - Display prescriptions with status indicators
    - Show drug interaction warnings
    - _Requirements: 5.1, 5.4, 5.5_
  - [x] 23.2 Create PrescriptionForm component
    - Medication, dose, frequency, duration fields
    - _Requirements: 5.2_
  - [x] 23.3 Write unit tests for prescription components
    - Test list display and form validation
    - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [x] 24. Implement Medical History Components
  - [x] 24.1 Create MedicalHistoryList component
    - Display conditions, surgeries, allergies, family history
    - Critical allergy warning banner
    - _Requirements: 6.1, 6.4_
  - [x] 24.2 Create MedicalHistoryForm component
    - Category selection with dynamic fields
    - Allergy severity and reaction fields
    - _Requirements: 6.2, 6.3_
  - [x] 24.3 Write unit tests for medical history components
    - Test list display and form validation
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 25. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: EMR Pages Integration

- [x] 26. Update EMR Main Page
  - [x] 26.1 Replace mock data with real API calls
    - Integrate PatientSelector
    - Fetch patient data on selection
    - _Requirements: 1.1, 7.1, 7.3_
  - [x] 26.2 Update Overview tab with real data
    - Display real medications, lab results, clinical notes
    - _Requirements: 1.2, 1.3, 1.4_
  - [x] 26.3 Write property test for EMR data loading
    - **Property 1: EMR Data Loading Consistency**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 4.1, 5.1, 6.1**
  - [x] 26.4 Add error handling and retry
    - Display error messages with retry button
    - _Requirements: 1.5_
  - [x] 26.5 Write property test for API error handling
    - **Property 18: API Error Handling**
    - **Validates: Requirements 1.5, 10.5**

- [x] 27. Update Clinical Notes Page
  - [x] 27.1 Replace mock data with real API calls
    - Integrate ClinicalNotesList and ClinicalNoteForm
    - _Requirements: 2.1, 2.3_
  - [x] 27.2 Add "New Note" functionality
    - Open form with template selection
    - _Requirements: 2.1, 2.4_
  - [x] 27.3 Write integration tests for clinical notes page
    - Test full create/edit/view flow
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 28. Update Imaging Reports Page
  - [x] 28.1 Replace mock data with real API calls
    - Integrate ImagingReportsList and ImagingReportForm
    - _Requirements: 4.1, 4.2_
  - [x] 28.2 Add "New Report" functionality
    - Open form with file upload
    - _Requirements: 4.2_
  - [x] 28.3 Add search and filter functionality
    - Filter by patient, imaging type, date range
    - _Requirements: 4.5_
  - [x] 28.4 Write integration tests for imaging page
    - Test full create/view/search flow
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 29. Update Prescriptions Page
  - [x] 29.1 Replace mock data with real API calls
    - Integrate PrescriptionsList and PrescriptionForm
    - _Requirements: 5.1, 5.2_
  - [x] 29.2 Add "New Prescription" functionality
    - Open form with drug interaction checking
    - _Requirements: 5.2, 5.4_
  - [x] 29.3 Write integration tests for prescriptions page
    - Test full create/view flow with interactions
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 30. Update Medical History Page
  - [x] 30.1 Replace mock data with real API calls
    - Integrate MedicalHistoryList and MedicalHistoryForm
    - _Requirements: 6.1, 6.2_
  - [x] 30.2 Add "Add Entry" functionality
    - Open form with category selection
    - _Requirements: 6.2, 6.3_
  - [x] 30.3 Add critical allergy warning banner
    - Display prominently for severe allergies
    - _Requirements: 6.4_
  - [x] 30.4 Write integration tests for medical history page
    - Test full create/view flow with allergy warnings
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 31. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: Responsive Design and Polish

- [x] 32. Implement Responsive Design
  - [x] 32.1 Add mobile-optimized layouts
    - Stack components vertically on small screens
    - Collapsible sections for mobile
    - _Requirements: 10.1_
  - [x] 32.2 Add tablet-optimized layouts
    - Touch-friendly controls (min 44px targets)
    - _Requirements: 10.2, 10.4_
  - [x] 32.3 Add loading indicators
    - Skeleton loaders for data fetching
    - Progress indicators for uploads
    - _Requirements: 10.5_
  - [x] 32.4 Write property test for viewport data persistence
    - **Property: Data persists during viewport changes**
    - **Validates: Requirements 10.3**

- [x] 33. Final Integration Testing
  - [x] 33.1 Run all property-based tests
    - Verify all 18 properties pass
    - _Requirements: All_
  - [x] 33.2 Run all unit tests
    - Verify all components and services work correctly
    - _Requirements: All_
  - [x] 33.3 Run multi-tenant isolation tests
    - Verify data isolation between tenants
    - _Requirements: 3.5, 8.1_
  - [x] 33.4 Manual testing of complete flows
    - Test all EMR sections end-to-end
    - _Requirements: All_

- [x] 34. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
