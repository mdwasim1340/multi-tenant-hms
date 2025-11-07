# Team C Week 1 Day 1: RBAC Database Schema

## 🎯 Objective
Design and implement the database schema for Role-Based Access Control (RBAC) system.

**Duration**: 6-8 hours | **Difficulty**: Medium

---

## 📋 Tasks Overview

### Task 1: RBAC Schema Design (2 hours)
Design comprehensive permission and role system

### Task 2: Database Tables Creation (2 hours)
Create RBAC tables with proper relationships

### Task 3: Permission Seeding (2 hours)
Seed initial permissions and roles

### Task 4: Integration Testing (2 hours)
Test RBAC schema with existing system

---

## 🗄️ Database Schema Design

### New Tables Required

#### 1. Permissions Table
```sql
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  resource VARCHAR(50) NOT NULL, -- patients, appointments, medical_records, etc.
  action VARCHAR(50) NOT NULL,   -- create, read, update, delete, manage
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Examples:
-- patients:create, patients:read, patients:update, patients:delete
-- appointments:create, appointments:read, appointments:update, appointments:delete
-- medical_records:create, medical_records:read, medical_records:update, medical_records:delete
-- users:manage, roles:manage, analytics:view, reports:export
```

#### 2. Role Permissions Table
```sql
CREATE TABLE role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by INTEGER REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, permission_id)
);
```

#### 3. User Permissions Table (Direct Permissions)
```sql
CREATE TABLE user_permissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by INTEGER REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  UNIQUE(user_id, permission_id)
);
```

#### 4. Permission Groups Table (Optional)
```sql
CREATE TABLE permission_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permission_group_permissions (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES permission_groups(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE(group_id, permission_id)
);
```

#### 5. Audit Log Table
```sql
CREATE TABLE permission_audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  target_user_id INTEGER REFERENCES users(id),
  target_role_id INTEGER REFERENCES roles(id),
  permission_id INTEGER REFERENCES permissions(id),
  action VARCHAR(50) NOT NULL, -- grant, revoke, create, update, delete
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  performed_by INTEGER REFERENCES users(id),
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT
);
```

---

## 📝 Task 1: RBAC Schema Design (2 hours)

### Permission System Design

Create `backend/docs/rbac-design.md`:

```markdown
# RBAC System Design

## Permission Structure
Format: `resource:action`

### Core Resources
- **patients**: Patient management
- **appointments**: Appointment scheduling
- **medical_records**: Medical records management
- **lab_tests**: Lab tests and results
- **users**: User management
- **roles**: Role management
- **analytics**: Analytics and reporting
- **system**: System administration

### Core Actions
- **create**: Create new records
- **read**: View/read records
- **update**: Modify existing records
- **delete**: Delete records
- **manage**: Full administrative access
- **export**: Export data
- **import**: Import data

### Permission Examples
- `patients:create` - Can create new patients
- `patients:read` - Can view patient information
- `appointments:manage` - Full appointment management
- `medical_records:read` - Can view medical records
- `analytics:view` - Can view analytics dashboard
- `users:manage` - Can manage user accounts
- `system:admin` - System administrator access

## Role Hierarchy
1. **System Admin** - Full system access
2. **Hospital Admin** - Hospital management
3. **Doctor** - Medical operations
4. **Nurse** - Patient care
5. **Receptionist** - Front desk operations
6. **Lab Technician** - Lab operations
7. **Pharmacist** - Pharmacy operations
8. **Manager** - Department management

## Permission Inheritance
- Users inherit permissions from their roles
- Direct user permissions override role permissions
- Multiple roles combine permissions (union)
- Explicit deny permissions override grants
```

### TypeScript Interfaces

Create `backend/src/types/rbac.ts`:

```typescript
export interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description?: string;
  created_at: Date;
}

export interface RolePermission {
  id: number;
  role_id: number;
  permission_id: number;
  granted_by?: number;
  granted_at: Date;
  permission?: Permission;
}

export interface UserPermission {
  id: number;
  user_id: number;
  permission_id: number;
  granted_by?: number;
  granted_at: Date;
  expires_at?: Date;
  permission?: Permission;
}

export interface PermissionGroup {
  id: number;
  name: string;
  description?: string;
  permissions?: Permission[];
  created_at: Date;
}

export interface PermissionAuditLog {
  id: number;
  user_id?: number;
  target_user_id?: number;
  target_role_id?: number;
  permission_id?: number;
  action: 'grant' | 'revoke' | 'create' | 'update' | 'delete';
  old_value?: any;
  new_value?: any;
  reason?: string;
  performed_by?: number;
  performed_at: Date;
  ip_address?: string;
  user_agent?: string;
}

export interface UserPermissions {
  user_id: number;
  role_permissions: Permission[];
  direct_permissions: Permission[];
  all_permissions: Permission[];
  can(permission: string): boolean;
}
```

