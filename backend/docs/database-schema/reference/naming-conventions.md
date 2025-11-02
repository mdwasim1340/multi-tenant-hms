# Database Naming Conventions Documentation

## 📝 Overview

This document establishes consistent naming conventions for the multi-tenant hospital management system database. Following these conventions ensures maintainability, readability, and prevents conflicts.

## 🗂️ Table Naming Conventions

### General Rules
- **Case**: Use `snake_case` for all table names
- **Plurality**: Use **singular** names for tables (e.g., `user`, not `users`)
- **Descriptive**: Names should clearly indicate the table's purpose
- **No Prefixes**: Avoid unnecessary prefixes like `tbl_` or `table_`

### Examples
```sql
-- ✅ Good table names
CREATE TABLE user (...);
CREATE TABLE patient (...);
CREATE TABLE medical_record (...);
CREATE TABLE appointment (...);
CREATE TABLE user_role (...);  -- Junction table

-- ❌ Bad table names
CREATE TABLE users (...);      -- Plural
CREATE TABLE tbl_patient (...); -- Unnecessary prefix
CREATE TABLE MedicalRecord (...); -- CamelCase
CREATE TABLE patient-record (...); -- Hyphen not allowed
```

### Current System Tables
| Table Name | Type | Schema | Purpose |
|------------|------|--------|---------|
| `tenants` | Global | public | Tenant registry (exception: plural) |
| `users` | Global | public | User accounts (exception: plural) |
| `roles` | Global | public | Role definitions (exception: plural) |
| `user_roles` | Junction | public | User-role assignments |
| `user_verification` | Global | public | Verification codes |

**Note**: Some existing tables use plural names due to migration history. New tables should follow singular naming.

## 🏷️ Column Naming Conventions

### General Rules
- **Case**: Use `snake_case` for all column names
- **Descriptive**: Names should be clear and unambiguous
- **No Abbreviations**: Avoid abbreviations unless widely understood
- **Consistent**: Use consistent patterns across tables

### Primary Keys
- **Standard**: Use `id` as primary key column name
- **Type**: Usually `SERIAL` (auto-incrementing integer)
- **Alternative**: Use descriptive name if needed (e.g., `tenant_id` for string IDs)

```sql
-- ✅ Standard primary key
CREATE TABLE patient (
  id SERIAL PRIMARY KEY,
  ...
);

-- ✅ Descriptive primary key (for tenants)
CREATE TABLE tenants (
  id string PRIMARY KEY,  -- tenant_123, tenant_456, etc.
  ...
);
```

### Foreign Keys
- **Pattern**: `{referenced_table}_id`
- **Consistency**: Always follow this pattern
- **Clarity**: Makes relationships obvious

```sql
-- ✅ Good foreign key naming
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  tenant_id string REFERENCES tenants(id),  -- References tenants table
  ...
);

CREATE TABLE appointment (
  id SERIAL PRIMARY KEY,
  patient_id integer REFERENCES patient(id), -- References patient table
  doctor_id integer,  -- References users table (application level)
  ...
);
```

### Common Column Patterns
| Pattern | Example | Purpose |
|---------|---------|---------|
| `*_id` | `tenant_id`, `user_id` | Foreign key references |
| `*_at` | `created_at`, `updated_at` | Timestamp fields |
| `*_date` | `birth_date`, `appointment_date` | Date-only fields |
| `*_url` | `profile_picture_url` | URL/link fields |
| `*_count` | `login_count`, `visit_count` | Counter fields |
| `is_*` | `is_active`, `is_verified` | Boolean flags |

### Standard Column Names
```sql
-- ✅ Consistent timestamp columns
created_at timestamp NOT NULL DEFAULT current_timestamp,
updated_at timestamp,
deleted_at timestamp,  -- For soft deletes

-- ✅ Consistent status columns
status varchar(50) NOT NULL DEFAULT 'active',

-- ✅ Consistent contact information
email varchar(255) NOT NULL,
phone_number varchar(50),

-- ✅ Consistent naming patterns
first_name varchar(255),
last_name varchar(255),
date_of_birth date,
profile_picture_url text,
```

