# Production Deployment Checklist

Complete checklist for deploying the multi-tenant backend to production.

## 📋 Pre-Deployment Checklist

### Local Environment
- [ ] All code committed to GitHub
- [ ] All tests passing locally
- [ ] `.env.production` file configured with correct credentials
- [ ] SSH key available at `n8n/LightsailDefaultKey-ap-south-1.pem`
- [ ] SSH key permissions set to 400

### Server Access
- [ ] Can SSH into server: `ssh -i n8n/LightsailDefaultKey-ap-south-1.pem bitnami@65.0.78.75`
- [ ] Server has internet connectivity
- [ ] GitHub repository accessible from server

### DNS Configuration
- [ ] Domain `backend.aajminpolyclinic.com.np` points to 65.0.78.75
- [ ] DNS propagation complete (check with `nslookup backend.aajminpolyclinic.com.np`)

## 🚀 Deployment Steps

### Step 1: Prepare SSH Access

```bash
# Set correct permissions
chmod 400 n8n/LightsailDefaultKey-ap-south-1.pem

# Test connection
ssh -i n8n/LightsailDefaultKey-ap-south-1.pem bitnami@65.0.78.75
```

**Expected Result**: Successfully connected to server
- [ ] SSH connection successful

### Step 2: Run Preparation Check

```bash
cd backend
chmod +x scripts/prepare-deployment.sh
./scripts/prepare-deployment.sh
```

**Expected Result**: Server status report showing installed software
- [ ] Node.js installed (or will be installed)
- [ ] PM2 installed (or will be installed)
- [ ] PostgreSQL installed (or will be installed)
- [ ] Nginx installed (or will be installed)

### Step 3: First-Time Server Setup (Skip if already done)

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

