# Authorization Quick Reference Guide

**Last Updated**: November 13, 2025

---

## 🚀 Quick Start

### For Developers

#### Adding Permission Check to New Endpoint
```typescript
import { requirePermission } from '../middleware/authorization';

// Read operation
router.get('/api/resource', requirePermission('resource', 'read'), handler);

// Write operation
router.post('/api/resource', requirePermission('resource', 'write'), handler);

// Admin operation
router.delete('/api/resource/:id', requirePermission('resource', 'admin'), handler);
```

#### Adding Application Access Check
```typescript
import { requireApplicationAccess } from '../middleware/authorization';

// Protect entire route group
app.use('/api/hospital', requireApplicationAccess('hospital_system'));
```

---

## 🔐 Permission Reference

### Available Permissions

| Resource | Actions | Description |
|----------|---------|-------------|
| `admin_dashboard` | `access`, `read`, `write`, `admin` | Admin dashboard access |
| `hospital_system` | `access`, `read`, `write`, `admin` | Hospital system access |
| `patients` | `read`, `write`, `admin` | Patient management |
| `appointments` | `read`, `write`, `admin` | Appointment scheduling |
| `analytics` | `read`, `write`, `admin` | Analytics and reports |
| `system` | `read`, `write`, `admin` | System configuration |

### Permission Naming Convention
```
resource:action

Examples:
- patients:read
- patients:write
- patients:admin
- appointments:read
- appointments:write
```

---

## 👥 Role Reference

### Role Permissions Matrix

| Role | Permissions Count | Key Permissions |
|------|------------------|-----------------|
| **Admin** | 20 | All permissions |
| **Hospital Admin** | 16 | Hospital system + patients + appointments |
| **Doctor** | 8 | Hospital access + patients read/write + appointments |
| **Nurse** | 5 | Hospital access + patients read/write |
| **Receptionist** | 6 | Hospital access + patients + appointments |
| **Manager** | 4 | Hospital access + analytics read |
| **Lab Technician** | 3 | Hospital access + patients read |
| **Pharmacist** | 3 | Hospital access + patients read |

---

## 🛠️ Common Tasks

### Check User Permissions
```bash
# Get user roles
curl -X GET http://localhost:3000/api/users/:userId/roles \
  -H "Authorization: Bearer <admin-token>"

# Get all permissions
curl -X GET http://localhost:3000/api/permissions
```

### Assign Role to User
```bash
curl -X POST http://localhost:3000/api/users/:userId/roles \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"roleId": 2}'
```

### Revoke Role from User
```bash
curl -X DELETE http://localhost:3000/api/users/:userId/roles/:roleId \
  -H "Authorization: Bearer <admin-token>"
```

---

## 🧪 Testing Authorization

### Test Read Permission
```bash
curl -X GET http://localhost:3000/api/patients \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: tenant_123"

# Expected: 200 OK (if has patients:read)
# Expected: 403 Forbidden (if no permission)
```

### Test Write Permission
```bash
curl -X POST http://localhost:3000/api/patients \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: tenant_123" \
  -H "Content-Type: application/json" \
  -d '{"patient_number":"P001","first_name":"John","last_name":"Doe","date_of_birth":"1990-01-01"}'

# Expected: 201 Created (if has patients:write)
# Expected: 403 Forbidden (if no permission)
```

### Test Admin Permission
```bash
curl -X DELETE http://localhost:3000/api/patients/1 \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: tenant_123"

# Expected: 200 OK (if has patients:admin)
# Expected: 403 Forbidden (if no permission)
```

---

## 🚨 Error Responses

### 401 Unauthorized
```json
{
  "error": "Authentication required",
  "message": "Please login to access this resource"
}
```
**Cause**: No token or invalid token  
**Solution**: Login and provide valid JWT token

### 403 Forbidden - Application Access
```json
{
  "error": "Access denied",
  "message": "You don't have permission to access hospital_system",
  "application": "hospital_system"
}
```
**Cause**: User doesn't have application access  
**Solution**: Assign appropriate role with hospital_system:access

### 403 Forbidden - Permission Denied
```json
{
  "error": "Permission denied",
  "message": "You don't have permission to write patients",
  "required_permission": "patients:write"
}
```
**Cause**: User doesn't have required permission  
**Solution**: Assign role with required permission

