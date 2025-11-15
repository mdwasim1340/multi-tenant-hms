# Implementation Plan

- [ ] 1. Create frontend pharmacy API client
  - Create TypeScript interfaces for pharmacy data
  - Implement API client methods
  - Add error handling and retry logic
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2_

- [ ] 1.1 Create pharmacy types file
  - Create `hospital-management-system/types/pharmacy.ts`
  - Define Prescription interface
  - Define PharmacyMetrics interface
  - Define DrugUtilization and PrescriptionTrend interfaces
  - _Requirements: 1.2, 9.2_

- [ ] 1.2 Create pharmacy API client
  - Create `hospital-management-system/lib/api/pharmacy.ts`
  - Configure axios instance with base URL
  - Implement getPrescriptions method
  - Implement getPrescriptionsByPatient method
  - Implement createPrescription method
  - _Requirements: 1.1, 1.2, 2.1_

- [ ] 1.3 Add prescription management methods
  - Implement fillPrescription method
  - Implement cancelPrescription method
  - Add proper error handling
  - _Requirements: 2.2, 2.3_

- [ ] 1.4 Add analytics methods
  - Implement getMetrics method
  - Implement getDrugUtilization method
  - Implement getPrescriptionTrends method
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 2. Create custom React hooks
  - Implement usePrescriptions hook
  - Implement usePharmacyMetrics hook
  - Add loading and error states
  - _Requirements: 1.1, 9.1, 9.3_

- [ ] 2.1 Create usePrescriptions hook
  - Create `hospital-management-system/hooks/use-pharmacy.ts`
  - Implement usePrescriptions with filters
  - Handle loading, error, and success states
  - Add refetch functionality
  - _Requirements: 1.1, 1.3, 8.1, 8.2_

- [ ] 2.2 Create usePharmacyMetrics hook
  - Implement usePharmacyMetrics hook
  - Fetch metrics on mount
  - Handle loading and error states
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 2.3 Create useDrugUtilization hook
  - Implement useDrugUtilization hook
  - Fetch utilization data
  - Handle loading and error states
  - _Requirements: 4.1, 4.2_

- [ ] 3. Update pharmacy management page
  - Replace mock data with real API calls
  - Integrate custom hooks
  - Update UI with real data
  - _Requirements: 1.1, 4.1, 9.1_

- [ ] 3.1 Integrate pharmacy metrics
  - Update `hospital-management-system/app/pharmacy-management/page.tsx`
  - Import and use usePharmacyMetrics hook
  - Replace hardcoded metrics with real data
  - Show loading states
  - _Requirements: 9.1, 9.2, 10.2_

- [ ] 3.2 Integrate prescription trends
  - Import and use usePrescriptionTrends hook
  - Replace mock trend data with real data
  - Update chart with real prescription data
  - _Requirements: 4.1, 4.3_

- [ ] 3.3 Integrate drug utilization
  - Import and use useDrugUtilization hook
  - Replace mock utilization data
  - Update pie chart with real data
  - _Requirements: 4.1, 4.2, 4.4_

- [ ] 3.4 Integrate prescription list
  - Import and use usePrescriptions hook
  - Replace hardcoded prescriptions array
  - Display real prescription data
  - Add search functionality
  - _Requirements: 1.1, 1.2, 8.1, 8.3_

- [ ] 3.5 Add error handling
  - Display error messages for failed API calls
  - Add retry buttons
  - Show empty states when no data
  - _Requirements: 10.1, 10.3, 10.4_

- [ ] 4. Update prescriptions page
  - Replace mock data with real API calls
  - Add prescription management features
  - Implement fill and cancel functionality
  - _Requirements: 1.1, 2.1, 2.2, 2.3_

- [ ] 4.1 Integrate prescription list
  - Update `hospital-management-system/app/emr/prescriptions/page.tsx`
  - Import and use usePrescriptions hook
  - Replace mock prescriptions with real data
  - Display prescription details
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 4.2 Add prescription creation
  - Create prescription form modal
  - Implement form validation
  - Call createPrescription API
  - Refresh list after creation
  - _Requirements: 2.1, 2.4_

- [ ] 4.3 Add fill prescription functionality
  - Add "Fill" button to prescription cards
  - Create fill prescription modal
  - Call fillPrescription API
  - Update prescription status in UI
  - _Requirements: 2.2, 7.2_

- [ ] 4.4 Add cancel prescription functionality
  - Add "Cancel" button to prescription cards
  - Create cancellation confirmation dialog
  - Call cancelPrescription API
  - Update prescription status in UI
  - _Requirements: 2.3, 7.3_

- [ ] 5. Create backend pharmacy routes
  - Create new pharmacy routes file
  - Implement metrics endpoint
  - Implement analytics endpoints
  - _Requirements: 4.1, 9.1_

- [ ] 5.1 Create pharmacy routes file
  - Create `backend/src/routes/pharmacy.routes.ts`
  - Set up express router
  - Apply authentication middleware
  - Apply permission middleware
  - _Requirements: 6.1, 6.2_

