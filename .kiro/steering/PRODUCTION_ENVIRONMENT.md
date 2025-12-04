# Production Environment Guide

**Last Updated**: December 3, 2025  
**Status**: Live and Operational

## Production Infrastructure

### Server Details
- **Provider**: AWS Lightsail
- **IP**: 65.0.78.75
- **OS**: Ubuntu (Bitnami stack)
- **User**: bitnami
- **SSH Key**: LightsailDefaultKey-ap-south-1.pem

### Services Running
```
PM2 Process Manager:
├── multi-tenant-backend (Port 3001) - Main API server
├── hospital-frontend (Port 3001) - Next.js frontend
├── n8n (Port 5678) - Workflow automation
└── wiggyz-backend - Legacy service
```

### Database
- **Type**: PostgreSQL
- **Database Name**: hospital_management
- **User**: postgres
- **Port**: 5432
- **Schemas**: 14 tenant schemas + public schema

### Domain Configuration
- **Backend API**: https://backend.aajminpolyclinic.com.np
- **Frontend**: https://*.aajminpolyclinic.com.np (subdomain routing)
  - https://aajmin.aajminpolyclinic.com.np
  - https://sunrise.aajminpolyclinic.com.np
  - https://citygeneral.aajminpolyclinic.com.np
  - etc.

## Active Tenants (14 Total)

### Production Hospitals (6)
1. **Aajmin Polyclinic** (`aajmin_polyclinic`)
   - Subdomain: aajmin
   - Status: Active
   - Users: 8 (Admin, Doctors, Nurses, Staff)

2. **Sunrise Medical Center** (`sunrise_medical_center`)
   - Subdomain: sunrise
   - Status: Active
   - Users: 5

3. **City General Hospital** (`city_general_hospital`)
   - Subdomain: citygeneral
   - Status: Active
   - Users: 5

4. **Metro Specialty Hospital** (`metro_specialty_hospital`)
   - Subdomain: metro
   - Status: Active
   - Users: 5

5. **Valley Health Clinic** (`valley_health_clinic`)
   - Subdomain: valley
   - Status: Active
   - Users: 5

6. **Riverside Community Hospital** (`riverside_community_hospital`)
   - Subdomain: riverside
   - Status: Active
   - Users: 5

### Test/Legacy Tenants (8)
- demo_hospital_001
- tenant_1762083064503
- tenant_1762083064515
- tenant_1762083586064
- tenant_1762276589673
- tenant_1762276735123
- test_complete_1762083043709
- test_complete_1762083064426

## Deployment Process

### 1. SSH Access
```bash
# Windows
ssh -i "C:\path\to\LightsailDefaultKey-ap-south-1.pem" bitnami@65.0.78.75

# Linux/Mac
ssh -i ~/.ssh/LightsailDefaultKey-ap-south-1.pem bitnami@65.0.78.75
```

### 2. Backend Deployment
```bash
# Navigate to backend directory
cd /home/bitnami/multi-tenant-backend

# Pull latest changes (if using git)
git pull origin main

# Install dependencies (if package.json changed)
npm install

# Build TypeScript
npm run build

# Restart PM2 process
pm2 restart multi-tenant-backend

# Check logs
pm2 logs multi-tenant-backend --lines 50

# Verify status
pm2 status
```

### 3. Frontend Deployment
```bash
# Navigate to frontend directory
cd /home/bitnami/hospital-frontend

# Build Next.js
npm run build

# Restart PM2 process
pm2 restart hospital-frontend

# Check logs
pm2 logs hospital-frontend --lines 50
```

### 4. Database Migrations
```bash
# Connect to PostgreSQL
sudo -u postgres psql -d hospital_management

# Run migration
\i /path/to/migration.sql

# Verify changes
\dt public.*
```

## Environment Variables

### Backend (.env location: /home/bitnami/multi-tenant-backend/.env)
```env
# Database
DB_USER=postgres
DB_HOST=localhost
DB_NAME=hospital_management
DB_PASSWORD=password
DB_PORT=5432

# AWS Cognito
COGNITO_USER_POOL_ID=us-east-1_tvpXwEgfS
COGNITO_CLIENT_ID=6n1faa8b43nd4isarns87rubia
AWS_REGION=us-east-1

# AWS S3
AWS_ACCESS_KEY_ID=[REDACTED - Use AWS IAM]
AWS_SECRET_ACCESS_KEY=[REDACTED - Use AWS IAM]
S3_BUCKET_NAME=multi-tenant-12

# Server
PORT=3001
NODE_ENV=production
```

## Monitoring & Logs

### PM2 Commands
```bash
# View all processes
pm2 list

# View logs (real-time)
pm2 logs multi-tenant-backend

# View logs (last N lines)
pm2 logs multi-tenant-backend --lines 100 --nostream

# View specific errors
pm2 logs multi-tenant-backend --err --lines 50

# Restart process
pm2 restart multi-tenant-backend

# Stop process
pm2 stop multi-tenant-backend

# Start process
pm2 start multi-tenant-backend

# Reload with zero downtime
pm2 reload multi-tenant-backend
```

