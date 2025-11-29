# Multi-Tenant Backend Deployment Guide

Complete guide for deploying the backend to production and managing development environments.

## 🌍 Environments

### Development Environment
- **URL**: http://localhost:3000
- **Database**: Local PostgreSQL
- **Config**: `.env.development`
- **Purpose**: Local development and testing

### Production Environment
- **URL**: https://backend.aajminpolyclinic.com.np
- **Server**: AWS Lightsail (65.0.78.75)
- **User**: bitnami
- **Database**: Production PostgreSQL
- **Config**: `.env.production`
- **GitHub**: https://github.com/mdwasim1340/multi-tenant-backend-only.git

## 🚀 Quick Deployment

### Option 1: Automated Deployment (Recommended)

```bash
# Make script executable
chmod +x backend/deploy.sh

# Run deployment
./backend/deploy.sh
```

This script will:
- Connect to production server via SSH
- Pull latest changes from GitHub
- Install dependencies
- Build TypeScript
- Restart PM2 process
- Verify deployment

### Option 2: Manual Deployment

See `backend/deploy-manual.md` for detailed step-by-step instructions.

## 📋 First-Time Setup

### 1. Prepare SSH Access

```bash
# Set correct permissions for SSH key
chmod 400 n8n/LightsailDefaultKey-ap-south-1.pem

# Test SSH connection
ssh -i n8n/LightsailDefaultKey-ap-south-1.pem bitnami@65.0.78.75
```

### 2. Run Production Setup Script

```bash
# Copy setup script to server
scp -i n8n/LightsailDefaultKey-ap-south-1.pem \
    backend/scripts/setup-production.sh \
    bitnami@65.0.78.75:/home/bitnami/

# SSH into server
ssh -i n8n/LightsailDefaultKey-ap-south-1.pem bitnami@65.0.78.75

# Run setup script
chmod +x setup-production.sh
./setup-production.sh
```

