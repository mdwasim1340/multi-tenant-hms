# Infrastructure Setup Guide

**Multi-Tenant Hospital Management System**  
**Date**: November 8, 2025  
**Version**: 1.0

---

## Overview

This guide covers setting up the complete infrastructure for the multi-tenant hospital management system, including subdomain support and custom branding features.

---

## System Requirements

### Software Requirements

| Component | Version | Required |
|-----------|---------|----------|
| Node.js | 18.x or higher | ✅ Yes |
| npm | 9.x or higher | ✅ Yes |
| PostgreSQL | 14.x or higher | ✅ Yes |
| Redis | 6.x or higher | ✅ Yes |
| Git | Latest | ✅ Yes |

### Hardware Requirements (Minimum)

| Resource | Development | Production |
|----------|-------------|------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4GB | 8GB+ |
| Storage | 20GB | 50GB+ |
| Network | 10 Mbps | 100 Mbps+ |

---

## Architecture Overview

The system consists of three main applications:

```
┌─────────────────────────────────────────────────────┐
│                 Users/Browsers                       │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┬──────────────────┐
        │                     │                  │
        ▼                     ▼                  ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Hospital   │    │    Admin     │    │   Backend    │
│   Frontend   │    │  Dashboard   │    │     API      │
│  (Port 3001) │    │ (Port 3002)  │    │  (Port 3000) │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                     │
       └───────────────────┴─────────────────────┘
                           │
            ┌──────────────┴──────────────┐
            │                             │
            ▼                             ▼
    ┌──────────────┐            ┌──────────────┐
    │  PostgreSQL  │            │    Redis     │
    │   Database   │            │    Cache     │
    └──────────────┘            └──────────────┘
```

---

## Port Configuration

| Application | Port | Purpose |
|-------------|------|---------|
| Backend API | 3000 | REST API endpoints |
| Hospital Frontend | 3001 | User-facing application |
| Admin Dashboard | 3002 | Super admin interface |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Caching layer |

**Important**: Ensure these ports are available on your system.

---

## Installation Steps

### 1. Clone Repository

```bash
git clone <repository-url>
cd multi-tenant-backend
```

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install

# Hospital Frontend
cd ../hospital-management-system
npm install

# Admin Dashboard
cd ../admin-dashboard
npm install
```

### 3. Database Setup

#### PostgreSQL Installation

**Windows:**
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run installer and follow wizard
3. Note down the password you set for `postgres` user
4. PostgreSQL service should start automatically

**Verify Installation:**
```bash
psql --version
```

#### Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE hospital_management;

# Create user (optional, recommended for production)
CREATE USER hospital_admin WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE hospital_management TO hospital_admin;

# Exit psql
\q
```

### 4. Redis Setup

#### Redis Installation

**Windows:**
1. Download Redis from https://github.com/microsoftarchive/redis/releases
2. Extract and run `redis-server.exe`
3. Redis will start on default port 6379

**Alternative - Using Docker:**
```bash
docker run -d -p 6379:6379 --name redis redis:latest
```

**Verify Installation:**
```bash
redis-cli ping
# Should return: PONG
```

### 5. Environment Configuration

Create `.env` files for each application:

#### Backend `.env`
```env
# Server
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/hospital_management

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3002

# File Upload
MAX_FILE_SIZE=2097152
UPLOAD_DIR=uploads

# S3 (Optional - for logo storage)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=hospital-system-branding

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### Hospital Frontend `.env.local`
```env
# API
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_KEY=hospital-dev-key-123

# Subdomain
NEXT_PUBLIC_BASE_DOMAIN=localhost:3001

# App Info
NEXT_PUBLIC_APP_NAME=Hospital Management System
NEXT_PUBLIC_APP_VERSION=1.0.0
```

#### Admin Dashboard `.env.local`
```env
# API
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_KEY=admin-dev-key-456

# App Info
NEXT_PUBLIC_APP_NAME=Admin Dashboard
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 6. Run Database Migrations

```bash
cd backend

# Run all migrations
npm run migrate

# Verify migrations
npm run migrate:status
```

### 7. Seed Database (Optional)

```bash
# Create demo tenant
npm run seed:tenants

# Create demo branding
npm run seed:branding
```

---

## Running the Applications

### Development Mode

Open **three separate terminals**:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Hospital Frontend:**
```bash
cd hospital-management-system
npm run dev
```

**Terminal 3 - Admin Dashboard:**
```bash
cd admin-dashboard
npm run dev
```

### Verify Everything is Running

| Application | URL | Status Check |
|-------------|-----|--------------|
| Backend API | http://localhost:3000 | `curl http://localhost:3000/health` |
| Hospital Frontend | http://localhost:3001 | Open in browser |
| Admin Dashboard | http://localhost:3002 | Open in browser |

---

## Testing Subdomain Feature Locally

### Option 1: Edit Hosts File (Recommended for Development)

**Windows:** Edit `C:\Windows\System32\drivers\etc\hosts`

Add these lines:
```
127.0.0.1 demo.localhost
127.0.0.1 cityhospital.localhost
127.0.0.1 generalhospital.localhost
```