### Database Monitoring
```bash
# Check active connections
sudo -u postgres psql -d hospital_management -c "
SELECT count(*) FROM pg_stat_activity;
"

# Check table sizes
sudo -u postgres psql -d hospital_management -c "
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;
"

# Check tenant schemas
sudo -u postgres psql -d hospital_management -c "
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name LIKE '%medical%' OR schema_name LIKE '%hospital%'
ORDER BY schema_name;
"
```

## Common Production Issues & Fixes

### Issue 1: "Forbidden: Hospital admins only"
**Cause**: Old auth middleware checking Cognito groups  
**Fix**: Deploy updated auth.js without Cognito group checks
```bash
cd /home/bitnami/multi-tenant-backend
# Upload new auth.js to dist/middleware/
pm2 restart multi-tenant-backend
```

### Issue 2: "no schema has been selected to create in"
**Cause**: Service adding `tenant_` prefix to schema names  
**Fix**: Update service to use tenant ID directly
```typescript
// ❌ WRONG
const schemaName = tenantId.startsWith('tenant_') ? tenantId : `tenant_${tenantId}`;

// ✅ CORRECT
const schemaName = tenantId;
await pool.query(`SET search_path TO "${schemaName}", public`);
```

### Issue 3: "relation does not exist"
**Cause**: Table name mismatch (e.g., `lab_tests` vs `lab_test_definitions`)  
**Fix**: Rename table or update code
```sql
-- Rename table in all tenant schemas
DO $$
DECLARE tenant_schema TEXT;
BEGIN
  FOR tenant_schema IN SELECT schema_name FROM information_schema.schemata 
    WHERE schema_name LIKE '%medical%' OR schema_name LIKE '%hospital%'
  LOOP
    EXECUTE format('ALTER TABLE %I.lab_tests RENAME TO lab_test_definitions', tenant_schema);
  END LOOP;
END $$;
```

### Issue 4: "Unable to load file preview"
**Cause**: S3 presigned URL generation failing or schema context issue  
**Fix**: Verify tenant schema context before querying attachments
```typescript
await pool.query(`SET search_path TO "${tenantId}", public`);
const result = await pool.query('SELECT * FROM record_attachments WHERE record_id = $1', [recordId]);
```

## Security Best Practices

### 1. Database Access
- ✅ Use parameterized queries ALWAYS
- ✅ Set schema context for every tenant operation
- ✅ Verify tenant isolation in queries
- ❌ NEVER use string concatenation for SQL

### 2. S3 Access
- ✅ Use tenant-prefixed keys: `{tenant_id}/medical-records/{record_id}/{filename}`
- ✅ Generate presigned URLs with 1-hour expiration
- ✅ Verify tenant ownership before generating URLs
- ❌ NEVER allow direct S3 access from frontend

### 3. Authentication
- ✅ Validate JWT tokens with JWKS
- ✅ Check user exists in database
- ✅ Verify user belongs to requested tenant
- ❌ NEVER skip authentication for "convenience"

### 4. Authorization
- ✅ Check permissions via requirePermission middleware
- ✅ Verify application access via requireApplicationAccess
- ✅ Use role-based access control
- ❌ NEVER hardcode permission checks

## Backup & Recovery

### Database Backup
```bash
# Full database backup
sudo -u postgres pg_dump hospital_management > backup_$(date +%Y%m%d_%H%M%S).sql

# Specific tenant schema backup
sudo -u postgres pg_dump -n sunrise_medical_center hospital_management > sunrise_backup.sql

# Restore from backup
sudo -u postgres psql hospital_management < backup_file.sql
```

### S3 Backup
- S3 bucket has versioning enabled
- Lifecycle policies move old files to Glacier
- Cross-region replication configured

## Performance Optimization

### Database
- Connection pooling: max 10 connections
- Indexes on foreign keys
- Regular VACUUM and ANALYZE
- Query optimization for large datasets

### Backend
- PM2 cluster mode (if needed)
- Redis caching for subdomain resolution
- Compression middleware enabled
- Rate limiting configured

### Frontend
- Next.js static generation where possible
- Image optimization enabled
- CDN for static assets
- Code splitting implemented

## Health Checks

### Backend Health
```bash
curl https://backend.aajminpolyclinic.com.np/health
# Expected: {"status":"healthy","timestamp":"...","uptime":...}
```

### Database Health
```bash
sudo -u postgres psql -d hospital_management -c "SELECT version();"
```

### PM2 Health
```bash
pm2 status
# All processes should show "online"
```

## Rollback Procedure

If deployment causes issues:

1. **Stop the problematic process**
```bash
pm2 stop multi-tenant-backend
```

2. **Restore previous version**
```bash
cd /home/bitnami/multi-tenant-backend
git checkout HEAD~1  # or specific commit
npm run build
```

3. **Restart process**
```bash
pm2 restart multi-tenant-backend
```

4. **Verify functionality**
```bash
pm2 logs multi-tenant-backend --lines 50
curl https://backend.aajminpolyclinic.com.np/health
```

5. **Restore database if needed**
```bash
sudo -u postgres psql hospital_management < backup_file.sql
```

## Contact & Escalation

### Production Issues
1. Check PM2 logs first
2. Check database connectivity
3. Verify tenant schemas exist
4. Check S3 access
5. Review recent deployments

### Emergency Contacts
- **System Admin**: [Contact Info]
- **Database Admin**: [Contact Info]
- **AWS Support**: [Account Info]

---

**Remember**: Always test changes in local development before deploying to production!
