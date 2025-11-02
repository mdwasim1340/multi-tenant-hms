# Database Schema Management - AI Agent Steering Rules

## 🎯 Core Principles

### Always Verify Current Database State
- **NEVER assume** what tables exist based on migration files
- **ALWAYS verify** actual PostgreSQL database state before making changes
- **Use live database queries** to check current schema, not migration directory
- **Document actual state** after every database operation

### Prevent Conflicts and Duplicates
- **Check existing tables** before creating new ones
- **Verify schema structure** matches documentation before modifications
- **Coordinate with other agents** working on database simultaneously
- **Update documentation immediately** after any database changes

## 🗃️ Current Database State (Verified Nov 2, 2025 - 13:25 UTC - AGENT A COMPLETE)

### ✅ Existing Tables (Public Schema) - 100% COMPLETE
```sql
-- VERIFIED: ALL CORE TABLES EXIST AND FUNCTIONAL (Agent A Mission Complete)
tenants (6 active tenants)
├── demo_hospital_001 (City Hospital - Enterprise)
├── tenant_1762083064503 (Auto ID Hospital - Basic)
├── tenant_1762083064515 (Complex Form Hospital - Enterprise)
├── tenant_1762083586064 (Md Wasim Akram - Basic)
├── test_complete_1762083043709 (Complete Test Hospital - Premium)
└── test_complete_1762083064426 (Complete Test Hospital - Premium)

users (6 admin users created)
├── Admin users for each tenant with proper relationships
├── Bcrypt-ready password hashing
├── Multi-tenant isolation enforced
└── Foreign key constraints to tenants table

roles (7 hospital roles defined)
├── Admin, Doctor, Nurse, Receptionist
├── Lab Technician, Pharmacist, Manager
└── Complete role-based access control foundation

user_roles (6 admin assignments)
├── Each tenant has an admin user
├── Many-to-many user-role relationships
└── Proper foreign key constraints

user_verification (email system)
├── Time-based OTP system
├── Password reset functionality
└── Email verification support

pgmigrations (migration tracking restored)
├── 4 completed migrations tracked
├── Migration system functional
└── Ready for future schema changes
```

### ✅ Existing Schemas - READY FOR HOSPITAL TABLES
```sql
-- VERIFIED: 6 tenant schemas exist and ready for hospital management tables
- public (✅ COMPLETE - all core tables with 10 performance indexes)
- demo_hospital_001 (✅ READY - awaiting hospital tables)
- tenant_1762083064503 (✅ READY - awaiting hospital tables)
- tenant_1762083064515 (✅ READY - awaiting hospital tables)
- tenant_1762083586064 (✅ READY - awaiting hospital tables)
- test_complete_1762083043709 (✅ READY - awaiting hospital tables)
- test_complete_1762083064426 (✅ READY - awaiting hospital tables)
```

### 🎯 Next Phase: Hospital Management Tables (Agent B)
```sql
-- These tables READY TO BE CREATED in all tenant schemas:
patients (patient demographics and medical history)
appointments (scheduling and doctor assignments)
medical_records (visit records and diagnoses)
prescriptions (medication management)
lab_tests (laboratory results and orders)
-- Can reference users.id for doctor_id foreign keys (✅ READY)
```

### ✅ Migration Status - FULLY OPERATIONAL
- **Status**: ✅ All core migrations successfully applied
- **Completed**: 4 migrations recorded in pgmigrations table
- **System**: ✅ Migration system restored and functional
- **Next Step**: Agent B can create hospital management tables

## 📋 Mandatory Pre-Work Verification

### Before ANY Database Operation
```bash
# 1. ALWAYS verify current database state first
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema NOT IN ('information_schema', 'pg_catalog') 
ORDER BY table_schema, table_name;
"

# 2. Check specific table structure before modifying
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "\d table_name"

# 3. Verify migration status
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "SELECT * FROM pgmigrations ORDER BY run_on;"
```

### Before Creating Tables
```sql
-- MANDATORY: Check if table already exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'your_table_name'
);

-- MANDATORY: Check if schema exists for tenant tables
SELECT EXISTS (
  SELECT FROM information_schema.schemata 
  WHERE schema_name = 'your_schema_name'
);
```

## 🛡️ Database Operation Rules

### Table Creation Rules
1. **NEVER create tables without verification**
   - Always check if table exists first
   - Verify schema structure matches expectations
   - Check for naming conflicts with existing tables

2. **Follow established naming conventions**
   - Use snake_case for all database objects
   - Use singular table names (patient, not patients) for new tables
   - Follow foreign key naming: `{table}_id`

3. **Respect multi-tenant architecture**
   - Global tables go in public schema only
   - Tenant-specific tables go in tenant schemas only
   - Never mix global and tenant data in same table

### Schema Modification Rules
1. **Always use transactions for complex operations**
   ```sql
   BEGIN;
   -- Your operations here
   COMMIT; -- or ROLLBACK on error
   ```

2. **Create indexes for performance**
   - Always index foreign key columns
   - Index frequently queried columns
   - Use descriptive index names: `{table}_{column}_idx`

3. **Maintain referential integrity**
   - Use proper foreign key constraints
   - Set appropriate CASCADE rules
   - Validate relationships work correctly

