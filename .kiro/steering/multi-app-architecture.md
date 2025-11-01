# Multi-Application Architecture Guidelines

## 🏥 Application Overview

This project implements a **multi-tenant hospital management system** with three interconnected applications:

### 1. Backend API (`backend/`)
- **Technology**: Node.js + TypeScript + Express.js
- **Purpose**: Multi-tenant API server with authentication and file management
- **Port**: 3000 (development)
- **Key Features**:
  - AWS Cognito authentication with JWT validation
  - Multi-tenant PostgreSQL with schema isolation
  - AWS S3 file management with presigned URLs
  - Comprehensive test suite in `backend/tests/`
  - Documentation in `backend/docs/`

### 2. Hospital Management System (`hospital-management-system/`)
- **Technology**: Next.js 16 + React 19 + Tailwind CSS
- **Purpose**: Frontend interface for hospital operations
- **Port**: 3001 (development)
- **Key Features**:
  - Patient management and medical records
  - Appointment scheduling and staff workflows
  - Responsive design with Radix UI components
  - Real-time data integration with backend API

### 3. Admin Dashboard (`admin-dashboard/`)
- **Technology**: Next.js 16 + React 19 + Tailwind CSS
- **Purpose**: System administration and tenant management
- **Port**: 3002 (development)
- **Key Features**:
  - Multi-tenant management and configuration
  - User management across all tenants
  - System analytics and monitoring
  - Administrative controls and settings

## 🔄 Inter-Application Communication

### API Communication Flow
```
Admin Dashboard (3002) ──┐
                         ├──► Backend API (3000) ──► PostgreSQL + AWS Services
Hospital System (3001) ──┘
```

### Authentication Flow
1. **User Login**: Both frontends authenticate via backend `/auth/signin`
2. **JWT Tokens**: Backend returns JWT tokens for API access
3. **Tenant Context**: All requests include `X-Tenant-ID` header
4. **Protected Routes**: Backend validates tokens and tenant access

### File Management Flow
1. **Upload Request**: Frontend requests presigned URL from backend
2. **S3 Integration**: Backend generates tenant-specific S3 URLs
3. **Direct Upload**: Frontend uploads directly to S3 using presigned URL
4. **Tenant Isolation**: Files stored with `tenant-id/filename` prefix

## 🏗️ Development Workflow

### Starting All Applications
```bash
# Terminal 1: Backend API
cd backend
npm run dev  # Port 3000

# Terminal 2: Hospital System
cd hospital-management-system
npm run dev  # Port 3001

# Terminal 3: Admin Dashboard
cd admin-dashboard
npm run dev  # Port 3002
```

### Application-Specific Development
```bash
# Backend only (API development)
cd backend && npm run dev

# Frontend only (hospital features)
cd hospital-management-system && npm run dev

# Admin only (system administration)
cd admin-dashboard && npm run dev
```

### Testing Workflow
```bash
# Backend comprehensive testing
cd backend
node tests/SYSTEM_STATUS_REPORT.js    # System health check
node tests/test-final-complete.js     # Full integration test
npm run test                          # Unit tests (if available)

# Frontend build testing
cd hospital-management-system && npm run build
cd admin-dashboard && npm run build
```

## 🔐 Security Architecture

### Multi-Tenant Security
- **Database Isolation**: Each tenant uses separate PostgreSQL schema
- **File Isolation**: S3 files prefixed with tenant ID
- **API Security**: JWT tokens with tenant validation
- **Cross-Tenant Prevention**: Middleware prevents data leakage

### Authentication Security
- **AWS Cognito**: Centralized user management
- **JWT Validation**: JWKS-based token verification
- **Token Expiration**: 1-hour token lifetime
- **Protected Routes**: All non-auth endpoints require valid tokens

## 📊 Current System Status

### ✅ Fully Operational Components
- **Backend API**: 100% functional with comprehensive testing
- **Authentication System**: AWS Cognito integration working
- **S3 File Management**: Presigned URLs with tenant isolation
- **Multi-Tenant Architecture**: Complete schema isolation
- **Database Operations**: PostgreSQL with proper migrations
- **Security Middleware**: JWT and tenant validation

### 🚀 Production Readiness
- **Backend**: Production-ready with full test coverage
- **Frontend Applications**: Ready for hospital and admin workflows
- **AWS Integration**: Cognito and S3 properly configured
- **Documentation**: Comprehensive docs in `backend/docs/`
- **Testing**: Extensive test suite in `backend/tests/`

## 🎯 Development Guidelines

### Code Organization
- **Backend**: Service layer pattern with middleware chain
- **Frontend**: Component-based architecture with Radix UI
- **Shared**: Consistent TypeScript types and interfaces
- **Testing**: Comprehensive backend testing, frontend build validation

### Branch Strategy
- **Application-specific branches**: `feature/backend/`, `feature/frontend/`, `feature/admin/`
- **Full-stack features**: `feature/fullstack/` for cross-application changes
- **Personal development**: `user/name/app/feature` for individual work

### Environment Configuration
- **Development**: All apps run locally with shared backend
- **Production**: Independent deployment with shared API
- **Testing**: Comprehensive backend testing with frontend build checks

This architecture ensures scalable, secure, and maintainable multi-tenant hospital management system with clear separation of concerns and comprehensive testing coverage.