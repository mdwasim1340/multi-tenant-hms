# 🚀 Quick Access Guide

## Your Credentials

```
Email: mdwasimakram44@gmail.com
Password: WasimAdmin@123
Tenant: Aajmin Polyclinic
Role: Hospital Admin
```

## Access URLs

### Hospital Management System ✅
```
http://localhost:3001/auth/login
http://aajminpolyclinic.localhost:3001/auth/login
```

### Admin Dashboard ❌
```
http://localhost:3002/auth/signin
(Access Denied - Admin role required)
```

## Start Applications

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd hospital-management-system && npm run dev

# Terminal 3 (optional)
cd admin-dashboard && npm run dev
```

## Your Permissions

✅ Hospital System Access
✅ Patient Management
✅ Appointment Scheduling
✅ Medical Records
✅ Analytics & Reports
❌ Admin Dashboard (requires Admin role)

## Need Admin Access?

```bash
cd backend
node scripts/assign-admin-role.js mdwasimakram44@gmail.com
```

## Test Signin

```bash
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"mdwasimakram44@gmail.com","password":"WasimAdmin@123"}'
```

---

**Ready to go! Sign in at http://localhost:3001/auth/login** 🎉
