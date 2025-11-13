# Backend Security Patterns - MANDATORY Guidelines

## 🚨 CRITICAL SECURITY REQUIREMENTS

### Core Principle: Zero Direct Access
The backend API must NEVER be accessible directly through browsers or unauthorized applications. All access must be through verified, authorized frontend applications only.

## 🚨 ANTI-DUPLICATION RULES FOR SECURITY IMPLEMENTATION

### Before Creating Security Components
1. **Check existing middleware**: Review `/src/middleware/` for existing security implementations
2. **Verify no legacy security**: Ensure old security patterns are removed
3. **Use established patterns**: Follow existing app authentication and tenant validation
4. **Single security model**: Never create duplicate authentication or authorization systems

### Current Security Implementation Status (Updated November 13, 2025)
- ✅ **Complete Security Architecture**: App authentication system fully implemented
- ✅ **Modern Tenant Security**: Subscription-based tenant validation operational
- ✅ **Protected Backend**: Direct browser access blocked, app authentication required
- ✅ **Frontend Integration**: Both applications use direct backend communication
- ✅ **No API Proxies**: All Next.js API proxy routes removed
- ✅ **Application-Level Authorization**: Role-based application access control
- ✅ **Permission System**: 20 granular permissions for resource access
- ✅ **Role Management**: 8 roles with specific permission assignments
- ✅ **Access Guards**: Frontend and backend enforcement of application access
- ✅ **Signin Enhancement**: Returns roles, permissions, and accessible applications

## 🛡️ Application-Level Security Architecture

### Allowed Applications Registry
```typescript
// ONLY these applications can access the backend
const ALLOWED_ORIGINS = [
  'http://localhost:3001', // Hospital Management System
  'http://localhost:3002', // Admin Dashboard  
  'http://localhost:3003', // Future applications
  // Production URLs would be added here
];

const APP_API_KEYS = {
  'hospital-management': process.env.HOSPITAL_APP_API_KEY,
  'admin-dashboard': process.env.ADMIN_APP_API_KEY,
  'mobile-app': process.env.MOBILE_APP_API_KEY,
};
```

### Required Security Headers
```typescript
// MANDATORY headers for ALL API requests
headers: {
  'Authorization': 'Bearer jwt_token',        // User authentication (JWT from signin)
  'X-Tenant-ID': 'tenant_id',               // Multi-tenant context
  'X-App-ID': 'admin-dashboard',            // Application identifier
  'X-API-Key': 'app-specific-secret-key'    // Application authentication
}

// Note: User must have appropriate role and permissions to access the application
// Signin response includes: roles, permissions, accessibleApplications
```

## 🚫 FORBIDDEN PATTERNS

### 1. Next.js API Routes as Proxies
```typescript
// ❌ NEVER DO THIS - Creates security vulnerabilities
// admin-dashboard/app/api/users/route.ts
export async function GET() {
  const response = await backendApi.get('/api/users');
  return NextResponse.json(response.data);
}
```

**Why this is forbidden:**
- Creates unnecessary proxy layer
- Bypasses backend security controls
- Allows potential data leakage
- Makes security auditing difficult
- Violates single source of truth principle

### 2. Direct Backend Access
```bash
# ❌ NEVER ALLOW THIS - Direct browser access
curl http://localhost:3000/api/users
# Should return 403 Forbidden
```

### 3. Missing App Authentication
```typescript
// ❌ NEVER DO THIS - Missing app identification
const response = await fetch('http://localhost:3000/api/users', {
  headers: {
    'Authorization': 'Bearer token',
    'X-Tenant-ID': 'tenant_id'
    // Missing X-App-ID and X-API-Key
  }
});
```

## ✅ REQUIRED PATTERNS

### 1. Direct Frontend-to-Backend Communication
```typescript
// ✅ CORRECT PATTERN - Direct API calls with full authentication
const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'X-App-ID': 'admin-dashboard',
    'X-API-Key': process.env.NEXT_PUBLIC_API_KEY
  }
});

// All requests automatically include app authentication
const response = await api.get('/api/users');
```

