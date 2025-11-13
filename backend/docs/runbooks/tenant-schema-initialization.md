# Tenant Schema Initialization Runbook

## Overview
- Initialize per-tenant schemas with required tables and indexes using `POST /api/tenants/:id/init-schema`.
- Idempotent: safe to re-run; already-applied files are skipped.
- Audit entries recorded in `public.tenant_schema_audit` with encrypted error payloads.

## Prerequisites
- Admin JWT with `cognito:groups: ['admin']`
- Environment: `SCHEMA_AUDIT_KEY` for encryption

## Procedure
- Trigger: `POST /api/tenants/<tenantId>/init-schema`
- Optional rollback: `POST /api/tenants/<tenantId>/rollback` with `{ file }`

## Files Applied
- `migrations/schemas/patient-schema.sql`
- `migrations/schemas/appointment-schema.sql`
- `migrations/create-medical-records-schema.sql`
- `migrations/create-lab-tests-schema.sql`

## Audit Fields
- `tenant_id`, `schema_name`, `file_name`, `version`, `checksum`, `applied_at`, `status`, `error_encrypted`

## Common Errors
- “relation … already exists” → treated as Already applied
- Validation failed → check SQL content and directory whitelist

