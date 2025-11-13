# Product Overview

This is a **Multi-Tenant Hospital Management System** with AWS Cognito authentication, designed to support multiple hospital tenants with complete data isolation. The system is **FULLY OPERATIONAL** and production-ready.

## Core Features

- **Schema-based Multi-Tenancy**: Each tenant gets isolated PostgreSQL schemas ✅ WORKING
- **AWS Cognito Authentication**: JWT token validation with JWKS ✅ WORKING
- **Application-Level Authorization**: Role-based application access control ✅ WORKING
- **S3 File Management**: Tenant-specific file storage with presigned URLs ✅ WORKING
- **Hospital Management Frontend**: Next.js application with Radix UI components ✅ WORKING
- **Admin Dashboard**: Multi-tenant administration interface ✅ WORKING
- **Email Integration**: AWS SES for password reset and notifications ✅ WORKING
- **Custom Fields System**: Dynamic field creation with conditional logic ✅ WORKING
- **Analytics Dashboard**: Real-time monitoring with polling fallback ✅ WORKING
- **Backup System**: Cross-platform S3 backup with compression ✅ WORKING
- **Subscription Management**: Tier-based restrictions and usage tracking ✅ WORKING
- **Role Management**: 8 roles with granular permissions (20 permissions) ✅ WORKING

## System Status (Last Updated: November 13, 2025)

🎉 **PHASE 1 COMPLETE** - Core infrastructure is production-ready with complete feature set
✅ **APPLICATION AUTHORIZATION COMPLETE** - Role-based application access control implemented
🚀 **PHASE 2 IN PROGRESS** - Hospital operations implementation with 250+ AI-agent-ready tasks

## 🚨 ANTI-DUPLICATION GUIDELINES

### Before Creating New Features
1. **Search existing components**: Use `find . -name "*feature-name*" -type f`
2. **Check for legacy implementations**: Review cleanup summaries in `backend/docs/`
3. **Remove old versions**: Clean up legacy code before implementing new features
4. **Document changes**: Update cleanup summaries when removing old code

### Current Clean Architecture (Post-Cleanup)
- **Tenant Management**: Single modern system in `/components/tenants/` (legacy removed)
- **Subscription System**: Integrated billing and usage tracking
- **No Duplicates**: 739 lines of legacy tenant code removed (Nov 4, 2025)

### ✅ Authentication & Authorization System
- User registration via `/auth/signup` - ✅ WORKING (Cognito connected)
- User sign-in via `/auth/signin` with JWT tokens - ✅ WORKING (USER_PASSWORD_AUTH enabled)
- Password reset via `/auth/forgot-password` - ✅ WORKING
- Email verification and OTP system - ✅ WORKING
- Complete user management with roles - ✅ WORKING (multiple tenants, 8 roles)
- Token validation middleware - ✅ WORKING
- Multi-tenant user isolation - ✅ WORKING
- **Application-level authorization** - ✅ WORKING (role-based app access)
- **Permission system** - ✅ WORKING (20 granular permissions)
- **Role management API** - ✅ WORKING (6 endpoints)
- **Frontend access guards** - ✅ WORKING (both applications)
- **Signin returns permissions** - ✅ WORKING (roles, permissions, accessible apps)

### ✅ S3 File Operations
- Upload URL generation with tenant isolation - WORKING
- Download URL generation - WORKING
- Presigned URLs with 1-hour expiration - WORKING
- File paths: `tenant-id/filename` format - WORKING

### ✅ Multi-Tenant Architecture
- Database schema isolation per tenant - ✅ WORKING (multiple active tenants)
- Tenant context via X-Tenant-ID header - ✅ WORKING
- Complete data separation - ✅ WORKING (verified isolation)
- Security middleware protection - ✅ WORKING
- Core database infrastructure - ✅ COMPLETE (users, roles, tenants, custom fields)
- Migration system - ✅ RESTORED & FUNCTIONAL
- Subscription management - ✅ WORKING (tier-based restrictions)
- Usage tracking - ✅ WORKING (analytics and monitoring)

### ✅ Email Integration (AWS SES)
- Password reset emails via AWS SES - WORKING
- Email verification system - WORKING
- Admin dashboard email integration - WORKING
- Proper error handling for SES sandbox mode - WORKING