---

## 📝 Task 2: Database Tables Creation (2 hours)

### Migration File

Create `backend/migrations/005-rbac-system.sql`:

```sql
-- RBAC System Migration
-- Creates tables for Role-Based Access Control

-- Permissions table
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role permissions junction table
CREATE TABLE role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by INTEGER REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, permission_id)
);

-- User permissions (direct permissions)
CREATE TABLE user_permissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by INTEGER REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  UNIQUE(user_id, permission_id)
);

-- Permission groups (optional)
CREATE TABLE permission_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permission_group_permissions (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES permission_groups(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE(group_id, permission_id)
);

-- Audit log for permission changes
CREATE TABLE permission_audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  target_user_id INTEGER REFERENCES users(id),
  target_role_id INTEGER REFERENCES roles(id),
  permission_id INTEGER REFERENCES permissions(id),
  action VARCHAR(50) NOT NULL,
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  performed_by INTEGER REFERENCES users(id),
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT
);

-- Indexes for performance
CREATE INDEX idx_permissions_resource_action ON permissions(resource, action);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission_id ON user_permissions(permission_id);
CREATE INDEX idx_permission_audit_log_user_id ON permission_audit_log(user_id);
CREATE INDEX idx_permission_audit_log_performed_at ON permission_audit_log(performed_at);
CREATE INDEX idx_permission_audit_log_action ON permission_audit_log(action);

-- Comments for documentation
COMMENT ON TABLE permissions IS 'System permissions for RBAC';
COMMENT ON TABLE role_permissions IS 'Permissions assigned to roles';
COMMENT ON TABLE user_permissions IS 'Direct permissions assigned to users';
COMMENT ON TABLE permission_audit_log IS 'Audit trail for permission changes';
```

### Run Migration

```bash
# Apply migration
cd backend
npx node-pg-migrate up

# Verify tables created
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%permission%' OR table_name LIKE '%role%'
ORDER BY table_name;
"
```

---

## 📝 Task 3: Permission Seeding (2 hours)

### Seed Script

Create `backend/scripts/seed-rbac.js`:

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const permissions = [
  // Patient Management
  { name: 'patients:create', resource: 'patients', action: 'create', description: 'Create new patients' },
  { name: 'patients:read', resource: 'patients', action: 'read', description: 'View patient information' },
  { name: 'patients:update', resource: 'patients', action: 'update', description: 'Update patient information' },
  { name: 'patients:delete', resource: 'patients', action: 'delete', description: 'Delete patients' },
  { name: 'patients:manage', resource: 'patients', action: 'manage', description: 'Full patient management' },

  // Appointment Management
  { name: 'appointments:create', resource: 'appointments', action: 'create', description: 'Schedule appointments' },
  { name: 'appointments:read', resource: 'appointments', action: 'read', description: 'View appointments' },
  { name: 'appointments:update', resource: 'appointments', action: 'update', description: 'Modify appointments' },
  { name: 'appointments:delete', resource: 'appointments', action: 'delete', description: 'Cancel appointments' },
  { name: 'appointments:manage', resource: 'appointments', action: 'manage', description: 'Full appointment management' },

  // Medical Records
  { name: 'medical_records:create', resource: 'medical_records', action: 'create', description: 'Create medical records' },
  { name: 'medical_records:read', resource: 'medical_records', action: 'read', description: 'View medical records' },
  { name: 'medical_records:update', resource: 'medical_records', action: 'update', description: 'Update medical records' },
  { name: 'medical_records:delete', resource: 'medical_records', action: 'delete', description: 'Delete medical records' },
  { name: 'medical_records:finalize', resource: 'medical_records', action: 'finalize', description: 'Finalize medical records' },

  // Lab Tests
  { name: 'lab_tests:create', resource: 'lab_tests', action: 'create', description: 'Order lab tests' },
  { name: 'lab_tests:read', resource: 'lab_tests', action: 'read', description: 'View lab tests and results' },
  { name: 'lab_tests:update', resource: 'lab_tests', action: 'update', description: 'Update lab tests' },
  { name: 'lab_tests:results', resource: 'lab_tests', action: 'results', description: 'Enter lab results' },

  // User Management
  { name: 'users:create', resource: 'users', action: 'create', description: 'Create user accounts' },
  { name: 'users:read', resource: 'users', action: 'read', description: 'View user information' },
  { name: 'users:update', resource: 'users', action: 'update', description: 'Update user accounts' },
  { name: 'users:delete', resource: 'users', action: 'delete', description: 'Delete user accounts' },
  { name: 'users:manage', resource: 'users', action: 'manage', description: 'Full user management' },

  // Role Management
  { name: 'roles:create', resource: 'roles', action: 'create', description: 'Create roles' },
  { name: 'roles:read', resource: 'roles', action: 'read', description: 'View roles' },
  { name: 'roles:update', resource: 'roles', action: 'update', description: 'Update roles' },
  { name: 'roles:delete', resource: 'roles', action: 'delete', description: 'Delete roles' },
  { name: 'roles:assign', resource: 'roles', action: 'assign', description: 'Assign roles to users' },

  // Analytics & Reporting
  { name: 'analytics:view', resource: 'analytics', action: 'view', description: 'View analytics dashboard' },
  { name: 'reports:create', resource: 'reports', action: 'create', description: 'Create reports' },
  { name: 'reports:export', resource: 'reports', action: 'export', description: 'Export reports' },

  // System Administration
  { name: 'system:admin', resource: 'system', action: 'admin', description: 'System administration' },
  { name: 'system:audit', resource: 'system', action: 'audit', description: 'View audit logs' },
];

