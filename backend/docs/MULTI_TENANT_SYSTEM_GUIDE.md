# Multi-Tenant Hospital Management System - Complete Guide

## 🏥 System Overview

This is a **fully operational multi-tenant hospital management system** where:
- **One admin** manages multiple hospitals from a central dashboard
- **Each hospital** is a separate tenant with complete data isolation
- **Each hospital** gets its own login credentials and subdomain capability
- **Zero data leakage** between hospitals - complete security isolation

---

## 🎯 Current Implementation Status

### ✅ **PRODUCTION READY** - Core Infrastructure Complete

**Backend API** (Port 3000):
- Multi-tenant PostgreSQL with schema-based isolation
- AWS Cognito authentication with JWT tokens
- RESTful API endpoints for all operations
- Complete security middleware

**Admin Dashboard** (Port 3002):
- Tenant management interface
- User management across all tenants
- Analytics and monitoring
- Subscription management

**Hospital Management System** (Port 3001):
- Patient management
- Appointment scheduling
- Medical records
- Lab tests and imaging
- Staff management

---

## 🏗️ Multi-Tenant Architecture

### Database Isolation Strategy

**Schema-Based Isolation:**
```
PostgreSQL Database: multitenant_db
├── public schema (global data)
│   ├── tenants (hospital list)
│   ├── users (admin users)
│   ├── roles (system roles)
│   ├── tenant_subscriptions
│   └── subscription_tiers
│
├── tenant_1762083064503 schema (Hospital A)
│   ├── patients
│   ├── appointments
│   ├── medical_records
│   ├── lab_tests
│   └── prescriptions
│
├── tenant_1762083064515 schema (Hospital B)
│   ├── patients
│   ├── appointments
│   ├── medical_records
│   ├── lab_tests
│   └── prescriptions
│
└── demo_hospital_001 schema (Hospital C)
    ├── patients
    ├── appointments
    ├── medical_records
    ├── lab_tests
    └── prescriptions
```

**Key Points:**
- Each hospital gets a **separate PostgreSQL schema**
- Global data (tenants, users, roles) in **public schema**
- Hospital-specific data (patients, appointments) in **tenant schemas**
- **Complete data isolation** - Hospital A cannot access Hospital B's data

---

## 👨‍💼 Admin Workflow: Managing Multiple Hospitals

### Step 1: Admin Login
```
URL: http://localhost:3002/auth/signin
Credentials: admin@example.com / password123
```

The admin logs into the **Admin Dashboard** with super-admin credentials.

### Step 2: View All Hospitals (Tenants)
```
URL: http://localhost:3002/tenants
```

Admin sees a list of all hospitals:
- **City Hospital** (demo_hospital_001) - Enterprise Plan
- **Auto ID Hospital** (tenant_1762083064503) - Basic Plan
- **Complex Form Hospital** (tenant_1762083064515) - Enterprise Plan
- **Md Wasim Akram** (tenant_1762083586064) - Basic Plan

Each card shows:
- Hospital name and status
- Subscription plan (Basic/Advanced/Premium)
- Number of users and patients
- Creation date

### Step 3: Create New Hospital
```
URL: http://localhost:3002/tenants/new
```

**3-Step Wizard:**

**Step 1 - Hospital Details:**
```javascript
{
  name: "City General Hospital",
  email: "contact@citygeneral.com",
  phone: "+91 1234567890",
  address: "123 Main Street, City"
}
```

**Step 2 - Admin User:**
```javascript
{
  admin_name: "Dr. John Doe",
  admin_email: "admin@citygeneral.com",
  admin_password: "SecurePass123!"
}
```

**Step 3 - Subscription Plan:**
```javascript
{
  plan: "premium", // basic, advanced, or premium
  // Premium: ₹29,999/month, Unlimited patients & users
  // Advanced: ₹14,999/month, 2000 patients, 25 users
  // Basic: ₹4,999/month, 500 patients, 5 users
}
```

### Step 4: Backend Creates Tenant

**What happens when admin clicks "Create Tenant":**

