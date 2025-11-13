## Overview
Add new tenant "Aajmin Polyclinic" with strict multi-tenant isolation, create and verify an admin Cognito user, assign RBAC permissions, and validate end-to-end flows. No frontend changes required; tenant context is enforced in the backend via headers/subdomain.

## Prerequisites
- Env vars: `AWS_REGION`, `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `COGNITO_SECRET` (backend/src/services/auth.ts:14–16; backend/src/middleware/auth.ts:19–35)
- Middleware order enforced (backend/src/index.ts:61–102): JSON parser → `/auth/*` bypass → `tenantMiddleware` → `authMiddleware` → routes → error middleware
- Tenant enforcement: `X-Tenant-ID` required and `SET search_path` performed (backend/src/middleware/tenant.ts:5–14)

## Tenant Configuration
1) Create Tenant
- Use `POST /api/tenants` (backend/src/routes/tenants.ts:18 → backend/src/services/tenant.ts:20–118)
- Payload: `{ id: 'aajmin_polyclinic', name: 'Aajmin Polyclinic', email: 'mdwasimkrm13@gmail.com', status: 'active', plan: 'standard', subdomain: 'aajmin' }`
- Service creates schema via `CREATE SCHEMA "aajmin_polyclinic"` (tenant.ts:76), seeds defaults

2) Tenant Identification
- Subdomain routing supported in `GET /by-subdomain/:subdomain` (backend/src/routes/tenants.ts:14)
- Header-based context required: `X-Tenant-ID: aajmin_polyclinic` (backend/src/middleware/tenant.ts:5–14)

3) Tenant Settings & Permissions
- Configure tier flags and admin settings in tenant record; permissions enforced via RBAC (see Role steps)

## Data Isolation
- All queries use tenant context via `SET search_path TO "<tenantId>", public` (backend/src/middleware/tenant.ts:14)
- Protected endpoints require JWT and header; cross-tenant access is denied (auth middleware and service queries)
- Services/controllers rely on schema scoping (e.g., lab controllers: search_path usage at controllers lines 18, 40)

## System Integration
1) Registration System
- Support onboarding through `POST /api/tenants` and optional public `POST /auth/tenants` (backend/src/routes/auth.ts:7–8) for guided workflows
- Centralized components remain shared; data persists per-tenant schema

2) Tenant-Aware Logging & Auditing
- Use audit logging per canonical docs (Team C RBAC/audit); record admin actions, tenant, user, timestamp
- Ensure admin dashboard has viewer filters by tenant

## Authentication & RBAC
1) Cognito User
- Create user `mdwasimkrm13@gmail.com` with password `Advanture101$`
- Programmatic path: `POST /auth/signup` (routes/auth.ts:9–18) → confirm via `POST /auth/verify-email` (20–29) or `AdminConfirmSignUp`
- Admin-set permanent password via `AdminSetUserPassword` (services/auth.ts:119–170) if needed; password policy enforced by pool
- Credentials never stored in DB/repo; no logs of passwords

2) Assign Administrative Privileges
- Ensure "Hospital Admin" role exists: `GET /api/roles` (routes/roles.ts:12–20), create if missing: `POST /api/roles` (35–43)
- Create backend user record and assign role+tenant: `POST /api/users` with `{ email: 'mdwasimkrm13@gmail.com', tenant_id: 'aajmin_polyclinic', role_id: <adminRoleId> }` (routes/users.ts:35–43 → services/userService.ts:70–84; assigns at line 80)
- Authentication validation: `POST /auth/signin` (routes/auth.ts:125–152) → JWT verified via JWKS (middleware/auth.ts:74–86); admin group check at 79–83

## Testing & Validation
- Isolation tests: attempt cross-tenant reads with mismatched `X-Tenant-ID` — expect denial; confirm schema scoping
- Performance tests: run multi-tenant load simulations; measure API <500ms P95
- Feature tests: patient, appointment, records flows under `aajmin_polyclinic`
- Reference test harness:
  - Tenant creation: `backend/tests/test-tenant-creation-api.js`, `test-tenant-management-crud.js`
  - Authentication: `backend/tests/test-admin-auth-complete.js`, `test-final-complete.js`
  - Isolation & usage: `test-tenant-management-analysis.js`, `test-usage-tracking.js`

## Documentation Updates
- Extend `implementation-plans/misc/DEMO_USERS_AND_SEED_DATA.md` with this named admin user and step sequence
- Cross-link `implementation-plans/misc/AUTHENTICATION_SYSTEM_SPEC.md` for architecture and security; avoid duplicating RBAC/audit content

## Security & Compliance
- HIPAA-aligned: strict access control (RBAC), audit logging of admin actions, encryption in transit/at rest, PHI minimization
- Least-privilege IAM for Cognito and DB; HTTPS-only; CORS restrictions
- No credential storage in DB; rely on Cognito user pool policies

## Rollback
- Delete Cognito user if needed; remove DB user via `DELETE /api/users/:id`; remove tenant via `DELETE /api/tenants` (services/tenant.ts:229–246; drops schema at 235)

## Deliverables
- Tenant `aajmin_polyclinic` created and isolated
- Cognito user created and verified; able to sign in
- Admin role assigned to user for this tenant
- Tests run and documented; setup recorded in demo users doc