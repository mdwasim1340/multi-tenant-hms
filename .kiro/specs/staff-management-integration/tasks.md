# Staff Management Integration - Implementation Tasks

## Overview

This implementation plan converts the Staff Management frontend from mock data to real backend integration with secure multi-tenant isolation. The plan builds on existing infrastructure (users table, roles system, authentication middleware) and focuses on connecting the frontend to backend APIs.

## Task Breakdown

### Phase 1: Backend API Enhancement

- [ ] 1. Enhance Staff API Endpoints
  - Create dedicated staff routes at `/api/staff` (alias for `/api/users` with staff-specific logic)
  - Add tenant filtering to all staff queries
  - Implement role-based filtering (Doctor, Nurse, etc.)
  - Add status filtering (active, inactive, on_leave)
  - Implement search functionality (name, email, employee ID)
  - Add pagination support with proper metadata
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 1.1 Create Staff Service Layer
  - Create `backend/src/services/staffService.ts`
  - Implement `getStaffList()` with multi-tenant filtering
  - Implement `getStaffMember()` with cross-tenant protection
  - Implement `getStaffStatistics()` for dashboard metrics
  - Add role distribution calculation
  - Add on-duty status calculation
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3_

- [ ] 1.2 Implement Staff Statistics Endpoint
  - Create `GET /api/staff/stats` endpoint
  - Calculate total staff count per tenant
  - Calculate active/inactive counts
  - Calculate on-duty count (status = 'active')
  - Calculate role distribution
  - Return response within 500ms performance requirement
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 1.3 Add Multi-Tenant Security Middleware
  - Verify X-Tenant-ID header presence
  - Validate tenant exists and is active
  - Filter all queries by tenant_id
  - Log cross-tenant access attempts
  - Return appropriate error codes (MISSING_TENANT_ID, INVALID_TENANT_ID, CROSS_TENANT_ACCESS_DENIED)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 1.4 Implement Permission-Based Access Control
  - Add `requirePermission('users', 'read')` middleware for GET endpoints
  - Add `requirePermission('users', 'write')` middleware for POST/PUT endpoints
  - Add `requirePermission('users', 'admin')` middleware for DELETE endpoints
  - Return 403 with INSUFFICIENT_PERMISSIONS code when unauthorized
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 1.5 Add Performance Optimizations
  - Implement indexed queries on tenant_id, email, status
  - Add pagination with page/limit parameters
  - Return pagination metadata (total, pages, current page)
  - Optimize JOIN queries for role data
  - Ensure <200ms response time for queries under 1000 records
  - _Requirements: 7.1, 7.2, 7.4, 7.5_

- [ ] 1.6 Implement Error Handling
  - Use consistent error format (error, code, message, timestamp)
  - Handle missing tenant ID (400, MISSING_TENANT_ID)
  - Handle invalid tenant ID (404, INVALID_TENANT_ID)
  - Handle cross-tenant access (403, CROSS_TENANT_ACCESS_DENIED)
  - Handle user not found (404, USER_NOT_FOUND)
  - Handle insufficient permissions (403, INSUFFICIENT_PERMISSIONS)
  - _Requirements: 8.1, 8.2_

### Phase 2: Frontend API Integration

- [ ] 2. Create Frontend API Client
  - Create `hospital-management-system/lib/api/staff.ts`
  - Configure axios instance with base URL
  - Add request interceptor for auth headers (Authorization, X-Tenant-ID, X-App-ID, X-API-Key)
  - Add response interceptor for error handling
  - Implement retry logic for network errors
  - _Requirements: 5.4, 5.5, 8.3_

- [ ] 2.1 Create Custom React Hooks
  - Create `hospital-management-system/hooks/useStaff.ts` for staff list
  - Create `hospital-management-system/hooks/useStaffMember.ts` for single staff
  - Create `hospital-management-system/hooks/useStaffStats.ts` for statistics
  - Create `hospital-management-system/hooks/useStaffMutations.ts` for create/update/delete
  - Implement loading states
  - Implement error states
  - Implement caching with React Query
  - _Requirements: 1.2, 1.3, 3.1, 3.3, 4.1, 4.4, 7.3, 8.2, 8.3_

