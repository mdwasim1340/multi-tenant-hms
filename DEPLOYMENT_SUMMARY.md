# Deployment Setup Summary

## ✅ What's Been Configured

Your multi-tenant backend is now ready for production deployment with complete environment separation.

### 📦 Files Created

#### Environment Configuration
- ✅ `.env.development` - Local development settings
- ✅ `.env.production` - Production settings with actual credentials
- ✅ `ecosystem.config.js` - PM2 configuration (2 instances, cluster mode)

#### Deployment Scripts
- ✅ `deploy.sh` - One-command automated deployment
- ✅ `scripts/setup-production.sh` - First-time server setup
- ✅ `scripts/check-deployment.sh` - Health check and verification
- ✅ `scripts/prepare-deployment.sh` - Pre-deployment checks

#### Documentation
- ✅ `DEPLOYMENT_GUIDE.md` - Complete deployment guide
- ✅ `DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist
- ✅ `QUICK_DEPLOYMENT_REFERENCE.md` - Quick reference card
- ✅ `backend/DEPLOYMENT_README.md` - Backend-specific docs
- ✅ `backend/deploy-manual.md` - Manual deployment steps
- ✅ `backend/DEPLOYMENT_ARCHITECTURE.md` - Architecture diagrams

### 🔐 Credentials Configured

All credentials from your current `.env` have been transferred to `.env.production`:

**Database:**
- User: `postgres`
- Database: `multitenant_db`
- Password: `password`

**AWS Cognito:**
- User Pool: `us-east-1_tvpXwEgfS`
- Client ID: `6n1faa8b43nd4isarns87rubia`
- Region: `us-east-1`

**AWS S3:**
- Bucket: `multi-tenant-12`
- Region: `us-east-1`

**AWS SNS:**
- Region: `us-west-2`
- Android ARN: `arn:aws:sns:us-west-2:276209672601:app/GCM/WiggyZ-Android`
- iOS ARN: `arn:aws:sns:us-west-2:276209672601:app/APNS/WiggyZ-iOS`

**n8n Integration:**
- Base URL: `https://n8n.aajminpolyclinic.com.np`
- OPD Agent: `2e2eee42-37e5-4e90-a4e3-ee1600dc1651`
- Ward Agent: `8d802b42-056f-44e5-bda3-312ac1129b72`
- Emergency Agent: `a29a82bd-3628-46bc-ab73-0d878ac48c5f`

**Security:**
- JWT Secret: `4Vl0Th1zn3aG+1T5dhLynENkCxKJGdi2eS3MOQX1WGk=` (generated)

## 🚀 Quick Start Guide

### Option 1: Automated Deployment (Recommended)

```bash
# 1. Prepare and check server
cd backend
chmod +x scripts/prepare-deployment.sh
./scripts/prepare-deployment.sh

# 2. Deploy to production
chmod +x deploy.sh
./deploy.sh

# 3. Verify deployment
chmod +x scripts/check-deployment.sh
./scripts/check-deployment.sh
```

### Option 2: First-Time Manual Setup

If this is the first deployment to a fresh server:

```bash
# 1. Copy setup script to server
scp -i n8n/LightsailDefaultKey-ap-south-1.pem \
    backend/scripts/setup-production.sh \
    bitnami@65.0.78.75:/home/bitnami/

# 2. SSH into server
ssh -i n8n/LightsailDefaultKey-ap-south-1.pem bitnami@65.0.78.75

# 3. Run setup script
chmod +x setup-production.sh
./setup-production.sh

# 4. Exit and deploy
exit
cd backend
./deploy.sh
```

## 📋 Next Steps

### Immediate Actions

1. **Test SSH Connection**
   ```bash
   chmod 400 n8n/LightsailDefaultKey-ap-south-1.pem
   ssh -i n8n/LightsailDefaultKey-ap-south-1.pem bitnami@65.0.78.75
   ```

2. **Run Preparation Check**
   ```bash
   cd backend
   ./scripts/prepare-deployment.sh
   ```

3. **Deploy Application**
   ```bash
   ./deploy.sh
   ```

4. **Verify Deployment**
   ```bash
   ./scripts/check-deployment.sh
   curl https://backend.aajminpolyclinic.com.np/health
   ```

### Post-Deployment Configuration

After first deployment, SSH into server and update:

```bash
ssh -i n8n/LightsailDefaultKey-ap-south-1.pem bitnami@65.0.78.75
cd /home/bitnami/multi-tenant-backend
nano .env
```

**Update these if needed:**
- `ALLOWED_ORIGINS` - Add production frontend URLs
- `EMAIL_SENDER` - Update to production email
- `DB_PASSWORD` - Change if using different password

Then restart:
```bash
pm2 restart backend-api-prod
```

## 🏗️ Architecture Overview

```
Production: https://backend.aajminpolyclinic.com.np
    ↓
AWS Lightsail (65.0.78.75)
    ↓
Nginx (SSL + Reverse Proxy)
    ↓
PM2 (2 instances, cluster mode)
    ↓
Node.js Backend API
    ↓
PostgreSQL Database (multitenant_db)
    ↓
AWS Services (Cognito, S3, SES, SNS)
```

