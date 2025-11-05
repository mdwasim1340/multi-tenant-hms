# Multi-Tenant Development Guidelines

## 🏗️ Multi-Tenant Architecture Rules

### Core Principle: Complete Data Isolation
Every tenant must have completely isolated data with no possibility of cross-tenant access or data leakage.

### Current Multi-Tenant Status (Updated Nov 4, 2025 - LEGACY CLEANUP COMPLETE)
- ✅ **Global Tables**: Modern subscription-based tenant system (legacy removed)
- ✅ **Tenant Management**: Single clean implementation in `/components/tenants/`
- ✅ **Subscription System**: Integrated billing, usage tracking, and tier management
- ✅ **User Management**: 6 admin users with proper tenant relationships
- ✅ **Role System**: 7 hospital roles defined with RBAC foundation
- ✅ **Legacy Cleanup**: 739 lines of duplicate tenant code removed
- ✅ **Isolation Mechanism**: PostgreSQL schema-based isolation fully operational

## 🚨 ANTI-DUPLICATION RULES FOR MULTI-TENANT DEVELOPMENT

### Before Creating Tenant-Related Components
1. **Check existing tenant components**: All tenant management is in `/components/tenants/`
2. **Verify no legacy exists**: Review `LEGACY_CLEANUP_SUMMARY.md` for removed components
3. **Use subscription model**: Integrate with existing subscription and usage tracking
4. **Single source of truth**: Never create duplicate tenant management systems

## 🗂️ Schema Distribution Rules

### Global Tables (Public Schema) - ✅ 100% COMPLETE (Agent A Mission Accomplished)
These tables exist once for the entire system and are fully operational:
- `tenants` - ✅ 6 active tenants with proper configuration
- `users` - ✅ 6 admin users with tenant relationships and security
- `roles` - ✅ 7 hospital roles (Admin, Doctor, Nurse, Receptionist, Lab Tech, Pharmacist, Manager)
- `user_roles` - ✅ 6 admin role assignments with proper constraints
- `user_verification` - ✅ Email verification and password reset system
- **Performance**: ✅ 10 strategic indexes for optimal query performance
- **Security**: ✅ Foreign key constraints prevent data corruption
- **Migration System**: ✅ Restored and functional for future changes

### Tenant-Specific Tables (Tenant Schemas) - ❌ NEED CREATION
These tables must be created in EACH tenant schema:
- `patients` - Patient records and demographics
- `appointments` - Appointment scheduling
- `medical_records` - Medical history and diagnoses
- `prescriptions` - Medication prescriptions
- `lab_tests` - Laboratory tests and results
- `billing` - Financial transactions (if needed)
- `inventory` - Medical supplies and equipment (if needed)

## 🔧 Tenant Context Management

### Required Headers for All Protected API Calls
```javascript
// MANDATORY: All API requests must include tenant context
headers: {
  'X-Tenant-ID': 'tenant_1762083064503', // Must match existing tenant ID
  'Authorization': 'Bearer jwt_token_here'
}
```

### Database Schema Context Setting
```sql
-- ALWAYS set search_path before tenant-specific queries
SET search_path TO "tenant_1762083064503";

-- Now all queries operate within tenant schema
SELECT * FROM patients; -- Queries tenant_1762083064503.patients
```

### Middleware Implementation Pattern
```typescript
// Tenant middleware MUST be applied to all protected routes
export const tenantMiddleware = async (req, res, next) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  
  // Validate tenant exists
  const tenantExists = await pool.query(
    'SELECT id FROM tenants WHERE id = $1', [tenantId]
  );
  
  if (!tenantExists.rows.length) {
    return res.status(400).json({ error: 'Invalid tenant ID' });
  }
  
  // Set schema context
  await pool.query(`SET search_path TO "${tenantId}"`);
  next();
};
```

## 🚨 Critical Multi-Tenant Rules

### NEVER Do These Things
1. **Cross-Tenant Queries**: Never query data across tenant schemas
2. **Global Patient Data**: Never put patient data in public schema
3. **Shared Resources**: Never share tenant-specific resources
4. **Direct Schema References**: Never hardcode schema names in queries
5. **Missing Tenant Context**: Never process requests without tenant validation
6. **Next.js API Proxies**: Never create Next.js API routes that proxy to backend
7. **Unprotected Backend**: Never allow direct browser access to backend APIs
8. **Missing App Auth**: Never skip app-level authentication headers

### ALWAYS Do These Things
1. **Validate Tenant ID**: Always verify tenant exists before operations
2. **Set Schema Context**: Always set search_path for tenant operations
3. **Isolate Data**: Always ensure data stays within tenant boundaries
4. **Test Isolation**: Always verify no cross-tenant data leakage
5. **Document Tenant Tables**: Always update docs when creating tenant tables
6. **Direct Backend Calls**: Always call backend API directly from frontend
7. **App Authentication**: Always include X-App-ID and X-API-Key headers
8. **Protect Backend**: Always use appAuthMiddleware on API routes

## 🏥 Hospital Management Schema Design

