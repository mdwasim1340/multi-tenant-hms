# Bed Management System - Migration Testing Guide

## Overview

This guide provides instructions for testing the bed management database migrations.

## Prerequisites

- PostgreSQL database running
- Backend environment configured
- At least one active tenant in the system
- Node.js and npm installed

---

## Step 1: Run Migrations

### Using node-pg-migrate

```bash
cd backend

# Run all pending migrations
npx node-pg-migrate up

# Or run to a specific migration
npx node-pg-migrate up -t 1731651200000
```

### Verify Migrations Applied

```bash
# Check migration status
npx node-pg-migrate status
```

---

## Step 2: Run Test Script

### Install Dependencies (if needed)

```bash
cd backend
npm install
```

### Run the Test Script

```bash
# Make script executable
chmod +x scripts/test-bed-migrations.ts

# Run tests
ts-node scripts/test-bed-migrations.ts
```

### Expected Output

The test script will:
1. ✅ Verify departments table exists with proper structure
2. ✅ Verify beds table exists with foreign keys
3. ✅ Verify bed_assignments table with EXCLUDE constraint
4. ✅ Test data insertion into all tables
5. ✅ Verify automatic bed status updates via triggers
6. ✅ Test double-booking prevention
7. ✅ Clean up test data

---

## Step 3: Manual Verification

### Connect to Database

```bash
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db
```

### Check Tables in Tenant Schema

```sql
-- Set search path to tenant schema
SET search_path TO tenant_hospital_123, public;

-- List all tables
\dt

-- Check departments table
SELECT * FROM departments;

-- Check beds table
SELECT * FROM beds;

-- Check bed_assignments table
SELECT * FROM bed_assignments;
```

### Verify Constraints

```sql
-- Check unique constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'departments';

-- Check foreign keys
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'beds' AND constraint_type = 'FOREIGN KEY';

-- Check EXCLUDE constraint
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'bed_assignments' AND constraint_type = 'EXCLUDE';
```

### Verify Indexes

```sql
-- List all indexes for departments
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'departments';

-- List all indexes for beds
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'beds';

-- List all indexes for bed_assignments
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'bed_assignments';
```

### Verify Triggers

```sql
-- Check triggers on bed_assignments
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'bed_assignments';
```

---

## Step 4: Test Double-Booking Prevention

### Insert Test Data

```sql
-- Insert a test department
INSERT INTO departments (department_name, department_code, total_capacity, status, created_by)
VALUES ('Test ICU', 'TEST-ICU', 10, 'active', 1)
RETURNING id;

-- Insert a test bed (use department_id from above)
INSERT INTO beds (bed_number, department_id, bed_type, status, room_number, created_by)
VALUES ('TEST-BED-001', 1, 'icu', 'available', 'R101', 1)
RETURNING id;

-- Insert a test patient (or use existing patient_id)
SELECT id FROM patients LIMIT 1;

-- Create bed assignment (use bed_id and patient_id from above)
INSERT INTO bed_assignments (bed_id, patient_id, status, admission_date, created_by)
VALUES (1, 1, 'active', NOW(), 1)
RETURNING id;

-- Verify bed status changed to 'occupied'
SELECT status FROM beds WHERE id = 1;

-- Try to create another active assignment for the same bed (should fail)
INSERT INTO bed_assignments (bed_id, patient_id, status, admission_date, created_by)
VALUES (1, 2, 'active', NOW(), 1);
-- Expected: ERROR: conflicting key value violates exclusion constraint
```

### Clean Up Test Data

```sql
DELETE FROM bed_assignments WHERE bed_id = 1;
DELETE FROM beds WHERE id = 1;
DELETE FROM departments WHERE id = 1;
```

---

## Verification Checklist

### ✅ Departments Table
- [ ] Table created in tenant schema
- [ ] All columns present (id, department_name, department_code, etc.)
- [ ] Unique constraint on department_code
- [ ] Indexes created (department_code, status)
- [ ] Triggers for updated_at working

### ✅ Beds Table
- [ ] Table created in tenant schema
- [ ] All columns present (id, bed_number, department_id, bed_type, etc.)
- [ ] Foreign key to departments table
- [ ] Unique constraint on bed_number
- [ ] JSONB features column exists
- [ ] Indexes created (bed_number, department_id, status, bed_type)
- [ ] Triggers for updated_at working

### ✅ Bed Assignments Table
- [ ] Table created in tenant schema
- [ ] All columns present (id, bed_id, patient_id, status, etc.)
- [ ] Foreign keys to beds and patients tables
- [ ] EXCLUDE constraint prevents double-booking
- [ ] Indexes created (bed_id, patient_id, status, admission_date)
- [ ] Trigger updates bed status on assignment
- [ ] Trigger updates bed status on discharge
- [ ] Triggers for updated_at working

---

## Troubleshooting

### Migration Fails: "relation does not exist"
**Solution**: Ensure you're in the correct tenant schema
```sql
SET search_path TO tenant_hospital_123, public;
```

### Migration Fails: "extension btree_gist does not exist"
**Solution**: Install the extension
```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
```

### Test Script Fails: "No active tenant found"
**Solution**: Create a tenant first using the tenant creation script

### Foreign Key Error: "violates foreign key constraint"
**Solution**: Ensure patients table exists with data, or modify test script

### EXCLUDE Constraint Not Working
**Solution**: Verify btree_gist extension is installed
```sql
SELECT * FROM pg_extension WHERE extname = 'btree_gist';
```

---

## Rollback Migrations (if needed)

```bash
# Rollback last migration
npx node-pg-migrate down

# Rollback to specific migration
npx node-pg-migrate down -t 1731651000000
```

---

## Next Steps

Once migrations are tested and verified:

1. ✅ Continue with Task 1.4: Create Bed Transfers Table
2. ✅ Continue with Task 1.5: Seed Initial Department Data
3. ✅ Move to Phase 2: TypeScript Interfaces
4. ✅ Move to Phase 3: Backend Service Layer

---

## Support

If you encounter issues:
1. Check database logs: `docker logs backend-postgres-1`
2. Check backend logs
3. Verify environment variables in `.env`
4. Ensure PostgreSQL version supports required features (>= 12)

---

**Last Updated**: November 15, 2025
**Migration Files**:
- `1731651000000_create_departments_table.sql`
- `1731651100000_create_beds_table.sql`
- `1731651200000_create_bed_assignments_table.sql`