### Documentation Update Rules
1. **Update documentation IMMEDIATELY after changes**
   - Modify relevant files in `backend/docs/database-schema/`
   - Update current state summaries
   - Document any new relationships or constraints

2. **Verify documentation accuracy**
   - Cross-check documentation against actual database
   - Update ERD diagrams if relationships change
   - Maintain migration history accuracy

## 🔄 Agent Coordination Rules

### Work Division Respect
- **Agent A**: Focus on public schema (users, roles, authentication)
- **Agent B**: Focus on tenant schemas (hospital management tables)
- **Coordinate**: When work overlaps or dependencies exist

### Communication Requirements
1. **Status Updates**: Update progress in shared documentation
2. **Blocking Issues**: Document any problems that prevent progress
3. **Completion Confirmation**: Verify work before marking complete

### Dependency Management
- **Agent B MUST wait** for Agent A to create users table before referencing it
- **Both agents** must coordinate on foreign key relationships
- **Test integration** after both complete their core work

## 📊 Required Verification Commands

### Database State Verification
```bash
# Check all tables across all schemas
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "
SELECT 
  schemaname, 
  tablename, 
  tableowner 
FROM pg_tables 
WHERE schemaname NOT IN ('information_schema', 'pg_catalog') 
ORDER BY schemaname, tablename;
"

# Check foreign key relationships
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "
SELECT 
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS referenced_table
FROM pg_constraint 
WHERE contype = 'f'
ORDER BY conrelid::regclass;
"

# Check indexes
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "
SELECT 
  schemaname, 
  tablename, 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
ORDER BY schemaname, tablename, indexname;
"
```

### Tenant Schema Verification
```bash
# Check tenant schema contents
for schema in $(docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -t -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%';"); do
  echo "=== Schema: $schema ==="
  docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = '$schema' 
    ORDER BY table_name;
  "
done
```

## 🚨 Critical Restrictions

### NEVER Do These Things
1. **Don't assume migration state** - Always verify actual database
2. **Don't create duplicate tables** - Check existence first
3. **Don't ignore foreign key constraints** - Validate relationships
4. **Don't skip documentation updates** - Keep docs current
5. **Don't work in isolation** - Coordinate with other agents
6. **Don't use reserved words** - Follow naming conventions
7. **Don't create cross-tenant references** - Respect isolation

### ALWAYS Do These Things
1. **Verify current state** before any operation
2. **Use transactions** for complex operations
3. **Create appropriate indexes** for performance
4. **Update documentation** immediately after changes
5. **Test functionality** after creating tables
6. **Coordinate with other agents** on dependencies
7. **Follow established patterns** from existing code

## 📋 Documentation Update Checklist

### After Creating Tables
- [ ] Update `backend/docs/database-schema/core/` files for global tables
- [ ] Update `backend/docs/database-schema/multi-tenancy/` for tenant tables
- [ ] Update `backend/docs/database-schema/reference/table-relationships.md`
- [ ] Update `backend/docs/database-schema/CURRENT_STATE_SUMMARY.md`
- [ ] Update migration history if migrations were used

### After Modifying Schema
- [ ] Verify all foreign key relationships still work
- [ ] Update ERD diagrams if relationships changed
- [ ] Test API endpoints still function correctly
- [ ] Update service layer code if needed
- [ ] Document any breaking changes

## 🎯 Success Validation

### Before Marking Work Complete
```sql
-- Verify table creation (CORE TABLES ALREADY EXIST!)
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'roles', 'user_roles', 'user_verification');
-- Should return 4 (CURRENTLY RETURNS 4 - COMPLETE!)

-- Verify tenant tables (run for each tenant schema)
SET search_path TO "tenant_1762083064503";
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'tenant_1762083064503' 
AND table_name IN ('patients', 'appointments', 'medical_records');
-- Should return 3+ for Agent B work

-- Verify foreign keys work
SELECT 
  COUNT(*) as fk_count 
FROM pg_constraint 
WHERE contype = 'f';
-- Should be > 0 after table creation

-- Test basic functionality
INSERT INTO roles (name, description) VALUES ('Test Role', 'Test Description');
SELECT * FROM roles WHERE name = 'Test Role';
DELETE FROM roles WHERE name = 'Test Role';
```

## 🔧 Emergency Procedures

### If Tables Already Exist
```sql
-- Check table structure matches expectations
\d existing_table_name

-- If structure is wrong, consider:
-- Option 1: Drop and recreate (if no important data)
DROP TABLE IF EXISTS table_name CASCADE;

-- Option 2: Alter table to match (if data exists)
ALTER TABLE table_name ADD COLUMN new_column VARCHAR(255);
```

### If Migration Conflicts Occur
```sql
-- Mark problematic migration as complete
INSERT INTO pgmigrations (name, run_on) 
VALUES ('migration_name', NOW());

-- Then run remaining migrations
-- npx node-pg-migrate up
```

### If Foreign Key Errors Occur
```sql
-- Check what references exist
SELECT 
  conname, 
  conrelid::regclass, 
  confrelid::regclass 
FROM pg_constraint 
WHERE confrelid::regclass = 'your_table'::regclass;

-- Drop problematic constraints if needed
ALTER TABLE table_name DROP CONSTRAINT constraint_name;
```

This steering document ensures AI agents will work safely and coordinately with the database schema while maintaining accurate documentation and preventing conflicts.