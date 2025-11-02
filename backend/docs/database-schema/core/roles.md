# Roles and User Roles Tables Documentation

## ⚠️ IMPORTANT: TABLES NOT YET CREATED

**Status**: ❌ The `roles` and `user_roles` tables have not been created yet due to migration conflicts.
**Action Required**: Resolve migration issues to create these tables.

## 📋 Tables Overview (Planned)

The role system will consist of two tables:
- `roles`: Defines available roles in the system
- `user_roles`: Junction table linking users to their roles (many-to-many)

## 🗃️ Roles Table Structure

### Table Name: `roles`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `integer` | PRIMARY KEY, AUTO INCREMENT | Unique role identifier |
| `name` | `varchar(255)` | NOT NULL | Role name (e.g., "Admin", "Doctor", "Nurse") |
| `description` | `text` | NULLABLE | Detailed description of role permissions |
| `created_at` | `timestamp` | NOT NULL, DEFAULT current_timestamp | Role creation timestamp |

## 🗃️ User Roles Junction Table Structure

### Table Name: `user_roles`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `integer` | PRIMARY KEY, AUTO INCREMENT | Unique assignment identifier |
| `user_id` | `integer` | NOT NULL, FOREIGN KEY | References users.id |
| `role_id` | `integer` | NOT NULL, FOREIGN KEY | References roles.id |
| `created_at` | `timestamp` | NOT NULL, DEFAULT current_timestamp | Assignment timestamp |

## 🔗 Relationships

### Roles Table Relationships
- **roles → user_roles**: One role can be assigned to many users
  - Foreign Key: `user_roles.role_id` references `roles.id`
  - Cascade: ON DELETE CASCADE (deleting role removes assignments)

### User Roles Junction Relationships
- **user_roles.user_id → users.id**
  - Constraint: ON DELETE CASCADE
  - Index: `user_roles_user_id_idx`
- **user_roles.role_id → roles.id**
  - Constraint: ON DELETE CASCADE
  - Index: `user_roles_role_id_idx`

### Many-to-Many Pattern
- **users ↔ roles** via `user_roles`
  - One user can have multiple roles
  - One role can be assigned to multiple users

## 📝 SQL Definitions

### Roles Table
```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name varchar(255) NOT NULL,
  description text,
  created_at timestamp NOT NULL DEFAULT current_timestamp
);
```

### User Roles Junction Table
```sql
CREATE TABLE user_roles (
  id SERIAL PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id integer NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at timestamp NOT NULL DEFAULT current_timestamp
);

-- Indexes
CREATE INDEX user_roles_user_id_idx ON user_roles(user_id);
CREATE INDEX user_roles_role_id_idx ON user_roles(role_id);
```

## 🔍 Common Queries

### Get All Roles with User Count
```sql
SELECT r.*, COUNT(ur.user_id) as user_count 
FROM roles r 
LEFT JOIN user_roles ur ON r.id = ur.role_id 
GROUP BY r.id 
ORDER BY r.name;
```

### Get User's Roles
```sql
SELECT r.* 
FROM roles r 
JOIN user_roles ur ON r.id = ur.role_id 
WHERE ur.user_id = $1;
```

### Get Users with Specific Role
```sql
SELECT u.* 
FROM users u 
JOIN user_roles ur ON u.id = ur.user_id 
JOIN roles r ON ur.role_id = r.id 
WHERE r.name = $1;
```

### Get Admin Users
```sql
SELECT u.* 
FROM users u 
JOIN user_roles ur ON u.id = ur.user_id 
JOIN roles r ON ur.role_id = r.id 
WHERE r.name = 'Admin';
```

### Check if User Has Role
```sql
SELECT EXISTS(
  SELECT 1 
  FROM user_roles ur 
  JOIN roles r ON ur.role_id = r.id 
  WHERE ur.user_id = $1 AND r.name = $2
) as has_role;
```

## 🛠️ Service Operations

### Role Management (`roleService.ts`)

#### Get Roles
- **Method**: `getRoles(queryParams)`
- **Features**:
  - Pagination (page, limit)
  - Sorting (sortBy, order)
  - Filtering by name/description
  - User count for each role
- **Allowed Sort Fields**: `['name', 'description', 'created_at']`

#### Create Role
- **Method**: `createRole(roleData)`
- **Required**: `name`
- **Optional**: `description`
- **Returns**: Created role object

