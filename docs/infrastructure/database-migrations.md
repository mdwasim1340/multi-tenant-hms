# Database Migrations Guide

**Multi-Tenant Hospital Management System**  
**Date**: November 9, 2025  
**Version**: 1.0

---

## Overview

This guide covers database migration procedures for the multi-tenant hospital management system, including creating, running, and rolling back migrations.

---

## Table of Contents

1. [Migration System Overview](#migration-system-overview)
2. [Migration Structure](#migration-structure)
3. [Creating New Migrations](#creating-new-migrations)
4. [Running Migrations](#running-migrations)
5. [Rolling Back Migrations](#rolling-back-migrations)
6. [Existing Migrations](#existing-migrations)
7. [Testing Migrations](#testing-migrations)
8. [Backup Procedures](#backup-procedures)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Migration System Overview

### What are Migrations?

Database migrations are version-controlled changes to your database schema. They allow you to:
- Track schema changes over time
- Deploy database changes consistently across environments
- Rollback changes if needed
- Collaborate with team members on schema changes

### Migration Tracking

Migrations are tracked in the `pgmigrations` table:

```sql
CREATE TABLE pgmigrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  run_on TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## Migration Structure

### Directory Layout

```
backend/
├── migrations/
│   ├── schemas/                          # Schema definitions
│   ├── 1678886400000_initial-migration.js
│   ├── 1762003868919_create-user-verification-table.js
│   ├── add-subdomain-to-tenants.sql
│   ├── create-tenant-branding.sql
│   └── ...
├── run-migrations.js                     # Migration runner
└── package.json
```

### Migration File Types

**1. JavaScript Migrations (.js)**
- Used for complex migrations with logic
- Support `up()` and `down()` functions
- Can include conditional logic

**Example**:
```javascript
exports.up = (pgm) => {
  pgm.createTable('users', {
    id: { type: 'serial', primaryKey: true },
    email: { type: 'string', notNull: true },
    created_at: { 
      type: 'timestamp', 
      notNull: true, 
      default: pgm.func('NOW()') 
    }
  });
};

exports.down = (pgm) => {
  pgm.dropTable('users');
};
```

**2. SQL Migrations (.sql)**
- Pure SQL files
- Simpler to write for straightforward changes
- Better for complex queries

**Example**:
```sql
-- Add subdomain column to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS subdomain VARCHAR(63) UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain 
ON tenants(subdomain);
```

---

## Creating New Migrations

### Naming Convention

**Format**: `{timestamp}_{description}.{js|sql}`

**Examples**:
- `1762003868919_create-users-table.js`
- `add-subdomain-to-tenants.sql`
- `create-tenant-branding.sql`

**Best Practices**:
- Use descriptive names (e.g., `create-patients-table` not `migration1`)
- Use hyphens for spaces (e.g., `add-column-to-users`)
- Be specific (e.g., `add-email-index-to-users` not `add-index`)

### Timestamp Generation

**Node.js**:
```bash
node -e "console.log(Date.now())"
# Output: 1762003868919
```

**PowerShell**:
```powershell
[DateTimeOffset]::Now.ToUnixTimeMilliseconds()
```

### Step-by-Step: Create JavaScript Migration

**1. Create migration file**:
```bash
cd backend/migrations
# Create file: 1762004000000_add-phone-to-patients.js
```

**2. Write migration code**:
```javascript
/**
 * Migration: Add phone number to patients table
 * Date: 2025-11-09
 */

exports.up = (pgm) => {
  pgm.addColumn('patients', {
    phone: {
      type: 'VARCHAR(20)',
      notNull: false
    }
  });
  
  // Add index for phone lookups
  pgm.createIndex('patients', 'phone', {
    name: 'idx_patients_phone'
  });
};

exports.down = (pgm) => {
  pgm.dropIndex('patients', 'phone', {
    name: 'idx_patients_phone'
  });
  
  pgm.dropColumn('patients', 'phone');
};
```

**3. Test migration**:
```bash
npm run migrate
```

### Step-by-Step: Create SQL Migration

**1. Create migration file**:
```bash
cd backend/migrations
# Create file: add-status-to-appointments.sql
```

**2. Write SQL**:
```sql
-- Migration: Add status to appointments
-- Date: 2025-11-09

-- Add status column
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) 
DEFAULT 'scheduled' 
NOT NULL;

-- Add check constraint
ALTER TABLE appointments
ADD CONSTRAINT check_appointment_status 
CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled'));

-- Create index
CREATE INDEX IF NOT EXISTS idx_appointments_status 
ON appointments(status);

-- Add comment
COMMENT ON COLUMN appointments.status IS 'Appointment status: scheduled, confirmed, completed, cancelled';
```

**3. Test migration**:
```bash
npm run migrate
```

---

## Running Migrations

### Development Environment

**1. Ensure database is running**:
```bash
# Check PostgreSQL status
psql --version

# Test connection
psql -U postgres -h localhost -d hospital_management
```

**2. Run migrations**:
```bash
cd backend
npm run migrate

# Or directly with Node
node run-migrations.js
```

**Expected Output**:
```
🔄 Running database migrations...
✅ UUID extension enabled
Found 10 migration files
⏭️  Skipping 1678886400000_initial-migration (already completed)
⏭️  Skipping add-subdomain-to-tenants (already completed)
🔄 Running migration: create-new-feature
✅ Completed migration: create-new-feature
✅ All migrations completed successfully
✅ Tenants table exists and ready for use
```

### Staging/Production Environment

**1. Backup database first** (see [Backup Procedures](#backup-procedures))

**2. Set environment variables**:
```bash
# Use production database
export DATABASE_URL="postgresql://user:pass@prod-db.example.com:5432/hospital_prod"

# Or set individual variables
export DB_USER="postgres"
export DB_HOST="prod-db.example.com"
export DB_NAME="hospital_prod"
export DB_PASSWORD="secure_password"
export DB_PORT="5432"
```

**3. Run migrations**:
```bash
cd backend
NODE_ENV=production node run-migrations.js
```

**4. Verify migrations**:
```sql
-- Check migration status
SELECT * FROM pgmigrations ORDER BY run_on DESC;

-- Verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

---

## Rolling Back Migrations

### Manual Rollback Process

**Note**: The current migration system doesn't support automatic rollbacks. Manual rollback required.

**1. Backup database**:
```bash
pg_dump -U postgres -h localhost hospital_management > backup_before_rollback.sql
```

**2. Identify migration to rollback**:
```sql
-- View recent migrations
SELECT * FROM pgmigrations ORDER BY run_on DESC LIMIT 5;
```

**3. Write rollback SQL**:
```sql
-- Reverse the changes made by the migration
-- Example: If migration added a column, drop it

BEGIN;

-- Drop column added by migration
ALTER TABLE patients DROP COLUMN IF EXISTS phone;

-- Drop index
DROP INDEX IF EXISTS idx_patients_phone;

-- Remove migration record
DELETE FROM pgmigrations WHERE name = 'add-phone-to-patients';

COMMIT;
```

**4. Execute rollback**:
```bash
psql -U postgres -h localhost -d hospital_management -f rollback.sql
```

### Best Practices for Rollbacks

✅ **Always backup before rollback**  
✅ **Test rollback on staging first**  
✅ **Document rollback procedures in migration files**  
✅ **Keep rollback scripts in version control**

---

## Existing Migrations

### Current Migration List

| Migration | Description | Date Added |
|-----------|-------------|------------|
| `1678886400000_initial-migration.js` | Initial schema setup | Initial |
| `1788886400000_create-tenants-table.js` | Tenants table creation | Initial |
| `1762003868919_create-user-verification-table.js` | User verification | Initial |
| `1762003868921_update-users-and-add-roles-tables.js` | User roles system | Initial |
| `005-create-custom-fields-tables.js` | Custom fields support | Phase 1 |
| `006-create-custom-field-values-tenant-table.js` | Custom field values | Phase 1 |
| `add-subdomain-to-tenants.sql` | Subdomain support | Phase 6 |
| `create-tenant-branding.sql` | Branding tables | Phase 7 |
| `create-medical-records-schema.sql` | Medical records | Core |
| `create-lab-tests-schema.sql` | Lab tests | Core |

### View Applied Migrations

```sql
-- All migrations
SELECT id, name, run_on 
FROM pgmigrations 
ORDER BY id;

-- Recent migrations (last 10)
SELECT id, name, run_on 
FROM pgmigrations 
ORDER BY run_on DESC 
LIMIT 10;

-- Count total migrations
SELECT COUNT(*) as total_migrations 
FROM pgmigrations;
```

---

## Testing Migrations

### Pre-Migration Testing

**1. Create test database**:
```bash
psql -U postgres
CREATE DATABASE hospital_test;
\q
```

**2. Run migrations on test database**:
```bash
export DB_NAME=hospital_test
node run-migrations.js
```

**3. Verify schema**:
```sql
-- Connect to test database
\c hospital_test

-- Check tables
\dt

-- Describe specific table
\d tenants
\d tenant_branding
```

**4. Test data insertion**:
```sql
-- Test inserting data
INSERT INTO tenants (name, subdomain) 
VALUES ('Test Hospital', 'test-hospital');

-- Verify
SELECT * FROM tenants;
```

### Post-Migration Validation

**1. Schema validation**:
```sql
-- Verify columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'your_table'
ORDER BY ordinal_position;

-- Verify indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'your_table';

-- Verify constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'your_table';
```

**2. Application testing**:
```bash
# Start backend
cd backend
npm run dev

# Run integration tests
npm test

# Manual API testing
curl http://localhost:3000/health/db
```

---

## Backup Procedures

### Before Running Migrations

**1. Full database backup**:
```bash
# Basic backup
pg_dump -U postgres -h localhost hospital_management > backup.sql

# With timestamp
pg_dump -U postgres hospital_management > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
pg_dump -U postgres hospital_management | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

**2. Schema-only backup** (faster, no data):
```bash
pg_dump -U postgres -s hospital_management > schema_backup.sql
```

**3. Specific table backup**:
```bash
pg_dump -U postgres -t tenants -t tenant_branding hospital_management > tables_backup.sql
```

### Restore from Backup

**1. Drop existing database** (if needed):
```bash
psql -U postgres
DROP DATABASE hospital_management;
CREATE DATABASE hospital_management;
\q
```

**2. Restore**:
```bash
# From SQL file
psql -U postgres hospital_management < backup.sql

# From compressed file
gunzip -c backup.sql.gz | psql -U postgres hospital_management
```

### Automated Backup Script

Create `backend/scripts/backup-db.sh`:

```bash
#!/bin/bash

# Database backup script
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME=${DB_NAME:-hospital_management}
DB_USER=${DB_USER:-postgres}

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
echo "Creating backup: $BACKUP_DIR/backup_$TIMESTAMP.sql"
pg_dump -U $DB_USER $DB_NAME > "$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Compress
gzip "$BACKUP_DIR/backup_$TIMESTAMP.sql"

echo "Backup completed: $BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

# Delete backups older than 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
echo "Cleaned up old backups (>30 days)"
```

**Usage**:
```bash
chmod +x backend/scripts/backup-db.sh
./backend/scripts/backup-db.sh
```

---

## Best Practices

### Migration Development

✅ **Always test migrations locally first**  
✅ **One logical change per migration**  
✅ **Use transactions when possible**  
✅ **Include rollback instructions in comments**  
✅ **Keep migrations small and focused**

### Naming Conventions

✅ **Use descriptive names**: `add-email-to-users` not `migration1`  
✅ **Use action verbs**: `create`, `add`, `remove`, `update`  
✅ **Be specific**: `add-subdomain-to-tenants` not `add-column`

### Safety Practices

✅ **Always backup before migrations**  
✅ **Test on staging before production**  
✅ **Run during low-traffic periods**  
✅ **Have rollback plan ready**  
✅ **Monitor application after migration**

### Code Quality

✅ **Add comments explaining the change**  
✅ **Include date and author**  
✅ **Handle `IF EXISTS`/`IF NOT EXISTS`**  
✅ **Use constraints to maintain data integrity**

---

## Troubleshooting

### Common Issues

**1. "relation already exists"**

**Cause**: Migration trying to create existing table

**Solution**:
```sql
-- Use IF NOT EXISTS
CREATE TABLE IF NOT EXISTS users (...);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
```

**2. "column does not exist"**

**Cause**: Migration assumes column that doesn't exist

**Solution**:
```sql
-- Check before dropping
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='old_column'
    ) THEN
        ALTER TABLE users DROP COLUMN old_column;
    END IF;
END $$;
```

**3. "migration failed: syntax error"**

**Cause**: SQL syntax error in migration

**Solution**:
- Test SQL in psql first
- Check semicolons and commas
- Verify table/column names

**4. "cannot connect to database"**

**Cause**: Database not running or wrong credentials

**Solution**:
```bash
# Check PostgreSQL status
psql --version

# Test connection
psql -U postgres -h localhost -d hospital_management

# Verify .env file
cat backend/.env | grep DB_
```

**5. "migration stuck/hanging"**

**Cause**: Long-running query or lock

**Solution**:
```sql
-- Check active queries
SELECT pid, query, state, query_start
FROM pg_stat_activity
WHERE state = 'active';

-- Cancel query if needed
SELECT pg_cancel_backend(pid);

-- Or terminate connection
SELECT pg_terminate_backend(pid);
```

### Recovery Procedures

**If migration fails halfway**:

1. **Restore from backup**:
```bash
psql -U postgres hospital_management < backup_before_migration.sql
```

2. **Remove failed migration record**:
```sql
DELETE FROM pgmigrations WHERE name = 'failed_migration_name';
```

3. **Fix migration file**

4. **Re-run migration**:
```bash
node run-migrations.js
```

---

## Migration Workflow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ 1. Create Migration File                                │
│    - Name with timestamp                                │
│    - Write up/down functions                            │
└───────────────────┬─────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────┐
│ 2. Test Locally                                         │
│    - Create test database                               │
│    - Run migration                                      │
│    - Verify schema changes                              │
└───────────────────┬─────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────┐
│ 3. Commit to Version Control                            │
│    - Add migration file                                 │
│    - Document changes                                   │
└───────────────────┬─────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────┐
│ 4. Deploy to Staging                                    │
│    - Backup staging database                            │
│    - Run migration                                      │
│    - Test application                                   │
└───────────────────┬─────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────┐
│ 5. Deploy to Production                                 │
│    - Schedule maintenance window                        │
│    - Backup production database                         │
│    - Run migration                                      │
│    - Monitor application                                │
│    - Verify data integrity                              │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Reference

### Run Migrations
```bash
cd backend
npm run migrate
# or
node run-migrations.js
```

### View Migration Status
```sql
SELECT * FROM pgmigrations ORDER BY run_on DESC;
```

### Backup Database
```bash
pg_dump -U postgres hospital_management > backup.sql
```

### Restore Database
```bash
psql -U postgres hospital_management < backup.sql
```

### Create New Migration
```bash
# 1. Generate timestamp
node -e "console.log(Date.now())"

# 2. Create file
touch backend/migrations/{timestamp}_{description}.sql

# 3. Write SQL
# 4. Test: npm run migrate
```

---

## Next Steps

After setting up migrations:

1. Review existing migrations
2. Test migration process on local database
3. Create backup strategy
4. Document team migration procedures
5. Set up automated backups
6. Plan migration schedule for production

**Related Documentation**:
- [Setup Guide](./setup-guide.md)
- [Environment Variables](./environment-variables.md)
- [Deployment Architecture](./deployment-architecture.md)

---

**Migrations configured!** 🎉 Your database schema is now version-controlled and manageable across all environments.