This will install and configure:
- Node.js 20.x
- PM2 process manager
- PostgreSQL database
- Nginx web server
- SSL certificate (Let's Encrypt)
- Firewall rules

## 🔧 Configuration

### Environment Files

**Development** (`.env.development`):
```bash
NODE_ENV=development
PORT=3000
BASE_URL=http://localhost:3000
DB_PASSWORD=password
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3002
```

**Production** (`.env.production`):
```bash
NODE_ENV=production
PORT=3000
BASE_URL=https://backend.aajminpolyclinic.com.np
DB_PASSWORD=STRONG_PASSWORD_HERE
ALLOWED_ORIGINS=https://hospital.aajminpolyclinic.com.np,https://admin.aajminpolyclinic.com.np
JWT_SECRET=GENERATE_STRONG_SECRET
```

### Generate Secure Secrets

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Generate database password
node -e "console.log(require('crypto').randomBytes(24).toString('base64'))"
```

## 📦 PM2 Process Management

### Start Application

```bash
# Production
pm2 start ecosystem.config.js --env production --only backend-api-prod

# Development
pm2 start ecosystem.config.js --env development --only backend-api-dev
```

### Common Commands

```bash
# List all processes
pm2 list

# View logs
pm2 logs backend-api-prod

# Monitor resources
pm2 monit

# Restart application
pm2 restart backend-api-prod

# Stop application
pm2 stop backend-api-prod

# Save configuration
pm2 save

# Startup on boot
pm2 startup
```

## 🗄️ Database Management

### Run Migrations

```bash
# On production server
cd /home/bitnami/multi-tenant-backend
npm run migrate up
```

### Backup Database

```bash
# Create backup
pg_dump -U postgres multitenant_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql -U postgres multitenant_db < backup_20250128_120000.sql
```

### Check Database Status

```bash
# Connect to database
psql -U postgres -d multitenant_db

# List tables
\dt

# List tenant schemas
SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%';

# Exit
\q
```

## 🔍 Health Checks

### Automated Health Check

```bash
# Make script executable
chmod +x backend/scripts/check-deployment.sh

# Run health check
./backend/scripts/check-deployment.sh
```

### Manual Health Checks

```bash
# Check API health
curl https://backend.aajminpolyclinic.com.np/health

# Check with authentication
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "X-Tenant-ID: tenant_id" \
     -H "X-App-ID: hospital-management" \
     -H "X-API-Key: your_api_key" \
     https://backend.aajminpolyclinic.com.np/api/patients
```

## 🐛 Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs backend-api-prod --lines 100

# Check if port is in use
sudo lsof -i :3000

# Check environment variables
cat .env | grep -v "PASSWORD\|SECRET\|KEY"
```

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log

# Test connection
psql -U postgres -d multitenant_db -h localhost
```

### Nginx Issues

```bash
# Check Nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

## 🔄 Deployment Workflow

### Standard Deployment Process

1. **Develop locally** with `.env.development`
2. **Test thoroughly** with local database
3. **Commit changes** to GitHub
4. **Run deployment script** or deploy manually
5. **Verify deployment** with health checks
6. **Monitor logs** for any issues

### Rollback Procedure

```bash
# SSH into server
ssh -i n8n/LightsailDefaultKey-ap-south-1.pem bitnami@65.0.78.75

# Navigate to project
cd /home/bitnami/multi-tenant-backend

# View recent commits
git log --oneline -10

# Checkout previous version
git checkout <commit-hash>

# Rebuild and restart
npm install
npm run build
pm2 restart backend-api-prod
```

## 📊 Monitoring

### Setup Monitoring

```bash
# Install PM2 log rotation
pm2 install pm2-logrotate

# Configure rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### Monitor Resources

```bash
# Real-time monitoring
pm2 monit

# System resources
htop

# Disk usage
df -h

# Memory usage
free -h
```

## 🔒 Security Checklist

Before going live:

- [ ] SSH key permissions set to 400
- [ ] Strong database password configured
- [ ] JWT secret generated and secured
- [ ] Environment variables not committed to Git
- [ ] Firewall configured (ports 22, 80, 443 only)
- [ ] SSL certificate installed and auto-renewal enabled
- [ ] CORS origins properly configured for production
- [ ] AWS credentials secured
- [ ] Database backups scheduled
- [ ] PM2 logs rotation enabled
- [ ] Nginx security headers configured
- [ ] Rate limiting configured (if needed)

## 📝 Useful Commands Reference

### SSH & File Transfer

```bash
# Connect to server
ssh -i n8n/LightsailDefaultKey-ap-south-1.pem bitnami@65.0.78.75

# Copy file to server
scp -i n8n/LightsailDefaultKey-ap-south-1.pem file.txt bitnami@65.0.78.75:/home/bitnami/

# Copy file from server
scp -i n8n/LightsailDefaultKey-ap-south-1.pem bitnami@65.0.78.75:/home/bitnami/file.txt ./
```

### Git Operations

```bash
# Pull latest changes
git pull origin main

# Check status
git status

# View commit history
git log --oneline -10

# Discard local changes
git reset --hard origin/main
```

### System Services

```bash
# PostgreSQL
sudo systemctl status postgresql
sudo systemctl restart postgresql

# Nginx
sudo systemctl status nginx
sudo systemctl restart nginx

# View all services
systemctl list-units --type=service
```

## 📞 Support

For deployment issues:

1. **Check logs**: `pm2 logs backend-api-prod`
2. **Run health check**: `./backend/scripts/check-deployment.sh`
3. **Review this guide**: Especially troubleshooting section
4. **Check server resources**: Memory, disk, CPU usage
5. **Verify environment**: Ensure all credentials are correct

## 🔗 Related Documentation

- **Manual Deployment**: `backend/deploy-manual.md`
- **API Documentation**: `backend/docs/`
- **Database Schema**: `backend/docs/database-schema/`
- **Security Guidelines**: `.kiro/steering/multi-tenant-security.md`

---

**Last Updated**: November 28, 2025  
**Maintainer**: Development Team
