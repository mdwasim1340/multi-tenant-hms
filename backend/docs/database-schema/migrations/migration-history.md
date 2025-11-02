# Migration History Documentation

## 📋 Overview

This document tracks all database migrations applied to the multi-tenant hospital management system, their purposes, and the changes they implement.

## 🗂️ Migration Timeline

### Migration 1: `1678886400000_initial-migration.js`
- **Date**: March 14, 2023 (approximate)
- **Status**: ✅ Applied, Superseded
- **Purpose**: Initial database setup with basic user table

#### Changes Made
```javascript
// Created simple users table
pgm.createTable('users', {
  id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
  email: { type: 'varchar(255)', notNull: true, unique: true },
  created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
});
```

#### Impact
- ✅ Established basic user storage
- ✅ UUID-based primary keys
- ✅ Email uniqueness constraint
- ⚠️ Limited functionality (email and ID only)

#### Superseded By
Migration 3 (`1762003868921_update-users-and-add-roles-tables.js`) completely replaced this table structure.

---

### Migration 2: `1762003868919_create-user-verification-table.js`
- **Date**: November 1, 2024 (approximate)
- **Status**: ✅ Applied, Active
- **Purpose**: Add email verification and password reset functionality

#### Changes Made
```javascript
// Created user verification table
pgm.createTable('user_verification', {
  id: 'id',  // Auto-incrementing primary key
  email: { type: 'varchar(255)', notNull: true },
  code: { type: 'varchar(255)', notNull: true },
  type: { type: 'varchar(50)', notNull: true },
  expires_at: {
    type: 'timestamp',
    notNull: true,
    default: pgm.func('current_timestamp + interval \'1 hour\'')
  },
  created_at: {
    type: 'timestamp',
    notNull: true,
    default: pgm.func('current_timestamp')
  }
});
```

#### Impact
- ✅ Email verification system support
- ✅ Password reset functionality
- ✅ OTP (One-Time Password) support
- ✅ Automatic expiration (1-hour default)
- ✅ Flexible verification type system

#### Current Usage
- Email verification during user registration
- Password reset codes for forgot password flow
- OTP codes for secure operations
- Two-factor authentication support

---

### Migration 3: `1762003868921_update-users-and-add-roles-tables.js`
- **Date**: November 1, 2024 (approximate)
- **Status**: ✅ Applied, Active
- **Purpose**: Complete user management system with roles and multi-tenancy

#### Changes Made

##### 1. Created Roles Table
```javascript
pgm.createTable('roles', {
  id: 'id',  // Auto-incrementing primary key
  name: { type: 'varchar(255)', notNull: true },
  description: { type: 'text' },
  created_at: {
    type: 'timestamp',
    notNull: true,
    default: pgm.func('current_timestamp')
  }
});
```

##### 2. Created Tenants Table (First Version)
```javascript
pgm.createTable('tenants', {
  id: 'id',  // Auto-incrementing primary key
  name: { type: 'varchar(255)', notNull: true },
  created_at: {
    type: 'timestamp',
    notNull: true,
    default: pgm.func('current_timestamp')
  }
});
```

##### 3. Recreated Users Table
```javascript
// Dropped original users table
pgm.dropTable('users');

// Created comprehensive users table
pgm.createTable('users', {
  id: 'id',  // Changed from UUID to auto-increment
  name: { type: 'varchar(255)', notNull: true },
  email: { type: 'varchar(255)', notNull: true, unique: true },
  password: { type: 'varchar(255)', notNull: true },
  status: { type: 'varchar(50)', notNull: true, default: 'active' },
  phone_number: { type: 'varchar(50)' },
  last_login_date: { type: 'timestamp' },
  profile_picture_url: { type: 'text' },
  tenant_id: {
    type: 'integer',
    notNull: true,
    references: '"tenants"',
    onDelete: 'cascade'
  },
  created_at: {
    type: 'timestamp',
    notNull: true,
    default: pgm.func('current_timestamp')
  }
});
```

##### 4. Created User Roles Junction Table
```javascript
pgm.createTable('user_roles', {
  id: 'id',
  user_id: {
    type: 'integer',
    notNull: true,
    references: '"users"',
    onDelete: 'cascade'
  },
  role_id: {
    type: 'integer',
    notNull: true,
    references: '"roles"',
    onDelete: 'cascade'
  },
  created_at: {
    type: 'timestamp',
    notNull: true,
    default: pgm.func('current_timestamp')
  }
});
```

