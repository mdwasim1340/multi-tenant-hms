# Implementation Plan

- [ ] 1. Remove system admin pages and routes
  - Delete all `/admin/*` page files
  - Remove admin route configurations
  - Add 404 redirects for admin paths
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 1.1 Delete admin page directory
  - Delete `hospital-management-system/app/admin/` directory and all subdirectories
  - Remove user-management, access-controls, system-settings pages
  - Remove audit-logs, database, maintenance pages
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 1.2 Add 404 redirect for admin routes
  - Create middleware to redirect `/admin/*` paths to 404
  - Add error message explaining feature not available
  - Test redirect works for all admin paths
  - _Requirements: 1.4, 1.5_

- [ ] 2. Refactor sidebar component
  - Remove admin menu items
  - Update navigation structure
  - Test sidebar renders correctly
  - _Requirements: 1.1, 1.2, 1.3, 10.1, 10.2_

- [ ] 2.1 Remove adminMenuItems array
  - Delete `adminMenuItems` array from sidebar.tsx
  - Remove all system admin menu item definitions
  - Remove Shield icon import if not used elsewhere
  - _Requirements: 1.1, 1.2_

- [ ] 2.2 Remove Admin Functions section
  - Remove "Admin Functions" section from navigation rendering
  - Remove admin section toggle logic
  - Remove admin section expansion state
  - _Requirements: 1.2, 1.3, 10.1_

- [ ] 2.3 Clean up sidebar code
  - Remove unused admin-related variables
  - Remove `isAdminActive` check
  - Simplify navigation rendering logic
  - _Requirements: 10.2, 10.3_

- [ ] 2.4 Test sidebar navigation
  - Verify all hospital menu items render correctly
  - Verify no admin menu items appear
  - Test sidebar expand/collapse works
  - Test submenu navigation works
  - _Requirements: 10.1, 10.2, 10.4_

- [ ] 3. Update dashboard page
  - Focus on hospital-specific metrics
  - Remove system-wide statistics
  - Add hospital context display
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2_

- [ ] 3.1 Create hospital metrics interface
  - Define HospitalDashboardMetrics TypeScript interface
  - Include patient, appointment, bed, staff metrics
  - Include financial and department metrics
  - _Requirements: 3.1, 3.2_

- [ ] 3.2 Update dashboard API calls
  - Change API calls to fetch hospital-specific data
  - Remove any system-wide metric calls
  - Ensure tenant context is included in all requests
  - _Requirements: 2.1, 2.2, 2.5_

- [ ] 3.3 Update dashboard UI
  - Display hospital name prominently
  - Show only hospital-specific metrics
  - Update charts to show hospital data only
  - Add hospital context indicators
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 3.4 Add hospital alerts section
  - Display hospital-specific alerts
  - Show bed shortages, pending tasks
  - Show department-level notifications
  - _Requirements: 3.4, 3.5_

- [ ] 4. Refactor settings page
  - Rename to Hospital Settings
  - Focus on hospital configuration
  - Remove system-level settings
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 4.1 Update settings page title and description
  - Change title from "System Settings" to "Hospital Settings"
  - Update description to clarify hospital-level scope
  - Add hospital name to page header
  - _Requirements: 6.1, 6.5_

- [ ] 4.2 Create hospital configuration sections
  - Add Hospital Profile section (name, address, contact)
  - Add Operating Hours section
  - Add Department Configuration section
  - Add Appointment Settings section
  - _Requirements: 6.2, 6.3_

- [ ] 4.3 Add billing and notification settings
  - Add Billing & Payment Settings section
  - Add Notification Preferences section
  - Add Branding Settings section (logo, colors)
  - _Requirements: 6.2, 6.4_

- [ ] 4.4 Remove system-level settings
  - Remove database configuration options
  - Remove system maintenance settings
  - Remove multi-tenant settings
  - Remove infrastructure settings
  - _Requirements: 6.5_

- [ ] 4.5 Implement settings save functionality
  - Create API endpoint for hospital settings
  - Implement save button with loading state
  - Show success/error messages
  - _Requirements: 6.2, 6.3_

- [ ] 5. Update staff management page
  - Clarify hospital-level scope
  - Show only hospital staff
  - Update role options
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 5.1 Add scope clarification
  - Add subtitle: "Manage staff within your hospital"
  - Add hospital name to page header
  - Add help text explaining scope
  - _Requirements: 4.1, 4.5_

- [ ] 5.2 Update staff list API call
  - Ensure API call includes current tenant ID
  - Filter to show only hospital staff
  - Remove any cross-tenant user queries
  - _Requirements: 4.1, 4.2_

- [ ] 5.3 Update role options
  - Show only hospital-level roles
  - Remove system admin role option
  - Keep: Doctor, Nurse, Receptionist, Lab Tech, Pharmacist, Manager, Hospital Admin
  - _Requirements: 4.3, 4.4_

