# Multi-Tenant Security & Database Management

**Consolidates**: multi-tenant-development.md, backend-security-patterns.md, application-authorization.md, database-schema-management.md

## 🚨 CRITICAL Security Principles

### Zero Direct Access
- Backend API NEVER accessible directly through browsers
- All access through verified, authorized frontend applications only
- App-level authentication required (X-App-ID, X-API-Key)

### Complete Data Isolation
- Each tenant = separate PostgreSQL schema
- No cross-tenant data access allowed
- Validate tenant context on EVERY operation

## Multi-Tenant Architecture

### Schema Distribution

**Global Tables (Public Schema)** - 6 Active Tenants ✅
```sql
tenants                  -- Tenant information
tenant_subscriptions     -- Subscription management
subscription_tiers       -- Tier definitions
usage_tracking          -- Usage analytics
custom_fields           -- Field definitions
users                   -- Admin users (6 active)
roles                   -- 8 hospital roles
user_roles              -- Role assignments
permissions             -- 20 granular permissions
role_permissions        -- Role-permission mappings
applications            -- Application registry
user_verification       -- Email verification
```

**Tenant-Specific Tables (Per Tenant Schema)**
```sql
patients                -- Patient records (32 fields)
appointments            -- Appointment scheduling
medical_records         -- Clinical documentation
custom_field_values     -- Custom field data
prescriptions           -- Medication management
lab_tests               -- Laboratory results
billing                 -- Financial transactions
```

### Required Headers (MANDATORY)
```typescript
headers: {
  'Authorization': 'Bearer jwt_token',        // User auth (JWT from signin)
  'X-Tenant-ID': 'tenant_id',                // Multi-tenant context
  'X-App-ID': 'hospital-management',         // Application identifier
  'X-API-Key': 'app-specific-secret-key'     // App authentication
}
```

### Tenant Context Management
```typescript
// ALWAYS validate tenant
const tenantId = req.headers['x-tenant-id'] as string;
if (!tenantId) {
  return res.status(400).json({ error: 'X-Tenant-ID required' });
}

// Verify tenant exists and is active
const tenant = await pool.query(
  'SELECT id, status FROM tenants WHERE id = $1',
  [tenantId]
);

if (!tenant.rows.length || tenant.rows[0].status !== 'active') {
  return res.status(403).json({ error: 'Invalid or inactive tenant' });
}

// Set schema context
await pool.query(`SET search_path TO "${tenantId}"`);
```

## Application-Level Authorization

### 8 Roles with Permissions
```
Admin              → 20 permissions (full access)
Hospital Admin     → 16 permissions (hospital management)
Doctor             → 8 permissions (clinical access)
Nurse              → 5 permissions (patient care)
Receptionist       → 6 permissions (front desk)
Manager            → 4 permissions (reports & analytics)
Lab Technician     → 3 permissions (lab module)
Pharmacist         → 3 permissions (pharmacy module)
```

### Access Control Matrix
```
Role              | Admin Dashboard | Hospital System
------------------|-----------------|----------------
Admin             | ✅ Yes          | ✅ Yes
Hospital Admin    | ❌ No           | ✅ Yes
Doctor            | ❌ No           | ✅ Yes
Nurse             | ❌ No           | ✅ Yes
Receptionist      | ❌ No           | ✅ Yes
Manager           | ❌ No           | ✅ Yes
Lab Technician    | ❌ No           | ✅ Yes
Pharmacist        | ❌ No           | ✅ Yes
```

### Signin Response (Enhanced)
```json
{
  "token": "jwt_token",
  "user": {...},
  "roles": [{"id": 2, "name": "Doctor", "description": "..."}],
  "permissions": [
    {"resource": "hospital_system", "action": "access"},
    {"resource": "patients", "action": "read"},
    {"resource": "patients", "action": "write"}
  ],
  "accessibleApplications": [
    {
      "application_id": "hospital_system",
      "name": "Hospital Management System",
      "has_access": true,
      "required_permissions": ["hospital_system:access"]
    }
  ]
}
```

### Frontend Access Guards
```typescript
// Check application access
const hasHospitalAccess = (): boolean => {
  const apps = JSON.parse(Cookies.get('accessible_apps') || '[]');
  return apps.some(app => 
    app.application_id === 'hospital_system' && app.has_access
  );
};

// Redirect if no access
if (!hasHospitalAccess()) {
  router.push('/unauthorized');
}
```

### Backend Middleware
```typescript
// Protect entire application
app.use('/api/hospital', requireApplicationAccess('hospital_system'));

// Protect specific endpoints
app.get('/api/patients', requirePermission('patients', 'read'), handler);
app.post('/api/patients', requirePermission('patients', 'write'), handler);

// Protect by role
app.get('/api/admin/settings', requireRole('Admin'), handler);
```

## Backend Security Patterns

### Allowed Applications Registry
```typescript
const ALLOWED_ORIGINS = [
  'http://localhost:3001',  // Hospital Management System
  'http://localhost:3002',  // Admin Dashboard
  // Production URLs added here
];

const APP_API_KEYS = {
  'hospital-management': process.env.HOSPITAL_APP_API_KEY,
  'admin-dashboard': process.env.ADMIN_APP_API_KEY,
};
```

### App Authentication Middleware
```typescript
export const apiAppAuthMiddleware = (req, res, next) => {
  // Skip auth endpoints
  if (req.path.startsWith('/auth/')) return next();

  const origin = req.headers.origin;
  const apiKey = req.headers['x-api-key'];
  const appId = req.headers['x-app-id'];

  // Validate origin
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return next();
  }

  // Validate API key and app ID
  if (apiKey && appId && APP_API_KEYS[appId] === apiKey) {
    return next();
  }

  // Block direct browser access
  return res.status(403).json({
    error: 'Direct access not allowed',
    message: 'This API can only be accessed through authorized applications'
  });
};
```

