# Project Structure

## Root Directory Layout
```
├── backend/                    # Node.js + TypeScript API server
│   ├── src/                   # TypeScript source code
│   ├── docs/                  # Documentation and analysis files
│   ├── tests/                 # Test scripts and utilities
│   ├── migrations/            # Database migration files
│   ├── dist/                  # Compiled JavaScript output
│   └── node_modules/          # Backend dependencies
├── hospital-management-system/ # Next.js frontend for hospital operations
│   ├── app/                   # Next.js App Router pages
│   ├── components/            # Reusable React components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility functions
│   └── public/                # Static assets
├── admin-dashboard/           # Next.js admin interface
│   ├── app/                   # Admin pages and layouts
│   ├── components/            # Admin-specific components
│   ├── hooks/                 # Admin utility hooks
│   ├── lib/                   # Admin utility functions
│   └── public/                # Admin static assets
└── .kiro/                     # Kiro IDE configuration
    └── steering/              # Development guidelines
```

## Backend Structure (`backend/`)
```
backend/
├── src/                    # TypeScript source code
│   ├── middleware/         # Express middleware (auth, tenant, error)
│   ├── routes/             # API route handlers
│   ├── services/           # Business logic layer
│   ├── types/              # TypeScript type definitions
│   ├── database.ts         # Database connection utilities
│   └── index.ts            # Main application entry point
├── docs/                   # Documentation files (15+ files)
│   ├── README.md           # Project documentation
│   ├── FINAL_SYSTEM_STATUS.md  # Current system status
│   ├── ADMIN_DASHBOARD_EMAIL_INTEGRATION_REPORT.md  # Email integration
│   ├── FORGOT_PASSWORD_FIX.md  # Password reset documentation
│   ├── OTP_UI_IMPLEMENTATION.md  # OTP system documentation
│   └── *.md               # Other analysis and documentation
├── tests/                  # Test scripts and utilities (25+ files)
│   ├── test-*.js          # API and integration tests
│   ├── diagnose-*.js      # Diagnostic scripts
│   ├── test-forgot-password-complete.js  # Password reset tests
│   ├── test-admin-dashboard-ui-flow.js  # Admin UI tests
│   └── SYSTEM_STATUS_REPORT.js  # System health checker
├── migrations/             # Database migration files
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