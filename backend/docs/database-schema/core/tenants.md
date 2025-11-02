# Tenants Table Documentation

## 📋 Table Overview

The `tenants` table is the core table for multi-tenant architecture, storing information about each hospital or organization using the system.

## 🗃️ Table Structure

### Table Name: `tenants`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `character varying(255)` | PRIMARY KEY, NOT NULL | Unique tenant identifier (e.g., "tenant_123") |
| `name` | `character varying(255)` | NOT NULL | Display name of the tenant/hospital |
| `email` | `character varying(255)` | NOT NULL | Primary contact email for the tenant |
| `plan` | `character varying(255)` | NOT NULL | Subscription plan ("basic", "premium", "enterprise") |
| `status` | `character varying(255)` | NOT NULL | Tenant status ("active", "inactive", "suspended") |
| `joindate` | `timestamp without time zone` | NOT NULL, DEFAULT CURRENT_TIMESTAMP | When the tenant was created |

## 🔗 Relationships

### One-to-Many Relationships (Planned)
- **tenants → users**: One tenant can have many users
  - Foreign Key: `users.tenant_id` references `tenants.id` (NOT YET IMPLEMENTED)
  - Cascade: ON DELETE CASCADE (deleting tenant removes all users)
  - Status: ❌ Users table not yet created

### Schema Relationships
- **tenants → PostgreSQL schemas**: Each tenant gets a dedicated schema
  - Schema name matches `tenants.id` (e.g., schema "tenant_123")
  - Created automatically when tenant is created
  - Dropped when tenant is deleted

## 📝 SQL Definition

```sql
CREATE TABLE tenants (
  id character varying(255) PRIMARY KEY NOT NULL,
  name character varying(255) NOT NULL,
  email character varying(255) NOT NULL,
  plan character varying(255) NOT NULL,
  status character varying(255) NOT NULL,
  joindate timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## 🔍 Common Queries

### Get All Active Tenants
```sql
SELECT * FROM tenants WHERE status = 'active';
```

### Get Tenant by ID
```sql
SELECT * FROM tenants WHERE id = $1;
```

### Count Tenants by Plan
```sql
SELECT plan, COUNT(*) as count 
FROM tenants 
GROUP BY plan;
```

### Get Tenant with User Count
```sql
SELECT t.*, COUNT(u.id) as user_count 
FROM tenants t 
LEFT JOIN users u ON t.id = u.tenant_id 
GROUP BY t.id;
```

## 🛠️ Service Operations

### Create Tenant
- **Service**: `tenant.ts` → `createTenant()`
- **Process**:
  1. Validate required fields (name, email, plan, status)
  2. Auto-generate ID if not provided (`tenant_${Date.now()}`)
  3. Begin database transaction
  4. Create PostgreSQL schema with tenant ID
  5. Insert tenant record
  6. Commit transaction
- **Rollback**: If schema creation fails, rollback tenant insertion

### Delete Tenant
- **Service**: `tenant.ts` → `deleteTenant()`
- **Process**:
  1. Begin database transaction
  2. Drop PostgreSQL schema (CASCADE removes all tables)
  3. Delete tenant record
  4. Commit transaction
- **Warning**: This permanently deletes ALL tenant data

## 🚨 Important Considerations

### Tenant ID Format
- **Pattern**: `tenant_${timestamp}` for auto-generated IDs
- **Manual IDs**: Must be unique, alphanumeric, no spaces
- **Schema Names**: Must be valid PostgreSQL schema names

### Status Values
- `"active"`: Tenant is operational and can access the system
- `"inactive"`: Tenant exists but cannot access the system
- `"suspended"`: Tenant is temporarily disabled
- `"pending"`: Tenant is being set up

### Plan Types
- `"basic"`: Basic hospital management features
- `"premium"`: Advanced features and analytics  
- `"enterprise"`: Full feature set with custom integrations

### Current Tenants (As of Nov 2, 2025)
- `test_complete_1762083043709`: Complete Test Hospital (premium)
- `test_complete_1762083064426`: Complete Test Hospital (premium)
- `tenant_1762083064503`: Auto ID Hospital (basic)
- `tenant_1762083064515`: Complex Form Hospital (enterprise)
- `tenant_1762083586064`: Md Wasim Akram (basic)

## 🔐 Security Notes

- **Schema Isolation**: Each tenant's data is completely isolated
- **Access Control**: Users can only access their tenant's data
- **Tenant Context**: All API requests require `X-Tenant-ID` header
- **Validation**: Always validate tenant exists before operations

## 📊 Migration History

### Migration: `1788886400000_create-tenants-table.js`
- **Created**: Latest tenant table structure
- **Purpose**: Replace old tenants table with new schema
- **Changes**: Added plan, status, and proper string ID

### Migration: `1762003868921_update-users-and-add-roles-tables.js`
- **Created**: Original tenants table (integer ID)
- **Purpose**: Support multi-tenant user relationships
- **Superseded**: By newer migration with string IDs

## ⚠️ Common Mistakes to Avoid

1. **Don't create duplicate tenant tables** - Use existing `tenants` table
2. **Don't use integer IDs** - Current schema uses string IDs
3. **Don't forget schema creation** - Always create PostgreSQL schema for new tenants
4. **Don't skip transaction** - Use transactions for tenant creation/deletion
5. **Don't allow cross-tenant access** - Always validate tenant context