```typescript
// 1. Generate unique tenant ID
const tenantId = `tenant_${Date.now()}`; // e.g., tenant_1762083064503

// 2. Create tenant record in public.tenants table
INSERT INTO public.tenants (id, name, email, plan, status)
VALUES ('tenant_1762083064503', 'City General Hospital', 
        'contact@citygeneral.com', 'premium', 'active');

// 3. Create isolated PostgreSQL schema for this hospital
CREATE SCHEMA "tenant_1762083064503";

// 4. Create subscription record
INSERT INTO tenant_subscriptions (tenant_id, tier_id, status)
VALUES ('tenant_1762083064503', 'premium', 'active');

// 5. Create admin user in public.users table
INSERT INTO public.users (email, name, tenant_id, role)
VALUES ('admin@citygeneral.com', 'Dr. John Doe', 
        'tenant_1762083064503', 'Admin');

// 6. Create user in AWS Cognito for authentication
// This allows the hospital admin to log in
```

---

## 🔐 Hospital Login & Data Isolation

### How Hospital Admins Access Their System

**Option 1: Direct Login (Current)**
```
URL: http://localhost:3001/auth/signin
Email: admin@citygeneral.com
Password: SecurePass123!
Tenant ID: tenant_1762083064503
```

**Option 2: Subdomain (Future Enhancement)**
```
URL: https://citygeneral.yourhospitalsystem.com
Email: admin@citygeneral.com
Password: SecurePass123!
// Tenant ID automatically detected from subdomain
```

### Authentication Flow

```mermaid
sequenceDiagram
    Hospital Admin->>Frontend: Login (email, password)
    Frontend->>Backend API: POST /auth/signin
    Backend API->>AWS Cognito: Validate credentials
    AWS Cognito->>Backend API: Return JWT token
    Backend API->>Frontend: JWT token + tenant_id
    Frontend->>Browser: Store token & tenant_id in cookies
    
    Hospital Admin->>Frontend: Access patients page
    Frontend->>Backend API: GET /api/patients
    Note over Frontend,Backend API: Headers: Authorization: Bearer {token}<br/>X-Tenant-ID: tenant_1762083064503
    Backend API->>Middleware: Validate JWT token
    Backend API->>Middleware: Set database schema
    Note over Backend API,Middleware: SET search_path TO "tenant_1762083064503"
    Backend API->>Database: SELECT * FROM patients
    Note over Backend API,Database: Queries tenant_1762083064503.patients
    Database->>Backend API: Return patients (only from this tenant)
    Backend API->>Frontend: Patient data
```

### Data Isolation Mechanism

**Every API request includes:**
```javascript
headers: {
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  'X-Tenant-ID': 'tenant_1762083064503'
}
```

**Backend middleware automatically:**
```typescript
// 1. Validates JWT token
if (!validToken) return 401 Unauthorized;

// 2. Validates tenant exists
const tenant = await db.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
if (!tenant) return 404 Tenant Not Found;

// 3. Sets database schema context
await db.query(`SET search_path TO "${tenantId}"`);

// 4. All subsequent queries operate in tenant schema
// SELECT * FROM patients → queries tenant_1762083064503.patients
// Hospital A cannot access Hospital B's data
```

---

## 🔒 Security Features

### 1. Complete Data Isolation
- Each hospital's data in separate PostgreSQL schema
- Middleware enforces schema context on every request
- No cross-tenant queries possible

### 2. Authentication & Authorization
- AWS Cognito for user authentication
- JWT tokens with 1-hour expiration
- Role-based access control (Admin, Doctor, Nurse, etc.)

### 3. API Security
- All endpoints require valid JWT token
- X-Tenant-ID header mandatory for protected routes
- App-level authentication (X-App-ID, X-API-Key)
- Direct browser access blocked

### 4. File Storage Isolation
- S3 files prefixed with tenant ID: `tenant_1762083064503/document.pdf`
- Presigned URLs with 1-hour expiration
- No cross-tenant file access

---

## 🌐 Subdomain Implementation (Future Enhancement)

### Current State
Hospitals access via: `http://localhost:3001` with manual tenant ID

### Planned Enhancement
Each hospital gets subdomain: `https://citygeneral.yourhospitalsystem.com`

**Implementation Steps:**

**1. DNS Configuration:**
```
*.yourhospitalsystem.com → Your server IP
```