### Patient Management Tables
```sql
-- Create in EACH tenant schema
CREATE TABLE patients (
  id SERIAL PRIMARY KEY,
  patient_number VARCHAR(50) UNIQUE NOT NULL, -- Tenant-specific patient ID
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  date_of_birth DATE NOT NULL,
  gender VARCHAR(20),
  address TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(50),
  medical_history TEXT,
  allergies TEXT,
  current_medications TEXT,
  insurance_info JSONB,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INTEGER NOT NULL, -- References public.users.id (validate in app)
  appointment_date TIMESTAMP NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  appointment_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, completed, cancelled, no_show
  notes TEXT,
  created_by INTEGER, -- References public.users.id
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medical_records (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INTEGER NOT NULL, -- References public.users.id
  appointment_id INTEGER REFERENCES appointments(id),
  visit_date TIMESTAMP NOT NULL,
  chief_complaint TEXT,
  diagnosis TEXT,
  treatment_plan TEXT,
  prescriptions JSONB,
  vital_signs JSONB, -- {"bp": "120/80", "temp": "98.6", "pulse": "72"}
  lab_results JSONB,
  notes TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Performance Indexes for Tenant Tables
```sql
-- ALWAYS create these indexes in each tenant schema
CREATE INDEX patients_patient_number_idx ON patients(patient_number);
CREATE INDEX patients_email_idx ON patients(email);
CREATE INDEX patients_name_idx ON patients(last_name, first_name);
CREATE INDEX patients_dob_idx ON patients(date_of_birth);
CREATE INDEX patients_status_idx ON patients(status);

CREATE INDEX appointments_patient_id_idx ON appointments(patient_id);
CREATE INDEX appointments_doctor_id_idx ON appointments(doctor_id);
CREATE INDEX appointments_date_idx ON appointments(appointment_date);
CREATE INDEX appointments_status_idx ON appointments(status);

CREATE INDEX medical_records_patient_id_idx ON medical_records(patient_id);
CREATE INDEX medical_records_doctor_id_idx ON medical_records(doctor_id);
CREATE INDEX medical_records_visit_date_idx ON medical_records(visit_date);
```

## 🔍 Tenant Schema Creation Process

### Step 1: Verify Tenant Exists
```sql
SELECT id, name, status FROM tenants WHERE id = 'your_tenant_id';
```

### Step 2: Create Tables in Tenant Schema
```bash
# Apply hospital tables to specific tenant
TENANT_ID="tenant_1762083064503"
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "
SET search_path TO \"$TENANT_ID\";
-- Execute CREATE TABLE statements here
"
```

### Step 3: Apply to All Tenant Schemas
```bash
# Get all tenant schemas
TENANT_SCHEMAS=$(docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -t -c "
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%';
")

# Apply to each schema
for schema in $TENANT_SCHEMAS; do
  echo "Creating tables in schema: $schema"
  docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "
    SET search_path TO \"$schema\";
    -- Execute all CREATE TABLE statements
  "
done
```

## 🧪 Testing Multi-Tenant Isolation

### Verify Data Isolation
```sql
-- Test 1: Create test data in different tenants
SET search_path TO "tenant_1762083064503";
INSERT INTO patients (patient_number, first_name, last_name, date_of_birth) 
VALUES ('P001', 'John', 'Doe', '1985-01-01');

SET search_path TO "tenant_1762083064515";
INSERT INTO patients (patient_number, first_name, last_name, date_of_birth) 
VALUES ('P001', 'Jane', 'Smith', '1990-01-01');

-- Test 2: Verify isolation (should return different results)
SET search_path TO "tenant_1762083064503";
SELECT first_name FROM patients WHERE patient_number = 'P001'; -- Should return 'John'

SET search_path TO "tenant_1762083064515";
SELECT first_name FROM patients WHERE patient_number = 'P001'; -- Should return 'Jane'

-- Test 3: Verify no cross-tenant access
SET search_path TO "tenant_1762083064503";
SELECT COUNT(*) FROM "tenant_1762083064515".patients; -- Should fail with permission error
```

### API Isolation Testing
```bash
# Test tenant isolation via API
curl -X GET http://localhost:3000/api/patients \
  -H "X-Tenant-ID: tenant_1762083064503" \
  -H "Authorization: Bearer valid_jwt_token"

curl -X GET http://localhost:3000/api/patients \
  -H "X-Tenant-ID: tenant_1762083064515" \
  -H "Authorization: Bearer valid_jwt_token"

# Should return different patient lists
```

## 📊 Monitoring Multi-Tenant Health

### Check Tenant Schema Status
```sql
-- Verify all tenants have required tables
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  COUNT(tables.table_name) as table_count
FROM tenants t
LEFT JOIN information_schema.tables tables ON t.id = tables.table_schema
WHERE tables.table_schema LIKE 'tenant_%' OR tables.table_schema LIKE 'demo_%'
GROUP BY t.id, t.name
ORDER BY t.id;
```

### Verify Data Distribution
```sql
-- Check patient count per tenant
SELECT 
  schema_name,
  (SELECT COUNT(*) FROM (schema_name || '.patients')::regclass) as patient_count
FROM information_schema.schemata 
WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%';
```

## 🚨 Emergency Procedures

### If Cross-Tenant Data Leakage Detected
1. **Immediate**: Stop all API services
2. **Investigate**: Check query logs for cross-schema queries
3. **Isolate**: Verify schema permissions are correct
4. **Fix**: Correct any application code that bypasses tenant context
5. **Verify**: Run isolation tests before resuming service

### If Tenant Schema Corruption
1. **Backup**: Export tenant data immediately
2. **Recreate**: Drop and recreate tenant schema
3. **Restore**: Import backed up data
4. **Test**: Verify all functionality works correctly

This multi-tenant development guide ensures proper data isolation and prevents cross-tenant data leakage while maintaining system performance and security.