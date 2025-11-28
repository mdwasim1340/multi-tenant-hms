# Frontend Integration Guide

## 🌐 Production Backend URL

```
https://backend.aajminpolyclinic.com.np
```

## ✅ Backend Status: ONLINE

Health check confirmed: `{"status":"ok"}`

---

## 📝 Step 1: Update Environment Variables

### Hospital Management System

Update `hospital-management-system/.env.local`:

```bash
# Production Backend
NEXT_PUBLIC_API_URL=https://backend.aajminpolyclinic.com.np
NEXT_PUBLIC_API_BASE_URL=https://backend.aajminpolyclinic.com.np

# AWS Cognito (same as backend)
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_tvpXwEgfS
NEXT_PUBLIC_COGNITO_CLIENT_ID=6n1faa8b43nd4isarns87rubia
NEXT_PUBLIC_AWS_REGION=us-east-1

# Application Identification
NEXT_PUBLIC_APP_ID=hospital-management
NEXT_PUBLIC_API_KEY=your-hospital-app-api-key
```

### Admin Dashboard

Update `admin-dashboard/.env.local`:

```bash
# Production Backend
NEXT_PUBLIC_API_URL=https://backend.aajminpolyclinic.com.np
NEXT_PUBLIC_API_BASE_URL=https://backend.aajminpolyclinic.com.np

# AWS Cognito (same as backend)
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_tvpXwEgfS
NEXT_PUBLIC_COGNITO_CLIENT_ID=6n1faa8b43nd4isarns87rubia
NEXT_PUBLIC_AWS_REGION=us-east-1

# Application Identification
NEXT_PUBLIC_APP_ID=admin-dashboard
NEXT_PUBLIC_API_KEY=your-admin-app-api-key
```

---

## 📡 Step 2: Update API Client Configuration

### Example API Client (lib/api.ts)

```typescript
import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend.aajminpolyclinic.com.np';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add authentication headers
api.interceptors.request.use(
  (config) => {
    // Get JWT token from cookies
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Get tenant ID from cookies
    const tenantId = Cookies.get('tenant_id');
    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId;
    }

    // Add application identification
    config.headers['X-App-ID'] = process.env.NEXT_PUBLIC_APP_ID || 'hospital-management';
    config.headers['X-API-Key'] = process.env.NEXT_PUBLIC_API_KEY || '';

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      Cookies.remove('token');
      Cookies.remove('tenant_id');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 🔐 Step 3: Authentication Flow

### Login Example

```typescript
import api from '@/lib/api';
import Cookies from 'js-cookie';

export async function signIn(email: string, password: string) {
  try {
    const response = await api.post('/auth/signin', {
      email,
      password,
    });

    const { token, user, tenant } = response.data;

    // Store authentication data
    Cookies.set('token', token, { expires: 7 }); // 7 days
    Cookies.set('tenant_id', tenant.id, { expires: 7 });
    Cookies.set('user', JSON.stringify(user), { expires: 7 });

    return { success: true, user, tenant };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: error.response?.data?.message || 'Login failed' };
  }
}
```

---

## 📊 Step 4: API Endpoints Reference

### Public Endpoints (No Auth Required)

```typescript
// Health check
GET /health
Response: {"status":"ok"}

// Authentication
POST /auth/signin
Body: { email, password }

POST /auth/signup
Body: { email, password, name, ... }

POST /auth/forgot-password
Body: { email }
```

### Protected Endpoints (Auth Required)

All protected endpoints require these headers:
```typescript
{
  'Authorization': 'Bearer <JWT_TOKEN>',
  'X-Tenant-ID': '<tenant_id>',
  'X-App-ID': 'hospital-management',
  'X-API-Key': '<api_key>'
}
```

**Patient Management:**
```typescript
GET    /api/patients              // List patients
GET    /api/patients/:id          // Get patient details
POST   /api/patients              // Create patient
PUT    /api/patients/:id          // Update patient
DELETE /api/patients/:id          // Delete patient
GET    /api/patients/export       // Export to CSV
```

**Appointment Management:**
```typescript
GET    /api/appointments          // List appointments
GET    /api/appointments/:id      // Get appointment details
POST   /api/appointments          // Create appointment
PUT    /api/appointments/:id      // Update appointment
DELETE /api/appointments/:id      // Cancel appointment
GET    /api/appointments/available-slots  // Get available time slots
```

**Medical Records:**
```typescript
GET    /api/medical-records       // List records
GET    /api/medical-records/:id   // Get record details
POST   /api/medical-records       // Create record
PUT    /api/medical-records/:id   // Update record
```

**Tenant Management (Admin Only):**
```typescript
GET    /api/tenants               // List tenants
GET    /api/tenants/:id           // Get tenant details
POST   /api/tenants               // Create tenant
PUT    /api/tenants/:id           // Update tenant
```

---

## 🧪 Step 5: Testing the Integration

### Test Health Endpoint

```typescript
// Test from browser console or component
fetch('https://backend.aajminpolyclinic.com.np/health')
  .then(res => res.json())
  .then(data => console.log('Health:', data));