## 🔗 Index Naming Conventions

### Index Types and Naming
- **Primary Key**: Automatic naming (`{table}_pkey`)
- **Foreign Key**: `{table}_{column}_idx`
- **Unique**: `{table}_{column}_key` or `{table}_{column}_unique`
- **Composite**: `{table}_{col1}_{col2}_idx`
- **Functional**: `{table}_{function}_{column}_idx`

```sql
-- ✅ Good index naming
CREATE INDEX users_tenant_id_idx ON users(tenant_id);
CREATE INDEX user_roles_user_id_idx ON user_roles(user_id);
CREATE INDEX user_roles_role_id_idx ON user_roles(role_id);
CREATE UNIQUE INDEX users_email_key ON users(email);
CREATE INDEX appointments_date_status_idx ON appointment(appointment_date, status);

-- ❌ Bad index naming
CREATE INDEX idx1 ON users(tenant_id);  -- Not descriptive
CREATE INDEX user_tenant ON users(tenant_id);  -- Missing _idx suffix
```

## 🏗️ Schema Naming Conventions

### Tenant Schema Naming
- **Pattern**: `tenant_{id}` where `{id}` is the tenant identifier
- **Examples**: `tenant_123`, `tenant_hospital_a`, `tenant_clinic_xyz`
- **Validation**: Must be valid PostgreSQL schema names
- **Consistency**: Always use lowercase with underscores

```sql
-- ✅ Good tenant schema names
CREATE SCHEMA "tenant_123";
CREATE SCHEMA "tenant_hospital_main";
CREATE SCHEMA "tenant_clinic_downtown";

-- ❌ Bad tenant schema names
CREATE SCHEMA "Tenant123";  -- Mixed case
CREATE SCHEMA "tenant-123"; -- Hyphen not recommended
CREATE SCHEMA "123_tenant"; -- Number prefix
```

### Special Schemas
- **public**: Default schema for global tables
- **information_schema**: PostgreSQL system schema (read-only)
- **pg_catalog**: PostgreSQL system catalog (read-only)

## 🔧 Constraint Naming Conventions

### Foreign Key Constraints
- **Pattern**: `fk_{table}_{referenced_table}` or `fk_{table}_{column}`
- **Clarity**: Makes constraint purpose obvious
- **Consistency**: Follow pattern across all tables

```sql
-- ✅ Good constraint naming
ALTER TABLE users 
ADD CONSTRAINT fk_users_tenant 
FOREIGN KEY (tenant_id) REFERENCES tenants(id);

ALTER TABLE user_roles 
ADD CONSTRAINT fk_user_roles_user 
FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE user_roles 
ADD CONSTRAINT fk_user_roles_role 
FOREIGN KEY (role_id) REFERENCES roles(id);
```

### Check Constraints
- **Pattern**: `chk_{table}_{column}_{condition}`
- **Examples**: `chk_users_status_valid`, `chk_appointment_date_future`

```sql
-- ✅ Good check constraint naming
ALTER TABLE users 
ADD CONSTRAINT chk_users_status_valid 
CHECK (status IN ('active', 'inactive', 'pending', 'suspended'));

ALTER TABLE appointment 
ADD CONSTRAINT chk_appointment_date_future 
CHECK (appointment_date > current_date);
```

### Unique Constraints
- **Pattern**: `uk_{table}_{column}` or `{table}_{column}_key`
- **Multi-column**: `uk_{table}_{col1}_{col2}`

```sql
-- ✅ Good unique constraint naming
ALTER TABLE users 
ADD CONSTRAINT uk_users_email UNIQUE (email);

ALTER TABLE patient 
ADD CONSTRAINT uk_patient_email_tenant UNIQUE (email, tenant_id);
```

## 📊 Enum and Type Naming

### Status Values
Use consistent status values across tables:
- `'active'` - Entity is operational
- `'inactive'` - Entity is disabled
- `'pending'` - Entity is awaiting activation
- `'suspended'` - Entity is temporarily disabled
- `'deleted'` - Soft delete (if used)

