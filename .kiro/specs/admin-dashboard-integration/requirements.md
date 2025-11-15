# Admin Dashboard Integration - Requirements

## Introduction

This specification defines the integration requirements for the Admin Dashboard application to replace mock/hardcoded data with real backend API data. The system will ensure secure multi-tenant management, proper authentication, and role-based access control for system administrators.

## Glossary

- **System**: The Admin Dashboard application for system administration
- **Backend API**: The Node.js/Express backend server providing admin services
- **Frontend Application**: The Next.js admin dashboard application
- **Admin User**: A system administrator with elevated privileges
- **Tenant**: A hospital organization managed by the system
- **Multi-Tenant Management**: Administrative oversight of all tenant organizations
- **System Analytics**: Real-time monitoring and reporting of system-wide metrics

## Requirements

### Requirement 1: Dashboard Overview Integration

**User Story:** As a system administrator, I want to view real-time system statistics on the dashboard, so that I can monitor overall system health and usage.

#### Acceptance Criteria

1. WHEN the dashboard loads, THE System SHALL fetch real system statistics from GET /api/analytics/stats endpoint
2. WHEN displaying metrics, THE System SHALL show total_tenants, total_users, total_patients, and api_calls_today
3. WHEN displaying growth trends, THE System SHALL fetch historical data from GET /api/analytics/trends endpoint
4. WHEN displaying storage distribution, THE System SHALL fetch storage metrics from GET /api/analytics/storage endpoint
5. WHERE WebSocket is available, THE System SHALL establish real-time connection for live updates

### Requirement 2: Tenant Management Integration

**User Story:** As a system administrator, I want to manage all hospital tenants from a central interface, so that I can oversee all organizations using the system.

#### Acceptance Criteria

1. WHEN the tenant list page loads, THE System SHALL fetch all tenants from GET /api/tenants endpoint
2. WHEN displaying tenant cards, THE System SHALL show name, email, status, subscription_tier, user_count, and patient_count
3. WHEN searching tenants, THE System SHALL filter results client-side based on name, email, or ID
4. WHEN clicking a tenant, THE System SHALL navigate to GET /tenants/:id page with detailed information
5. WHERE tenant creation is needed, THE System SHALL call POST /api/tenants with tenant data

### Requirement 3: User Management Integration

**User Story:** As a system administrator, I want to manage users across all tenants, so that I can control access and permissions system-wide.

#### Acceptance Criteria

1. WHEN the users page loads, THE System SHALL fetch users from GET /api/users endpoint with pagination
2. WHEN displaying users, THE System SHALL show name, email, tenant, role, status, and join_date
3. WHEN searching users, THE System SHALL send search query to backend via q parameter
4. WHEN creating a user, THE System SHALL call POST /api/users with user data
5. WHEN updating a user, THE System SHALL call PUT /api/users/:id with updated data
6. WHEN deleting a user, THE System SHALL call DELETE /api/users/:id after confirmation
7. WHERE filtering is applied, THE System SHALL send filter parameters to backend

### Requirement 4: Analytics Dashboard Integration

**User Story:** As a system administrator, I want to view real-time analytics and usage statistics, so that I can understand system performance and tenant activity.

#### Acceptance Criteria

1. WHEN the analytics page loads, THE System SHALL fetch system stats from GET /api/analytics/stats endpoint
2. WHEN displaying tenant usage, THE System SHALL fetch data from GET /api/analytics/tenants-usage endpoint
3. WHEN displaying recent events, THE System SHALL fetch data from GET /api/analytics/events endpoint
4. WHERE WebSocket is enabled, THE System SHALL connect to ws://backend/ws for real-time updates
5. WHERE WebSocket is unavailable, THE System SHALL poll endpoints every 30 seconds for updates

### Requirement 5: Secure Admin Authentication

**User Story:** As a system administrator, I want secure authentication with admin-only access, so that only authorized personnel can access the admin dashboard.

#### Acceptance Criteria

1. WHEN accessing admin pages, THE System SHALL verify user has admin role via JWT token
2. WHEN making API requests, THE System SHALL include Authorization header with JWT token
3. WHEN making API requests, THE System SHALL include X-App-ID header with "admin-dashboard" value
4. WHEN making API requests, THE System SHALL include X-API-Key header with admin API key
5. IF authentication fails, THEN THE System SHALL redirect user to /auth/signin page
6. IF user lacks admin role, THEN THE System SHALL redirect to /unauthorized page

### Requirement 6: Multi-Tenant Data Access

**User Story:** As a system administrator, I want to view data across all tenants, so that I can manage the entire system from one interface.

#### Acceptance Criteria

1. WHEN fetching tenant data, THE System SHALL use X-Tenant-ID header with "admin" value
2. WHEN backend processes admin requests, THE System SHALL allow access to all tenant data
3. WHEN displaying tenant-specific data, THE System SHALL clearly indicate which tenant the data belongs to
4. WHEN switching between tenant views, THE System SHALL update context appropriately
5. WHERE cross-tenant queries are needed, THE System SHALL use admin-level API endpoints

### Requirement 7: Real-Time Updates

**User Story:** As a system administrator, I want to see real-time updates of system events, so that I can respond quickly to issues.

#### Acceptance Criteria

1. WHEN WebSocket is enabled, THE System SHALL connect to backend WebSocket server
2. WHEN new events occur, THE System SHALL receive real-time notifications via WebSocket
3. WHEN WebSocket connection drops, THE System SHALL attempt to reconnect automatically
4. WHERE WebSocket is unavailable, THE System SHALL fall back to polling every 30 seconds
5. WHEN displaying connection status, THE System SHALL show "Live", "Connecting...", or "Polling Mode"

### Requirement 8: Tenant Detail View Integration

**User Story:** As a system administrator, I want to view detailed information about a specific tenant, so that I can understand their usage and configuration.

#### Acceptance Criteria

1. WHEN viewing tenant details, THE System SHALL fetch tenant data from GET /api/tenants endpoint
2. WHEN displaying subscription info, THE System SHALL fetch data from GET /api/subscriptions/tenant/:id endpoint
3. WHEN displaying usage metrics, THE System SHALL fetch data from GET /api/usage/tenant/:id/current endpoint
4. WHEN displaying users, THE System SHALL fetch tenant users from GET /api/users?tenant_id=:id endpoint
5. WHERE data is unavailable, THE System SHALL display appropriate fallback messages

### Requirement 9: Storage Management Integration

**User Story:** As a system administrator, I want to monitor storage usage across all tenants, so that I can manage system capacity.

#### Acceptance Criteria

1. WHEN the storage page loads, THE System SHALL fetch storage metrics from GET /api/analytics/storage endpoint
2. WHEN displaying tenant storage, THE System SHALL show storage_used_gb and storage_limit_gb per tenant
3. WHEN displaying system storage, THE System SHALL show total storage used and available
4. WHEN storage limits are exceeded, THE System SHALL highlight tenants with warnings
5. WHERE storage cleanup is needed, THE System SHALL provide tools to manage storage

### Requirement 10: Error Handling and User Feedback

**User Story:** As a system administrator, I want clear error messages and loading states, so that I understand what's happening in the system.

#### Acceptance Criteria

1. WHEN API requests fail, THE System SHALL display user-friendly error messages
2. WHEN loading data, THE System SHALL show loading spinners or skeleton screens
3. WHEN data is empty, THE System SHALL show empty state messages with helpful guidance
4. WHEN network errors occur, THE System SHALL show "Connection failed" with retry option
5. WHERE validation errors occur, THE System SHALL highlight problematic fields with error messages
