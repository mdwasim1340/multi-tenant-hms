# Requirements Document - Application Access Control

## Introduction

This feature implements application-level authorization to control which users can access which applications (Admin Dashboard, Hospital Management System, etc.) in the multi-tenant hospital management system. Currently, any authenticated user can access any application, which poses a security risk. This feature will restrict access based on user roles and permissions.

## Glossary

- **System**: The multi-tenant hospital management system
- **User**: An authenticated person with credentials in AWS Cognito
- **Application**: A frontend application (Admin Dashboard, Hospital Management System, Mobile App, etc.)
- **Application Access**: Permission for a user to access a specific application
- **Global Admin**: A user with access to the Admin Dashboard and all tenants
- **Hospital User**: A user with access only to the Hospital Management System for their assigned tenant
- **Access Token**: JWT token returned after successful authentication
- **Application ID**: Unique identifier for each application (admin-dashboard, hospital-management, mobile-app)

## Requirements

### Requirement 1: Application Access Control

**User Story:** As a system administrator, I want to control which applications users can access, so that users only see applications relevant to their role.

#### Acceptance Criteria

1. WHEN a User authenticates, THE System SHALL return a list of applications the User is authorized to access
2. WHEN a User attempts to access an Application, THE System SHALL verify the User has permission to access that Application
3. IF a User attempts to access an unauthorized Application, THEN THE System SHALL redirect the User to an access denied page
4. THE System SHALL store application access permissions in the database linked to user roles
5. THE System SHALL validate application access on every protected route in each Application

### Requirement 2: Role-Based Application Access

**User Story:** As a system administrator, I want to assign application access based on user roles, so that I can manage permissions efficiently.

#### Acceptance Criteria

1. THE System SHALL define application access permissions for each role in the database
2. WHEN a User has role "Global Admin", THE System SHALL grant access to the Admin Dashboard
3. WHEN a User has role "Hospital Admin", THE System SHALL grant access to the Hospital Management System for their tenant
4. WHEN a User has role "Doctor" or "Nurse", THE System SHALL grant access only to the Hospital Management System
5. THE System SHALL allow multiple application access assignments per user through role combinations

### Requirement 3: Authentication Response Enhancement

**User Story:** As a developer, I want the authentication response to include application access information, so that the frontend can enforce access control.

#### Acceptance Criteria

1. WHEN authentication succeeds, THE System SHALL include an "allowed_applications" array in the response
2. THE System SHALL include the user's primary role in the authentication response
3. THE System SHALL include the user's tenant_id in the authentication response
4. THE System SHALL include application-specific permissions in the authentication response
5. THE System SHALL return application access information in a format that frontend applications can easily consume

### Requirement 4: Frontend Access Validation

**User Story:** As a user, I want to be automatically redirected if I access an unauthorized application, so that I don't see confusing error messages.

#### Acceptance Criteria

1. WHEN a User loads an Application, THE System SHALL check if the User has access to that Application
2. IF the User lacks access to the Application, THEN THE System SHALL redirect to an access denied page
3. THE System SHALL display which applications the User can access on the access denied page
4. THE System SHALL provide a logout option on the access denied page
5. THE System SHALL validate application access before rendering any protected routes

### Requirement 5: Database Schema for Application Access

**User Story:** As a system administrator, I want application access stored in the database, so that I can manage permissions centrally.

#### Acceptance Criteria

1. THE System SHALL create an "application_access" table to store user-application permissions
2. THE System SHALL link application access to user roles through a "role_applications" table
3. THE System SHALL support multiple applications per user through role assignments
4. THE System SHALL allow administrators to grant or revoke application access
5. THE System SHALL maintain an audit log of application access changes

### Requirement 6: Admin Dashboard Exclusive Access

**User Story:** As a global administrator, I want the Admin Dashboard to be accessible only to authorized administrators, so that sensitive system configuration is protected.

#### Acceptance Criteria

1. THE System SHALL restrict Admin Dashboard access to users with "Global Admin" or "System Admin" roles
2. WHEN a non-admin User attempts to access the Admin Dashboard, THE System SHALL deny access
3. THE System SHALL redirect unauthorized users to the Hospital Management System or access denied page
4. THE System SHALL log all Admin Dashboard access attempts for security auditing
5. THE System SHALL display a clear message explaining why access was denied

### Requirement 7: Hospital System Tenant-Scoped Access

**User Story:** As a hospital staff member, I want to access only my hospital's data in the Hospital Management System, so that I cannot see other hospitals' information.

#### Acceptance Criteria

1. WHEN a Hospital User logs in, THE System SHALL grant access only to the Hospital Management System
2. THE System SHALL automatically set the tenant context to the User's assigned tenant
3. THE System SHALL prevent the User from switching to other tenants
4. THE System SHALL validate tenant context matches the User's assigned tenant on every API request
5. IF tenant context does not match, THEN THE System SHALL return a 403 Forbidden error

### Requirement 8: Application Access Management API

**User Story:** As a system administrator, I want API endpoints to manage application access, so that I can control permissions programmatically.

#### Acceptance Criteria

1. THE System SHALL provide an API endpoint to list all applications
2. THE System SHALL provide an API endpoint to get a user's application access
3. THE System SHALL provide an API endpoint to grant application access to a user
4. THE System SHALL provide an API endpoint to revoke application access from a user
5. THE System SHALL require Global Admin role to access application management endpoints

### Requirement 9: Graceful Access Denial

**User Story:** As a user, I want clear information when I'm denied access to an application, so that I understand what I can access instead.

#### Acceptance Criteria

1. WHEN access is denied, THE System SHALL display a user-friendly access denied page
2. THE System SHALL list the applications the User is authorized to access
3. THE System SHALL provide direct links to authorized applications
4. THE System SHALL display the User's role and tenant information
5. THE System SHALL provide a logout button and support contact information

### Requirement 10: Security Audit Logging

**User Story:** As a security administrator, I want all application access attempts logged, so that I can monitor for unauthorized access attempts.

#### Acceptance Criteria

1. THE System SHALL log every successful application access with timestamp, user, and application
2. THE System SHALL log every denied application access attempt with reason
3. THE System SHALL store access logs in the database for at least 90 days
4. THE System SHALL provide an API endpoint to query access logs
5. THE System SHALL alert administrators when multiple access denial attempts occur for the same user
