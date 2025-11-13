# Demo Users and Seed Data

## Overview
- Centralized reference for demo tenants, users, and seed data used across applications.
- Dev-only credentials; never use weak passwords or shared accounts in production.

## Demo Tenants & Schemas
- Tenant schemas (example): `demo_hospital_001`, plus additional tenants as configured
- Isolation: All demo data is scoped by tenant; requests must include `X-Tenant-ID`

## Demo User (Dev Only)
- Username: `demo@hospital.com`
- Password: `password123` (development environment only)
- Role: Hospital Admin (can access management features); consider lower-privileged roles for focused demos

## Named Demo: Aajmin Polyclinic Admin (Production-grade credentials)
- Tenant: `aajmin_polyclinic` (name: Aajmin Polyclinic; subdomain: `aajmin`)
- Email: `mdwasimkrm13@gmail.com`
- Password: `Advanture101$`
- Role: Hospital Admin
- Creation Steps (Cognito preferred):
  1. Create Cognito user with the above email and password; set `email_verified=true`
  2. Create tenant via `POST /api/tenants` with payload `{ id: 'aajmin_polyclinic', name: 'Aajmin Polyclinic', email: 'mdwasimkrm13@gmail.com', status: 'active', plan: 'standard', subdomain: 'aajmin' }`
  3. Ensure Hospital Admin role exists; if not, create via `POST /api/roles`
  4. Create backend user and assign role+tenant via `POST /api/users` with `{ email: 'mdwasimkrm13@gmail.com', tenant_id: 'aajmin_polyclinic', role_id: <adminRoleId> }`
  5. Sign in via `POST /auth/signin`; use token on protected routes with header `X-Tenant-ID: aajmin_polyclinic`

### Security Notes for Named Demo
- Credentials are not stored in the repository or database
- Cognito enforces password policy and securely stores credentials
- Use HTTPS-only and least-privilege IAM; avoid logging secrets

## Isolation Validation Steps
- Use `Authorization: Bearer <JWT>` and `X-Tenant-ID: aajmin_polyclinic` to access admin endpoints
- Attempt cross-tenant access (e.g., `X-Tenant-ID: other_tenant`) should fail with access denial
- Confirm schema creation via `CREATE SCHEMA "aajmin_polyclinic"` (service reference: backend/src/services/tenant.ts:76)
- Verify audit logs capture admin actions under `aajmin_polyclinic`

## Security Measures
- Password Complexity
  - Production: strong complexity rules enforced by Cognito
  - Development: weak password allowed solely for demo; document environment guards
- Account Lockout
  - Lock after repeated failed attempts (e.g., 5); implement login throttling
  - Prefer Cognito advanced security; otherwise backend rate limiting
- Session Timeout
  - JWT expiry: 1 hour
  - Frontend inactivity timeout: ~15 minutes with reauthentication prompt

## Creation Paths
- Cognito (Preferred)
  - Create demo user in dev user pool and assign appropriate groups/roles
- Local Fallback (Dev Only)
  - Seed a local user using bcrypt hashing; disable in production

## Access Levels & RBAC
- Map demo user to RBAC roles defined in canonical docs:
  - `implementation-plans/phase-2/team-c-advanced/week-1-rbac/day-1-rbac-schema.md`
  - `implementation-plans/phase-2/team-c-advanced/week-1-rbac/day-2-permission-system.md`
  - `implementation-plans/phase-2/team-c-advanced/week-1-rbac/day-3-role-management-api.md`

## Cross-App Usage
- Backend API: Include `X-Tenant-ID` and valid JWT on protected routes
- Hospital Management System: Use demo user for patient/appointment/records flows
- Admin Dashboard: Validate tenant management and billing views under demo tenant

## Seed Data Recommendations
- Subscription tiers: reuse existing seed from Phase 1 (`A1-subscription-tier-system.md`)
- Patients/appointments: minimal records to exercise UI and E2E paths
- Files: sample documents stored in S3 under tenant prefix

## Notes
- Avoid duplicating RBAC or auth specifications; link to canonical docs
- Demo credentials are for non-production demos and should never be deployed to production
