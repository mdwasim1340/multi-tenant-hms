# Application Authorization - Quick Start Guide

## 🚀 Quick Start

### 1. Verify Installation
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

### 2. Assign Admin Role to User

#### Option A: Via Database
```sql
-- Find your user ID
SELECT id, email FROM users WHERE email = 'your-email@example.com';

-- Assign Admin role (role_id = 1)
INSERT INTO user_roles (user_id, role_id)
VALUES (YOUR_USER_ID, 1);
```

#### Option B: Via Script
```bash
cd backend
node scripts/assign-admin-role.js your-email@example.com
```

### 3. Test Login

#### Admin Dashboard (Port 3002)
1. Go to http://localhost:3002/auth/signin
2. Sign in with admin credentials
3. Should successfully access admin dashboard
4. Try signing in with non-admin user → Should see "Access Denied"

#### Hospital System (Port 3001)
1. Go to http://localhost:3001/auth/login
2. Sign in with doctor/nurse credentials
3. Should successfully access hospital system
4. Try signing in with admin-only user → Should see "Access Denied"

---

## 👥 User Role Assignment

### Assign Doctor Role
```sql
INSERT INTO user_roles (user_id, role_id)
VALUES (USER_ID, (SELECT id FROM roles WHERE name = 'Doctor'));
```

### Assign Multiple Roles
```sql
-- User can have multiple roles
INSERT INTO user_roles (user_id, role_id) VALUES
  (USER_ID, (SELECT id FROM roles WHERE name = 'Doctor')),
  (USER_ID, (SELECT id FROM roles WHERE name = 'Manager'));
```

### Check User Roles
```sql
SELECT u.email, r.name as role, r.description
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'user@example.com';
```

---

## 🔍 Troubleshooting

### User Can't Access Application

1. **Check if user has role assigned**:
```sql
SELECT * FROM user_roles WHERE user_id = USER_ID;
```

2. **Check role permissions**:
```sql
SELECT p.resource, p.action
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE rp.role_id = ROLE_ID;
```

3. **Check application requirements**:
```sql
SELECT * FROM applications WHERE id = 'admin_dashboard';
```

### Permission Denied Error

1. **Verify user has required permission**:
```sql
SELECT check_user_permission(USER_ID, 'admin_dashboard', 'access');
```

2. **Get all user permissions**:
```sql
SELECT * FROM get_user_permissions(USER_ID);
```

---

## 📋 Common Tasks

### Create New User with Role
```sql
-- 1. Create user (via signup or admin)
-- 2. Assign role
INSERT INTO user_roles (user_id, role_id)
VALUES (
  (SELECT id FROM users WHERE email = 'newuser@example.com'),
  (SELECT id FROM roles WHERE name = 'Doctor')
);
```

### Change User Role
```sql
-- Remove old role
DELETE FROM user_roles 
WHERE user_id = USER_ID AND role_id = OLD_ROLE_ID;

-- Add new role
INSERT INTO user_roles (user_id, role_id)
VALUES (USER_ID, NEW_ROLE_ID);
```

### List All Users with Roles
```sql
SELECT 
  u.id,
  u.email,
  u.name,
  STRING_AGG(r.name, ', ') as roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.id, u.email, u.name
ORDER BY u.email;
```

---

## 🎯 Role Descriptions

| Role | Access | Permissions |
|------|--------|-------------|
| **Admin** | Admin Dashboard + All | Full system access |
| **Hospital Admin** | Hospital System | Full hospital management |
| **Doctor** | Hospital System | Patients, appointments, clinical data |
| **Nurse** | Hospital System | View patients, manage appointments |
| **Receptionist** | Hospital System | Front desk, appointments, patient registration |
| **Manager** | Hospital System | Reports and analytics |
| **Lab Technician** | Hospital System | Lab module access |
| **Pharmacist** | Hospital System | Pharmacy module access |

---

## ✅ Verification Checklist

- [ ] Authorization tables created
- [ ] Permissions seeded
- [ ] Applications registered
- [ ] Role-permission assignments complete
- [ ] Admin user has Admin role
- [ ] Test users have appropriate roles
- [ ] Admin dashboard blocks non-admin users
- [ ] Hospital system blocks admin-only users
- [ ] Unauthorized pages display correctly

---

## 🆘 Need Help?

Check the full documentation:
- `docs/APPLICATION_AUTHORIZATION_PLAN.md` - Implementation plan
- `docs/APPLICATION_AUTHORIZATION_IMPLEMENTATION.md` - Complete implementation details
- `backend/scripts/test-authorization.js` - Test script

Run the test script to verify everything is working:
```bash
cd backend
node scripts/test-authorization.js
```