const rolePermissions = {
  'Admin': [
    'patients:manage', 'appointments:manage', 'medical_records:read', 'medical_records:update',
    'users:manage', 'roles:manage', 'analytics:view', 'reports:create', 'reports:export',
    'system:admin', 'system:audit'
  ],
  'Doctor': [
    'patients:read', 'patients:update', 'appointments:create', 'appointments:read', 'appointments:update',
    'medical_records:create', 'medical_records:read', 'medical_records:update', 'medical_records:finalize',
    'lab_tests:create', 'lab_tests:read', 'analytics:view'
  ],
  'Nurse': [
    'patients:read', 'patients:update', 'appointments:read', 'appointments:update',
    'medical_records:read', 'medical_records:update', 'lab_tests:read'
  ],
  'Receptionist': [
    'patients:create', 'patients:read', 'patients:update',
    'appointments:create', 'appointments:read', 'appointments:update', 'appointments:delete'
  ],
  'Lab Technician': [
    'patients:read', 'lab_tests:read', 'lab_tests:update', 'lab_tests:results'
  ],
  'Pharmacist': [
    'patients:read', 'medical_records:read', 'lab_tests:read'
  ],
  'Manager': [
    'patients:read', 'appointments:read', 'medical_records:read',
    'analytics:view', 'reports:create', 'reports:export'
  ]
};