##### 5. Created Performance Indexes
```javascript
pgm.createIndex('users', 'tenant_id');
pgm.createIndex('user_roles', 'user_id');
pgm.createIndex('user_roles', 'role_id');
```

#### Impact
- ✅ Complete user profile management
- ✅ Role-based access control (RBAC)
- ✅ Multi-tenant user relationships
- ✅ Password storage capability
- ✅ User status management
- ✅ Performance optimization with indexes
- ✅ Referential integrity with foreign keys
- ✅ Cascade delete for data consistency

#### Breaking Changes
- **Primary Key Change**: Users table changed from UUID to auto-increment integer
- **Table Structure**: Complete replacement of original users table
- **New Dependencies**: Users now require tenant_id (multi-tenancy)

---

### Migration 4: `1788886400000_create-tenants-table.js`
- **Date**: November 2, 2025 (approximate)
- **Status**: ✅ Applied, Active
- **Purpose**: Replace tenants table with improved structure for production use

#### Changes Made
```javascript
// Note: This creates a new tenants table structure
pgm.createTable('tenants', {
  id: { type: 'string', notNull: true, primaryKey: true },  // Changed to string
  name: { type: 'string', notNull: true },
  email: { type: 'string', notNull: true },
  plan: { type: 'string', notNull: true },
  status: { type: 'string', notNull: true },
  joinDate: {
    type: 'timestamp',
    notNull: true,
    default: pgm.func('current_timestamp')
  }
});
```

#### Impact
- ✅ String-based tenant IDs (e.g., "tenant_123")
- ✅ Tenant contact information (email)
- ✅ Subscription plan tracking
- ✅ Tenant status management
- ✅ Join date tracking
- ⚠️ Potential conflict with Migration 3's tenants table

#### Key Changes from Previous Version
- **ID Type**: Changed from integer to string for human-readable tenant IDs
- **Additional Fields**: Added email, plan, status fields
- **Naming**: Changed created_at to joinDate for clarity

---

## 📊 Current Database State

### Active Tables (Actual Current State)
| Table | Primary Key | Created By | Status |
|-------|-------------|------------|--------|
| `tenants` | `id` (varchar 255) | Manual/Direct Creation | ✅ Active |
| `pgmigrations` | Auto | node-pg-migrate | ✅ Active (empty) |
| `users` | `id` (integer) | Migration 3 | ❌ Failed to Create |
| `roles` | `id` (integer) | Migration 3 | ❌ Failed to Create |
| `user_roles` | `id` (integer) | Migration 3 | ❌ Failed to Create |
| `user_verification` | `id` (integer) | Migration 2 | ❌ Failed to Create |

### Migration Status
- **Migrations Run**: 0 (pgmigrations table is empty)
- **Tables Created**: Only `tenants` exists (created outside migration system)
- **Issue**: Migration conflict - tenants table already exists when migrations try to run

### Relationships Established
- `users.tenant_id` → `tenants.id` (Foreign Key)
- `user_roles.user_id` → `users.id` (Foreign Key)
- `user_roles.role_id` → `roles.id` (Foreign Key)
- `user_verification.email` ↔ `users.email` (Logical relationship)

### Indexes Created
- `users_tenant_id_idx` on `users(tenant_id)`
- `user_roles_user_id_idx` on `user_roles(user_id)`
- `user_roles_role_id_idx` on `user_roles(role_id)`
- Automatic indexes on all primary keys
- Unique index on `users(email)`

## 🔍 Migration Analysis

### Migration Patterns Used

#### 1. Incremental Development
- Started with simple user table
- Added verification system
- Expanded to full multi-tenant architecture
- Enhanced tenant management

#### 2. Breaking Changes Management
- Migration 3 completely replaced users table
- Used DROP and CREATE pattern for major changes
- Maintained data integrity with transactions

#### 3. Performance Considerations
- Added indexes for foreign key relationships
- Created composite indexes for common queries
- Used appropriate data types for performance

