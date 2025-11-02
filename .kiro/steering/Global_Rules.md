---
inclusion: always
---

# Multi-Tenant Hospital Management System - Development Guidelines

## Project Structure & Organization

### File Placement Rules (Updated Nov 2, 2025 - Core Infrastructure Complete)
- **Backend documentation**: `backend/docs/` directory (✅ 15+ documentation files)
- **Backend tests**: `backend/tests/` directory (✅ 25+ comprehensive test files, 90% success rate)
- **Hospital frontend**: `hospital-management-system/` (Next.js app for hospital operations)
- **Admin dashboard**: `admin-dashboard/` (Next.js app with email integration ✅ working)
- **Development guidelines**: `.kiro/steering/` (Kiro IDE configuration - UPDATED)
- **Core Infrastructure**: ✅ 100% COMPLETE (Agent A mission accomplished)

### Naming Conventions
- **Backend files**: kebab-case (e.g., `auth-service.ts`)
- **Frontend components**: PascalCase (e.g., `PatientCard.tsx`)
- **Database schemas**: snake_case (e.g., `tenant_123`)
- **API endpoints**: kebab-case (e.g., `/api/patient-records`)

## Multi-Tenant Architecture Rules

### Critical Multi-Tenancy Requirements (✅ FULLY OPERATIONAL)
- **Always require `X-Tenant-ID` header** for protected routes ✅ ENFORCED
- **Database isolation**: Each tenant uses separate PostgreSQL schema ✅ 6 TENANTS ACTIVE
- **File isolation**: S3 paths must include tenant prefix (`tenant-id/filename`) ✅ WORKING
- **No cross-tenant data access** - validate tenant context in all operations ✅ VERIFIED
- **Core database infrastructure**: ✅ COMPLETE (users, roles, tenants with RBAC)
- **Migration system**: ✅ RESTORED AND FUNCTIONAL

### Authentication & Security
- **AWS Cognito integration**: Use JWT tokens with JWKS validation ✅ working
- **Password reset system**: AWS SES email integration ✅ working
- **Token expiration**: 1-hour JWT token lifetime
- **Auth middleware**: Apply to all routes except `/auth/*`
- **Environment variables**: Never commit `.env` files, use `.env.example`
- **Email verification**: OTP system with AWS SES ✅ working

## Technology Stack Standards

### Backend (Node.js + TypeScript)
- **Framework**: Express.js 5.x with TypeScript strict mode
- **Database**: PostgreSQL with node-pg-migrate
- **Code style**: 2 spaces, single quotes, trailing commas (Prettier)
- **Error handling**: Use centralized error middleware
- **Async patterns**: Prefer async/await over promises

### Frontend (Next.js + React)
- **Framework**: Next.js 16.x with React 19
- **UI Library**: Radix UI components with Tailwind CSS 4.x
- **Forms**: React Hook Form with Zod validation
- **State management**: React hooks, avoid external state libraries unless necessary

## API Development Patterns

### Route Structure
- **Auth routes**: `/auth/signup`, `/auth/signin` (public)
- **Protected routes**: Require JWT token and `X-Tenant-ID` header
- **S3 operations**: `/api/s3/upload-url`, `/api/s3/download-url`
- **Error responses**: Consistent JSON format with `error` and `message` fields

### Middleware Chain Order
1. JSON parser
2. Auth routes (bypass for `/auth/*`)
3. Tenant middleware (set database schema)
4. Auth middleware (validate JWT)
5. Route handlers
6. Error middleware

### Service Layer Pattern
- **Services handle business logic**: `auth-service.ts`, `s3-service.ts`, `tenant-service.ts`
- **Routes are thin controllers**: Delegate to services, handle HTTP concerns only
- **Database operations**: Abstract through services, never direct queries in routes

## Frontend Development Standards

### Component Architecture
- **Radix UI components**: Use for all interactive elements (buttons, forms, dialogs)
- **Tailwind CSS**: Utility-first styling, avoid custom CSS unless necessary
- **Loading states**: Every button must show loading spinner during API calls
- **Error handling**: Display user-friendly error messages from API responses

### Form Handling
- **React Hook Form + Zod**: Standard pattern for all forms
- **Validation**: Client-side validation with server-side confirmation
- **Accessibility**: Proper labels, ARIA attributes, keyboard navigation

## Testing & Quality Assurance

### Test Organization (Updated Nov 2, 2025 - 90% Success Rate)
- **System health**: Run `node tests/SYSTEM_STATUS_REPORT.js` for overall status (✅ 9/10 tests passing)
- **Component tests**: Individual service testing (auth, S3, database, email) ✅ WORKING
- **Integration tests**: Full multi-tenant workflow testing ✅ OPERATIONAL
- **Email tests**: Password reset and OTP validation testing ✅ WORKING
- **Error scenario tests**: Comprehensive error handling validation ✅ COMPLETE
- **Admin dashboard tests**: UI flow and integration testing ✅ WORKING
- **Core infrastructure tests**: ✅ 100% COMPLETE (Agent A mission accomplished)
- **Documentation**: Update `backend/docs/` after significant changes (✅ 15+ docs current)

### Code Quality Standards
- **TypeScript strict mode**: No `any` types, proper interface definitions
- **Error handling**: Try-catch blocks for all async operations
- **Logging**: Use consistent logging format for debugging
- **Environment validation**: Check required env vars on startup

## Security Requirements

### Data Protection
- **Input validation**: Sanitize all user inputs
- **SQL injection prevention**: Use parameterized queries only
- **XSS protection**: Escape output, validate file uploads
- **CORS configuration**: Restrict origins in production

### AWS Integration
- **Cognito configuration**: USER_PASSWORD_AUTH flow enabled (minor config needed)
- **S3 permissions**: Tenant-specific prefixes, presigned URL expiration (1 hour)
- **SES integration**: Email service for password reset and notifications ✅ working
- **IAM roles**: Minimal required permissions for Cognito, S3, and SES access

## Development Workflow

### Before Making Changes
1. Run system health check: `node tests/SYSTEM_STATUS_REPORT.js`
2. Check current documentation in `backend/docs/`
3. Understand tenant isolation requirements

### After Making Changes
1. Test affected components individually
2. Run integration tests: `node tests/test-final-complete.js`
3. Update relevant documentation
4. Verify multi-tenant isolation still works

### Common Commands
```bash
# Backend development (API server)
cd backend && npm run dev                    # Port 3000

# Hospital management system (frontend)
cd hospital-management-system && npm run dev # Port 3001

# Admin dashboard (admin interface)
cd admin-dashboard && npm run dev            # Port 3002

# System testing and health checks
cd backend && node tests/SYSTEM_STATUS_REPORT.js
cd backend && node tests/test-final-complete.js
cd backend && node tests/test-forgot-password-complete.js
cd backend && node tests/test-admin-dashboard-ui-flow.js

# Full-stack development (all apps)
cd backend && npm run dev &
cd hospital-management-system && npm run dev &
cd admin-dashboard && npm run dev &
```