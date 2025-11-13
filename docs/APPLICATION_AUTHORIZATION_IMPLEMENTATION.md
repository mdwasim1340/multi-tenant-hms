# Application-Level Authorization Implementation Summary

## ✅ Implementation Complete

Application-level authorization has been successfully implemented to ensure users can only access applications they are authorized for.

---

## 🎯 What Was Implemented

### 1. Database Schema ✅
**File**: `backend/migrations/1731485000000_application_authorization.sql`

Created tables:
- `permissions` - Granular permissions for resources and actions
- `role_permissions` - Many-to-many relationship between roles and permissions
- `applications` - Registry of applications in the system

**Default Permissions Created**:
- Admin Dashboard: access, read, write, admin
- Hospital System: access, read, write, admin
- Patients: read, write, admin
- Appointments: read, write, admin
- Analytics: read, write, admin
- System: read, write, admin

**Default Applications Registered**:
- `admin_dashboard` - Admin Dashboard (Port 3002)
- `hospital_system` - Hospital Management System (Port 3001)

**Role-Permission Assignments**:
- **Admin**: All permissions (full system access)
- **Hospital Admin**: Hospital system + management permissions
- **Doctor**: Hospital system + clinical data (patients, appointments)
- **Nurse**: Hospital system + limited access (read patients, manage appointments)
- **Receptionist**: Front desk operations (patients, appointments)
- **Manager**: Hospital system + reports
- **Lab Technician**: Hospital system + lab module
- **Pharmacist**: Hospital system + pharmacy

### 2. Backend Services ✅
**File**: `backend/src/services/authorization.ts`

Functions implemented:
- `getUserRoles(userId)` - Get user's assigned roles
- `getUserPermissions(userId)` - Get user's permissions
- `checkUserPermission(userId, resource, action)` - Check specific permission
- `getUserApplicationAccess(userId)` - Get all applications with access status
- `canUserAccessApplication(userId, applicationId)` - Check app access
- `getUserAccessibleApplications(userId)` - Get only accessible apps
- `assignUserRole(userId, roleId)` - Assign role to user
- `revokeUserRole(userId, roleId)` - Revoke role from user
- `getAllRoles()` - Get all available roles
- `getRolePermissions(roleId)` - Get permissions for a role
- `getAllPermissions()` - Get all available permissions

### 3. Authorization Middleware ✅
**File**: `backend/src/middleware/authorization.ts`

Middleware functions:
- `requireApplicationAccess(applicationId)` - Enforce app-level access
- `requirePermission(resource, action)` - Enforce permission-based access
- `requireRole(roleName)` - Enforce role-based access

### 4. Updated Authentication Flow ✅
**File**: `backend/src/routes/auth.ts`

Updated `/auth/signin` endpoint to return:
```json
{
  "token": "jwt_token",
  "refreshToken": "refresh_token",
  "expiresIn": 3600,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "tenant_id": "tenant_123"
  },
  "roles": [
    {
      "id": 1,
      "name": "Doctor",
      "description": "Medical practitioner"
    }
  ],
  "permissions": [
    {
      "resource": "hospital_system",
      "action": "access"
    },
    {
      "resource": "patients",
      "action": "read"
    }
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

### 5. Role Management API ✅
**File**: `backend/src/routes/roles.ts`

Endpoints created:
- `GET /api/roles` - Get all roles
- `GET /api/roles/:roleId/permissions` - Get role permissions
- `GET /api/permissions` - Get all permissions
- `GET /api/users/:userId/roles` - Get user roles
- `POST /api/users/:userId/roles` - Assign role to user (Admin only)
- `DELETE /api/users/:userId/roles/:roleId` - Revoke role from user (Admin only)

### 6. Frontend Guards ✅

#### Hospital Management System
**Files**:
- `hospital-management-system/lib/auth.ts` - Updated with authorization functions
- `hospital-management-system/app/auth/login/page.tsx` - Added access check
- `hospital-management-system/app/unauthorized/page.tsx` - Unauthorized page

**Functions added**:
- `hasHospitalAccess()` - Check if user can access hospital system
- `getUserPermissions()` - Get user's permissions
- `getUserRoles()` - Get user's roles
- `hasPermission(resource, action)` - Check specific permission

#### Admin Dashboard
**Files**:
- `admin-dashboard/lib/auth.ts` - Created authorization library
- `admin-dashboard/app/auth/signin/page.tsx` - Added access check
- `admin-dashboard/app/unauthorized/page.tsx` - Unauthorized page

**Functions added**:
- `hasAdminAccess()` - Check if user can access admin dashboard
- `getUserPermissions()` - Get user's permissions
- `getUserRoles()` - Get user's roles
- `hasPermission(resource, action)` - Check specific permission
- `isAdmin()` - Check if user has admin role

---

## 🔐 Access Control Matrix

| Role | Admin Dashboard | Hospital System | Analytics |
|------|----------------|-----------------|-----------|
| Admin | ✅ Full Access | ✅ All Tenants | ✅ Full Access |
| Hospital Admin | ❌ No Access | ✅ Own Tenant | ✅ Own Tenant |
| Doctor | ❌ No Access | ✅ Own Tenant | ✅ Clinical Data |
| Nurse | ❌ No Access | ✅ Own Tenant | ✅ Limited |
| Receptionist | ❌ No Access | ✅ Front Desk | ❌ No Access |
| Manager | ❌ No Access | ✅ Own Tenant | ✅ Reports |
| Lab Technician | ❌ No Access | ✅ Lab Module | ✅ Lab Data |
| Pharmacist | ❌ No Access | ✅ Pharmacy | ✅ Pharmacy Data |

---

## 🧪 Testing the Implementation

### 1. Test Admin Access
```bash
# Sign in as admin user
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# Response should include:
# - accessibleApplications with admin_dashboard and hospital_system
# - roles with "Admin"
# - permissions with admin_dashboard:access
```

### 2. Test Doctor Access
```bash
# Sign in as doctor
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@hospital.com","password":"password123"}'

