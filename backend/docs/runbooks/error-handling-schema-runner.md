# Error Handling Protocols (Schema Runner)

## Failures
- Transaction rollback per file
- Encrypted error payload recorded in `tenant_schema_audit.error_encrypted`

## Recovery
- Re-run init; idempotency skips already applied files
- Optional rollback for a file: `POST /api/tenants/:id/rollback` with `{ file }`

## Escalation
- Investigate disallowed SQL or missing dependencies
- Verify tenant schema has prerequisites (patients before medical-records)
