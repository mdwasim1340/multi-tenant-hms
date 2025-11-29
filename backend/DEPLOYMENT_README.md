# Backend Deployment Documentation

## 📁 Deployment Files Overview

This directory contains all necessary files for deploying the multi-tenant backend to production and development environments.

### Configuration Files

| File | Purpose | Environment |
|------|---------|-------------|
| `.env.development` | Development environment variables | Local |
| `.env.production` | Production environment variables | Production |
| `ecosystem.config.js` | PM2 process configuration | Both |
| `deploy.sh` | Automated deployment script | Production |
| `deploy-manual.md` | Manual deployment guide | Production |

### Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `scripts/setup-production.sh` | First-time server setup | One-time |
| `scripts/check-deployment.sh` | Health check script | Anytime |

## 🚀 Quick Start

### Development Environment

```bash
# 1. Copy development environment
cp .env.development .env

# 2. Start development server
npm run dev

# Or with PM2
npm run pm2:dev
```

### Production Deployment

```bash
# Option 1: Automated (Recommended)
./deploy.sh

# Option 2: Manual
# See deploy-manual.md for step-by-step instructions
```

## 🌍 Environment Configuration

### Development (.env.development)

- **Purpose**: Local development and testing
- **Database**: Local PostgreSQL
- **CORS**: localhost:3001, localhost:3002
- **Logging**: Debug level with pretty format

### Production (.env.production)

- **Purpose**: Production deployment
- **Database**: Production PostgreSQL
- **CORS**: Production frontend URLs
- **Logging**: Info level with JSON format
- **Security**: Strong secrets and passwords

## 📦 PM2 Process Management

### Configuration (ecosystem.config.js)

Two process configurations:

1. **backend-api-prod**: Production mode
   - 2 instances (cluster mode)
   - Auto-restart on crash
   - Memory limit: 1GB
   - Log rotation enabled

2. **backend-api-dev**: Development mode
   - 1 instance (fork mode)
   - Watch mode enabled
   - Auto-restart on file changes

### NPM Scripts

```bash
# Start production
npm run pm2:start

# Start development
npm run pm2:dev

# Stop all processes
npm run pm2:stop

# Restart all processes
npm run pm2:restart

# View logs
npm run pm2:logs

# Monitor resources
npm run pm2:monit
```

## 🔧 Deployment Scripts

### deploy.sh (Automated Deployment)

**What it does:**
1. Connects to production server via SSH
2. Pulls latest changes from GitHub
3. Installs dependencies
4. Builds TypeScript
5. Restarts PM2 process
6. Verifies deployment

**Usage:**
```bash
chmod +x deploy.sh
./deploy.sh
```

**Requirements:**
- SSH key at `n8n/LightsailDefaultKey-ap-south-1.pem`
- Server access (65.0.78.75)
- GitHub repository access

### setup-production.sh (First-Time Setup)

**What it does:**
1. Updates system packages
2. Installs Node.js 20.x
3. Installs PM2
4. Installs PostgreSQL
5. Creates database
6. Clones repository
7. Configures Nginx
8. Obtains SSL certificate
9. Starts application

**Usage:**
```bash
# Copy to server
scp -i n8n/LightsailDefaultKey-ap-south-1.pem \
    scripts/setup-production.sh \
    bitnami@65.0.78.75:/home/bitnami/

# SSH and run
ssh -i n8n/LightsailDefaultKey-ap-south-1.pem bitnami@65.0.78.75
chmod +x setup-production.sh
./setup-production.sh
```

### check-deployment.sh (Health Check)

**What it does:**
1. Verifies SSH connection
2. Checks server resources
3. Verifies PM2 status
4. Checks PostgreSQL status
5. Checks Nginx status
6. Tests API health endpoint

**Usage:**
```bash
chmod +x scripts/check-deployment.sh
./scripts/check-deployment.sh
```

## 🗄️ Database Migrations

### Running Migrations

```bash
# Run all pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Create new migration
npm run migrate create migration-name
```

### Migration Files Location

```
backend/migrations/
├── 1234567890123_initial_schema.js
├── 1234567890124_add_tenants.js
└── ...
```

## 🔐 Security Configuration

### Required Secrets