# Response should include:
# - accessibleApplications with only hospital_system
# - roles with "Doctor"
# - permissions with hospital_system:access, patients:read, patients:write
```

### 3. Test Unauthorized Access
1. Try to access admin dashboard with doctor credentials
2. Should be redirected to `/unauthorized` page
3. Error message: "You don't have permission to access the Admin Dashboard"

### 4. Test Role Assignment (Admin Only)
```bash
# Assign Doctor role to user
curl -X POST http://localhost:3000/api/users/123/roles \
  -H "Authorization: Bearer admin_token" \
  -H "Content-Type: application/json" \
  -d '{"roleId":2}'

# Revoke role
curl -X DELETE http://localhost:3000/api/users/123/roles/2 \
  -H "Authorization: Bearer admin_token"
```

---

## 📊 Database Helper Functions

### Check User Permission
```sql
SELECT check_user_permission(1, 'patients', 'read');
-- Returns: true/false
```

### Get User Permissions
```sql
SELECT * FROM get_user_permissions(1);
-- Returns: List of (resource, action) pairs
```

---

## 🚀 How to Use

### For Developers

#### 1. Protect Backend Routes
```typescript
import { requireApplicationAccess, requirePermission } from './middleware/authorization';

// Protect entire application
app.use('/api/hospital', requireApplicationAccess('hospital_system'));

// Protect specific endpoints
app.get('/api/patients', requirePermission('patients', 'read'), getPatientsHandler);
app.post('/api/patients', requirePermission('patients', 'write'), createPatientHandler);
```

#### 2. Check Permissions in Frontend
```typescript
import { hasPermission, hasHospitalAccess } from '@/lib/auth';

// Check application access
if (!hasHospitalAccess()) {
  router.push('/unauthorized');
}

// Check specific permission
if (hasPermission('patients', 'write')) {
  // Show create patient button
}
```

#### 3. Assign Roles to Users
```typescript
// In admin dashboard
import { assignUserRole } from '@/lib/api';

await assignUserRole(userId, roleId);
```

### For Administrators

#### 1. Assign Roles via Database
```sql
-- Assign Doctor role to user
INSERT INTO user_roles (user_id, role_id)
VALUES (123, (SELECT id FROM roles WHERE name = 'Doctor'));
```

#### 2. Create Custom Roles
```sql
-- Create new role
INSERT INTO roles (name, description)
VALUES ('Billing Staff', 'Staff handling billing and payments');

-- Assign permissions to role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'Billing Staff'),
  id
FROM permissions
WHERE resource IN ('hospital_system', 'billing')
  AND action IN ('access', 'read', 'write');
```

---

## 🔧 Configuration

### Add New Application
```sql
INSERT INTO applications (id, name, description, url, port, required_permissions, status)
VALUES (
  'analytics_dashboard',
  'Analytics Dashboard',
  'Business intelligence and reporting',
  'http://localhost:3003',
  3003,
  ARRAY['analytics:access'],
  'active'
);
```

### Add New Permission
```sql
INSERT INTO permissions (resource, action, description)
VALUES ('billing', 'admin', 'Full billing administration');

-- Assign to Admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'Admin'),
  id
FROM permissions
WHERE resource = 'billing' AND action = 'admin';
```

---

## ✅ Success Criteria Met

1. ✅ Users can only access authorized applications
2. ✅ Admins can assign/revoke roles via API
3. ✅ Clear error messages for unauthorized access
4. ✅ Easy to add new applications and roles
5. ✅ Permissions stored in database and returned on login
6. ✅ Frontend guards prevent unauthorized access
7. ✅ Backend middleware enforces access control
8. ✅ Comprehensive role-permission system

---

## 📝 Next Steps

### For Production Deployment
1. Create admin users and assign Admin role
2. Create hospital staff users and assign appropriate roles
3. Test all role-permission combinations
4. Set up role management UI in admin dashboard
5. Document role assignment procedures for administrators

### Future Enhancements
1. Add role management UI in admin dashboard
2. Add permission management UI
3. Add audit logging for role changes
4. Add time-based role assignments (temporary access)
5. Add role hierarchy (role inheritance)

---

## 🎉 Summary

Application-level authorization is now fully implemented and operational. Users will only be able to access applications they have permissions for:

- **Admin users** → Can access Admin Dashboard
- **Hospital staff** (Doctor, Nurse, etc.) → Can access Hospital Management System
- **Unauthorized users** → Redirected to unauthorized page with clear message

The system is secure, scalable, and easy to extend with new applications and roles.