---

## 📋 Endpoint Permission Requirements

### Patient Endpoints
```
GET    /api/patients           → patients:read
POST   /api/patients           → patients:write
GET    /api/patients/:id       → patients:read
PUT    /api/patients/:id       → patients:write
DELETE /api/patients/:id       → patients:admin
```

### Appointment Endpoints
```
GET    /api/appointments       → appointments:read
POST   /api/appointments       → appointments:write
GET    /api/appointments/:id   → appointments:read
PUT    /api/appointments/:id   → appointments:write
DELETE /api/appointments/:id   → appointments:write
```

### Medical Records Endpoints
```
GET    /api/medical-records           → patients:read
POST   /api/medical-records           → patients:write
GET    /api/medical-records/:id       → patients:read
PUT    /api/medical-records/:id       → patients:write
POST   /api/medical-records/:id/finalize → patients:write
```

### Prescription Endpoints
```
POST   /api/prescriptions                    → patients:write
GET    /api/prescriptions/patient/:patientId → patients:read
DELETE /api/prescriptions/:id                → patients:write
```

### Lab Test Endpoints
```
GET    /api/lab-tests           → patients:read
POST   /api/lab-tests           → patients:write
GET    /api/lab-tests/:id       → patients:read
PUT    /api/lab-tests/:id/results → patients:write
```

### Imaging Endpoints
```
POST   /api/imaging     → patients:write
GET    /api/imaging/:id → patients:read
```

### Diagnosis/Treatment Endpoints
```
POST   /api/medical-records/diagnoses    → patients:write
POST   /api/medical-records/treatments   → patients:write
DELETE /api/medical-records/treatments/:id → patients:write
```

### Lab Panel Endpoints
```
GET    /api/lab-panels     → patients:read
GET    /api/lab-panels/:id → patients:read
```

---

## 🔧 Troubleshooting

### User Can't Access Hospital System
1. Check if user has `hospital_system:access` permission
2. Verify user has appropriate role (Doctor, Nurse, etc.)
3. Check signin response includes hospital_system in accessibleApplications

### User Can View But Not Create
1. User has `read` permission but not `write`
2. Assign role with write permission (Doctor, Nurse, Receptionist)

### User Can't Delete Records
1. Delete operations require `admin` permission
2. Only Admin and Hospital Admin roles have this permission
3. This is intentional for data protection

---

## 💡 Best Practices

### For Developers
- ✅ Always add permission checks to new endpoints
- ✅ Use appropriate permission level (read/write/admin)
- ✅ Test with different user roles
- ✅ Document permission requirements

### For Administrators
- ✅ Follow principle of least privilege
- ✅ Assign minimum necessary permissions
- ✅ Regularly audit user permissions
- ✅ Remove unused roles promptly

### For Users
- ✅ Request only necessary permissions
- ✅ Report access issues immediately
- ✅ Don't share credentials
- ✅ Log out when finished

---

## 📞 Quick Help

### Get User's Current Permissions
```javascript
// Frontend
import { getUserPermissions, hasPermission } from '@/lib/auth';

const permissions = getUserPermissions();
const canWrite = hasPermission('patients', 'write');
```

### Check Application Access
```javascript
// Frontend
import { hasHospitalAccess } from '@/lib/auth';

if (!hasHospitalAccess()) {
  router.push('/unauthorized');
}
```

### Backend Permission Check
```typescript
// In controller
const userId = (req as any).userId;
const hasPermission = await checkUserPermission(userId, 'patients', 'write');

if (!hasPermission) {
  return res.status(403).json({ error: 'Permission denied' });
}
```

---

## 📚 Additional Resources

- **Full Audit Report**: `PHASE_1_2_AUTHORIZATION_AUDIT.md`
- **Implementation Details**: `AUTHORIZATION_FIXES_IMPLEMENTATION.md`
- **Complete Summary**: `IMPLEMENTATION_COMPLETE.md`
- **Test Suite**: `backend/tests/test-authorization-enforcement.js`

---

**Quick Reference Version**: 1.0  
**Last Updated**: November 13, 2025  
**Status**: Production Ready 🚀