- [ ] 5.2 Add metrics endpoint
  - Implement GET /api/pharmacy/metrics route
  - Require patients:read permission
  - Call pharmacy service method
  - Return metrics data
  - _Requirements: 9.1, 9.2_

- [ ] 5.3 Add analytics endpoints
  - Implement GET /api/pharmacy/analytics/utilization route
  - Implement GET /api/pharmacy/analytics/trends route
  - Require patients:read permission
  - Call pharmacy service methods
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 6. Create pharmacy service
  - Create PharmacyService class
  - Implement metrics calculation
  - Implement analytics methods
  - _Requirements: 4.1, 4.2, 9.1_

- [ ] 6.1 Create pharmacy service file
  - Create `backend/src/services/pharmacy.service.ts`
  - Create PharmacyService class
  - Set up database connection
  - _Requirements: 6.1, 6.2_

- [ ] 6.2 Implement getMetrics method
  - Query prescriptions for active count
  - Calculate prescriptions today
  - Calculate prescriptions this month
  - Return metrics object
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 6.3 Implement getDrugUtilization method
  - Query prescriptions by medication category
  - Calculate percentages
  - Return utilization data
  - _Requirements: 4.1, 4.2_

- [ ] 6.4 Implement getPrescriptionTrends method
  - Query prescriptions by month
  - Calculate filled vs pending
  - Return trend data
  - _Requirements: 4.1, 4.3, 4.4_

- [ ] 7. Enhance prescription service
  - Add fillPrescription method
  - Update prescription status logic
  - Add validation
  - _Requirements: 2.2, 7.2_

- [ ] 7.1 Add fillPrescription method
  - Update `backend/src/services/prescription.service.ts`
  - Implement fillPrescription method
  - Update prescription status to 'filled'
  - Record fill date and pharmacist
  - _Requirements: 2.2, 7.2_

- [ ] 7.2 Add prescription validation
  - Validate prescription is active before filling
  - Check prescription hasn't expired
  - Validate required fields
  - _Requirements: 2.4, 7.2_

- [ ] 8. Update prescription routes
  - Add fill prescription endpoint
  - Update existing routes
  - Add proper error handling
  - _Requirements: 2.2, 6.1_

- [ ] 8.1 Add fill prescription route
  - Update `backend/src/routes/prescriptions.routes.ts`
  - Add PUT /api/prescriptions/:id/fill route
  - Require patients:write permission
  - Call fillPrescription service method
  - _Requirements: 2.2, 7.2_

- [ ] 8.2 Update get prescriptions route
  - Add GET /api/prescriptions route (list all)
  - Support filtering by status, patient, date
  - Support pagination
  - Support search
  - _Requirements: 1.1, 8.1, 8.2_

- [ ] 9. Create database migrations
  - Create pharmacy inventory table
  - Create medication catalog table
  - Add indexes
  - _Requirements: 3.1, 3.2_

- [ ] 9.1 Create pharmacy inventory migration
  - Create migration file for pharmacy_inventory table
  - Define table schema with all fields
  - Add foreign key constraints
  - Add indexes for performance
  - _Requirements: 3.1, 3.2_

- [ ] 9.2 Create medication catalog migration
  - Create migration file for medication_catalog table
  - Define table schema
  - Add unique constraints
  - Add indexes
  - _Requirements: 3.1_

- [ ] 10. Implement multi-tenant isolation
  - Ensure all queries use tenant context
  - Test cross-tenant access prevention
  - Verify data isolation
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 10.1 Verify tenant context in all queries
  - Review all pharmacy service methods
  - Ensure SET search_path is called
  - Verify X-Tenant-ID header is used
  - _Requirements: 6.1, 6.2_

- [ ] 10.2 Test cross-tenant isolation
  - Create test prescriptions for multiple hospitals
  - Verify each hospital sees only their data
  - Test API returns 403 for cross-tenant access
  - _Requirements: 6.3, 6.4_

- [ ] 11. Add search and filtering
  - Implement prescription search
  - Add status filters
  - Add date range filters
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 11.1 Implement backend search
  - Update prescription service to support search
  - Search by medication name, patient name, prescription number
  - Use ILIKE for case-insensitive search
  - _Requirements: 8.1, 8.3_

- [ ] 11.2 Implement frontend search
  - Add search input to pharmacy pages
  - Debounce search input
  - Update usePrescriptions hook with search param
  - Display search results
  - _Requirements: 8.1, 8.3_

- [ ] 11.3 Add status filters
  - Add status filter dropdown
  - Support multiple status selection
  - Update API calls with status filter
  - _Requirements: 8.2, 8.5_

- [ ] 12. Add loading states and skeletons
  - Create skeleton components
  - Add loading spinners
  - Implement optimistic updates
  - _Requirements: 10.2, 10.4_