### Security Testing
```bash
# Should return 403 Forbidden
curl -X GET http://localhost:3000/api/users

# Should return 200 OK
curl -X GET http://localhost:3000/api/users \
  -H "Origin: http://localhost:3002" \
  -H "Authorization: Bearer valid_token" \
  -H "X-Tenant-ID: tenant_id" \
  -H "X-App-ID: admin-dashboard" \
  -H "X-API-Key: admin-dev-key-456"
```

## Database Management Rules

### ALWAYS Verify Before Operations
```bash
# Check all tables
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "
SELECT table_name, table_schema FROM information_schema.tables 
WHERE table_schema NOT IN ('information_schema', 'pg_catalog');
"

# Check tenant schemas
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name LIKE 'tenant_%';
"

# Check migration status
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "
SELECT * FROM pgmigrations ORDER BY run_on;
"
```

### NEVER Do These Things
1. ❌ Assume table existence based on migration files
2. ❌ Create duplicate tables
3. ❌ Skip tenant context validation
4. ❌ Allow cross-tenant queries
5. ❌ Use string concatenation for SQL
6. ❌ Hardcode tenant IDs
7. ❌ Skip documentation updates

### ALWAYS Do These Things
1. ✅ Verify current database state first
2. ✅ Use parameterized queries
3. ✅ Set schema context for tenant operations
4. ✅ Create indexes on foreign keys
5. ✅ Test multi-tenant isolation
6. ✅ Update documentation immediately
7. ✅ Use transactions for complex operations

### Creating Tenant Tables
```sql
-- Apply to ALL tenant schemas
DO $$
DECLARE
  tenant_schema TEXT;
BEGIN
  FOR tenant_schema IN 
    SELECT schema_name FROM information_schema.schemata 
    WHERE schema_name LIKE 'tenant_%'
  LOOP
    EXECUTE format('SET search_path TO %I', tenant_schema);
    
    -- Create table in tenant schema
    CREATE TABLE IF NOT EXISTS patients (
      id SERIAL PRIMARY KEY,
      patient_number VARCHAR(50) UNIQUE NOT NULL,
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255) NOT NULL,
      -- ... other fields
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Create indexes
    CREATE INDEX IF NOT EXISTS patients_patient_number_idx 
      ON patients(patient_number);
  END LOOP;
END $$;
```

### Testing Isolation
```sql
-- Test 1: Create test data in different tenants
SET search_path TO "tenant_1762083064503";
INSERT INTO patients (patient_number, first_name, last_name, date_of_birth) 
VALUES ('P001', 'John', 'Doe', '1985-01-01');

SET search_path TO "tenant_1762083064515";
INSERT INTO patients (patient_number, first_name, last_name, date_of_birth) 
VALUES ('P001', 'Jane', 'Smith', '1990-01-01');

-- Test 2: Verify isolation
SET search_path TO "tenant_1762083064503";
SELECT first_name FROM patients WHERE patient_number = 'P001'; 
-- Should return 'John'

SET search_path TO "tenant_1762083064515";
SELECT first_name FROM patients WHERE patient_number = 'P001'; 
-- Should return 'Jane'

-- Test 3: Verify no cross-tenant access
SET search_path TO "tenant_1762083064503";
SELECT COUNT(*) FROM "tenant_1762083064515".patients; 
-- Should fail with permission error
```

## Security Incident Response

### If Direct Access Detected
1. **Immediate**: Block the source IP/origin
2. **Investigate**: Check logs for data access patterns
3. **Audit**: Review all recent API calls
4. **Strengthen**: Add additional security layers
5. **Monitor**: Increase logging and alerting

### If Cross-Tenant Data Leakage
1. **Immediate**: Stop all API services
2. **Investigate**: Check logs for cross-schema queries
3. **Isolate**: Verify schema permissions
4. **Fix**: Correct application code
5. **Test**: Run isolation tests before resuming

### If Unauthorized App Access
1. **Revoke**: Invalidate compromised API keys
2. **Rotate**: Generate new API keys for all applications
3. **Investigate**: Determine how keys were compromised
4. **Strengthen**: Add additional app verification layers
5. **Notify**: Alert application owners

## Role Management API

```typescript
// GET /api/roles - List all roles
// GET /api/roles/:roleId/permissions - Get role permissions
// GET /api/permissions - List all permissions
// GET /api/users/:userId/roles - Get user roles
// POST /api/users/:userId/roles - Assign role (admin only)
// DELETE /api/users/:userId/roles/:roleId - Revoke role (admin only)
```

### Helper Scripts
```bash
# Test authorization system
cd backend && node scripts/test-authorization.js

# Assign admin role
node scripts/assign-admin-role.js user@example.com

# Create hospital admin user
node scripts/create-hospital-admin.js email@example.com "Name" tenant_id password
```

## Security Checklist

Before deploying:
- [ ] All API endpoints use app authentication middleware
- [ ] Multi-tenant isolation verified with tests
- [ ] No direct browser access possible
- [ ] All database queries use parameterized statements
- [ ] Tenant context validated on every request
- [ ] Permission checks implemented
- [ ] Role-based access control enforced
- [ ] JWT tokens validated with JWKS
- [ ] Environment variables secured
- [ ] API keys rotated regularly
- [ ] Logging and monitoring enabled
- [ ] Security audit completed

---

**For API patterns**: See `api-integration.md`  
**For development rules**: See `development-rules.md`  
**For team tasks**: See `team-missions.md`