**2. Subdomain-to-Tenant Mapping:**
```typescript
// Add to tenants table
ALTER TABLE tenants ADD COLUMN subdomain VARCHAR(255) UNIQUE;

// Example data
UPDATE tenants SET subdomain = 'citygeneral' 
WHERE id = 'tenant_1762083064503';
```

**3. Frontend Subdomain Detection:**
```typescript
// hospital-management-system/lib/tenant.ts
export function getTenantIdFromSubdomain(): string {
  const hostname = window.location.hostname;
  
  // Extract subdomain: citygeneral.yourhospitalsystem.com → citygeneral
  const subdomain = hostname.split('.')[0];
  
  // Lookup tenant ID from subdomain
  const response = await api.get(`/api/tenants/by-subdomain/${subdomain}`);
  return response.data.tenant_id;
}
```

**4. Backend Subdomain Lookup:**
```typescript
// backend/src/routes/tenants.ts
router.get('/by-subdomain/:subdomain', async (req, res) => {
  const { subdomain } = req.params;
  
  const result = await pool.query(
    'SELECT id, name FROM tenants WHERE subdomain = $1 AND status = $1',
    [subdomain, 'active']
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Hospital not found' });
  }
  
  res.json({ tenant_id: result.rows[0].id, name: result.rows[0].name });
});
```

**5. Automatic Tenant Context:**
```typescript
// Frontend automatically sets tenant ID from subdomain
const tenantId = getTenantIdFromSubdomain();
Cookies.set('tenant_id', tenantId);

// All API calls include this tenant ID
api.defaults.headers['X-Tenant-ID'] = tenantId;
```

---

## 📊 Admin Dashboard Features

### Tenant Management
- **View all hospitals** with status, plan, users, patients
- **Create new hospitals** with 3-step wizard
- **Edit hospital details** (name, email, plan)
- **Suspend/activate hospitals**
- **Delete hospitals** (with cascade delete of all data)

### User Management
- **View all users** across all hospitals
- **Create admin users** for specific hospitals
- **Assign roles** (Admin, Doctor, Nurse, etc.)
- **Manage user status** (active, suspended)

### Analytics & Monitoring
- **System-wide statistics** (total hospitals, users, patients)
- **Usage tracking** per hospital
- **Subscription analytics** (revenue, plan distribution)
- **Real-time monitoring** of system health

### Subscription Management
- **View subscription tiers** (Basic, Advanced, Premium)
- **Upgrade/downgrade plans** for hospitals
- **Usage limits enforcement** (max patients, max users)
- **Billing cycle tracking**

---

## 🏥 Hospital Dashboard Features

### Patient Management
- **Register new patients** with demographics
- **View patient list** with search and filters
- **Patient details** with medical history
- **Custom fields** for hospital-specific data

### Appointment Scheduling
- **Calendar view** of appointments
- **Book appointments** with doctors
- **Appointment status** (scheduled, completed, cancelled)
- **Doctor availability** management

### Medical Records
- **Create visit records** with diagnoses
- **Treatment plans** and prescriptions
- **Vital signs** tracking
- **Lab test results** integration

### Lab Tests & Imaging
- **Order lab tests** with panels
- **View test results** with interpretations
- **Imaging studies** management
- **Result notifications**

---

## 🔧 Technical Implementation Details

### Backend API Endpoints

**Authentication:**
```
POST /auth/signup - Register new user
POST /auth/signin - User login (returns JWT)
POST /auth/forgot-password - Request password reset
POST /auth/reset-password - Reset password with code
```

**Tenant Management (Admin only):**
```
GET /api/tenants - List all hospitals
POST /api/tenants - Create new hospital
PUT /api/tenants/:id - Update hospital
DELETE /api/tenants/:id - Delete hospital
```

**Patient Management (Tenant-specific):**
```
GET /api/patients - List patients (tenant-scoped)
POST /api/patients - Create patient
GET /api/patients/:id - Get patient details
PUT /api/patients/:id - Update patient
DELETE /api/patients/:id - Delete patient
```

**Appointment Management:**
```
GET /api/appointments - List appointments
POST /api/appointments - Create appointment
PUT /api/appointments/:id - Update appointment
DELETE /api/appointments/:id - Cancel appointment
```

