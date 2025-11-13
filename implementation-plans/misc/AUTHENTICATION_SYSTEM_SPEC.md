# Authentication System: Technical Specification

## Overview
- Primary authentication: AWS Cognito with JWT (JWKS validation)
- Tenant context: `X-Tenant-ID` header required for protected routes
- Middleware order: JSON parser → auth route bypass (`/auth/*`) → tenant middleware → auth middleware → RBAC middleware → route handlers → error middleware
- Production uses Cognito; local/dev may use an internal bcrypt-based fallback for testing only

## Architecture
- Token validation: Verify JWT with Cognito JWKS; enforce 1-hour expiry
- Tenant isolation: Map `X-Tenant-ID` to PostgreSQL schema; deny cross-tenant access
- RBAC integration: Permissions checked post-auth with role-based policies
- Session management: Frontend enforces inactivity timeout (e.g., 15 minutes) and reauthentication flows
- Audit logging: Log auth events, role changes, and privileged actions with user, tenant, timestamp

## RBAC (Canonical References)
- Schema: `implementation-plans/phase-2/team-c-advanced/week-1-rbac/day-1-rbac-schema.md`
- Permission system: `implementation-plans/phase-2/team-c-advanced/week-1-rbac/day-2-permission-system.md`
- Role management API: `implementation-plans/phase-2/team-c-advanced/week-1-rbac/day-3-role-management-api.md`
- RBAC UI: `implementation-plans/phase-2/team-c-advanced/week-1-rbac/day-4-rbac-ui.md`
- Audit logging: `implementation-plans/phase-2/team-c-advanced/week-1-rbac/day-5-audit-logging.md`

## Secure Password Storage
- Cognito manages credentials in production; no server-side password storage
- Dev-only fallback: bcrypt hashing for local testing when Cognito is unavailable
- Enforce complexity policies in non-prod environments for realistic testing

## Session Management
- JWT lifetime: 1 hour (configurable)
- Inactivity timeout: 15 minutes (frontend policy); renew via silent reauth where applicable
- Token refresh: Use Cognito flows (if enabled) or enforced re-login on expiry

## Audit Logging
- Events: sign-in/out, failed login attempts, role assignments, permission changes, access to sensitive resources
- Storage: per-tenant audit tables; ensure immutable records and retention policies
- Review: admin dashboard viewer, filters by tenant/user/action/date

## Security Considerations & Threat Modeling
- STRIDE threats addressed:
  - Spoofing: JWT validation via JWKS; strict CORS; HTTPS only
  - Tampering: Parameterized queries; integrity checks; S3 object prefix isolation
  - Repudiation: Comprehensive audit logging; admin review workflows
  - Information disclosure: PHI minimization; encryption at rest/in transit; least-privilege IAM
  - Denial of service: Rate limiting, login throttling with lockout; circuit breakers
  - Elevation of privilege: RBAC enforcement; permission checks in services and routes
- HIPAA alignment:
  - Access controls: unique user accounts, role-based permissions
  - Audit trails: detailed logs for access and changes
  - Data protection: encryption, secure transport, key management hygiene
  - Incident response: breach notification procedures and forensic audit readiness

## Implementation Notes
- Apply auth bypass only to `/auth/*`; all other routes enforce JWT + tenant context
- Ensure `X-Tenant-ID` validated before DB access; schema selection per request
- Avoid duplicating RBAC docs; link to canonical references above

### Tenant & Group Mapping
- Store tenant context in requests via `X-Tenant-ID`; never derive tenant from token alone
- Use Cognito groups or custom claims to reflect high-level roles; backend RBAC remains source of truth
- On user onboarding, assign backend role with `POST /api/users` and optional Cognito group membership for UI hints; enforce permissions server-side

## Validation Procedures
- JWT validation tests with Cognito keys and expiration
- Multi-tenant isolation tests (schema scoping, forbidden cross-tenant queries)
- RBAC permission matrix tests per role
- Audit logging tests for auth events and privileged actions
