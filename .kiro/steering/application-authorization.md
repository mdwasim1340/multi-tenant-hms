# Application-Level Authorization - AI Agent Guidelines

## 🎯 Overview

Application-level authorization ensures users can only access applications they have permissions for. This system was implemented on November 13, 2025, and is now fully operational.

---

## 🏗️ System Architecture

### Database Schema

**3 New Tables**:
1. **permissions** - 20 granular permissions (resource:action pairs)
2. **role_permissions** - Many-to-many role-to-permission mappings
3. **applications** - Application registry with required permissions

**Existing Tables Enhanced**:
- **roles** - 8 roles defined (was 7, added Hospital Admin)
- **user_roles** - User-to-role assignments

### 8 Roles Defined

| Role | Permissions | Admin Dashboard | Hospital System |
|------|-------------|-----------------|-----------------|
| **Admin** | 20 | ✅ Yes | ✅ Yes |
| **Hospital Admin** | 16 | ❌ No | ✅ Yes |
| **Doctor** | 8 | ❌ No | ✅ Yes |
| **Nurse** | 5 | ❌ No | ✅ Yes |
| **Receptionist** | 6 | ❌ No | ✅ Yes |
| **Manager** | 4 | ❌ No | ✅ Yes |
| **Lab Technician** | 3 | ❌ No | ✅ Yes |
| **Pharmacist** | 3 | ❌ No | ✅ Yes |

### 20 Permissions Defined

**Admin Dashboard** (4):
- admin_dashboard:access, read, write, admin

**Hospital System** (4):
- hospital_system:access, read, write, admin

**Patients** (3):
- patients:read, write, admin

**Appointments** (3):
- appointments:read, write, admin

**Analytics** (3):
- analytics:read, write, admin

**System** (3):
- system:read, write, admin

---

## 🔐 How It Works

### 1. Signin Flow

**Before Authorization**:
```json
POST /auth/signin
Response: {
  "token": "jwt_token",
  "user": {...}
}
```

**After Authorization (NEW)**:
```json
POST /auth/signin
Response: {
  "token": "jwt_token",
  "user": {...},
  "roles": [
    {"id": 2, "name": "Doctor", "description": "Medical practitioner"}
  ],
  "permissions": [
    {"resource": "hospital_system", "action": "access"},
    {"resource": "patients", "action": "read"},
    {"resource": "patients", "action": "write"}
  ],
  "accessibleApplications": [
    {
      "application_id": "hospital_system",
      "name": "Hospital Management System",
      "url": "http://localhost:3001",
      "port": 3001,
      "has_access": true,
      "required_permissions": ["hospital_system:access"]
    }
  ]
}
```

### 2. Frontend Access Check

**Hospital Management System** (`hospital-management-system/lib/auth.ts`):
```typescript
// Check if user has access to hospital system
const hasHospitalAccess = (): boolean => {
  const apps = JSON.parse(Cookies.get('accessible_apps'));
  return apps.some(app => 
    app.application_id === 'hospital_system' && app.has_access
  );
};

// On login
if (!result.hasAccess) {
  router.push('/unauthorized');
}
```

**Admin Dashboard** (`admin-dashboard/lib/auth.ts`):
```typescript
// Check if user has access to admin dashboard
const hasAdminAccess = (): boolean => {
  const apps = JSON.parse(Cookies.get('accessible_apps'));
  return apps.some(app => 
    app.application_id === 'admin_dashboard' && app.has_access
  );
};
```

### 3. Backend Enforcement

**Authorization Middleware** (`backend/src/middleware/authorization.ts`):
```typescript
// Protect entire application
app.use('/api/hospital', requireApplicationAccess('hospital_system'));

// Protect specific endpoints
app.get('/api/patients', requirePermission('patients', 'read'), handler);
app.post('/api/patients', requirePermission('patients', 'write'), handler);

// Protect by role
app.get('/api/admin/settings', requireRole('Admin'), handler);
```

---

## 🛠️ Implementation Files

### Backend
- `backend/migrations/1731485000000_application_authorization.sql` - Database schema
- `backend/src/services/authorization.ts` - Authorization service (11 functions)
- `backend/src/middleware/authorization.ts` - Authorization middleware (3 functions)
- `backend/src/routes/auth.ts` - Updated signin to include permissions
- `backend/src/routes/roles.ts` - Role management API (6 endpoints)

### Frontend - Hospital System
- `hospital-management-system/lib/auth.ts` - Authorization functions
- `hospital-management-system/app/auth/login/page.tsx` - Access check on login
- `hospital-management-system/app/unauthorized/page.tsx` - Unauthorized page

### Frontend - Admin Dashboard
- `admin-dashboard/lib/auth.ts` - Authorization functions
- `admin-dashboard/app/auth/signin/page.tsx` - Access check on login
- `admin-dashboard/app/unauthorized/page.tsx` - Unauthorized page

