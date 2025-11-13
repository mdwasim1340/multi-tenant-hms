# Application-Level Authorization Implementation Plan

## 🎯 Objective

Implement application-level authorization to ensure users can only access applications they are authorized for, preventing unauthorized access to admin dashboard or other applications.

## 📋 Current State

### Existing Infrastructure
- ✅ Roles table (8 roles: Admin, Doctor, Nurse, Receptionist, Manager, Lab Technician, Pharmacist, Hospital Admin)
- ✅ User_roles table (user-role assignments)
- ✅ AWS Cognito authentication
- ✅ Multi-tenant architecture

### Current Issues
- ❌ Any authenticated user can access any application
- ❌ No application-specific permissions
- ❌ No role-based application access control

## 🏗️ Architecture Design

### Applications in System
1. **Admin Dashboard** (Port 3002) - Super admins only
2. **Hospital Management System** (Port 3001) - Hospital staff (doctors, nurses, etc.)
3. **Future Apps** - Role-based access

### Access Control Matrix

| Role | Admin Dashboard | Hospital System | Analytics |
|------|----------------|-----------------|-----------|
| Admin (Super Admin) | ✅ Full | ✅ All Tenants | ✅ Full |
| Hospital Admin | ❌ None | ✅ Own Tenant | ✅ Own Tenant |
| Doctor | ❌ None | ✅ Own Tenant | ✅ Clinical |
| Nurse | ❌ None | ✅ Own Tenant | ✅ Limited |
| Receptionist | ❌ None | ✅ Front Desk | ❌ None |
| Manager | ❌ None | ✅ Own Tenant | ✅ Reports |
| Lab Technician | ❌ None | ✅ Lab Module | ✅ Lab Data |
| Pharmacist | ❌ None | ✅ Pharmacy | ✅ Pharmacy Data |

## 🔧 Implementation Steps

### Phase 1: Database Schema (30 min)
1. Create `permissions` table
2. Create `role_permissions` table
3. Create `applications` table
4. Seed default data

### Phase 2: Backend Services (45 min)
1. Create authorization service
2. Create authorization middleware
3. Update auth routes to include permissions
4. Create role management API

### Phase 3: Frontend Guards (30 min)
1. Create application access guard
2. Update login flows
3. Add unauthorized page
4. Implement role-based redirects

### Phase 4: Admin Interface (30 min)
1. User role management UI
2. Permission assignment UI

## 📊 Database Schema

```sql
-- Permissions table
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(resource, action)
);

-- Role permissions (many-to-many)
CREATE TABLE role_permissions (
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

-- Applications registry
CREATE TABLE applications (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  url VARCHAR(255),
  port INTEGER,
  required_permissions TEXT[],
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔐 Security Flow

### Login Process
1. User enters credentials
2. AWS Cognito validates
3. Backend checks user roles & permissions
4. Return JWT + permissions + allowed apps
5. Frontend stores permissions
6. Redirect to appropriate app

### Application Access Check
1. User tries to access app
2. Frontend checks stored permissions
3. If no permission → Redirect to unauthorized page
4. If has permission → Allow access
5. Backend validates on every API call

## ✅ Success Criteria

1. Users can only access authorized applications
2. Admins can assign/revoke roles
3. Clear error messages for unauthorized access
4. Easy to add new applications and roles

**Estimated Total Time**: 2-3 hours
**Priority**: High (Security Critical)