### 2. Backend Security Middleware Implementation
```typescript
// ✅ MANDATORY - Apply to all /api routes
import { apiAppAuthMiddleware } from './middleware/appAuth';

app.use('/api', apiAppAuthMiddleware); // Protects all API endpoints
app.use('/auth', authRouter);          // Auth endpoints remain accessible
```

### 3. Frontend App Configuration
```typescript
// ✅ REQUIRED - Configure axios interceptor
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  const tenantId = getTenantId();
  
  config.headers['Authorization'] = `Bearer ${token}`;
  config.headers['X-Tenant-ID'] = tenantId;
  config.headers['X-App-ID'] = 'admin-dashboard';
  config.headers['X-API-Key'] = process.env.NEXT_PUBLIC_API_KEY;
  
  return config;
});
```

## 🔒 Security Middleware Implementation

### App Authentication Middleware
```typescript
export const apiAppAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Skip auth endpoints (needed for login)
  if (req.path.startsWith('/auth/')) {
    return next();
  }

  const origin = req.headers.origin;
  const apiKey = req.headers['x-api-key'] as string;
  const appId = req.headers['x-app-id'] as string;

  // Validate origin is from allowed applications
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return next();
  }

  // Validate API key and app ID for programmatic access
  if (apiKey && appId && APP_API_KEYS[appId] === apiKey) {
    return next();
  }

  // Block direct browser access
  if (isDirectBrowserAccess(req)) {
    return res.status(403).json({
      error: 'Direct access not allowed',
      message: 'This API can only be accessed through authorized applications'
    });
  }

  // Block unauthorized applications
  return res.status(403).json({
    error: 'Unauthorized application',
    message: 'Your application is not authorized to access this API'
  });
};
```

## 🧪 Security Testing Requirements

### 1. Test Direct Access Blocking
```bash
# Should return 403 Forbidden
curl -X GET http://localhost:3000/api/users
curl -X GET http://localhost:3000/api/tenants
curl -X GET http://localhost:3000/api/roles
```

### 2. Test Unauthorized App Blocking
```bash
# Should return 403 Forbidden
curl -X GET http://localhost:3000/api/users \
  -H "Origin: http://malicious-site.com" \
  -H "Authorization: Bearer valid_token"
```

### 3. Test Valid App Access
```bash
# Should return 200 OK
curl -X GET http://localhost:3000/api/users \
  -H "Origin: http://localhost:3002" \
  -H "Authorization: Bearer valid_token" \
  -H "X-Tenant-ID: admin" \
  -H "X-App-ID: admin-dashboard" \
  -H "X-API-Key: admin-dev-key-456"
```

## 📋 Implementation Checklist

### Backend Security Setup
- [ ] Install `appAuthMiddleware` on all `/api` routes
- [ ] Configure `ALLOWED_ORIGINS` with authorized applications
- [ ] Set up `APP_API_KEYS` for each application
- [ ] Test direct access blocking
- [ ] Test unauthorized app blocking
- [ ] Verify auth endpoints remain accessible

### Frontend Security Setup
- [ ] Remove all Next.js API proxy routes
- [ ] Configure axios with app identification headers
- [ ] Add `X-App-ID` and `X-API-Key` to all requests
- [ ] Test direct backend communication
- [ ] Verify error handling for blocked requests
- [ ] Update environment variables for API keys

### Documentation Updates
- [ ] Update API documentation with security requirements
- [ ] Document required headers for each application
- [ ] Create security testing procedures
- [ ] Update deployment guides with security considerations

## 🚨 Security Incident Response

### If Direct Access is Detected
1. **Immediate**: Block the source IP/origin
2. **Investigate**: Check logs for data access patterns
3. **Audit**: Review all recent API calls
4. **Strengthen**: Add additional security layers
5. **Monitor**: Increase logging and alerting

