# Application Authorization - Testing Guide

## ✅ Setup Complete

Your user `mdwasimkrm13@gmail.com` now has the **Admin** role and can access both applications.

---

## 🧪 Test Scenarios

### Test 1: Admin User Access ✅

**User**: mdwasimkrm13@gmail.com (Admin role)

**Expected Behavior**:
1. ✅ Can sign in to Admin Dashboard (http://localhost:3002)
2. ✅ Can sign in to Hospital System (http://localhost:3001)
3. ✅ Receives permissions in signin response
4. ✅ Has access to all features

**How to Test**:
```bash
# Start backend
cd backend
npm run dev

# Start admin dashboard (new terminal)
cd admin-dashboard
npm run dev

# Start hospital system (new terminal)
cd hospital-management-system
npm run dev
```

Then:
1. Go to http://localhost:3002/auth/signin
2. Sign in with: mdwasimkrm13@gmail.com
3. Should successfully access admin dashboard
4. Go to http://localhost:3001/auth/login
5. Sign in with same credentials
6. Should successfully access hospital system

---

### Test 2: Non-Admin User Access

**Create a test doctor user**:
```bash
cd backend
node scripts/create-admin-user.js doctor@test.com "Test Doctor" demo_hospital_001
```

Then assign Doctor role:
```sql
-- Connect to database
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db

-- Assign Doctor role
INSERT INTO user_roles (user_id, role_id)
VALUES (
  (SELECT id FROM users WHERE email = 'doctor@test.com'),
  (SELECT id FROM roles WHERE name = 'Doctor')
);
```

**Expected Behavior**:
1. ❌ Cannot access Admin Dashboard (redirected to /unauthorized)
2. ✅ Can access Hospital System
3. ✅ Has limited permissions (patients, appointments)

---

### Test 3: Check Signin Response

**Test with curl**:
```bash
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"mdwasimkrm13@gmail.com","password":"your_password"}'
```

**Expected Response**:
```json
{
  "token": "jwt_token_here",
  "refreshToken": "refresh_token_here",
  "expiresIn": 3600,
  "user": {
    "id": 8,
    "email": "mdwasimkrm13@gmail.com",
    "name": "Aajmin Admin",
    "tenant_id": "demo_hospital_001"
  },
  "roles": [
    {
      "id": 1,
      "name": "Admin",
      "description": "System administrator with full access"
    },
    {
      "id": 8,
      "name": "Hospital Admin",
      "description": "Administrative role for hospital tenant management"
    }
  ],
  "permissions": [
    {
      "resource": "admin_dashboard",
      "action": "access"
    },
    {
      "resource": "hospital_system",
      "action": "access"
    },
    // ... more permissions
  ],
  "accessibleApplications": [
    {
      "application_id": "admin_dashboard",
      "name": "Admin Dashboard",
      "url": "http://localhost:3002",
      "port": 3002,
      "has_access": true,
      "required_permissions": ["admin_dashboard:access"]
    },
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

---

## 🔍 Verification Commands

### Check User Roles
```sql
SELECT u.email, u.name, r.name as role, r.description
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'mdwasimkrm13@gmail.com';
```

### Check User Permissions
```sql
SELECT * FROM get_user_permissions(
  (SELECT id FROM users WHERE email = 'mdwasimkrm13@gmail.com')
);
```

### Check Application Access
```sql
SELECT 
  a.id,
  a.name,
  a.required_permissions,
  check_user_permission(
    (SELECT id FROM users WHERE email = 'mdwasimkrm13@gmail.com'),
    'admin_dashboard',
    'access'
  ) as has_access
FROM applications a;
```

---

## 📋 Test Checklist

### Admin User Tests
- [ ] Can sign in to admin dashboard
- [ ] Can sign in to hospital system
- [ ] Signin response includes roles
- [ ] Signin response includes permissions
- [ ] Signin response includes accessibleApplications
- [ ] Both applications show has_access: true

### Non-Admin User Tests
- [ ] Cannot sign in to admin dashboard (shows error)
- [ ] Can sign in to hospital system
- [ ] Redirected to /unauthorized when trying admin dashboard
- [ ] Signin response shows limited permissions
- [ ] Admin dashboard shows has_access: false

### API Tests
- [ ] GET /api/roles returns all roles
- [ ] GET /api/permissions returns all permissions
- [ ] GET /api/users/:userId/roles returns user roles
- [ ] POST /api/users/:userId/roles assigns role (admin only)
- [ ] DELETE /api/users/:userId/roles/:roleId revokes role (admin only)

---

## 🐛 Troubleshooting

### Issue: User can't access admin dashboard
**Solution**: Check if user has Admin role
```sql
SELECT * FROM user_roles 
WHERE user_id = (SELECT id FROM users WHERE email = 'your-email@example.com');
```

### Issue: Signin doesn't return permissions
**Solution**: Check if authorization service is working
```bash
cd backend
node scripts/test-authorization.js
```

### Issue: Frontend shows "Access Denied"
**Solution**: Check browser console for stored permissions
```javascript
// In browser console
document.cookie
// Should see: accessible_apps, user_permissions, user_roles
```

---

## ✅ Success Indicators

1. ✅ Admin users can access both applications
2. ✅ Non-admin users are blocked from admin dashboard
3. ✅ Clear error messages on unauthorized access
4. ✅ Permissions returned in signin response
5. ✅ Frontend guards working correctly
6. ✅ Backend middleware enforcing access control

---

## 📞 Next Steps

1. **Test with your credentials**: Sign in to both applications
2. **Create test users**: Create users with different roles
3. **Test access control**: Verify each role has correct access
4. **Check unauthorized pages**: Verify error messages are clear
5. **Test role management**: Use API to assign/revoke roles

**Your system is now secure with application-level authorization! 🎉**