### Scripts
- `backend/scripts/test-authorization.js` - Test authorization system
- `backend/scripts/assign-admin-role.js` - Assign admin role to user
- `backend/scripts/create-hospital-admin.js` - Create hospital admin user

---

## 📋 API Endpoints

### Role Management (Admin Only)

**GET /api/roles**
- Returns all roles with permission counts
- No authentication required (public info)

**GET /api/roles/:roleId/permissions**
- Returns permissions for a specific role
- No authentication required (public info)

**GET /api/permissions**
- Returns all available permissions
- No authentication required (public info)

**GET /api/users/:userId/roles**
- Returns roles assigned to a user
- Requires authentication

**POST /api/users/:userId/roles**
- Assigns a role to a user
- Requires Admin role
- Body: `{"roleId": 2}`

**DELETE /api/users/:userId/roles/:roleId**
- Revokes a role from a user
- Requires Admin role

---

## 🧪 Testing

### Test Authorization System
```bash
cd backend
node scripts/test-authorization.js
```

Expected output:
```
✅ Found 3/3 tables
✅ 20 permissions created
✅ 2 applications registered
✅ Role permissions assigned
```

### Create Hospital Admin User
```bash
node scripts/create-hospital-admin.js email@example.com "User Name" tenant_id password
```

Example:
```bash
node scripts/create-hospital-admin.js doctor@hospital.com "Dr. Smith" aajmin_polyclinic "SecurePass123!"
```

### Assign Admin Role
```bash
node scripts/assign-admin-role.js user@example.com
```

### Test Signin
```bash
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

---

## 🚨 Critical Rules for AI Agents

### 1. Always Check User Permissions

**Before creating protected routes**:
```typescript
// ❌ WRONG: No permission check
app.get('/api/patients', getPatientsHandler);

// ✅ CORRECT: With permission check
app.get('/api/patients', 
  requirePermission('patients', 'read'), 
  getPatientsHandler
);
```

### 2. Always Validate Application Access

**Frontend**:
```typescript
// ❌ WRONG: No access check
router.push('/dashboard');

// ✅ CORRECT: Check access first
if (!hasHospitalAccess()) {
  router.push('/unauthorized');
  return;
}
router.push('/dashboard');
```

### 3. Never Hardcode Permissions

**Use the database**:
```typescript
// ❌ WRONG: Hardcoded permissions
if (user.role === 'Doctor') {
  // Allow access
}

// ✅ CORRECT: Check permissions from database
if (await checkUserPermission(userId, 'patients', 'read')) {
  // Allow access
}
```

### 4. Always Return Permissions on Signin

**Updated signin endpoint**:
```typescript
// Must include in response
{
  token,
  user,
  roles: await getUserRoles(userId),
  permissions: await getUserPermissions(userId),
  accessibleApplications: await getUserAccessibleApplications(userId)
}
```

---

## 📊 Database Helper Functions

### Check User Permission
```sql
SELECT check_user_permission(user_id, 'patients', 'read');
-- Returns: true/false
```

### Get User Permissions
```sql
SELECT * FROM get_user_permissions(user_id);
-- Returns: List of (resource, action) pairs
```

### Assign Role
```sql
INSERT INTO user_roles (user_id, role_id)
VALUES (user_id, role_id);
```

### Check User Roles
```sql
SELECT r.name, r.description
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = user_id;
```

---

## 🎯 Common Tasks

### Create New User with Role
```bash
# 1. Create user in Cognito and database
node scripts/create-hospital-admin.js email@example.com "Name" tenant_id password

# 2. Role is automatically assigned (Hospital Admin)
```

### Change User Role
```bash
# Via API
curl -X POST http://localhost:3000/api/users/USER_ID/roles \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"roleId":2}'
```

### Add New Permission
```sql
-- 1. Create permission
INSERT INTO permissions (resource, action, description)
VALUES ('billing', 'read', 'View billing information');

-- 2. Assign to role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'Manager'),
  id
FROM permissions
WHERE resource = 'billing' AND action = 'read';
```

---

## ✅ Success Criteria

- [x] Users can only access authorized applications
- [x] Admin users can access admin dashboard
- [x] Hospital staff can access hospital system
- [x] Unauthorized users see clear error messages
- [x] Permissions returned on login
- [x] Frontend guards prevent unauthorized access
- [x] Backend middleware enforces access control
- [x] Role management API available

---

## 📚 Documentation

- **Quick Start**: `docs/AUTHORIZATION_QUICK_START.md`
- **Full Implementation**: `docs/APPLICATION_AUTHORIZATION_IMPLEMENTATION.md`
- **Testing Guide**: `AUTHORIZATION_TESTING_GUIDE.md`
- **User Setup**: `USER_SETUP_COMPLETE.md`
- **Quick Access**: `QUICK_ACCESS_GUIDE.md`

---

**Status**: Production Ready (November 13, 2025) 🚀
