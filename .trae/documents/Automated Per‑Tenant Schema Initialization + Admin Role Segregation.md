## Overview
Implement a robust, idempotent per‑tenant schema runner that applies all required SQL files to new tenant schemas with auditing, validation, and rollback. Introduce clear separation between system admins (`admin`) and hospital admins (`hospital-admin`) with route‑level authorization so hospital admins access tenant‑context features only.

## Components to Add/Update
- New service: `backend/src/services/tenantSchemaRunner.ts` (core runner)
- New audit table: `public.tenant_schema_audit` (created if missing in `backend/src/services/tenantSchemaRunner.ts`)
- New admin APIs:
  - `POST /api/tenants/:id/init-schema` → runs the schema runner for the tenant
  - Optional: `GET /api/tenants/:id/schema-status` → lists audit entries
- Middleware updates:
  - Split `authMiddleware` into `adminAuthMiddleware` and `hospitalAuthMiddleware`
  - Update `backend/src/index.ts` to use `adminAuthMiddleware` for `/api/tenants`, `/api/users`, `/api/roles`, `/api/analytics`, etc.; and `hospitalAuthMiddleware` for tenant‑context routes (patients, appointments, files, etc.)
- Cognito integration:
  - Add `AdminAddUserToGroupCommand` helper to assign `hospital-admin` or `admin` groups in `backend/src/services/auth.ts`
  - Ensure `POST /auth/signup` or a new `POST /auth/assign-group` supports hospital admin assignment

## 1) Schema Application Runner
- Runner behavior (`tenantSchemaRunner.ts`):
  - Input: `tenantId` (schema name) and a fixed list of SQL files:
    - `migrations/schemas/patient-schema.sql`
    - `migrations/schemas/appointment-schema.sql`
    - `migrations/create-medical-records-schema.sql`
    - `migrations/create-lab-tests-schema.sql`
  - Validation:
    - Only allow files from whitelisted directories
    - Compute SHA256 checksum and record in audit
    - Scan SQL for disallowed statements (e.g., `DROP SCHEMA`, `ALTER SYSTEM`, cross‑schema references)
  - Execution:
    - For each file: open transaction, `SET search_path TO "<tenantId>"`, run SQL; on error, `ROLLBACK` and record failure
    - Idempotency: skip execution if an audit record exists with same `file_name` + `version` + `checksum` and status `success`; rely on `IF NOT EXISTS` in SQL
  - Audit logging (table: `tenant_schema_audit`):
    - Columns: `id`, `tenant_id`, `schema_name`, `file_name`, `version`, `checksum`, `applied_at`, `status` (success/failure), `error_encrypted`
    - Encrypt error details with AES‑256‑GCM using `SCHEMA_AUDIT_KEY` env var
  - Versioning:
    - Define a simple semantic version map in runner (e.g., `patients@1.0.0`, `appointments@1.0.0`, `medical_records@1.0.0`, `lab_tests@1.0.0`)
- Endpoint wiring:
  - `POST /api/tenants/:id/init-schema` (admin only) triggers runner and returns per‑file statuses
  - Optionally auto‑trigger inside `createTenant` after `CREATE SCHEMA`, with feature flag (e.g., `AUTO_INIT_TENANT_SCHEMA=true`)

## 2) Admin Role Management
- Cognito groups:
  - System admins: `admin` (unchanged)
  - Hospital admins: `hospital-admin`
- Middleware split:
  - `adminAuthMiddleware`: requires JWT `cognito:groups` contains `admin`
  - `hospitalAuthMiddleware`: requires JWT `cognito:groups` contains `hospital-admin` OR `admin`; and is applied only to tenant‑context routes
- Routing changes (`backend/src/index.ts`):
  - `/api/tenants`, `/api/users`, `/api/roles`, `/api/analytics` → `adminAuthMiddleware`
  - `/api/patients`, `/api/appointments`, `/api/medical-records`, `/files`, etc. → `hospitalAuthMiddleware` + `tenantMiddleware`
- Group assignment in auth service:
  - Add helper to add user to group via `AdminAddUserToGroupCommand`
  - Update `POST /auth/signup` to accept `group: 'hospital-admin' | 'admin'` (admin‑protected or dev‑only)
  - Ensure JWTs carry `cognito:groups` claim accordingly

## 3) Security Requirements
- Strict tenant isolation:
  - Runner always sets `search_path` to tenant schema and only executes within that context
  - Validation blocks cross‑schema references (e.g., `FROM public.*` unless explicitly whitelisted)
- SQL validation:
  - Whitelist allowed statements (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX`, `ALTER TABLE ADD COLUMN`, etc.)
  - Deny destructive ops unless part of controlled rollback
- Rollback:
  - On file failure: transaction rollback; audit logs record failure and error payload (encrypted)
  - Add optional `POST /api/tenants/:id/rollback` to drop newly created tables from the failed file (guided by audit or introspection)
- Encryption:
  - Encrypt `error_encrypted` using `SCHEMA_AUDIT_KEY` with AES‑GCM; store IV and tag

## 4) Testing Requirements
- Unit tests (validation):
  - Validate disallowed SQL is rejected
  - Check checksum computation and audit entries
- Integration tests (flow):
  - Create temporary tenant → run init-schema → assert tables exist → re‑run (idempotent) → assert no duplicate state and audit shows skip
- Security tests (RBAC):
  - JWT with `hospital-admin` can access tenant routes but not `/api/tenants` admin routes
  - JWT with `admin` can access both
- Performance tests:
  - Concurrent provisioning for N tenants (e.g., 5–10) with measured execution time and DB load; ensure no deadlocks and acceptable latency

## 5) Documentation
- Runbook: `backend/docs/runbooks/tenant-schema-initialization.md`
  - Prereqs, environment variables, commands to trigger runner, rollback steps, and common errors
- SQL naming conventions: `backend/docs/database-schema/sql-conventions.md`
  - Required naming and `IF NOT EXISTS` guidelines, no cross‑schema references, version mapping
- Error handling protocol: `backend/docs/runbooks/error-handling-schema-runner.md`
  - Audit entries, encrypted error payloads, retry and escalation
- Monitoring: `backend/docs/monitoring/tenant-schema-runner.md`
  - Metrics (files applied, failures), log routes, alerts on failures; optional publish events via `eventService`

## Implementation Steps
1. Create `tenant_schema_audit` if missing; add AES helpers and validation utilities
2. Implement `tenantSchemaRunner.ts` with file list, idempotent audit checks, transactional execution, and encryption
3. Add `POST /api/tenants/:id/init-schema` route (admin only)
4. Split auth middleware and update route wiring per admin vs hospital contexts
5. Add Cognito group helper and group assignment capability
6. Add unit/integration/security/performance tests and docs

## Acceptance Criteria
- Running init on a fresh tenant applies all required tables and indexes; re‑running is safe
- Audit contains accurate per‑file entries with checksums and status
- Hospital admins can only access tenant‑context routes; system admins retain full access
- SQL validation blocks unsafe scripts; rollback works for failed runs
- Documentation is complete with runbook, conventions, error handling, and monitoring