- [ ] 12.1 Create skeleton components
  - Create PrescriptionListSkeleton component
  - Create MetricsCardSkeleton component
  - Create ChartSkeleton component
  - _Requirements: 10.2_

- [ ] 12.2 Add loading states to pages
  - Show skeleton while loading prescriptions
  - Show spinner while filling prescription
  - Show loading indicator for metrics
  - _Requirements: 10.2, 10.4_

- [ ] 13. Implement error handling
  - Add error boundaries
  - Display user-friendly error messages
  - Add retry functionality
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 13.1 Create error handling utility
  - Create `hospital-management-system/lib/error-handler.ts`
  - Implement handlePharmacyError function
  - Map error codes to user messages
  - _Requirements: 10.1, 10.2_

- [ ] 13.2 Add error boundaries
  - Wrap pharmacy pages with error boundary
  - Display fallback UI on error
  - Add "Try Again" button
  - _Requirements: 10.1, 10.5_

- [ ] 13.3 Add toast notifications
  - Install toast library if not present
  - Show success toasts for actions
  - Show error toasts for failures
  - _Requirements: 10.1, 10.2_

- [ ] 14. Add patient prescription history view
  - Create patient prescription history component
  - Integrate with patient details page
  - Display prescription timeline
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 14.1 Create prescription history component
  - Create component to display patient prescriptions
  - Show prescriptions in chronological order
  - Display medication details and status
  - _Requirements: 5.1, 5.2_

- [ ] 14.2 Integrate with patient page
  - Add prescription history tab to patient details
  - Call getPrescriptionsByPatient API
  - Display prescription history
  - _Requirements: 5.1, 5.2, 5.5_

- [ ] 14.3 Add drug interaction warnings
  - Check for potential interactions
  - Display warnings prominently
  - Highlight conflicting medications
  - _Requirements: 5.3, 5.4_

- [ ] 15. Write unit tests
  - Test pharmacy API client
  - Test custom hooks
  - Test pharmacy service
  - _Requirements: All_

- [ ] 15.1 Test pharmacy API client
  - Test getPrescriptions returns correct data
  - Test fillPrescription updates status
  - Test error handling
  - Mock axios responses

- [ ] 15.2 Test custom hooks
  - Test usePrescriptions fetches data
  - Test usePharmacyMetrics handles loading
  - Test error states
  - Mock API calls

- [ ] 15.3 Test pharmacy service
  - Test getMetrics calculates correctly
  - Test getDrugUtilization returns data
  - Test getPrescriptionTrends
  - Mock database queries

- [ ] 16. Write integration tests
  - Test prescription management flow
  - Test multi-tenant isolation
  - Test search and filtering
  - _Requirements: All_

- [ ] 16.1 Test prescription flow
  - Create prescription via API
  - Fill prescription
  - Verify status updated
  - Cancel prescription

- [ ] 16.2 Test multi-tenant isolation
  - Create prescriptions for multiple hospitals
  - Verify each sees only their data
  - Test cross-tenant access blocked

- [ ] 16.3 Test search and filtering
  - Test search by medication name
  - Test status filtering
  - Test date range filtering
  - Verify results are correct

- [ ] 17. Perform end-to-end testing
  - Test complete pharmacy workflow
  - Test with different user roles
  - Verify all features work
  - _Requirements: All_

- [ ] 17.1 Test pharmacist workflow
  - Login as pharmacist
  - View prescription list
  - Fill a prescription
  - Verify status updated

- [ ] 17.2 Test doctor workflow
  - Login as doctor
  - Create prescription for patient
  - Verify prescription appears in pharmacy
  - Check patient can view prescription

- [ ] 17.3 Test analytics and reporting
  - View pharmacy metrics
  - Check drug utilization chart
  - Verify prescription trends
  - Export reports

- [ ] 18. Update documentation
  - Document API endpoints
  - Create user guide
  - Update developer documentation
  - _Requirements: All_

- [ ] 18.1 Document API endpoints
  - Document all pharmacy endpoints
  - Provide request/response examples
  - Document error codes
  - Include authentication requirements

- [ ] 18.2 Create user guide
  - Document how to manage prescriptions
  - Explain fill and cancel workflow
  - Document search and filtering
  - Include screenshots

- [ ] 18.3 Update developer documentation
  - Document pharmacy service architecture
  - Explain multi-tenant isolation
  - Document data models
  - Provide code examples

- [ ] 19. Deploy and validate
  - Deploy to staging
  - Perform user acceptance testing
  - Deploy to production
  - Monitor for issues
  - _Requirements: All_

- [ ] 19.1 Deploy to staging
  - Build frontend application
  - Deploy backend changes
  - Run database migrations
  - Test in staging environment

- [ ] 19.2 User acceptance testing
  - Have pharmacists test features
  - Collect feedback
  - Fix any issues found
  - Verify all requirements met

- [ ] 19.3 Deploy to production
  - Deploy frontend changes
  - Deploy backend changes
  - Monitor for errors
  - Verify all features work correctly