// Expected: {status: "ok"}
```

### Test Authentication

```typescript
// Test login
const testLogin = async () => {
  const response = await fetch('https://backend.aajminpolyclinic.com.np/auth/signin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password123',
    }),
  });
  
  const data = await response.json();
  console.log('Login response:', data);
};
```

### Test Protected Endpoint

```typescript
// Test with authentication
const testProtectedEndpoint = async () => {
  const token = 'your-jwt-token';
  const tenantId = 'your-tenant-id';
  
  const response = await fetch('https://backend.aajminpolyclinic.com.np/api/patients', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Tenant-ID': tenantId,
      'X-App-ID': 'hospital-management',
      'X-API-Key': 'your-api-key',
    },
  });
  
  const data = await response.json();
  console.log('Patients:', data);
};
```

---

## 🔍 Step 6: Verify CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:3001` (Hospital System - Development)
- `http://localhost:3002` (Admin Dashboard - Development)
- Production frontend URLs (to be added)

**If deploying frontend to production**, update backend CORS:

```bash
# SSH into server
ssh -i n8n\LightsailDefaultKey-ap-south-1.pem bitnami@65.0.78.75

# Edit environment
cd /home/bitnami/multi-tenant-backend
nano .env

# Update ALLOWED_ORIGINS
ALLOWED_ORIGINS=https://hospital.aajminpolyclinic.com.np,https://admin.aajminpolyclinic.com.np

# Restart
pm2 restart multi-tenant-backend
```

---

## 🚨 Common Issues & Solutions

### Issue 1: CORS Error
```
Access to fetch at 'https://backend.aajminpolyclinic.com.np' from origin 'http://localhost:3001' 
has been blocked by CORS policy
```

**Solution**: Ensure your origin is in the backend's ALLOWED_ORIGINS list.

### Issue 2: 401 Unauthorized
```
{"error": "Unauthorized"}
```

**Solution**: Check that JWT token is valid and included in Authorization header.

### Issue 3: 403 Forbidden
```
{"error": "Invalid or inactive tenant"}
```

**Solution**: Verify X-Tenant-ID header is correct and tenant is active.

### Issue 4: 404 Not Found
```
{"error": "Not found"}
```

**Solution**: Check the endpoint URL is correct. Remember routes are case-sensitive.

---

## 📊 Step 7: Monitor API Calls

### Add Request Logging

```typescript
// Add to your API client
api.interceptors.request.use((config) => {
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response ${response.status}:`, response.data);
    return response;
  },
  (error) => {
    console.error(`[API] Error ${error.response?.status}:`, error.response?.data);
    return Promise.reject(error);
  }
);
```

---

## ✅ Integration Checklist

- [ ] Environment variables updated
- [ ] API client configured with base URL
- [ ] Authentication headers added to requests
- [ ] JWT token stored in cookies
- [ ] Tenant ID stored in cookies
- [ ] X-App-ID header included
- [ ] X-API-Key header included
- [ ] Error handling implemented
- [ ] CORS configured (if needed)
- [ ] Health endpoint tested
- [ ] Authentication flow tested
- [ ] Protected endpoints tested
- [ ] Request/response logging added

---

## 🎯 Next Steps After Integration

1. **Test all critical flows**:
   - User login/logout
   - Patient CRUD operations
   - Appointment scheduling
   - Medical records access

2. **Monitor for errors**:
   - Check browser console
   - Check network tab
   - Monitor backend logs: `pm2 logs multi-tenant-backend`

3. **Performance optimization**:
   - Implement request caching
   - Add loading states
   - Handle slow connections

4. **Security review**:
   - Ensure tokens are stored securely
   - Implement token refresh
   - Add request rate limiting

---

## 📞 Support

If you encounter issues:

1. Check backend logs: `pm2 logs multi-tenant-backend`
2. Test endpoint with curl/Postman
3. Verify all required headers are present
4. Check CORS configuration
5. Refer to `DEPLOYMENT_COMPLETE.md` for backend status

---

**Backend URL**: https://backend.aajminpolyclinic.com.np  
**Status**: ✅ ONLINE  
**Last Updated**: November 28, 2025
