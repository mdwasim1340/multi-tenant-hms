# Users Table Documentation

## ⚠️ IMPORTANT: TABLE NOT YET CREATED

**Status**: ❌ The `users` table has not been created yet due to migration conflicts.
**Action Required**: Resolve migration issues to create this table.

## 📋 Table Overview (Planned)

The `users` table will store user account information for all users across all tenants. Each user will belong to exactly one tenant and can have multiple roles.

## 🗃️ Table Structure

### Table Name: `users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `integer` | PRIMARY KEY, AUTO INCREMENT | Unique user identifier |
| `name` | `varchar(255)` | NOT NULL | Full name of the user |
| `email` | `varchar(255)` | NOT NULL, UNIQUE | Email address (used for login) |
| `password` | `varchar(255)` | NOT NULL | Hashed password (bcrypt) |
| `status` | `varchar(50)` | NOT NULL, DEFAULT 'active' | User account status |
| `phone_number` | `varchar(50)` | NULLABLE | User's phone number |
| `last_login_date` | `timestamp` | NULLABLE | Last successful login timestamp |
| `profile_picture_url` | `text` | NULLABLE | URL to user's profile picture (S3) |
| `tenant_id` | `integer` | NOT NULL, FOREIGN KEY | References tenants.id |
| `created_at` | `timestamp` | NOT NULL, DEFAULT current_timestamp | Account creation timestamp |

## 🔗 Relationships

### Foreign Key Relationships
- **users.tenant_id → tenants.id**
  - Constraint: ON DELETE CASCADE
  - Index: `users_tenant_id_idx`
  - Purpose: Links user to their tenant/hospital

### Many-to-Many Relationships
- **users ↔ roles** (via `user_roles` junction table)
  - Junction: `user_roles.user_id` → `users.id`
  - Junction: `user_roles.role_id` → `roles.id`
  - Purpose: Users can have multiple roles

## 📝 SQL Definition

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name varchar(255) NOT NULL,
  email varchar(255) NOT NULL UNIQUE,
  password varchar(255) NOT NULL,
  status varchar(50) NOT NULL DEFAULT 'active',
  phone_number varchar(50),
  last_login_date timestamp,
  profile_picture_url text,
  tenant_id integer NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at timestamp NOT NULL DEFAULT current_timestamp
);

-- Indexes
CREATE INDEX users_tenant_id_idx ON users(tenant_id);
```

## 🔍 Common Queries

### Get User with Role and Tenant Info
```sql
SELECT u.*, r.name as role, t.name as tenant 
FROM users u 
LEFT JOIN user_roles ur ON u.id = ur.user_id 
LEFT JOIN roles r ON ur.role_id = r.id 
LEFT JOIN tenants t ON u.tenant_id = t.id 
WHERE u.id = $1;
```

### Get All Users for a Tenant
```sql
SELECT * FROM users WHERE tenant_id = $1;
```

### Get Active Users Count
```sql
SELECT COUNT(*) FROM users WHERE status = 'active';
```

### Get Admin Users
```sql
SELECT u.* 
FROM users u 
JOIN user_roles ur ON u.id = ur.user_id 
JOIN roles r ON ur.role_id = r.id 
WHERE r.name = 'Admin';
```

### Get Users with Pagination and Sorting
```sql
SELECT u.*, r.name as role, t.name as tenant 
FROM users u 
LEFT JOIN user_roles ur ON u.id = ur.user_id 
LEFT JOIN roles r ON ur.role_id = r.id 
LEFT JOIN tenants t ON u.tenant_id = t.id 
ORDER BY u.created_at DESC 
LIMIT $1 OFFSET $2;
```

## 🛠️ Service Operations

### Create User
- **Service**: `userService.ts` → `createUser()`
- **Process**:
  1. Hash password with bcrypt (10 salt rounds)
  2. Insert user record
  3. Assign role if `role_id` provided
  4. Return created user
- **Validation**: Email uniqueness, required fields

### Update User
- **Service**: `userService.ts` → `updateUser()`
- **Process**:
  1. Hash new password if provided
  2. Update user record
  3. Update role assignment if `role_id` provided
  4. Return updated user

### Delete User
- **Service**: `userService.ts` → `deleteUser()`
- **Process**:
  1. Delete from `user_roles` junction table
  2. Delete user record
- **Cascade**: Role assignments automatically removed

### Get Users with Filters
- **Service**: `userService.ts` → `getUsers()`
- **Features**:
  - Pagination (page, limit)
  - Sorting (sortBy, order)
  - Filtering by any field
  - Statistics (total, active, admins)

## 🔐 Password Security

### Hashing
- **Algorithm**: bcrypt with 10 salt rounds
- **Storage**: Never store plain text passwords
- **Updates**: Always hash new passwords on update

### Password Requirements
- Enforced by AWS Cognito (not database)
- Minimum 8 characters
- Must contain uppercase, lowercase, number, special character

## 📊 Status Values

### User Status Options
- `"active"`: User can log in and access system
- `"inactive"`: User account disabled
- `"pending"`: User registered but not verified
- `"suspended"`: Temporarily disabled account
- `"deleted"`: Soft delete (if implemented)

## 🖼️ Profile Pictures

### Storage Pattern
- **Location**: AWS S3 bucket
- **Path**: `{tenant_id}/profiles/{user_id}/{filename}`
- **URL**: Presigned URLs for secure access
- **Field**: `profile_picture_url` stores S3 URL

## 🔍 Indexes and Performance

### Existing Indexes
- `users_pkey`: Primary key on `id`
- `users_email_key`: Unique index on `email`
- `users_tenant_id_idx`: Index on `tenant_id`

### Query Optimization
- Use tenant_id index for tenant-specific queries
- Email index for login lookups
- Consider composite indexes for frequent filter combinations

## 📊 Migration History

### Migration: `1678886400000_initial-migration.js`
- **Created**: Original simple users table (UUID, email only)
- **Purpose**: Basic user storage
- **Superseded**: By comprehensive user structure

### Migration: `1762003868921_update-users-and-add-roles-tables.js`
- **Created**: Current comprehensive users table
- **Purpose**: Full user management with roles and tenants
- **Changes**: 
  - Dropped original table
  - Added full user profile fields
  - Added tenant relationship
  - Added role system support

## ⚠️ Common Mistakes to Avoid

1. **Don't store plain text passwords** - Always use bcrypt hashing
2. **Don't forget tenant_id** - All users must belong to a tenant
3. **Don't skip email validation** - Ensure email uniqueness
4. **Don't ignore role assignments** - Use user_roles junction table
5. **Don't allow cross-tenant user access** - Validate tenant context
6. **Don't create duplicate user tables** - Use existing users table
7. **Don't modify password field directly** - Use service methods for hashing

## 🚨 Security Considerations

### Multi-Tenant Security
- Users can only access data within their tenant
- Tenant context validated via `X-Tenant-ID` header
- No cross-tenant user relationships allowed

### Authentication Integration
- **AWS Cognito**: Primary authentication system
- **JWT Tokens**: Used for API authentication
- **Database Users**: Store additional profile information
- **Sync**: Keep Cognito and database users synchronized

### Data Protection
- **Password Hashing**: bcrypt with salt
- **Email Privacy**: Validate email ownership
- **Profile Pictures**: Secure S3 storage with presigned URLs
- **Audit Trail**: Track last_login_date for security monitoring