# Core Architecture & Technology Stack

**Consolidates**: product.md, structure.md, tech.md, multi-app-architecture.md

## System Overview

Multi-Tenant Hospital Management System with AWS Cognito authentication, designed for complete data isolation between hospital tenants.

### Core Features (All Production Ready ✅)
- Schema-based Multi-Tenancy (6 active tenants)
- AWS Cognito Authentication (JWT validation)
- Application-Level Authorization (8 roles, 20 permissions)
- S3 File Management (presigned URLs, tenant isolation)
- Email Integration (AWS SES)
- Custom Fields System (conditional logic)
- Analytics Dashboard (real-time monitoring)
- Backup System (S3 with compression)

### Current Status (Nov 26, 2025)
- **Phase 1**: ✅ Production Ready
- **Phase 2**: 🔄 In Progress
  - Patient Management: ✅ Complete (32 fields, CSV export, 12+ filters)
  - Appointment Management: 🔄 In Progress (Team Alpha, Week 2)
  - Medical Records: 📋 Planned (Team Alpha, Week 3)

## Technology Stack

### Backend
- **Runtime**: Node.js + TypeScript (strict mode)
- **Framework**: Express.js 5.x
- **Database**: PostgreSQL (schema-based multi-tenancy)
- **Auth**: AWS Cognito (JWT + JWKS validation)
- **Storage**: AWS S3 (presigned URLs, 1-hour expiration)
- **Email**: AWS SES (password reset, notifications)
- **Migrations**: node-pg-migrate
- **Testing**: 25+ comprehensive test files

### Frontend
- **Framework**: Next.js 16.x + React 19
- **UI**: Radix UI components + Tailwind CSS 4.x
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **State**: React hooks + custom field management
- **Real-time**: WebSocket ready (polling fallback)

### Development Tools
- TypeScript strict mode
- ESLint + Prettier (2 spaces, single quotes)
- ts-node-dev (auto-restart)

## Project Structure

```
├── backend/                    # API Server (Port 3000) ✅ PRODUCTION READY
│   ├── src/
│   │   ├── middleware/         # Auth, tenant, error handling
│   │   ├── routes/             # API endpoints
│   │   ├── services/           # Business logic
│   │   ├── types/              # TypeScript definitions
│   │   └── index.ts            # Main entry point
│   ├── tests/                  # 25+ test files (90% success rate)
│   ├── migrations/             # Database migrations (restored & functional)
│   └── docs/                   # 15+ documentation files
│
├── hospital-management-system/ # Hospital UI (Port 3001) ✅ 81 ROUTES
│   ├── app/                    # Next.js App Router
│   │   ├── patients/           # Patient management ✅
│   │   ├── appointments/       # Appointment scheduling 🔄
│   │   ├── bed-management/     # Bed management
│   │   └── records/            # Medical records 📋
│   ├── components/             # React components (Radix UI)
│   ├── hooks/                  # Custom React hooks
│   └── lib/                    # API clients, utilities
│
├── admin-dashboard/            # Admin UI (Port 3002) ✅ 21 ROUTES
│   ├── app/                    # Admin pages
│   │   ├── tenants/            # Tenant management
│   │   ├── users/              # User management
│   │   ├── analytics/          # System analytics
│   │   └── settings/           # System settings
│   ├── components/             # Admin components
│   └── lib/                    # Admin utilities
│
└── .kiro/steering/             # AI Agent Guidelines (6 files)
```

## Architecture Patterns

### Middleware Chain (Backend)
1. JSON Parser → Parse request bodies
2. Auth Routes → Public `/auth/*` endpoints
3. Tenant Middleware → Set database schema context
4. Auth Middleware → Validate JWT tokens
5. Route Handlers → Business logic
6. Error Middleware → Global error handling

### Service Layer Pattern
- Services handle business logic (auth, S3, tenant)
- Routes are thin controllers
- Database operations abstracted through services

### Multi-Tenant Database Design
- Each tenant = separate PostgreSQL schema
- Tenant middleware sets `search_path` based on `X-Tenant-ID`
- Migrations create tables in all tenant schemas

### Application Communication Flow
```
Admin Dashboard (3002) ──┐
                         ├──► Backend API (3000) ──► PostgreSQL + AWS
Hospital System (3001) ──┘
```

## File Naming Conventions
- **Backend**: kebab-case files, camelCase variables
- **Frontend**: kebab-case components, camelCase utilities
- **Types**: PascalCase interfaces/types
- **Constants**: UPPER_SNAKE_CASE environment variables

## Common Commands

### Development
```bash
# Backend
cd backend && npm run dev

# Hospital System
cd hospital-management-system && npm run dev

# Admin Dashboard
cd admin-dashboard && npm run dev

# All at once (3 terminals)
cd backend && npm run dev &
cd hospital-management-system && npm run dev &
cd admin-dashboard && npm run dev &
```

### Testing
```bash
# System health check
cd backend && node tests/SYSTEM_STATUS_REPORT.js

# Full integration test
node tests/test-final-complete.js

# Specific component tests
node tests/test-s3-direct.js
node tests/test-cognito-direct.js
node tests/test-forgot-password-complete.js
```

### Database
```bash
# Setup
node setup-local.js

# Docker
docker-compose up          # Full stack
docker-compose up postgres # Database only
```

### Build
```bash
# Backend
cd backend && npm run build

# Frontend
cd hospital-management-system && npm run build
cd admin-dashboard && npm run build
```

## Key Business Rules

1. **Multi-Tenant Isolation**: All API requests (except `/auth/*`) require `X-Tenant-ID` header
2. **Complete Data Separation**: No cross-tenant data access allowed
3. **File Isolation**: S3 uploads prefixed with `tenant-id/filename`
4. **Authentication**: AWS Cognito user pools with JWT tokens
5. **Token Expiration**: JWT tokens expire after 1 hour
6. **Presigned URLs**: S3 URLs expire after 1 hour
7. **Application Access**: Role-based application access control enforced

## Database Tables

### Global (Public Schema)
- `tenants` - Tenant information
- `tenant_subscriptions` - Subscription management
- `subscription_tiers` - Tier definitions
- `usage_tracking` - Usage analytics
- `custom_fields` - Field definitions
- `users` - Admin users (6 active)
- `roles` - 8 hospital roles
- `user_roles` - Role assignments
- `permissions` - 20 granular permissions
- `role_permissions` - Role-permission mappings
- `applications` - Application registry

### Tenant-Specific (Per Tenant Schema)
- `patients` - Patient records (32 fields)
- `appointments` - Appointment scheduling
- `medical_records` - Clinical documentation
- `custom_field_values` - Custom field data
- `prescriptions` - Medication management
- `lab_tests` - Laboratory results
- `billing` - Financial transactions

## Performance Optimizations
- Strategic database indexes on foreign keys
- Connection pooling for PostgreSQL
- Presigned URLs for direct S3 access
- Intelligent-Tiering for S3 storage
- Compression for backups
- Polling fallback for real-time features

## Security Architecture
- JWT validation with JWKS
- App-level authentication (X-App-ID, X-API-Key)
- Tenant context validation
- Parameterized queries (SQL injection prevention)
- CORS configuration
- Rate limiting (planned)

---

**For detailed security rules**: See `multi-tenant-security.md`  
**For API patterns**: See `api-integration.md`  
**For development rules**: See `development-rules.md`
