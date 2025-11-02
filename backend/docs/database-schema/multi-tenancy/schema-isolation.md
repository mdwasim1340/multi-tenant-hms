# Multi-Tenant Schema Isolation Documentation

## 🏗️ Schema-Based Multi-Tenancy Overview

The system implements **schema-based multi-tenancy** using PostgreSQL schemas to provide complete data isolation between tenants. Each tenant gets their own dedicated schema within the same database.

## 🗃️ Schema Architecture

### Schema Naming Convention
- **Pattern**: Each tenant schema is named using the tenant ID
- **Example**: Tenant with ID `"tenant_123"` gets schema `"tenant_123"`
- **Public Schema**: Contains shared tables (`tenants`, `roles`, global `users`)
- **Tenant Schemas**: Contain tenant-specific data tables

### Current Schema Structure
```
Database: multitenant_db
├── public (default schema)
│   ├── tenants                 # ✅ Global tenant registry (EXISTS)
│   ├── pgmigrations           # ✅ Migration tracking (EXISTS)
│   ├── users                   # ❌ Global user registry (NOT CREATED)
│   ├── roles                   # ❌ Global roles definition (NOT CREATED)
│   ├── user_roles             # ❌ Global user-role assignments (NOT CREATED)
│   └── user_verification      # ❌ Global verification codes (NOT CREATED)
├── demo_hospital_001 (tenant schema)
│   └── (empty - no tables created yet)
├── tenant_1762083064503 (tenant schema)
│   └── (empty - no tables created yet)
├── tenant_1762083064515 (tenant schema)
│   └── (empty - no tables created yet)
├── tenant_1762083586064 (tenant schema)
│   └── (empty - no tables created yet)
└── test_complete_* (test tenant schemas)
    └── (empty - no tables created yet)
```

## 🔄 Schema Management Process

### Tenant Creation Process
1. **Validate Tenant Data**: Check required fields (name, email, plan, status)
2. **Generate Tenant ID**: Auto-generate if not provided (`tenant_${Date.now()}`)
3. **Begin Transaction**: Start database transaction for atomicity
4. **Create Schema**: `CREATE SCHEMA "${tenant_id}"`
5. **Insert Tenant Record**: Add to global `tenants` table
6. **Run Migrations**: Apply all tenant-specific table migrations to new schema
7. **Commit Transaction**: Complete the tenant creation

### Tenant Deletion Process
1. **Begin Transaction**: Start database transaction
2. **Drop Schema**: `DROP SCHEMA "${tenant_id}" CASCADE`
3. **Delete Tenant Record**: Remove from global `tenants` table
4. **Commit Transaction**: Complete the tenant deletion
5. **Cleanup**: Remove any external resources (S3 files, etc.)

## 🔧 Schema Context Management

### Setting Schema Context
The system uses PostgreSQL's `search_path` to set the active schema context:

```sql
-- Set search path to tenant schema
SET search_path TO "tenant_123";

-- Now all queries operate within tenant_123 schema
SELECT * FROM patients;  -- Queries tenant_123.patients
```

### Middleware Implementation
```typescript
// Tenant middleware sets schema context
export const tenantMiddleware = async (req, res, next) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  
  if (!tenantId) {
    return res.status(400).json({ message: 'X-Tenant-ID header is required' });
  }

  const client = await pool.connect();
  try {
    // Set search path to tenant schema
    await client.query(`SET search_path TO "${tenantId}"`);
    req.dbClient = client;
    
    // Release client when response finishes
    res.on('finish', () => client.release());
    next();
  } catch (error) {
    client.release();
    res.status(500).json({ message: 'Failed to set tenant context' });
  }
};
```

## 🗂️ Table Distribution Strategy

### Global Tables (Public Schema)
Tables that exist (or will exist) once for the entire system:

| Table | Purpose | Why Global | Status |
|-------|---------|------------|--------|
| `tenants` | Tenant registry | Central tenant management | ✅ EXISTS |
| `pgmigrations` | Migration tracking | System maintenance | ✅ EXISTS |
| `users` | User accounts | Cross-tenant user lookup | ❌ NOT CREATED |
| `roles` | Role definitions | Shared role types across tenants | ❌ NOT CREATED |
| `user_roles` | User-role assignments | Links global users to global roles | ❌ NOT CREATED |
| `user_verification` | Verification codes | Email verification across tenants | ❌ NOT CREATED |

### Tenant-Specific Tables (Tenant Schemas)
Tables that exist separately for each tenant:

| Table Category | Examples | Why Tenant-Specific |
|----------------|----------|-------------------|
| **Patient Data** | `patients`, `patient_history` | Complete data isolation |
| **Medical Records** | `medical_records`, `prescriptions` | Privacy and compliance |
| **Appointments** | `appointments`, `schedules` | Tenant-specific workflows |
| **Billing** | `invoices`, `payments` | Financial data isolation |
| **Inventory** | `medications`, `equipment` | Tenant-specific resources |

## 🔍 Schema Queries and Operations

### Check if Schema Exists
```sql
SELECT EXISTS(
  SELECT 1 FROM information_schema.schemata 
  WHERE schema_name = $1
) as schema_exists;
```

### List All Tenant Schemas
```sql
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name LIKE 'tenant_%' 
ORDER BY schema_name;
```

### Get Tables in Tenant Schema
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = $1 
ORDER BY table_name;
```

## 🛡️ Security and Isolation

### Complete Data Isolation
- **Physical Separation**: Each tenant's data is in separate schema
- **Query Isolation**: `search_path` ensures queries only access tenant data
- **No Cross-Tenant Queries**: Impossible to accidentally query another tenant's data
- **Schema-Level Permissions**: Can set different permissions per schema

### Access Control
```sql
-- Create tenant-specific user (if needed)
CREATE USER tenant_123_user;

-- Grant access only to tenant schema
GRANT USAGE ON SCHEMA "tenant_123" TO tenant_123_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA "tenant_123" TO tenant_123_user;

-- Revoke access to other schemas
REVOKE ALL ON SCHEMA public FROM tenant_123_user;
```

## ⚠️ Common Pitfalls and Solutions

### Schema Context Issues
- **Problem**: Forgetting to set schema context
- **Solution**: Always use tenant middleware for protected routes
- **Detection**: Queries fail with "relation does not exist" errors

### Cross-Schema References
- **Problem**: Foreign keys between schemas don't work
- **Solution**: Use application-level relationships, not database FKs
- **Pattern**: Store IDs and validate relationships in application code

### Migration Complexity
- **Problem**: Applying migrations to multiple schemas
- **Solution**: Create migration helpers for tenant-specific changes
- **Best Practice**: Test migrations on sample tenant schemas first

## 🚨 Best Practices

### Schema Naming
- Use consistent naming pattern (`tenant_${id}`)
- Avoid special characters in tenant IDs
- Keep tenant IDs reasonably short but descriptive
- Validate tenant ID format before schema creation

### Data Isolation
- Never write queries that span multiple tenant schemas
- Always validate tenant context before operations
- Use middleware to enforce schema context
- Implement proper error handling for schema operations