### Database Schema

**Global Tables (public schema):**
```sql
-- Hospitals/Tenants
CREATE TABLE tenants (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  plan VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'active',
  joindate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  tenant_id VARCHAR REFERENCES tenants(id),
  role VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscription Management
CREATE TABLE tenant_subscriptions (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR REFERENCES tenants(id),
  tier_id VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'active',
  billing_cycle VARCHAR DEFAULT 'monthly',
  usage_limits JSONB
);
```

**Tenant-Specific Tables (each tenant schema):**
```sql
-- Patients (in tenant_1762083064503 schema)
CREATE TABLE patients (
  id SERIAL PRIMARY KEY,
  patient_number VARCHAR UNIQUE NOT NULL,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  email VARCHAR,
  phone VARCHAR,
  date_of_birth DATE NOT NULL,
  gender VARCHAR,
  address TEXT,
  medical_history TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointments
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id),
  doctor_id INTEGER, -- References public.users.id
  appointment_date TIMESTAMP NOT NULL,
  status VARCHAR DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medical Records
CREATE TABLE medical_records (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id),
  doctor_id INTEGER,
  visit_date TIMESTAMP NOT NULL,
  diagnosis TEXT,
  treatment_plan TEXT,
  prescriptions JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🚀 Deployment Considerations

### Production Setup

**1. Environment Variables:**
```bash
# Backend (.env)
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=multitenant_db
DB_USER=postgres
DB_PASSWORD=your-password

AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=your-pool-id
COGNITO_CLIENT_ID=your-client-id
S3_BUCKET_NAME=your-bucket

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourhospitalsystem.com
```

**2. DNS Configuration:**
```
api.yourhospitalsystem.com → Backend API
admin.yourhospitalsystem.com → Admin Dashboard
*.yourhospitalsystem.com → Hospital Management System
```

**3. SSL Certificates:**
```
Use Let's Encrypt or AWS Certificate Manager
for *.yourhospitalsystem.com wildcard certificate
```

**4. Database Scaling:**
```
- Use connection pooling (pg-pool)
- Implement read replicas for reporting
- Regular backups with point-in-time recovery
- Monitor schema count and size
```

---

## 📈 Scaling Considerations

### Current Capacity
- **Tenants:** Unlimited (schema-based isolation)
- **Users per tenant:** Based on subscription plan
- **Patients per tenant:** Based on subscription plan
- **Concurrent requests:** Limited by server resources

### Optimization Strategies

**1. Database:**
- Connection pooling (already implemented)
- Indexes on frequently queried columns
- Partitioning for large tables
- Regular VACUUM and ANALYZE

**2. API:**
- Rate limiting per tenant
- Caching with Redis
- CDN for static assets
- Load balancing

**3. File Storage:**
- S3 with CloudFront CDN
- Lifecycle policies for old files
- Compression for large files

---

## 🎯 Summary

### What You Have Now

✅ **Multi-Tenant System:** Complete schema-based isolation
✅ **Admin Dashboard:** Manage multiple hospitals from one place
✅ **Hospital System:** Each hospital has full management capabilities
✅ **Security:** Complete data isolation, JWT authentication
✅ **Subscriptions:** Tiered plans with usage limits
✅ **Production Ready:** All core features operational

### What's Next

🔄 **Subdomain Implementation:** Automatic tenant detection from URL
🔄 **Custom Branding:** Hospital-specific logos and colors
🔄 **Advanced Analytics:** Per-hospital reporting and insights
🔄 **Mobile Apps:** iOS/Android apps for hospitals
🔄 **API Integrations:** Third-party integrations (labs, pharmacies)

---

## 📞 Quick Reference

**Admin Access:**
- URL: `http://localhost:3002`
- Email: `admin@example.com`
- Password: `password123`

**Hospital Access:**
- URL: `http://localhost:3001`
- Email: Hospital-specific admin email
- Password: Set during tenant creation
- Tenant ID: Provided by system admin

**API Base URL:**
- Development: `http://localhost:3000`
- Production: `https://api.yourhospitalsystem.com`

---

**System Status:** ✅ PRODUCTION READY
**Last Updated:** November 2025
**Version:** 1.0.0