### If Unauthorized App Access is Detected
1. **Revoke**: Invalidate compromised API keys
2. **Rotate**: Generate new API keys for all applications
3. **Investigate**: Determine how keys were compromised
4. **Strengthen**: Add additional app verification layers
5. **Notify**: Alert application owners of security incident

## 🔐 Application-Level Authorization (NEW - Nov 13, 2025)

### Role-Based Application Access
Users can only access applications they have permissions for:

**Database Schema**:
- `permissions` - 20 granular permissions (resource:action pairs)
- `role_permissions` - Role-to-permission mappings
- `applications` - Application registry with required permissions
- `user_roles` - User-to-role assignments

**8 Roles Defined**:
1. **Admin** - Full system access (20 permissions)
2. **Hospital Admin** - Hospital management (16 permissions)
3. **Doctor** - Clinical access (8 permissions)
4. **Nurse** - Patient care (5 permissions)
5. **Receptionist** - Front desk (6 permissions)
6. **Manager** - Reports and analytics (4 permissions)
7. **Lab Technician** - Lab module (3 permissions)
8. **Pharmacist** - Pharmacy module (3 permissions)

**Access Control Matrix**:
```
Role              | Admin Dashboard | Hospital System
------------------|-----------------|----------------
Admin             | ✅ Yes          | ✅ Yes
Hospital Admin    | ❌ No           | ✅ Yes
Doctor            | ❌ No           | ✅ Yes
Nurse             | ❌ No           | ✅ Yes
Receptionist      | ❌ No           | ✅ Yes
Manager           | ❌ No           | ✅ Yes
Lab Technician    | ❌ No           | ✅ Yes
Pharmacist        | ❌ No           | ✅ Yes
```

**Signin Response Enhancement**:
```json
{
  "token": "jwt_token",
  "user": {...},
  "roles": [{"id": 1, "name": "Doctor", "description": "..."}],
  "permissions": [
    {"resource": "hospital_system", "action": "access"},
    {"resource": "patients", "action": "read"},
    {"resource": "patients", "action": "write"}
  ],
  "accessibleApplications": [
    {
      "application_id": "hospital_system",
      "name": "Hospital Management System",
      "has_access": true,
      "required_permissions": ["hospital_system:access"]
    }
  ]
}
```

**Frontend Guards**:
- Both applications check `accessibleApplications` on login
- Users without access are redirected to `/unauthorized` page
- Clear error messages explain access requirements

**Backend Middleware**:
- `requireApplicationAccess(applicationId)` - Enforce app-level access
- `requirePermission(resource, action)` - Enforce permission-based access
- `requireRole(roleName)` - Enforce role-based access

**Role Management API**:
- `GET /api/roles` - List all roles
- `GET /api/permissions` - List all permissions
- `GET /api/users/:userId/roles` - Get user roles
- `POST /api/users/:userId/roles` - Assign role (admin only)
- `DELETE /api/users/:userId/roles/:roleId` - Revoke role (admin only)

**Helper Scripts**:
- `backend/scripts/test-authorization.js` - Test authorization system
- `backend/scripts/assign-admin-role.js` - Assign admin role to user
- `backend/scripts/create-hospital-admin.js` - Create hospital admin user

## 🎯 Security Goals

### Primary Objectives
- **Zero Direct Access**: No browser can directly access backend APIs
- **App Verification**: Only authorized applications can access backend
- **Role-Based Access**: Users can only access authorized applications
- **Permission Enforcement**: Granular control over resource access
- **Audit Trail**: All API access is logged and traceable
- **Defense in Depth**: Multiple security layers protect the backend
- **Fail Secure**: Default to blocking access when in doubt

### Success Metrics
- 100% of direct access attempts blocked
- 100% of unauthorized app attempts blocked
- 100% of unauthorized user access attempts blocked
- 0% false positives for authorized applications
- Complete audit trail of all API access
- Zero security incidents related to unauthorized access

This security architecture ensures that the backend API is completely protected from unauthorized access while maintaining seamless operation for authorized applications and users.