#### Update Role
- **Method**: `updateRole(id, roleData)`
- **Updates**: `name`, `description`
- **Returns**: Updated role object

#### Delete Role
- **Method**: `deleteRole(id)`
- **Process**:
  1. Delete all user assignments (`user_roles`)
  2. Delete role record
- **Warning**: Removes role from all users

### User Role Assignment (`userService.ts`)

#### Assign Role to User
```sql
-- During user creation or update
INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2);
```

#### Change User Role
```sql
-- Remove existing roles
DELETE FROM user_roles WHERE user_id = $1;
-- Add new role
INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2);
```

#### Remove Role from User
```sql
DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2;
```

## 🏥 Standard Hospital Roles

### Typical Role Hierarchy
1. **Admin**: System administration, tenant management
2. **Doctor**: Medical staff, patient care, prescriptions
3. **Nurse**: Patient care, medication administration
4. **Receptionist**: Appointment scheduling, patient check-in
5. **Lab Technician**: Laboratory tests, results entry
6. **Pharmacist**: Medication management, dispensing
7. **Manager**: Department management, reporting
8. **IT Support**: Technical support, system maintenance

### Role Permissions (Application Level)
- **Admin**: Full system access, user management, tenant settings
- **Doctor**: Patient records, appointments, prescriptions, medical notes
- **Nurse**: Patient care records, medication tracking, vital signs
- **Receptionist**: Appointments, patient registration, basic info
- **Lab Tech**: Lab orders, test results, equipment management
- **Pharmacist**: Medication inventory, prescription fulfillment
- **Manager**: Reports, analytics, department oversight
- **IT Support**: System logs, technical configuration

## 📊 Role Statistics Queries

### Users per Role
```sql
SELECT r.name, COUNT(ur.user_id) as user_count 
FROM roles r 
LEFT JOIN user_roles ur ON r.id = ur.role_id 
GROUP BY r.id, r.name 
ORDER BY user_count DESC;
```

### Most Common Roles
```sql
SELECT r.name, COUNT(ur.user_id) as assignments 
FROM roles r 
JOIN user_roles ur ON r.id = ur.role_id 
GROUP BY r.id, r.name 
ORDER BY assignments DESC 
LIMIT 5;
```

### Users with Multiple Roles
```sql
SELECT u.name, u.email, COUNT(ur.role_id) as role_count 
FROM users u 
JOIN user_roles ur ON u.id = ur.user_id 
GROUP BY u.id, u.name, u.email 
HAVING COUNT(ur.role_id) > 1 
ORDER BY role_count DESC;
```

## 🔍 Indexes and Performance

### Existing Indexes
- `roles_pkey`: Primary key on `roles.id`
- `user_roles_pkey`: Primary key on `user_roles.id`
- `user_roles_user_id_idx`: Index on `user_roles.user_id`
- `user_roles_role_id_idx`: Index on `user_roles.role_id`

### Performance Considerations
- Junction table indexes enable fast role lookups
- Consider composite index on `(user_id, role_id)` for uniqueness
- Role name queries benefit from index on `roles.name`

## 📊 Migration History

### Migration: `1762003868921_update-users-and-add-roles-tables.js`
- **Created**: Both `roles` and `user_roles` tables
- **Purpose**: Implement role-based access control
- **Features**:
  - Many-to-many user-role relationships
  - Proper foreign key constraints
  - Cascade deletes for data integrity
  - Indexes for performance

## ⚠️ Common Mistakes to Avoid

1. **Don't create duplicate role tables** - Use existing `roles` and `user_roles`
2. **Don't skip junction table** - Always use `user_roles` for assignments
3. **Don't store roles in users table** - Use proper many-to-many relationship
4. **Don't forget cascade deletes** - Maintain referential integrity
5. **Don't allow orphaned assignments** - Clean up `user_roles` when deleting users/roles
6. **Don't hardcode role IDs** - Query by role name for flexibility
7. **Don't ignore role validation** - Verify role exists before assignment

## 🚨 Security Considerations

### Role-Based Access Control (RBAC)
- Roles define what users can access
- Application enforces role-based permissions
- Database stores role assignments only
- Business logic handles permission checking

### Multi-Tenant Role Isolation
- Roles are global across all tenants
- Role assignments are tenant-specific via user context
- Same role name can have different permissions per tenant
- Validate tenant context when checking roles

### Role Management Security
- Only admins should create/modify roles
- Role deletion affects all assigned users
- Audit trail for role changes recommended
- Validate role assignments during user operations