- [ ] 5.4 Remove system-level features
  - Remove ability to manage users across tenants
  - Remove system-level role assignments
  - Remove infrastructure permissions
  - _Requirements: 4.4, 4.5_

- [ ] 6. Add hospital context to top bar
  - Display hospital name
  - Show user role
  - Add hospital indicator
  - _Requirements: 2.3, 2.4, 2.5_

- [ ] 6.1 Update top bar component
  - Add hospital name display
  - Add hospital icon (Building2)
  - Show "Hospital Admin" role label
  - _Requirements: 2.3, 2.4_

- [ ] 6.2 Fetch hospital information
  - Get hospital name from tenant data
  - Get user role from auth context
  - Display in top bar
  - _Requirements: 2.3, 2.5_

- [ ] 7. Update API client configuration
  - Ensure automatic tenant context
  - Remove system-wide API calls
  - Add hospital-level filtering
  - _Requirements: 2.1, 2.2, 2.5, 5.1, 5.2_

- [ ] 7.1 Update API interceptor
  - Ensure X-Tenant-ID header always includes current hospital
  - Remove any logic for switching tenants
  - Add hospital context to all requests
  - _Requirements: 5.1, 5.2_

- [ ] 7.2 Remove system-wide API calls
  - Remove GET /api/users (all tenants)
  - Remove GET /api/tenants (all tenants)
  - Remove GET /api/analytics/system
  - _Requirements: 2.1, 2.2_

- [ ] 7.3 Update API calls to hospital-specific
  - Change to GET /api/users?tenant_id={current_tenant}
  - Change to GET /api/analytics/hospital
  - Ensure all calls filtered by current tenant
  - _Requirements: 2.1, 2.2, 2.5_

- [ ] 8. Add department management feature
  - Create department management page
  - Allow CRUD operations for departments
  - Show department metrics
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 8.1 Create department management page
  - Create `hospital-management-system/app/departments/page.tsx`
  - Add to navigation under Hospital Administration
  - Design department list UI
  - _Requirements: 5.1_

- [ ] 8.2 Implement department CRUD
  - Add create department form
  - Add edit department functionality
  - Add delete department with confirmation
  - _Requirements: 5.2, 5.3_

- [ ] 8.3 Display department metrics
  - Show patient count per department
  - Show bed occupancy per department
  - Show staff assigned to department
  - _Requirements: 5.4, 5.5_

- [ ] 9. Update analytics pages
  - Focus on hospital-specific data
  - Remove system-wide comparisons
  - Add hospital context
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 9.1 Update analytics dashboard
  - Show only hospital-specific metrics
  - Remove multi-tenant comparisons
  - Add hospital name to page header
  - _Requirements: 7.1, 7.2_

- [ ] 9.2 Update analytics API calls
  - Change to hospital-specific endpoints
  - Ensure tenant context in all requests
  - Remove system-wide analytics calls
  - _Requirements: 7.1, 7.2, 7.5_

- [ ] 9.3 Update analytics charts
  - Show hospital historical data
  - Compare against hospital's own trends
  - Remove cross-tenant comparisons
  - _Requirements: 7.3, 7.5_

- [ ] 9.4 Update report generation
  - Generate reports for hospital only
  - Include only hospital-specific data
  - Add hospital branding to reports
  - _Requirements: 7.4_

- [ ] 10. Implement backend hospital context middleware
  - Enforce hospital-level access
  - Prevent cross-tenant access
  - Add security checks
  - _Requirements: 2.5, 5.1, 5.2, 5.3, 5.4_

- [ ] 10.1 Create hospital context middleware
  - Create `backend/src/middleware/hospital-context.ts`
  - Verify user's tenant matches request tenant
  - Return 403 if mismatch
  - _Requirements: 5.2, 5.3_

- [ ] 10.2 Apply middleware to hospital routes
  - Apply to all hospital management routes
  - Ensure single-tenant access only
  - Test cross-tenant access is blocked
  - _Requirements: 5.2, 5.3, 5.4_

- [ ] 10.3 Add hospital-level permission checks
  - Verify user has hospital admin role
  - Check hospital-level permissions
  - Remove system-level permission checks
  - _Requirements: 2.5, 5.4_

- [ ] 11. Update billing pages
  - Focus on hospital-level billing
  - Remove system-wide financial data
  - Add hospital context
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 11.1 Update billing dashboard
  - Show only hospital revenue and expenses
  - Remove multi-tenant financial data
  - Add hospital name to page header
  - _Requirements: 9.1, 9.2_

- [ ] 11.2 Update invoice management
  - Show only hospital invoices
  - Generate invoices for hospital services
  - Ensure tenant context in all billing calls
  - _Requirements: 9.2, 9.3_

- [ ] 11.3 Update financial reports
  - Generate reports for hospital only
  - Show revenue by department
  - Show hospital operational expenses
  - _Requirements: 9.4, 9.5_

