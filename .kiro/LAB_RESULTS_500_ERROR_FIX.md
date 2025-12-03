# Lab Results 500 Error Fix

## Issue
The `/api/lab-results` endpoint was returning 500 Internal Server Error when accessed from the frontend.

## Root Causes

### 1. Missing Lab Tables in Tenant Schema
The `tenant_aajmin_polyclinic` schema was missing the lab-related tables:
- `lab_test_categories`
- `lab_tests`
- `lab_orders`
- `lab_order_items`
- `lab_results`

**Fix**: Applied lab tests migrations to create the missing tables.

### 2. Schema Name Prefix Mismatch
The frontend sends tenant ID as `aajmin_polyclinic` but the database schema is `tenant_aajmin_polyclinic`.

**Fix**: Updated `backend/src/middleware/tenant.ts` to automatically add the `tenant_` prefix:
```typescript
const schemaName = tenantId.startsWith('tenant_') ? tenantId : `tenant_${tenantId}`;
await client.query(`SET search_path TO "${schemaName}", public`);
```

### 3. labResult.service.ts Direct Pool Queries
The lab result service uses `pool.query` directly instead of using `req.dbClient`, so it needed its own schema prefix handling.

**Fix**: Added helper function and updated all `SET search_path` calls in `backend/src/services/labResult.service.ts`:
```typescript
function getSchemaName(tenantId: string): string {
  return tenantId.startsWith('tenant_') ? tenantId : `tenant_${tenantId}`;
}

// Usage
await pool.query(`SET search_path TO "${getSchemaName(tenantId)}"`);
```

## Files Modified
1. `backend/src/middleware/tenant.ts` - Added tenant_ prefix handling
2. `backend/src/services/labResult.service.ts` - Added getSchemaName helper and updated all queries

## Tables Created
Applied migrations to `tenant_aajmin_polyclinic`:
- `lab_test_categories` ✅
- `lab_tests` ✅
- `lab_orders` ✅
- `lab_order_items` ✅
- `lab_results` ✅

## Testing
After the fix, the API should return an empty results array instead of a 500 error when no lab results exist for a patient.

## Note
The 403 errors for `/api/tenants/.../branding` and `/api/subscriptions/current` are separate issues related to permissions/authentication, not the lab results fix.