## 📊 PM2 Process Configuration

**Production Mode:**
- Name: `backend-api-prod`
- Instances: 2 (cluster mode)
- Memory Limit: 1GB per instance
- Auto-restart: Enabled
- Log Rotation: 10MB max, 7 days retention

**Development Mode:**
- Name: `backend-api-dev`
- Instances: 1 (fork mode)
- Watch Mode: Enabled
- Auto-restart: On file changes

## 🔧 Available NPM Scripts

```bash
# Development
npm run dev              # Start development server
npm run pm2:dev          # Start with PM2 (development)

# Production
npm run build            # Build TypeScript
npm run start:prod       # Start production server
npm run pm2:start        # Start with PM2 (production)

# PM2 Management
npm run pm2:stop         # Stop all PM2 processes
npm run pm2:restart      # Restart all PM2 processes
npm run pm2:logs         # View PM2 logs
npm run pm2:monit        # Monitor PM2 processes

# Database
npm run migrate:up       # Run migrations
npm run migrate:down     # Rollback migrations
```

## 🔍 Health Check Endpoints

```bash
# Basic health check
curl https://backend.aajminpolyclinic.com.np/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-11-28T12:00:00.000Z"
}
```

## 📝 Important Files

### On Production Server
```
/home/bitnami/multi-tenant-backend/
├── .env                    # Production environment (configure this)
├── dist/                   # Compiled JavaScript
├── logs/                   # Application logs
├── ecosystem.config.js     # PM2 configuration
└── node_modules/           # Dependencies
```

### On Local Machine
```
backend/
├── .env.development        # Local development
├── .env.production         # Production template
├── deploy.sh              # Deployment script
├── scripts/
│   ├── setup-production.sh
│   ├── check-deployment.sh
│   └── prepare-deployment.sh
└── DEPLOYMENT_README.md
```

## 🚨 Troubleshooting Quick Reference

| Issue | Command | Solution |
|-------|---------|----------|
| Can't SSH | `chmod 400 n8n/LightsailDefaultKey-ap-south-1.pem` | Fix key permissions |
| App won't start | `pm2 logs backend-api-prod` | Check logs for errors |
| Port in use | `sudo lsof -i :3000` | Kill conflicting process |
| Database error | `sudo systemctl restart postgresql` | Restart PostgreSQL |
| Nginx error | `sudo nginx -t` | Test configuration |
| SSL expired | `sudo certbot renew` | Renew certificate |

## 📞 Support Resources

### Documentation
- **Complete Guide**: `DEPLOYMENT_GUIDE.md`
- **Checklist**: `DEPLOYMENT_CHECKLIST.md`
- **Quick Reference**: `QUICK_DEPLOYMENT_REFERENCE.md`
- **Architecture**: `backend/DEPLOYMENT_ARCHITECTURE.md`
- **Manual Steps**: `backend/deploy-manual.md`

### Commands
```bash
# View all documentation
ls -la *.md backend/*.md backend/scripts/*.sh

# Quick help
cat QUICK_DEPLOYMENT_REFERENCE.md
```

## ✅ Pre-Deployment Checklist

Before running deployment:

- [ ] SSH key available and permissions set (400)
- [ ] Can connect to server via SSH
- [ ] GitHub repository accessible
- [ ] DNS configured (backend.aajminpolyclinic.com.np → 65.0.78.75)
- [ ] All code committed and pushed to GitHub
- [ ] Local tests passing
- [ ] `.env.production` reviewed and correct

## 🎯 Success Criteria

Deployment is successful when:

- [ ] Application accessible at https://backend.aajminpolyclinic.com.np
- [ ] Health endpoint returns 200 OK
- [ ] PM2 shows 2 instances running
- [ ] No errors in logs
- [ ] SSL certificate valid
- [ ] Database connected
- [ ] AWS services accessible

## 📈 Monitoring

After deployment, monitor:

```bash
# Real-time monitoring
ssh -i n8n/LightsailDefaultKey-ap-south-1.pem bitnami@65.0.78.75
pm2 monit

# View logs
pm2 logs backend-api-prod

# Check status
pm2 status
```

## 🔄 Future Deployments

After initial setup, deployments are simple:

```bash
# 1. Commit and push changes
git add .
git commit -m "feat: description"
git push origin main

# 2. Deploy
cd backend
./deploy.sh

# 3. Verify
./scripts/check-deployment.sh
```

---

## 🎉 You're Ready!

Everything is configured and ready for deployment. Follow the steps in `DEPLOYMENT_CHECKLIST.md` for a guided deployment process.

**Start here:**
```bash
cd backend
./scripts/prepare-deployment.sh
```

Good luck with your deployment! 🚀

---

**Created**: November 28, 2025  
**Server**: 65.0.78.75 (bitnami)  
**Domain**: https://backend.aajminpolyclinic.com.np  
**GitHub**: https://github.com/mdwasim1340/multi-tenant-backend-only.git