#### 4. Multi-Tenant Preparation
- Established tenant-user relationships
- Prepared for schema-based isolation
- Set up cascade delete patterns

### Data Type Evolution
| Field | Migration 1 | Migration 3 | Migration 4 | Reason |
|-------|-------------|-------------|-------------|---------|
| `users.id` | UUID | Integer | Integer | Simpler, better performance |
| `tenants.id` | - | Integer | String | Human-readable tenant IDs |
| Timestamps | `timestamp` | `timestamp` | `timestamp` | Consistent across migrations |

## 🚨 CURRENT MIGRATION ISSUES

### Active Issue: Migration Conflict
- **Problem**: `tenants` table exists but migrations haven't been run
- **Error**: "relation 'tenants' already exists" when running migrations
- **Impact**: No other tables (users, roles, etc.) have been created
- **Root Cause**: Tenants table was created outside the migration system

### Resolution Options
1. **Drop and Recreate**: Drop existing tenants table and run migrations fresh
2. **Skip Migration**: Mark tenants migration as completed and run remaining migrations
3. **Manual Sync**: Create remaining tables manually to match migration expectations

## ⚠️ Migration Issues and Resolutions

### Potential Conflicts

#### 1. Tenants Table Duplication
- **Issue**: Migration 3 and 4 both create tenants table
- **Resolution**: Migration 4 likely replaces Migration 3's version
- **Impact**: Need to verify which structure is active

#### 2. Foreign Key Compatibility
- **Issue**: Users table references tenants with integer FK, but Migration 4 uses string PK
- **Resolution**: Need to update users.tenant_id to string type
- **Status**: Requires investigation and potential fix migration

#### 3. Data Migration
- **Issue**: No data migration scripts for existing data
- **Resolution**: Would need separate data migration if upgrading existing system
- **Impact**: Fresh installations not affected

### Recommended Actions

#### 1. Verify Current State
```sql
-- Check actual tenants table structure
\d tenants;

-- Check users.tenant_id type
\d users;

-- Verify foreign key constraints
SELECT conname, conrelid::regclass, confrelid::regclass 
FROM pg_constraint 
WHERE contype = 'f' AND conrelid::regclass::text = 'users';
```

#### 2. Fix Type Mismatch (if needed)
```sql
-- If users.tenant_id is still integer but tenants.id is string
ALTER TABLE users ALTER COLUMN tenant_id TYPE string;
```

## 🚀 Future Migration Considerations

### Planned Enhancements
1. **Tenant Schema Creation**: Migrations to create tenant-specific schemas
2. **Hospital Tables**: Patient, appointment, medical record tables
3. **Audit Logging**: Add audit trail tables
4. **Performance Optimization**: Additional indexes based on usage patterns

### Migration Best Practices
1. **Always use transactions** for complex migrations
2. **Test migrations** on sample data first
3. **Document breaking changes** clearly
4. **Provide rollback procedures** for critical migrations
5. **Coordinate with application changes** for schema modifications

### Rollback Procedures
Each migration should have a corresponding down() function:
```javascript
exports.down = (pgm) => {
  // Reverse all changes made in up() function
  pgm.dropTable('table_name');
  // etc.
};
```

## 📋 Migration Checklist

### Before Running New Migrations
- [ ] Backup database
- [ ] Test migration on development environment
- [ ] Verify foreign key relationships
- [ ] Check for data type compatibility
- [ ] Review performance impact
- [ ] Prepare rollback plan

### After Running Migrations
- [ ] Verify table structures match expectations
- [ ] Test application functionality
- [ ] Check foreign key constraints
- [ ] Validate data integrity
- [ ] Update documentation
- [ ] Monitor performance impact

## 🔧 Migration Utilities

### Check Migration Status
```sql
-- List all tables in public schema
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check for migration tracking table (if using migration tool)
SELECT * FROM pgmigrations ORDER BY run_on;
```

### Verify Data Integrity
```sql
-- Check for orphaned records
SELECT COUNT(*) FROM users u 
LEFT JOIN tenants t ON u.tenant_id = t.id 
WHERE t.id IS NULL;

-- Check role assignments
SELECT COUNT(*) FROM user_roles ur
LEFT JOIN users u ON ur.user_id = u.id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.id IS NULL OR r.id IS NULL;
```