### Role Names
Use descriptive, title-case role names:
- `'Admin'` - System administrator
- `'Doctor'` - Medical practitioner
- `'Nurse'` - Nursing staff
- `'Receptionist'` - Front desk staff
- `'Manager'` - Department manager

### Verification Types
Use descriptive verification type names:
- `'email_verification'` - Email address verification
- `'password_reset'` - Password reset codes
- `'otp'` - One-time passwords
- `'two_factor'` - Two-factor authentication

## 🚨 Naming Anti-Patterns

### Avoid These Patterns
```sql
-- ❌ Don't use reserved words
CREATE TABLE order (...);  -- 'order' is reserved
CREATE TABLE user (...);   -- 'user' is reserved (use 'users' or 'app_user')

-- ❌ Don't use abbreviations
CREATE TABLE pt (...);     -- Use 'patient'
CREATE TABLE appt (...);   -- Use 'appointment'
CREATE TABLE med_rec (...); -- Use 'medical_record'

-- ❌ Don't use prefixes/suffixes unnecessarily
CREATE TABLE tbl_patient (...);  -- Remove 'tbl_'
CREATE TABLE patient_table (...); -- Remove '_table'

-- ❌ Don't use inconsistent casing
CREATE TABLE Patient (...);      -- Use snake_case
CREATE TABLE medicalRecord (...); -- Use snake_case

-- ❌ Don't use special characters
CREATE TABLE patient-record (...); -- Use underscore
CREATE TABLE patient@record (...); -- Invalid character
```

## 🔍 Validation Rules

### Table Name Validation
```sql
-- Check if table name follows conventions
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name ~ '^[a-z][a-z0-9_]*[a-z0-9]$'  -- snake_case pattern
AND table_name NOT LIKE '%\_table'              -- No _table suffix
AND table_name NOT LIKE 'tbl\_%';               -- No tbl_ prefix
```

### Column Name Validation
```sql
-- Check column naming patterns
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name !~ '^[a-z][a-z0-9_]*[a-z0-9]$'  -- Not snake_case
ORDER BY table_name, column_name;
```

## 📋 Migration Naming Conventions

### Migration File Names
- **Pattern**: `{timestamp}_{description}.js`
- **Timestamp**: Unix timestamp or date-based
- **Description**: Brief, descriptive name using hyphens

```bash
# ✅ Good migration names
1678886400000_initial-migration.js
1762003868919_create-user-verification-table.js
1762003868921_update-users-and-add-roles-tables.js
1788886400000_create-tenants-table.js

# ❌ Bad migration names
migration1.js                    # Not descriptive
create_users.js                  # No timestamp
1678886400000_CreateUsers.js     # CamelCase
```

### Migration Content Naming
```javascript
// ✅ Good migration structure
exports.up = (pgm) => {
  pgm.createTable('patient', {  // Singular table name
    id: 'id',                   // Standard primary key
    first_name: { type: 'varchar(255)', notNull: true },  // snake_case
    last_name: { type: 'varchar(255)', notNull: true },
    date_of_birth: { type: 'date' },  // Descriptive name
    created_at: {               // Standard timestamp
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });
  
  // Standard index naming
  pgm.createIndex('patient', 'created_at');
};
```

## 🎯 Best Practices Summary

### Do's
- ✅ Use `snake_case` for all database objects
- ✅ Use singular table names for new tables
- ✅ Use descriptive, unambiguous names
- ✅ Follow consistent patterns across the system
- ✅ Use standard column names (`id`, `created_at`, `status`)
- ✅ Name foreign keys with `{table}_id` pattern
- ✅ Include proper indexes with descriptive names

### Don'ts
- ❌ Don't use reserved words as table/column names
- ❌ Don't use abbreviations or acronyms
- ❌ Don't use prefixes like `tbl_` or suffixes like `_table`
- ❌ Don't use special characters except underscores
- ❌ Don't use inconsistent naming patterns
- ❌ Don't create names longer than 63 characters (PostgreSQL limit)
- ❌ Don't use numbers at the beginning of names