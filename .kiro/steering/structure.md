# Project Structure

## Root Directory Layout
```
├── backend/                    # Node.js + TypeScript API server (✅ PRODUCTION READY)
│   ├── src/                   # TypeScript source code
│   ├── docs/                  # Documentation and analysis files (15+ docs)
│   ├── tests/                 # Test scripts and utilities (25+ test files)
│   ├── migrations/            # Database migration files (restored & functional)
│   ├── dist/                  # Compiled JavaScript output
│   └── node_modules/          # Backend dependencies
├── hospital-management-system/ # Next.js frontend for hospital operations (✅ 81 ROUTES - SHELL READY)
│   ├── app/                   # Next.js App Router pages (Phase 2: adding patient/appointment/records)
│   ├── components/            # Reusable React components (including custom fields)
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility functions
│   └── public/                # Static assets
├── admin-dashboard/           # Next.js admin interface (✅ 21 ROUTES - COMPLETE)
│   ├── app/                   # Admin pages and layouts (custom fields, analytics)
│   ├── components/            # Admin-specific components
│   ├── hooks/                 # Admin utility hooks
│   ├── lib/                   # Admin utility functions
│   └── public/                # Admin static assets
├── implementation-plans/      # Phase 2 implementation tasks (250+ AI-agent-ready tasks)
│   ├── phase-2/              # Hospital operations implementation
│   │   ├── DAILY_TASK_BREAKDOWN.md  # Master task index
│   │   ├── team-a-backend/   # Backend API tasks (patients, appointments, records)
│   │   ├── team-b-frontend/  # Frontend UI tasks (forms, calendar, dashboards)
│   │   ├── team-c-advanced/  # Advanced features (RBAC, analytics, notifications)
│   │   └── team-d-testing/   # Testing tasks (E2E, performance, security)
│   └── misc/                 # Phase summaries and progress tracking
└── .kiro/                     # Kiro IDE configuration
    └── steering/              # Development guidelines (UPDATED NOV 2025)
```

## Backend Structure (`backend/`) - ✅ PRODUCTION READY + LEGACY CLEANUP COMPLETE

### 🚨 Anti-Duplication Rules for Backend
- **Before creating new services**: Check existing services in `/src/services/`
- **Before adding routes**: Verify no duplicate endpoints in `/src/routes/`
- **Before database changes**: Check current schema with verification scripts
- **Document all removals**: Update cleanup summaries in `/docs/`
```
backend/
├── src/                    # TypeScript source code (✅ COMPLETE)
│   ├── middleware/         # Express middleware (auth, tenant, error) ✅ WORKING
│   ├── routes/             # API route handlers ✅ FUNCTIONAL
│   ├── services/           # Business logic layer ✅ IMPLEMENTED
│   ├── types/              # TypeScript type definitions ✅ DEFINED
│   ├── database.ts         # Database connection utilities ✅ OPTIMIZED
│   └── index.ts            # Main application entry point ✅ OPERATIONAL
├── docs/                   # Documentation files (15+ files) ✅ COMPREHENSIVE
│   ├── README.md           # Project documentation
│   ├── FINAL_SYSTEM_STATUS.md  # Current system status (✅ 100% operational)
│   ├── MERGE_AND_B2_COMPLETION_SUMMARY.md  # Latest feature completion
│   ├── WEBSOCKET_FIX_SUMMARY.md  # WebSocket error resolution
│   ├── database-schema/    # Database documentation (✅ COMPLETE)
│   │   ├── CURRENT_STATE_SUMMARY.md  # Latest database state
│   │   ├── AI_AGENT_WORK_DIVISION.md  # Agent coordination
│   │   └── *.md           # Schema documentation
│   └── *.md               # Other analysis and documentation
├── tests/                  # Test scripts and utilities (25+ files) ✅ COMPREHENSIVE
│   ├── SYSTEM_STATUS_REPORT.js  # System health checker (90% success rate)
│   ├── test-final-complete.js  # Complete multi-tenant system test
│   ├── test-forgot-password-complete.js  # Password reset tests ✅ WORKING
│   ├── test-admin-dashboard-ui-flow.js  # Admin UI tests ✅ WORKING
│   ├── test-s3-direct.js  # S3 integration tests ✅ WORKING
│   ├── test-cognito-direct.js  # Cognito tests (minor config needed)
│   └── test-*.js          # Additional API and integration tests
├── migrations/             # Database migration files (✅ RESTORED & FUNCTIONAL)
├── dist/                   # Compiled JavaScript output
└── configuration files     # .env, package.json, tsconfig.json, etc.
```

## Frontend Applications Structure

### Hospital Management System (`hospital-management-system/`)
```
hospital-management-system/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/       # Dashboard layout group
│   ├── patients/          # Patient management pages
│   ├── appointments/      # Appointment scheduling
│   ├── records/           # Medical records
│   └── layout.tsx         # Root layout
├── components/             # Reusable React components
│   ├── ui/                # Base UI components (Radix)
│   ├── forms/             # Form components
│   ├── charts/            # Data visualization
│   └── layout/            # Layout components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions and configurations
├── public/                 # Static assets
├── styles/                 # Global CSS and Tailwind styles
└── components.json         # Shadcn/ui component configuration
```

### Admin Dashboard (`admin-dashboard/`)
```
admin-dashboard/
├── app/                    # Next.js App Router pages
│   ├── (admin)/           # Admin layout group
│   ├── tenants/           # Tenant management
│   ├── users/             # User management
│   ├── analytics/         # System analytics
│   └── settings/          # System settings
├── components/             # Admin-specific components
│   ├── ui/                # Base UI components (Radix)
│   ├── charts/            # Analytics charts
│   ├── tables/            # Data tables
│   └── forms/             # Admin forms
├── hooks/                  # Admin utility hooks
├── lib/                    # Admin utility functions
├── public/                 # Admin static assets
└── styles/                 # Admin-specific styles
```

## Architecture Patterns

### Middleware Chain
1. **JSON Parser** - Parse request bodies
2. **Auth Routes** - Public authentication endpoints (`/auth/*`)
3. **Tenant Middleware** - Set database schema context
4. **Auth Middleware** - Validate JWT tokens (protected routes)
5. **Route Handlers** - Business logic
6. **Error Middleware** - Global error handling

### Service Layer Pattern
- Services handle business logic (auth, S3, tenant management)
- Routes are thin controllers that delegate to services
- Database operations are abstracted through services

### Multi-Tenant Database Design
- Each tenant gets a separate PostgreSQL schema
- Tenant middleware sets `search_path` based on `X-Tenant-ID` header
- Migrations create tables in all tenant schemas

## File Naming Conventions
- **Backend**: kebab-case for files, camelCase for variables
- **Frontend**: kebab-case for components, camelCase for utilities
- **Types**: PascalCase for interfaces and types
- **Constants**: UPPER_SNAKE_CASE for environment variables

## Import Organization
1. External libraries (Node.js, npm packages)
2. Internal services and utilities
3. Types and interfaces
4. Relative imports (./filename)