- [ ] 12. Add contextual help and documentation
  - Add help text clarifying scope
  - Update user documentation
  - Add tooltips for features
  - _Requirements: 10.3, 10.4, 10.5_

- [ ] 12.1 Add help text to pages
  - Add scope clarification to staff management
  - Add help text to settings page
  - Add tooltips explaining hospital-level features
  - _Requirements: 10.3, 10.4_

- [ ] 12.2 Create user documentation
  - Document hospital admin features
  - Explain difference from system admin
  - Provide usage examples
  - _Requirements: 10.4, 10.5_

- [ ] 12.3 Add in-app help system
  - Add help icon to pages
  - Show contextual help on hover
  - Link to documentation
  - _Requirements: 10.5_

- [ ] 13. Update navigation breadcrumbs
  - Show hospital context in breadcrumbs
  - Update navigation paths
  - Remove admin paths
  - _Requirements: 10.4, 10.5_

- [ ] 13.1 Update breadcrumb component
  - Add hospital name to breadcrumbs
  - Show hospital-context navigation
  - Remove admin breadcrumb paths
  - _Requirements: 10.4, 10.5_

- [ ] 13.2 Test breadcrumb navigation
  - Verify breadcrumbs show correct paths
  - Test navigation works correctly
  - Verify no admin paths appear
  - _Requirements: 10.4_

- [ ] 14. Write unit tests
  - Test sidebar component
  - Test dashboard component
  - Test settings component
  - Test API client
  - _Requirements: All_

- [ ] 14.1 Test sidebar component
  - Test admin menu items not rendered
  - Test hospital menu items rendered
  - Test navigation links correct
  - Mock navigation state

- [ ] 14.2 Test dashboard component
  - Test only hospital metrics displayed
  - Test no system-wide metrics shown
  - Test hospital context displayed
  - Mock API responses

- [ ] 14.3 Test settings component
  - Test hospital settings displayed
  - Test system settings not shown
  - Test save functionality works
  - Mock API calls

- [ ] 14.4 Test API client
  - Test tenant context always included
  - Test no system-wide calls made
  - Test hospital filtering works
  - Mock axios requests

- [ ] 15. Write integration tests
  - Test navigation flow
  - Test API integration
  - Test data isolation
  - _Requirements: All_

- [ ] 15.1 Test navigation flow
  - Verify `/admin/*` routes return 404
  - Verify hospital routes accessible
  - Verify tenant context maintained
  - Test complete navigation flow

- [ ] 15.2 Test API integration
  - Verify all API calls include tenant ID
  - Verify no cross-tenant data access
  - Verify hospital-level filtering works
  - Test error handling

- [ ] 15.3 Test data isolation
  - Create test data for multiple hospitals
  - Verify each hospital sees only their data
  - Test cross-tenant access blocked
  - Verify security middleware works

- [ ] 16. Perform end-to-end testing
  - Test hospital admin workflow
  - Test all features work correctly
  - Verify no system admin features accessible
  - _Requirements: All_

- [ ] 16.1 Test hospital admin login
  - Login as hospital admin
  - Verify dashboard loads with hospital data
  - Verify sidebar shows hospital features only
  - Verify no admin features visible

- [ ] 16.2 Test hospital operations
  - Test patient management works
  - Test appointment scheduling works
  - Test staff management works
  - Test billing works
  - Verify all data is hospital-specific

- [ ] 16.3 Test security and access control
  - Verify cannot access `/admin/*` routes
  - Verify cannot access other hospital's data
  - Test permission checks work
  - Verify hospital context enforced

- [ ] 17. Update documentation
  - Update user documentation
  - Update developer documentation
  - Create migration guide
  - _Requirements: All_

- [ ] 17.1 Update user documentation
  - Document hospital admin features
  - Explain scope and limitations
  - Provide usage examples
  - Include screenshots

- [ ] 17.2 Update developer documentation
  - Document architecture changes
  - Explain hospital context handling
  - Document API patterns
  - Provide code examples

- [ ] 17.3 Create migration guide
  - Document what was removed
  - Explain why changes were made
  - Provide before/after comparisons
  - Guide users to Admin Dashboard for system features

- [ ] 18. Deploy and validate
  - Deploy changes to staging
  - Perform user acceptance testing
  - Deploy to production
  - Monitor for issues
  - _Requirements: All_

- [ ] 18.1 Deploy to staging
  - Build application
  - Deploy to staging environment
  - Verify environment variables correct
  - Test in staging

- [ ] 18.2 User acceptance testing
  - Have hospital admins test features
  - Collect feedback
  - Fix any issues found
  - Verify all requirements met

- [ ] 18.3 Deploy to production
  - Deploy frontend changes
  - Deploy backend changes
  - Monitor for errors
  - Verify all features work correctly