### ✅ Frontend Applications (Phase 1)
- Hospital Management System (Next.js) - ✅ WORKING (81 routes - shell ready)
- Admin Dashboard with email integration - ✅ WORKING (21 routes - complete)
- Multi-tenant user interface - ✅ WORKING
- Responsive design with Radix UI - ✅ WORKING
- Custom Fields UI - ✅ WORKING (complete field management)
- Analytics Dashboard - ✅ WORKING (real-time monitoring)
- Direct backend communication - ✅ WORKING (no API proxies)
- **Application access guards** - ✅ WORKING (role-based access control)
- **Unauthorized pages** - ✅ WORKING (clear error messages)

### ✅ Application-Level Authorization (NEW - Nov 13, 2025)
- **Database Schema**: 3 new tables (permissions, role_permissions, applications)
- **20 Permissions**: Granular access control for all resources
- **8 Roles**: Admin, Hospital Admin, Doctor, Nurse, Receptionist, Manager, Lab Tech, Pharmacist
- **2 Applications**: Admin Dashboard (admin-only), Hospital System (staff-only)
- **Role Management API**: 6 endpoints for managing user roles
- **Frontend Guards**: Both apps check permissions before allowing access
- **Signin Enhancement**: Returns roles, permissions, and accessible applications
- **Access Control Matrix**: Clear definition of who can access what

**Access Control**:
- **Admin** → ✅ Admin Dashboard + ✅ Hospital System (all permissions)
- **Hospital Admin** → ❌ Admin Dashboard + ✅ Hospital System (16 permissions)
- **Doctor** → ❌ Admin Dashboard + ✅ Hospital System (8 permissions)
- **Nurse** → ❌ Admin Dashboard + ✅ Hospital System (5 permissions)
- **Receptionist** → ❌ Admin Dashboard + ✅ Hospital System (6 permissions)
- **Manager** → ❌ Admin Dashboard + ✅ Hospital System (4 permissions)
- **Lab Technician** → ❌ Admin Dashboard + ✅ Hospital System (3 permissions)
- **Pharmacist** → ❌ Admin Dashboard + ✅ Hospital System (3 permissions)

### 🚀 Phase 2: Hospital Operations (In Progress)
- **Patient Management**: Database schema, API endpoints, Frontend UI (Team A & B, Week 1)
- **Appointment Management**: Scheduling system, Calendar UI (Team A & B, Week 2)
- **Medical Records**: Clinical documentation, Diagnosis tracking (Team A & B, Week 3)
- **Lab Tests**: Laboratory orders, Results management (Team A, Week 4)
- **RBAC System**: Role-based permissions, Audit logging (Team C, Week 1-2)
- **Analytics**: Advanced reporting, Usage tracking (Team C, Week 2-3)
- **Notifications**: Email/SMS alerts, In-app notifications (Team C, Week 3)
- **Search**: Full-text search, Advanced filtering (Team C, Week 4)
- **Testing**: E2E, Performance, Security, UAT (Team D, Weeks 1-4)

## Architecture

The system implements a middleware-based Express.js backend with:
- Tenant isolation through database schema separation
- JWT-based authentication using AWS Cognito
- S3 integration for secure file storage
- RESTful API design with comprehensive error handling

## Key Business Rules

- All API requests (except auth endpoints) require tenant context via `X-Tenant-ID` header
- Each tenant operates in complete isolation - no cross-tenant data access
- File uploads are automatically prefixed with tenant ID for isolation
- User authentication is handled through AWS Cognito user pools
- JWT tokens expire after 1 hour for security
- Presigned URLs expire after 1 hour to prevent unauthorized access

## Testing & Documentation

### Phase 1 Testing (Complete)
- **Documentation**: Located in `backend/docs/` directory with comprehensive reports
- **Test Scripts**: Located in `backend/tests/` directory with 25+ test files
- **System Health**: Run `node tests/SYSTEM_STATUS_REPORT.js` for current status (90% success rate)
- **Complete Tests**: Run `node tests/test-final-complete.js` for full system test
- **Email Testing**: Comprehensive forgot password and OTP validation tests
- **Error Scenario Testing**: Complete error handling validation
- **Admin Dashboard Testing**: UI flow and integration tests

### Phase 2 Implementation (In Progress)
- **Task Structure**: 250+ AI-agent-ready tasks (1-3 hours each)
- **Master Index**: `implementation-plans/phase-2/DAILY_TASK_BREAKDOWN.md`
- **Team Organization**: 4 teams (Backend, Frontend, Advanced, Testing)
- **Daily Breakdown**: Tasks organized by day with clear dependencies
- **Verification**: Built-in success checks for each task
- **Documentation**: Complete code examples and step-by-step instructions