1. **Database Password**
   ```bash
   # Generate strong password
   node -e "console.log(require('crypto').randomBytes(24).toString('base64'))"
   ```

2. **JWT Secret**
   ```bash
   # Generate JWT secret
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

3. **AWS Credentials**
   - Already configured in `.env.production`
   - Verify they're correct for production

### CORS Configuration

Update `ALLOWED_ORIGINS` in `.env.production`:

```bash
ALLOWED_ORIGINS=https://hospital.aajminpolyclinic.com.np,https://admin.aajminpolyclinic.com.np
```

## 📊 Monitoring & Logs

### PM2 Logs

```bash
# View all logs
pm2 logs

# View specific process
pm2 logs backend-api-prod

# View last 100 lines
pm2 logs backend-api-prod --lines 100

# Clear logs
pm2 flush
```

### Log Files Location

```
backend/logs/
├── pm2-error.log      # Production errors
├── pm2-out.log        # Production output
├── pm2-dev-error.log  # Development errors
└── pm2-dev-out.log    # Development output
```

### Log Rotation

Configured via PM2:
- Max size: 10MB per file
- Retention: 7 days
- Compression: Enabled

## 🐛 Troubleshooting

### Common Issues

1. **Port 3000 already in use**
   ```bash
   # Find process
   sudo lsof -i :3000
   
   # Kill process
   kill -9 <PID>
   ```

2. **PM2 not found**
   ```bash
   sudo npm install -g pm2
   ```

3. **Database connection failed**
   ```bash
   # Check PostgreSQL
   sudo systemctl status postgresql
   
   # Restart if needed
   sudo systemctl restart postgresql
   ```

4. **Build errors**
   ```bash
   # Clean and rebuild
   rm -rf dist node_modules
   npm install
   npm run build
   ```

5. **Environment variables not loaded**
   ```bash
   # Verify .env exists
   ls -la .env
   
   # Check contents (hide secrets)
   cat .env | grep -v "PASSWORD\|SECRET\|KEY"
   ```

## 🔄 Deployment Workflow

### Standard Process

1. **Develop locally**
   ```bash
   cp .env.development .env
   npm run dev
   ```

2. **Test thoroughly**
   ```bash
   npm run test
   node tests/SYSTEM_STATUS_REPORT.js
   ```

3. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: description"
   git push origin main
   ```

4. **Deploy to production**
   ```bash
   ./deploy.sh
   ```

5. **Verify deployment**
   ```bash
   ./scripts/check-deployment.sh
   curl https://backend.aajminpolyclinic.com.np/health
   ```

### Rollback Process

```bash
# SSH to server
ssh -i n8n/LightsailDefaultKey-ap-south-1.pem bitnami@65.0.78.75

# Navigate to project
cd /home/bitnami/multi-tenant-backend

# View commits
git log --oneline -10

# Checkout previous version
git checkout <commit-hash>

# Rebuild
npm install
npm run build

# Restart
pm2 restart backend-api-prod
```

## 📞 Support & Documentation

### Related Documentation

- **Main Deployment Guide**: `../DEPLOYMENT_GUIDE.md`
- **Quick Reference**: `../QUICK_DEPLOYMENT_REFERENCE.md`
- **Manual Deployment**: `deploy-manual.md`
- **API Documentation**: `docs/`
- **Security Guidelines**: `../.kiro/steering/multi-tenant-security.md`

### Getting Help

1. Check logs: `pm2 logs backend-api-prod`
2. Run health check: `./scripts/check-deployment.sh`
3. Review troubleshooting section above
4. Check GitHub issues
5. Contact system administrator

## 🎯 Best Practices

1. **Always test locally first** before deploying to production
2. **Use automated deployment** script for consistency
3. **Monitor logs** after deployment for any issues
4. **Keep secrets secure** - never commit `.env` files
5. **Run health checks** regularly
6. **Backup database** before major changes
7. **Use PM2** for process management
8. **Enable log rotation** to prevent disk space issues
9. **Keep dependencies updated** but test thoroughly
10. **Document any manual changes** made to production

---

**Last Updated**: November 28, 2025  
**Version**: 1.0.0  
**Maintainer**: Development Team
