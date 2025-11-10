# Environment Variables Guide

**Multi-Tenant Hospital Management System**  
**Date**: November 9, 2025  
**Version**: 1.0

---

## Overview

This guide documents all environment variables required for the multi-tenant hospital management system. Each application (Backend, Hospital Frontend, Admin Dashboard) requires specific configuration.

---

## Table of Contents

1. [Backend API Variables](#backend-api-variables)
2. [Hospital Frontend Variables](#hospital-frontend-variables)
3. [Admin Dashboard Variables](#admin-dashboard-variables)
4. [Example .env Files](#example-env-files)
5. [Environment-Specific Configuration](#environment-specific-configuration)
6. [Security Best Practices](#security-best-practices)

---

## Backend API Variables

Location: `backend/.env`

### Server Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | ✅ Yes | `development` | Environment mode: `development`, `production`, `test` |
| `PORT` | ✅ Yes | `3000` | Port for backend API server |
| `API_VERSION` | No | `v1` | API version prefix for routes |
| `BASE_URL` | No | `http://localhost:3000` | Full base URL for API |

### Database Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ Yes | - | PostgreSQL connection string |

**Format**: `postgresql://[user]:[password]@[host]:[port]/[database]`

**Examples**:
- Development: `postgresql://postgres:password@localhost:5432/hospital_management`
- Production: `postgresql://user:pass@db.example.com:5432/hospital_prod`

### Redis Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REDIS_URL` | ✅ Yes | - | Redis connection string |

**Format**: `redis://[host]:[port]` or `redis://:[password]@[host]:[port]`

**Examples**:
- Development: `redis://localhost:6379`
- Production: `redis://:password@redis.example.com:6379`

### Authentication & Security

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | ✅ Yes | - | Secret key for JWT token signing (min 32 characters) |
| `JWT_EXPIRES_IN` | No | `7d` | JWT token expiration time (e.g., `1h`, `7d`, `30d`) |
| `BCRYPT_ROUNDS` | No | `10` | Number of salt rounds for password hashing |

**Security Note**: Use a strong, randomly generated JWT secret in production.

### CORS Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ALLOWED_ORIGINS` | ✅ Yes | - | Comma-separated list of allowed origins |

**Example**: `http://localhost:3001,http://localhost:3002,https://admin.yourdomain.com`

### File Upload Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MAX_FILE_SIZE` | No | `2097152` | Maximum file upload size in bytes (2MB default) |
| `UPLOAD_DIR` | No | `uploads` | Local directory for temporary file storage |
| `ALLOWED_FILE_TYPES` | No | `image/png,image/jpeg,image/jpg,image/svg+xml` | Comma-separated MIME types |

### AWS S3 Configuration (Logo Storage)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AWS_ACCESS_KEY_ID` | Conditional* | - | AWS access key for S3 |
| `AWS_SECRET_ACCESS_KEY` | Conditional* | - | AWS secret key for S3 |
| `AWS_REGION` | Conditional* | `us-east-1` | AWS region for S3 bucket |
| `S3_BUCKET_NAME` | Conditional* | - | S3 bucket name for logo storage |
| `USE_LOCAL_STORAGE` | No | `false` | Set to `true` to use local storage instead of S3 |

**\*Required for production**, optional for development if `USE_LOCAL_STORAGE=true`

### Email Configuration (Optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SMTP_HOST` | No | - | SMTP server hostname |
| `SMTP_PORT` | No | `587` | SMTP server port |
| `SMTP_SECURE` | No | `false` | Use TLS/SSL for SMTP |
| `SMTP_USER` | No | - | SMTP authentication username |
| `SMTP_PASS` | No | - | SMTP authentication password |
| `EMAIL_FROM` | No | - | Default sender email address |

---

## Hospital Frontend Variables

Location: `hospital-management-system/.env.local`

### API Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ Yes | - | Backend API base URL |
| `NEXT_PUBLIC_API_KEY` | No | - | Optional API key for authentication |

**Examples**:
- Development: `http://localhost:3000/api`
- Production: `https://api.yourdomain.com/api`

### Subdomain Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_BASE_DOMAIN` | ✅ Yes | - | Base domain for subdomain routing |

**Examples**:
- Development: `localhost:3001`
- Production: `yourdomain.com`

**Note**: In production, this should be the root domain (e.g., `example.com`). Tenants will access via subdomains (e.g., `hospital1.example.com`).

### Application Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_APP_NAME` | No | `Hospital Management` | Application name displayed in UI |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | No | - | Support contact email |

---

## Admin Dashboard Variables

Location: `admin-dashboard/.env.local`

### API Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ Yes | - | Backend API base URL |
| `NEXT_PUBLIC_API_KEY` | No | - | Optional API key for authentication |

**Examples**:
- Development: `http://localhost:3000/api`
- Production: `https://api.yourdomain.com/api`

### Dashboard Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_BASE_DOMAIN` | ✅ Yes | - | Base domain for subdomain URLs |
| `NEXT_PUBLIC_DASHBOARD_NAME` | No | `Admin Dashboard` | Dashboard title |

---

## Example .env Files

### Backend `.env.example`

```env
# ===================================
# Backend API Environment Variables
# ===================================

# Server Configuration
NODE_ENV=development
PORT=3000
API_VERSION=v1
BASE_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/hospital_management

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-change-this
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10

# CORS - Update with your frontend URLs
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3002

# File Upload
MAX_FILE_SIZE=2097152
UPLOAD_DIR=uploads
ALLOWED_FILE_TYPES=image/png,image/jpeg,image/jpg,image/svg+xml

# AWS S3 (Optional - for logo storage)
# Leave commented to use local storage in development
# AWS_ACCESS_KEY_ID=your-aws-access-key-id
# AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
# AWS_REGION=us-east-1
# S3_BUCKET_NAME=hospital-system-branding
USE_LOCAL_STORAGE=true

# Email (Optional)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
# EMAIL_FROM=noreply@yourdomain.com
```

### Hospital Frontend `.env.local.example`

```env
# ===================================
# Hospital Frontend Environment Variables
# ===================================

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Subdomain Configuration
NEXT_PUBLIC_BASE_DOMAIN=localhost:3001

# Application Settings
NEXT_PUBLIC_APP_NAME=Hospital Management System
NEXT_PUBLIC_SUPPORT_EMAIL=support@yourdomain.com
```

### Admin Dashboard `.env.local.example`

```env
# ===================================
# Admin Dashboard Environment Variables
# ===================================

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Dashboard Configuration
NEXT_PUBLIC_BASE_DOMAIN=localhost:3001
NEXT_PUBLIC_DASHBOARD_NAME=Super Admin Dashboard
```

---

## Environment-Specific Configuration

### Development Environment

**Characteristics**:
- Local database and Redis
- Local file storage (no S3)
- Relaxed CORS policies
- Verbose logging
- Hot module reloading

**Example Backend `.env`**:
```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/hospital_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-key-32-characters-min
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3002
USE_LOCAL_STORAGE=true
```

### Staging Environment

**Characteristics**:
- Cloud database and Redis
- S3 for file storage
- Stricter CORS
- Moderate logging
- Similar to production

**Example Backend `.env`**:
```env
NODE_ENV=staging
DATABASE_URL=postgresql://user:pass@staging-db.example.com:5432/hospital_staging
REDIS_URL=redis://:pass@staging-redis.example.com:6379
JWT_SECRET=staging-secret-key-from-secrets-manager
ALLOWED_ORIGINS=https://staging-admin.example.com,https://*.staging.example.com
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=hospital-staging-branding
```

### Production Environment

**Characteristics**:
- Managed database and Redis
- S3 for file storage
- Strict CORS policies
- Error-only logging
- High availability

**Example Backend `.env`**:
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db.example.com:5432/hospital_prod
REDIS_URL=redis://:pass@prod-redis.example.com:6379
JWT_SECRET=production-secret-from-aws-secrets-manager
ALLOWED_ORIGINS=https://admin.yourdomain.com,https://*.yourdomain.com
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET_NAME=hospital-prod-branding
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG...
```

---

## Security Best Practices

### 1. Secret Management

❌ **Never commit `.env` files to version control**

✅ **Do**:
- Use `.env.example` files (without real values)
- Store secrets in secure vaults (AWS Secrets Manager, HashiCorp Vault)
- Use environment variables in CI/CD pipelines
- Rotate secrets regularly

### 2. JWT Secret

✅ **Requirements**:
- Minimum 32 characters
- Use cryptographically secure random generation
- Different secrets for each environment

**Generate secure JWT secret**:
```bash
# Linux/Mac
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# PowerShell
[Convert]::ToBase64String((1..32|%{Get-Random -Max 256}))
```

### 3. Database Credentials

✅ **Best practices**:
- Use strong passwords (16+ characters)
- Create separate database users per environment
- Grant minimal required privileges
- Enable SSL/TLS connections in production
- Rotate credentials quarterly

### 4. CORS Configuration

✅ **Production**:
```env
# Specific domains only
ALLOWED_ORIGINS=https://admin.yourdomain.com,https://*.yourdomain.com
```

❌ **Never in production**:
```env
# Don't use wildcard in production
ALLOWED_ORIGINS=*
```

### 5. File Upload Security

✅ **Validation**:
```env
MAX_FILE_SIZE=2097152              # 2MB limit
ALLOWED_FILE_TYPES=image/png,image/jpeg,image/svg+xml
```

### 6. Environment Variable Validation

**Backend startup should validate**:
- All required variables are present
- Values are in correct format
- Database connection works
- Redis connection works
- S3 credentials are valid (if used)

---

## Troubleshooting

### Common Issues

**1. "DATABASE_URL is not defined"**
- Ensure `.env` file exists in `backend/` directory
- Check file is named exactly `.env` (not `.env.txt`)
- Restart the backend server

**2. "Cannot connect to database"**
- Verify PostgreSQL is running: `psql --version`
- Test connection: `psql -U postgres -h localhost -d hospital_management`
- Check DATABASE_URL format is correct

**3. "Redis connection failed"**
- Verify Redis is running: `redis-cli ping` (should return "PONG")
- Check REDIS_URL is correct
- Ensure Redis port 6379 is not blocked

**4. "CORS error in browser"**
- Add frontend URL to ALLOWED_ORIGINS
- Use exact URL including protocol and port
- Restart backend after changing ALLOWED_ORIGINS

**5. "JWT verification failed"**
- Ensure JWT_SECRET is same across restarts
- Clear browser cookies/localStorage
- Check JWT token hasn't expired

---

## Environment Variable Checklist

Use this checklist when setting up a new environment:

### Backend
- [ ] `NODE_ENV` set correctly
- [ ] `DATABASE_URL` configured and tested
- [ ] `REDIS_URL` configured and tested
- [ ] `JWT_SECRET` generated (32+ characters)
- [ ] `ALLOWED_ORIGINS` includes all frontend URLs
- [ ] S3 credentials configured (production) or `USE_LOCAL_STORAGE=true` (development)
- [ ] SMTP configured (if using email features)

### Hospital Frontend
- [ ] `NEXT_PUBLIC_API_URL` points to backend
- [ ] `NEXT_PUBLIC_BASE_DOMAIN` set correctly

### Admin Dashboard
- [ ] `NEXT_PUBLIC_API_URL` points to backend
- [ ] `NEXT_PUBLIC_BASE_DOMAIN` set correctly

---

## Next Steps

After configuring environment variables:

1. Create `.env` files from examples
2. Fill in actual values for your environment
3. Test database connection
4. Test Redis connection
5. Start all services
6. Verify API connectivity
7. Test subdomain routing

**Related Documentation**:
- [Setup Guide](./setup-guide.md)
- [Database Migrations](./database-migrations.md)
- [Deployment Architecture](./deployment-architecture.md)
- [S3 Configuration Guide](./s3-configuration.md)

---

**Security Reminder**: Never share or commit actual environment variable values. Always use `.env.example` files with placeholder values for documentation.