**This will install and configure:**
- [ ] Node.js 20.x
- [ ] PM2 process manager
- [ ] PostgreSQL database
- [ ] Database created: `multitenant_db`
- [ ] Nginx web server
- [ ] SSL certificate (Let's Encrypt)
- [ ] Firewall rules (UFW)
- [ ] Repository cloned
- [ ] Application built
- [ ] PM2 started

**Expected Duration**: 10-15 minutes

### Step 4: Configure Environment Variables

```bash
# SSH into server
ssh -i n8n/LightsailDefaultKey-ap-south-1.pem bitnami@65.0.78.75

# Navigate to project
cd /home/bitnami/multi-tenant-backend

# Edit environment file
nano .env
```

**Update these values:**

```bash
# Database (if different from default)
DB_PASSWORD=password

# Security (already generated)
JWT_SECRET=4Vl0Th1zn3aG+1T5dhLynENkCxKJGdi2eS3MOQX1WGk=

# CORS (add production frontend URLs)
ALLOWED_ORIGINS=https://hospital.aajminpolyclinic.com.np,https://admin.aajminpolyclinic.com.np

# Email (update if needed)
EMAIL_SENDER=noreply@aajminpolyclinic.com.np
```

**Save and exit**: `Ctrl+X`, then `Y`, then `Enter`

- [ ] Environment variables configured
- [ ] JWT secret set
- [ ] CORS origins updated
- [ ] Email sender updated

### Step 5: Run Database Migrations

```bash
# Still on server
cd /home/bitnami/multi-tenant-backend

# Run migrations
npm run migrate:up
```

**Expected Result**: All migrations applied successfully
- [ ] Migrations completed without errors
- [ ] Database tables created
- [ ] Tenant schemas created

### Step 6: Start Application

```bash
# Start with PM2
pm2 start ecosystem.config.js --env production --only backend-api-prod

# Save PM2 configuration
pm2 save

# Check status
pm2 status
```

**Expected Result**: Application running with status "online"
- [ ] PM2 process started
- [ ] Status shows "online"
- [ ] No errors in logs

### Step 7: Verify Deployment

```bash
# Exit from server
exit

# From local machine, run health check
cd backend
./scripts/check-deployment.sh
```

**Expected Results:**
- [ ] SSH connection successful
- [ ] Server information displayed
- [ ] PM2 shows backend-api-prod as "online"
- [ ] PostgreSQL is running
- [ ] Nginx is running
- [ ] API health check passed

### Step 8: Test API Endpoints

```bash
# Test health endpoint
curl https://backend.aajminpolyclinic.com.np/health

# Expected response:
# {"status":"ok","timestamp":"2025-11-28T..."}
```

- [ ] Health endpoint returns 200 OK
- [ ] Response contains status and timestamp

### Step 9: Test with Frontend

If you have frontend applications ready:

```bash
# Test from Hospital Management System
curl -X GET https://backend.aajminpolyclinic.com.np/api/patients \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Tenant-ID: tenant_id" \
  -H "X-App-ID: hospital-management" \
  -H "X-API-Key: your_api_key"
```

- [ ] API responds to authenticated requests
- [ ] Multi-tenant isolation working
- [ ] CORS headers correct

### Step 10: Monitor Logs

```bash
# SSH back into server
ssh -i n8n/LightsailDefaultKey-ap-south-1.pem bitnami@65.0.78.75

# View logs
pm2 logs backend-api-prod

# Monitor in real-time
pm2 monit
```

- [ ] No error messages in logs
- [ ] Application responding to requests
- [ ] Memory usage normal (< 500MB per instance)

## 🔄 Subsequent Deployments

For future deployments after initial setup:

```bash
# From local machine
cd backend
./deploy.sh
```

**This will:**
1. Connect to server via SSH
2. Pull latest changes from GitHub
3. Install dependencies
4. Build TypeScript
5. Restart PM2 process
6. Verify deployment

- [ ] Deployment script completed successfully
- [ ] Application restarted
- [ ] Health check passed

## 🔒 Security Verification

### Firewall Check

```bash
# On server
sudo ufw status
```

**Expected ports open:**
- [ ] 22/tcp (SSH)
- [ ] 80/tcp (HTTP)
- [ ] 443/tcp (HTTPS)

### SSL Certificate Check

```bash
# On server
sudo certbot certificates
```

- [ ] Certificate valid
- [ ] Expiry date > 30 days
- [ ] Auto-renewal configured

### Environment Security

```bash
# On server
ls -la /home/bitnami/multi-tenant-backend/.env
```

- [ ] .env file exists
- [ ] Permissions are 600 or 644
- [ ] Not committed to Git

## 📊 Post-Deployment Monitoring

### First 24 Hours

- [ ] Monitor PM2 logs every 2 hours
- [ ] Check memory usage: `pm2 monit`
- [ ] Verify no crashes: `pm2 list`
- [ ] Test all critical endpoints
- [ ] Monitor error rates

### First Week

- [ ] Daily health checks
- [ ] Review logs for errors
- [ ] Monitor database performance
- [ ] Check disk space: `df -h`
- [ ] Verify backups working

### Ongoing

- [ ] Weekly health checks
- [ ] Monthly security updates
- [ ] SSL certificate renewal (automatic)
- [ ] Database backups (configure schedule)
- [ ] Log rotation working

## 🚨 Rollback Plan

If deployment fails:

```bash
# SSH into server
ssh -i n8n/LightsailDefaultKey-ap-south-1.pem bitnami@65.0.78.75
cd /home/bitnami/multi-tenant-backend

# View recent commits
git log --oneline -10

# Rollback to previous version
git checkout <previous-commit-hash>

# Rebuild
npm install
npm run build

# Restart
pm2 restart backend-api-prod

# Verify
pm2 logs backend-api-prod
```

- [ ] Rollback procedure tested
- [ ] Previous version working

## 📞 Emergency Contacts

### If Something Goes Wrong

1. **Check logs first**: `pm2 logs backend-api-prod`
2. **Check server status**: `./scripts/check-deployment.sh`
3. **Restart application**: `pm2 restart backend-api-prod`
4. **Check database**: `sudo systemctl status postgresql`
5. **Check Nginx**: `sudo systemctl status nginx`

### Common Issues

| Issue | Solution |
|-------|----------|
| Application won't start | Check logs: `pm2 logs backend-api-prod` |
| Port 3000 in use | `sudo lsof -i :3000` then kill process |
| Database connection failed | `sudo systemctl restart postgresql` |
| Nginx error | `sudo nginx -t` then `sudo systemctl restart nginx` |
| SSL certificate expired | `sudo certbot renew` |
| Out of memory | Increase server resources or optimize code |
| Disk space full | Clean logs: `pm2 flush` and old files |

## ✅ Final Verification

Before marking deployment complete:

- [ ] Application accessible at https://backend.aajminpolyclinic.com.np
- [ ] Health endpoint returns 200 OK
- [ ] SSL certificate valid
- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] PM2 process running in cluster mode
- [ ] Logs show no errors
- [ ] Frontend can connect to backend
- [ ] Multi-tenant isolation verified
- [ ] Authentication working
- [ ] CORS configured correctly
- [ ] Firewall rules active
- [ ] Monitoring in place
- [ ] Backup strategy defined
- [ ] Rollback plan tested
- [ ] Documentation updated

## 📝 Deployment Log

Record each deployment:

| Date | Version | Deployed By | Status | Notes |
|------|---------|-------------|--------|-------|
| 2025-11-28 | 1.0.0 | [Name] | ✅ Success | Initial deployment |
|  |  |  |  |  |

---

**Last Updated**: November 28, 2025  
**Next Review**: After first deployment
