# 🚀 Quick Start Guide for AI Agents

**Last Updated**: December 3, 2025  
**System Status**: Production Live | Phase 2 In Progress

## 📋 Essential Information

### System Overview
- **Multi-Tenant Hospital Management System**
- **Production**: Live at https://backend.aajminpolyclinic.com.np (65.0.78.75)
- **Frontend**: https://*.aajminpolyclinic.com.np (subdomain-based routing)
- **Phase 1**: ✅ Complete (Auth, Multi-tenancy, S3, Custom Fields, Analytics)
- **Phase 2**: 🔄 In Progress (Patient ✅, Appointments 🔄, Medical Records ✅)
- **14 Active Tenants** with complete schema isolation

### Technology Stack
- **Backend**: Node.js + TypeScript + Express.js + PostgreSQL
- **Frontend**: Next.js 16 + React 19 + Tailwind CSS + Radix UI
- **Auth**: AWS Cognito (JWT tokens)
- **Storage**: AWS S3 (presigned URLs, tenant-isolated)
- **Email**: AWS SES
- **Database**: PostgreSQL with schema-based multi-tenancy

## 🚨 CRITICAL RULES (Read First!)

### 1. Multi-Tenant Headers (MANDATORY)
```typescript
headers: {
  'Authorization': 'Bearer jwt_token',
  'X-Tenant-ID': 'sunrise_medical_center',  // Direct schema name, NO tenant_ prefix
  'X-App-ID': 'hospital-management',
  'X-API-Key': process.env.NEXT_PUBLIC_API_KEY
}
```

### 2. Schema Naming Convention
- ✅ **CORRECT**: Use tenant ID directly as schema name
  - `sunrise_medical_center`
  - `aajmin_polyclinic`
  - `city_general_hospital`
- ❌ **WRONG**: Do NOT add `tenant_` prefix
  - ~~`tenant_sunrise_medical_center`~~

### 3. Database Operations
```bash
# Production (via SSH)
ssh -i ~/.ssh/LightsailDefaultKey-ap-south-1.pem bitnami@65.0.78.75
sudo -u postgres psql -d hospital_management

# Local (via Docker)
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db
```

### 4. Security
- ❌ NEVER create Next.js API proxies
- ✅ ALWAYS call backend directly
- ✅ ALWAYS validate tenant context
- ✅ ALWAYS use parameterized queries
- ✅ S3 uploads use tenant-prefixed keys: `{tenant_id}/medical-records/{record_id}/{filename}`

## 🎯 Quick Commands

### Development (Local)
```bash
# Backend (Port 3001)
cd backend && npm run dev

# Hospital System (Port 3001)
cd hospital-management-system && npm run dev

# Admin Dashboard (Port 3002)
cd admin-dashboard && npm run dev
```

### Production Deployment
```bash
# SSH to production
ssh -i "C:\app_dev\multi-tenant-backend\n8n\LightsailDefaultKey-ap-south-1.pem" bitnami@65.0.78.75

# Deploy backend
cd /home/bitnami/multi-tenant-backend
npm run build
pm2 restart multi-tenant-backend

# Check logs
pm2 logs multi-tenant-backend --lines 50
```

### Database
```bash
# Local - Check tables
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "\dt public.*"

# Local - Check tenant schemas
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name LIKE '%medical%' OR schema_name LIKE '%hospital%';
"

# Production - Check tables
sudo -u postgres psql -d hospital_management -c "\dt public.*"
```

## 📁 Project Structure

```
backend/                    # API server (Port 3001)
├── src/
│   ├── middleware/
│   │   ├── auth.ts        # JWT validation (NO Cognito group checks)
│   │   ├── tenant.ts      # Schema context (uses tenant ID directly)
│   │   └── authorization.ts # Permission checks
│   ├── services/
│   │   ├── medicalRecord.service.ts # Fixed schema prefix
│   │   └── s3.service.ts  # Tenant-isolated uploads
│   └── routes/
├── dist/                  # Compiled JS (production uses this)
└── .env                   # DB_NAME=hospital_management (production)

hospital-management-system/ # Hospital UI (Port 3001)
├── app/                   # Next.js pages (81 routes)
└── lib/
    └── auth.ts           # Frontend auth (no permission checks)

production-data/           # Synced from production
├── tenants.csv           # 14 tenants
├── users.csv             # 39 users
└── *.csv                 # All production data
```