Now you can access:
- `http://demo.localhost:3001` - Demo hospital
- `http://cityhospital.localhost:3001` - City Hospital
- `http://generalhospital.localhost:3001` - General Hospital

### Option 2: Use Different Paths (Simpler)

Access via tenant ID in URL:
- `http://localhost:3001?tenant=demo_hospital_001`

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations run successfully
- [ ] Redis connection working
- [ ] S3 bucket set up (for logos)
- [ ] Domain DNS configured
- [ ] SSL certificates obtained
- [ ] Build process tested
- [ ] Backups configured

### Build Commands

```bash
# Backend
cd backend
npm run build
npm start

# Hospital Frontend
cd hospital-management-system
npm run build
npm start

# Admin Dashboard
cd admin-dashboard
npm run build
npm start
```

### Recommended Hosting Platforms

| Platform | Best For | Cost (Estimated) |
|----------|----------|------------------|
| Vercel | Next.js apps | Free - $20/month |
| Railway | Backend + DB | $5 - $20/month |
| AWS | Full control | $50 - $200/month |
| DigitalOcean | VPS | $20 - $40/month |
| Heroku | Quick deploy | $7 - $50/month |

---

## Troubleshooting

### Database Connection Failed

**Error**: `ECONNREFUSED` or `Connection refused`

**Solutions**:
1. Check PostgreSQL is running: `pg_ctl status`
2. Verify credentials in `.env`
3. Check firewall isn't blocking port 5432
4. Test connection: `psql -U postgres -d hospital_management`

### Redis Connection Failed

**Error**: `Redis connection to localhost:6379 failed`

**Solutions**:
1. Check Redis is running: `redis-cli ping`
2. Start Redis: `redis-server`
3. Check firewall isn't blocking port 6379
4. Verify REDIS_URL in `.env`

### Port Already in Use

**Error**: `Port 3000 is already in use`

**Solutions**:
```bash
# Windows - Find process using port
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <process_id> /F

# Or use different port in .env
PORT=3003
```

### Subdomain Not Resolving

**Solutions**:
1. Check hosts file entries (Windows)
2. Clear DNS cache: `ipconfig /flushdns`
3. Restart browser
4. Verify subdomain exists in database

### Logo Upload Failing

**Solutions**:
1. Check file size < 2MB
2. Verify S3 credentials in `.env`
3. Check CORS configuration on S3 bucket
4. Ensure upload directory writable (local storage)
5. Check backend logs for errors

---

## Monitoring & Maintenance

### Health Checks

```bash
# Backend health
curl http://localhost:3000/health

# Database health
curl http://localhost:3000/health/db

# Redis health
curl http://localhost:3000/health/redis
```

### Database Backups

**Daily Backup (Recommended)**:
```bash
# Backup
pg_dump -U postgres hospital_management > backup_$(date +%Y%m%d).sql

# Restore
psql -U postgres hospital_management < backup_20251108.sql
```

### Log Files

| Application | Log Location |
|-------------|--------------|
| Backend | `backend/logs/app.log` |
| Frontend | Browser console + Vercel logs |
| Database | PostgreSQL data directory |
| Redis | Redis data directory |

---

## Performance Optimization

### Redis Caching

Already implemented for:
- ✅ Subdomain resolution (1 hour TTL)
- ✅ Branding configuration (1 hour TTL)
- ✅ Tenant lookups

### Database Indexes

Existing indexes:
- ✅ `tenants.subdomain` (unique)
- ✅ `tenant_branding.tenant_id` (unique)
- ✅ `tenants.id` (primary key)

### Image Optimization

- Logos automatically resized (small, medium, large)
- Use WebP format when possible
- Enable CDN caching (CloudFront)

---

## Security Considerations

### Production Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT_SECRET
- [ ] Enable HTTPS only
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable SQL injection protection
- [ ] Implement XSS prevention
- [ ] Regular security updates
- [ ] Database encryption at rest
- [ ] API key rotation policy

---

## Scaling Guidelines

### Horizontal Scaling

**When to scale**:
- CPU usage > 70% sustained
- Memory usage > 80%
- Response time > 500ms
- > 1000 concurrent users

**How to scale**:
1. Load balancer (nginx, AWS ALB)
2. Multiple backend instances
3. Database read replicas
4. Redis cluster
5. CDN for static assets

### Vertical Scaling

Upgrade server resources:
- CPU: 2 → 4 → 8 cores
- RAM: 4GB → 8GB → 16GB
- Storage: SSD recommended

---

## Support & Resources

### Documentation

- API Documentation: `/docs/api/`
- Database Schema: `/docs/database/`
- Deployment Guide: `/docs/infrastructure/deployment-architecture.md`

### Getting Help

1. Check troubleshooting section above
2. Review logs for error messages
3. Search existing issues on GitHub
4. Contact development team

---

## Next Steps

After completing setup:

1. ✅ Verify all services running
2. ✅ Create your first tenant via Admin Dashboard
3. ✅ Configure subdomain for tenant
4. ✅ Upload hospital logo and set colors
5. ✅ Test hospital frontend with subdomain
6. ✅ Review security settings
7. ✅ Plan production deployment

---

**Setup Complete!** 🎉

Your multi-tenant hospital management system with subdomain support and custom branding is now ready for development or deployment.