- [ ] 2.2 Create TypeScript Interfaces
  - Create `hospital-management-system/types/staff.ts`
  - Define StaffMember interface matching backend response
  - Define StaffStats interface for statistics
  - Define StaffFilters interface for filtering
  - Define ApiError interface for error handling
  - Ensure type safety across components
  - _Requirements: 1.2, 3.3, 4.4_

- [ ] 2.3 Update Staff List Page
  - Replace mock data in `app/staff/page.tsx` with `useStaff()` hook
  - Implement loading states with skeleton screens
  - Implement error states with retry button
  - Implement empty states with appropriate messaging
  - Add role filter dropdown
  - Add status filter dropdown
  - Add search input with debouncing
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 8.2, 8.3, 8.4_

- [ ] 2.4 Update Staff Statistics Cards
  - Replace hardcoded numbers with `useStaffStats()` hook
  - Display total staff count
  - Display on-duty count
  - Display burnout risk count (placeholder for future)
  - Display certifications due count (placeholder for future)
  - Add loading states for statistics
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 8.5_

- [ ] 2.5 Implement Staff Details View
  - Create staff details component/page
  - Fetch staff member data with `useStaffMember(id)`
  - Display profile information
  - Display role assignments
  - Display contact information
  - Display join date and last login
  - Handle cross-tenant access errors
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 2.6 Add Permission-Based UI Controls
  - Check user permissions on page load
  - Hide "Add Staff Member" button if user lacks users:write permission
  - Disable edit buttons if user lacks users:write permission
  - Hide delete buttons if user lacks users:admin permission
  - Show permission denied messages when appropriate
  - _Requirements: 6.1, 6.5_

### Phase 3: Real-Time Updates & Polish

- [ ] 3. Implement Real-Time Data Synchronization
  - Add polling mechanism with 30-second interval
  - Implement change detection using timestamps
  - Auto-refresh staff list when changes detected
  - Show update notifications to users
  - Implement optimistic updates for mutations
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 3.1 Add Staff Creation Form
  - Create staff creation modal/page
  - Implement form validation (name, email, role required)
  - Check for duplicate emails within tenant
  - Hash passwords using bcrypt
  - Assign role on creation
  - Show success/error messages
  - _Requirements: 10.1, 10.2, 10.4_

- [ ] 3.2 Add Staff Update Form
  - Create staff edit modal/page
  - Pre-populate form with existing data
  - Verify staff belongs to current tenant
  - Update timestamp on save
  - Show success/error messages
  - _Requirements: 10.3, 10.5_

- [ ] 3.3 Implement Error Handling UI
  - Create error boundary component
  - Display user-friendly error messages
  - Show retry button for network errors
  - Show maintenance message for 503 errors
  - Log errors for debugging
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

### Phase 4: Testing & Security Validation

- [ ] 4. Backend Testing
  - Write unit tests for staffService functions
  - Test multi-tenant isolation (staff from different tenants)
  - Test role filtering
  - Test status filtering
  - Test search functionality
  - Test pagination
  - Test permission checks
  - Test error scenarios
  - _Requirements: All requirements_

- [ ] 4.1 Frontend Testing
  - Write unit tests for custom hooks
  - Test loading states
  - Test error states
  - Test empty states
  - Test filtering functionality
  - Test search functionality
  - Test permission-based UI controls
  - _Requirements: All requirements_

- [ ] 4.2 Integration Testing
  - Test complete frontend-backend flow
  - Test with multiple tenants
  - Test cross-tenant access prevention
  - Test permission enforcement
  - Test real-time updates
  - Test error handling
  - _Requirements: All requirements_

- [ ] 4.3 Security Audit
  - Verify multi-tenant isolation
  - Test cross-tenant access attempts
  - Verify permission enforcement
  - Test SQL injection prevention
  - Test XSS prevention
  - Verify password hashing
  - Test rate limiting (if implemented)
  - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4_