## 🔍 Common Tasks

### Creating New API Endpoint
1. Check existing routes: `ls backend/src/routes/`
2. Verify no duplicates
3. Add tenant middleware (uses tenant ID directly)
4. Add auth middleware (hospitalAuthMiddleware)
5. Add permission check (requirePermission)
6. Test with curl
7. Update documentation

### Database Schema Operations
```sql
-- Set schema context (NO tenant_ prefix)
SET search_path TO "sunrise_medical_center", public;

-- Create table in tenant schema
CREATE TABLE IF NOT EXISTS patients (...);

-- Query with schema context
SELECT * FROM patients WHERE id = 1;
```

### S3 File Upload Pattern
```typescript
// Generate S3 key with tenant prefix
const s3Key = `${tenantId}/medical-records/${recordId}/${timestamp}-${filename}`;

// Upload to S3
await s3.upload({
  Bucket: 'multi-tenant-12',
  Key: s3Key,
  Body: fileBuffer
});

// Store in database
await pool.query(`
  INSERT INTO record_attachments (record_id, s3_key, s3_bucket, file_name)
  VALUES ($1, $2, $3, $4)
`, [recordId, s3Key, 'multi-tenant-12', filename]);
```

## 📚 Production Credentials

### Aajmin Polyclinic (subdomain: aajmin)
- Admin: `mdwasimkrm13@gmail.com` / `Advanture101$`
- Hospital Admin: `admin@aajmin.hospital` / `Aspiration101$`
- Doctor: `doctor@aajmin.hospital` / `Aspiration101$`

### Sunrise Medical Center (subdomain: sunrise)
- Hospital Admin: `admin@sunrise.hospital` / `Aspiration101$`
- Doctor: `doctor@sunrise.hospital` / `Aspiration101$`

### City General Hospital (subdomain: citygeneral)
- Hospital Admin: `admin@citygeneral.hospital` / `Aspiration101$`

## 🆘 Emergency Contacts

### If Something Breaks
1. Check PM2 logs: `pm2 logs multi-tenant-backend --lines 100`
2. Check database: `sudo -u postgres psql -d hospital_management`
3. Verify tenant schemas exist
4. Check auth middleware (should NOT check Cognito groups)
5. Verify tenant middleware (should NOT add tenant_ prefix)

### Common Issues & Fixes

**Issue**: "Forbidden: Hospital admins only"
**Fix**: Auth middleware has old Cognito group checks. Deploy fixed auth.js

**Issue**: "no schema has been selected to create in"
**Fix**: Service is adding `tenant_` prefix. Use tenant ID directly.

**Issue**: "relation does not exist"
**Fix**: Table might be named differently (e.g., `lab_tests` vs `lab_test_definitions`)

**Issue**: "Unable to load file preview"
**Fix**: Check S3 presigned URL generation and tenant schema context

## ✅ Success Checklist

Before marking work complete:
- [ ] No duplicate implementations
- [ ] Multi-tenant isolation verified
- [ ] Schema names used directly (no tenant_ prefix)
- [ ] All tests passing
- [ ] TypeScript compiles without errors
- [ ] Documentation updated
- [ ] Changes committed with clear message
- [ ] Deployed to production (if needed)
- [ ] Tested in production environment

## 🔄 Sync Local with Production

```bash
# Import production data locally
docker exec -i backend-postgres-1 psql -U postgres -d multitenant_db < import-production-data-local.sql

# Create tenant schemas
docker exec -i backend-postgres-1 psql -U postgres -d multitenant_db < create-tenant-schemas-local.sql

# Verify
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "SELECT COUNT(*) FROM users;"
```

See `SYNC_LOCAL_WITH_PRODUCTION.md` for detailed instructions.

---

**Next Steps**: Read the detailed steering documents for your specific task area.

**Production Server**: 65.0.78.75 (bitnami user)
**Backend Path**: /home/bitnami/multi-tenant-backend
**PM2 Process**: multi-tenant-backend
**Database**: hospital_management (PostgreSQL)