async function seedRBAC() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Insert permissions
    console.log('Seeding permissions...');
    for (const permission of permissions) {
      await client.query(`
        INSERT INTO permissions (name, resource, action, description)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (name) DO NOTHING
      `, [permission.name, permission.resource, permission.action, permission.description]);
    }

    // Get all roles and permissions
    const rolesResult = await client.query('SELECT id, name FROM roles');
    const permissionsResult = await client.query('SELECT id, name FROM permissions');
    
    const roleMap = {};
    rolesResult.rows.forEach(role => {
      roleMap[role.name] = role.id;
    });

    const permissionMap = {};
    permissionsResult.rows.forEach(permission => {
      permissionMap[permission.name] = permission.id;
    });

    // Assign permissions to roles
    console.log('Assigning permissions to roles...');
    for (const [roleName, permissions] of Object.entries(rolePermissions)) {
      const roleId = roleMap[roleName];
      if (!roleId) {
        console.log(`Role ${roleName} not found, skipping...`);
        continue;
      }

      for (const permissionName of permissions) {
        const permissionId = permissionMap[permissionName];
        if (!permissionId) {
          console.log(`Permission ${permissionName} not found, skipping...`);
          continue;
        }

        await client.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_id) DO NOTHING
        `, [roleId, permissionId]);
      }
    }

    await client.query('COMMIT');
    console.log('RBAC seeding completed successfully!');

    // Display summary
    const permissionCount = await client.query('SELECT COUNT(*) FROM permissions');
    const rolePermissionCount = await client.query('SELECT COUNT(*) FROM role_permissions');
    
    console.log(`\nSummary:`);
    console.log(`- Permissions created: ${permissionCount.rows[0].count}`);
    console.log(`- Role-permission assignments: ${rolePermissionCount.rows[0].count}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding RBAC:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run seeding
seedRBAC()
  .then(() => {
    console.log('RBAC seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('RBAC seeding failed:', error);
    process.exit(1);
  });
```

### Run Seeding

```bash
cd backend
node scripts/seed-rbac.js
```

---

## 📝 Task 4: Integration Testing (2 hours)

### Test RBAC Schema

Create `backend/tests/rbac-schema.test.js`:

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

describe('RBAC Schema Tests', () => {
  let client;

  beforeAll(async () => {
    client = await pool.connect();
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  test('should have all RBAC tables', async () => {
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('permissions', 'role_permissions', 'user_permissions', 'permission_audit_log')
    `);
    
    expect(result.rows).toHaveLength(4);
  });

  test('should have permissions seeded', async () => {
    const result = await client.query('SELECT COUNT(*) FROM permissions');
    expect(parseInt(result.rows[0].count)).toBeGreaterThan(20);
  });

  test('should have role permissions assigned', async () => {
    const result = await client.query('SELECT COUNT(*) FROM role_permissions');
    expect(parseInt(result.rows[0].count)).toBeGreaterThan(10);
  });

  test('should be able to query user permissions', async () => {
    const result = await client.query(`
      SELECT u.name as user_name, r.name as role_name, p.name as permission_name
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      LIMIT 5
    `);
    
    expect(result.rows.length).toBeGreaterThan(0);
  });

  test('should enforce foreign key constraints', async () => {
    // Test invalid role_id in role_permissions
    await expect(
      client.query('INSERT INTO role_permissions (role_id, permission_id) VALUES (99999, 1)')
    ).rejects.toThrow();

    // Test invalid permission_id in role_permissions
    await expect(
      client.query('INSERT INTO role_permissions (role_id, permission_id) VALUES (1, 99999)')
    ).rejects.toThrow();
  });
});
```

### Verification Script

Create `backend/scripts/verify-rbac.js`:

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function verifyRBAC() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verifying RBAC System...\n');

    // Check tables exist
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('permissions', 'role_permissions', 'user_permissions', 'permission_audit_log')
      ORDER BY table_name
    `);
    
    console.log('✅ RBAC Tables:');
    tables.rows.forEach(row => console.log(`   - ${row.table_name}`));

    // Check permissions
    const permissions = await client.query('SELECT COUNT(*) as count FROM permissions');
    console.log(`\n✅ Permissions: ${permissions.rows[0].count} created`);

    // Check role permissions
    const rolePermissions = await client.query('SELECT COUNT(*) as count FROM role_permissions');
    console.log(`✅ Role Permissions: ${rolePermissions.rows[0].count} assignments`);

    // Show sample permissions by role
    const samplePermissions = await client.query(`
      SELECT r.name as role_name, COUNT(p.id) as permission_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      GROUP BY r.id, r.name
      ORDER BY permission_count DESC
    `);

    console.log('\n📊 Permissions by Role:');
    samplePermissions.rows.forEach(row => {
      console.log(`   - ${row.role_name}: ${row.permission_count} permissions`);
    });

    // Check indexes
    const indexes = await client.query(`
      SELECT indexname FROM pg_indexes 
      WHERE tablename IN ('permissions', 'role_permissions', 'user_permissions', 'permission_audit_log')
      AND indexname LIKE 'idx_%'
      ORDER BY indexname
    `);

    console.log('\n✅ Performance Indexes:');
    indexes.rows.forEach(row => console.log(`   - ${row.indexname}`));

    console.log('\n🎉 RBAC System verification completed successfully!');

  } catch (error) {
    console.error('❌ RBAC verification failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

verifyRBAC()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
```

### Run Verification

```bash
cd backend
node scripts/verify-rbac.js
```

---

## ✅ Completion Checklist

- [ ] RBAC schema designed and documented
- [ ] Database tables created with proper relationships
- [ ] Permissions seeded for all resources and actions
- [ ] Role permissions assigned to existing roles
- [ ] Indexes created for performance
- [ ] Integration tests written and passing
- [ ] Verification script confirms setup
- [ ] Documentation updated

---

## 📚 Documentation

Update `backend/docs/database-schema/rbac-system.md`:

```markdown
# RBAC System Database Schema

## Overview
Role-Based Access Control system with granular permissions.

## Tables
- `permissions`: System permissions
- `role_permissions`: Permissions assigned to roles
- `user_permissions`: Direct user permissions
- `permission_audit_log`: Audit trail

## Permission Format
`resource:action` (e.g., `patients:create`, `medical_records:read`)

## Role Hierarchy
1. Admin - Full system access
2. Doctor - Medical operations
3. Nurse - Patient care
4. Receptionist - Front desk
5. Lab Technician - Lab operations
6. Pharmacist - Pharmacy operations
7. Manager - Department management
```

---

## 🎯 Success Criteria

- ✅ RBAC database schema implemented
- ✅ Permissions system designed and seeded
- ✅ Role permissions assigned
- ✅ Audit logging system ready
- ✅ Performance indexes created
- ✅ Integration tests passing
- ✅ Documentation complete

**Day 1 Complete!** Ready for Day 2: Permission System Implementation.

---

**Next**: [Day 2: Permission System & Middleware](day-2-permission-system.md)