- [ ] 4.4 Performance Testing
  - Test with 100+ staff members
  - Test with 1000+ staff members
  - Verify <200ms response time
  - Verify <500ms statistics calculation
  - Test pagination performance
  - Test search performance
  - _Requirements: 7.1, 7.2, 7.4, 7.5_

### Phase 5: Documentation & Deployment

- [ ] 5. Update Documentation
  - Document API endpoints in backend/docs/
  - Document frontend components
  - Document custom hooks usage
  - Document error codes
  - Document security considerations
  - Create user guide for staff management
  - _Requirements: All requirements_

- [ ] 5.1 Deployment Preparation
  - Review all code changes
  - Run all tests
  - Perform security audit
  - Update environment variables
  - Create deployment checklist
  - _Requirements: All requirements_

- [ ] 5.2 Deployment & Monitoring
  - Deploy backend changes
  - Deploy frontend changes
  - Monitor error logs
  - Monitor performance metrics
  - Gather user feedback
  - Fix any issues found
  - _Requirements: All requirements_

## Implementation Notes

### Key Security Considerations

1. **Multi-Tenant Isolation**: Every query MUST filter by tenant_id from X-Tenant-ID header
2. **Permission Checks**: All endpoints MUST verify user has required permissions
3. **Cross-Tenant Protection**: Prevent users from accessing staff from other tenants
4. **Input Validation**: Validate all inputs to prevent SQL injection and XSS
5. **Password Security**: Always hash passwords with bcrypt, never return hashes in responses

### Performance Requirements

1. **Response Time**: <200ms for queries under 1000 records
2. **Statistics**: <500ms for statistics calculation
3. **Pagination**: Support large datasets with efficient pagination
4. **Caching**: Implement frontend caching with 30-second stale time
5. **Indexes**: Use existing indexes on tenant_id, email, status

### Error Handling Standards

All API errors must follow this format:
```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "timestamp": "2025-11-14T10:00:00Z"
}
```

Error codes:
- `MISSING_TENANT_ID` (400)
- `INVALID_TENANT_ID` (404)
- `MISSING_AUTH_TOKEN` (401)
- `INVALID_AUTH_TOKEN` (401)
- `INSUFFICIENT_PERMISSIONS` (403)
- `CROSS_TENANT_ACCESS_DENIED` (403)
- `USER_NOT_FOUND` (404)
- `DUPLICATE_EMAIL` (409)
- `VALIDATION_ERROR` (400)
- `INTERNAL_SERVER_ERROR` (500)

### Testing Strategy

1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test complete API flows
3. **Security Tests**: Test multi-tenant isolation and permissions
4. **Performance Tests**: Test with large datasets
5. **E2E Tests**: Test complete user workflows

### Rollback Plan

If issues arise:
1. **Backend Rollback**: Revert to previous version, frontend continues with mock data
2. **Frontend Rollback**: Revert to mock data, backend remains functional
3. **No Data Loss**: No schema changes required, existing data intact

## Success Criteria

- [ ] All staff data comes from backend API
- [ ] Multi-tenant isolation verified (no cross-tenant access)
- [ ] Permission-based access control working
- [ ] Loading, error, and empty states implemented
- [ ] Search and filtering functional
- [ ] Statistics display real data
- [ ] Performance requirements met (<200ms, <500ms)
- [ ] All tests passing
- [ ] Security audit passed
- [ ] User feedback positive

## Estimated Timeline

- **Phase 1 (Backend)**: 2-3 days
- **Phase 2 (Frontend)**: 3-4 days
- **Phase 3 (Polish)**: 2-3 days
- **Phase 4 (Testing)**: 2-3 days
- **Phase 5 (Deployment)**: 1-2 days

**Total**: 10-15 days

## Dependencies

- ✅ Users table exists with tenant_id
- ✅ Roles and user_roles tables exist
- ✅ Authentication middleware functional
- ✅ Authorization middleware functional
- ✅ Multi-tenant middleware functional
- ✅ Frontend authentication working
- ✅ API client infrastructure ready

## Next Steps

1. Review this implementation plan
2. Start with Phase 1, Task 1 (Backend API Enhancement)
3. Test each task before moving to the next
4. Coordinate frontend and backend development
5. Perform thorough testing before deployment
