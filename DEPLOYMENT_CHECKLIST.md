# Hospital Management System - Deployment Checklist

**Server**: 65.0.78.75 (bitnami@aajminpolyclinic.com.np)  
**Date**: _______________  
**Deployed By**: _______________

---

## ✅ Pre-Deployment (Complete Before Starting)

### Local Preparation
- [ ] All code committed to git repository
- [ ] Backend builds successfully locally
- [ ] Frontend builds successfully locally
- [ ] All tests passing
- [ ] Environment variables documented
- [ ] Database migrations tested locally
- [ ] Backup of current production (if updating)

### Server Access
- [ ] SSH key available: `n8n/LightsailDefaultKey-ap-south-1.pem`
- [ ] Can connect to server: `ssh -i "n8n/LightsailDefaultKey-ap-south-1.pem" bitnami@65.0.78.75`
- [ ] Have sudo access if needed

### Documentation Review
- [ ] Read `LIGHTSAIL_DEPLOYMENT_PLAN.md`
- [ ] Read `DEPLOYMENT_QUICK_REFERENCE.md`
- [ ] Understand port allocation (3001=backend, 3002=frontend)
- [ ] Know rollback procedure

---

## 🔍 Phase 0: Analysis (15 min)

- [ ] Upload `analyze-lightsail-deployment.sh` to server
- [ ] Run analysis script
- [ ] Download and review `deployment-analysis.txt`
- [ ] Verify port 3000 is in use (existing service)
- [ ] Verify ports 3001, 3002 are available
- [ ] Confirm web server type (Apache/Nginx)
- [ ] Check disk space (need 5GB+)
- [ ] Check memory (need 2GB+ free)
- [ ] Document existing services

**⚠️ STOP if conflicts found. Resolve before continuing.**

---

## 📦 Phase 1: Build & Prepare (30 min)

### Build Backend
- [ ] `cd backend`
- [ ] `npm install --production`
- [ ] `npm run build` (if applicable)
- [ ] Test: `node src/index.js` starts without errors
- [ ] Create `.env.production` with correct values
- [ ] Verify PORT=3001 in .env

### Build Frontend
- [ ] `cd hospital-management-system`
- [ ] `npm install --production`
- [ ] `npm run build`
- [ ] Verify `.next` folder created
- [ ] Create `.env.production` with correct values
- [ ] Verify PORT=3002 in .env
- [ ] Verify NEXT_PUBLIC_API_URL points to api.aajminpolyclinic.com.np

### Create Deployment Package
- [ ] Create `deployment-package` folder
- [ ] Copy backend files (exclude node_modules)
- [ ] Copy frontend files (exclude node_modules, include .next)
- [ ] Copy environment files
- [ ] Create `ecosystem.config.js` for PM2

---

## 🚀 Phase 2: Server Setup (1 hour)

### Connect to Server
- [ ] SSH into server
- [ ] Verify current user: `whoami` (should be bitnami)
- [ ] Check existing services: `pm2 list`

### Install Dependencies
- [ ] Check Node.js version: `node --version` (need 18+)
- [ ] Install/update Node.js if needed
- [ ] Check PM2: `pm2 --version`
- [ ] Install PM2 if needed: `sudo npm install -g pm2`
- [ ] Check PostgreSQL: `psql --version`
- [ ] Install PostgreSQL if needed

### Create Directories
- [ ] `sudo mkdir -p /opt/hospital-management`
- [ ] `sudo chown bitnami:bitnami /opt/hospital-management`
- [ ] `mkdir -p /opt/hospital-management/{backend,frontend,logs,backups}`

### Setup Database
- [ ] Connect to PostgreSQL: `sudo -u postgres psql`
- [ ] Create database: `CREATE DATABASE multitenant_db;`
- [ ] Create user: `CREATE USER hospital_user WITH PASSWORD 'secure_password';`
- [ ] Grant privileges: `GRANT ALL PRIVILEGES ON DATABASE multitenant_db TO hospital_user;`
- [ ] Test connection: `psql -U hospital_user -d multitenant_db -h localhost`
- [ ] Exit and document credentials

---

## 📤 Phase 3: Upload Files (30 min)

### Transfer Backend
- [ ] `scp -i "n8n/LightsailDefaultKey-ap-south-1.pem" -r backend/* bitnami@65.0.78.75:/opt/hospital-management/backend/`
- [ ] Verify files uploaded: `ls -la /opt/hospital-management/backend/`

### Transfer Frontend
- [ ] `scp -i "n8n/LightsailDefaultKey-ap-south-1.pem" -r hospital-management-system/* bitnami@65.0.78.75:/opt/hospital-management/frontend/`
- [ ] Verify files uploaded: `ls -la /opt/hospital-management/frontend/`

### Transfer Configuration
- [ ] Upload backend .env
- [ ] Upload frontend .env.local
- [ ] Upload ecosystem.config.js
- [ ] Verify all files present

---

## 🔧 Phase 4: Install & Configure (45 min)

### Backend Setup
- [ ] `cd /opt/hospital-management/backend`
- [ ] `npm install --production`
- [ ] Verify .env file: `cat .env | grep PORT` (should show 3001)
- [ ] Run migrations: `npm run migrate up`
- [ ] Verify migrations: `psql -U hospital_user -d multitenant_db -c "\dt"`
- [ ] Test backend: `node src/index.js` (Ctrl+C after verification)

### Frontend Setup
- [ ] `cd /opt/hospital-management/frontend`
- [ ] `npm install --production`
- [ ] Verify .env.local: `cat .env.local | grep PORT` (should show 3002)
- [ ] Verify build exists: `ls -la .next/`
- [ ] Test frontend: `npm start` (Ctrl+C after verification)

### PM2 Configuration
- [ ] Verify ecosystem.config.js in `/opt/hospital-management/`
- [ ] Check ports in config: backend=3001, frontend=3002
- [ ] Start services: `pm2 start ecosystem.config.js`
- [ ] Check status: `pm2 status`
- [ ] View logs: `pm2 logs --lines 20`
- [ ] Save PM2 config: `pm2 save`
- [ ] Setup startup: `pm2 startup` (follow instructions)

### Verify Services Running
- [ ] Backend: `curl http://localhost:3001/health`
- [ ] Frontend: `curl http://localhost:3002`
- [ ] PM2 status shows both running
- [ ] No errors in logs

---

## 🌐 Phase 5: Web Server Configuration (45 min)

### Identify Web Server
- [ ] Check Apache: `sudo systemctl status apache2`
- [ ] Check Nginx: `sudo systemctl status nginx`
- [ ] Document which one is active

### Apache Configuration (if using Apache)
- [ ] Create vhost file: `/opt/bitnami/apache/conf/vhosts/hospital-vhost.conf`
- [ ] Add backend proxy (api.aajminpolyclinic.com.np → localhost:3001)
- [ ] Add frontend proxy (aajminpolyclinic.com.np → localhost:3002)
- [ ] Enable proxy modules: `sudo a2enmod proxy proxy_http`
- [ ] Test config: `sudo /opt/bitnami/apache/bin/apachectl configtest`
- [ ] Restart Apache: `sudo /opt/bitnami/ctlscript.sh restart apache`

### Nginx Configuration (if using Nginx)
- [ ] Create config: `/etc/nginx/sites-available/hospital`
- [ ] Add backend proxy (api.aajminpolyclinic.com.np → localhost:3001)
- [ ] Add frontend proxy (aajminpolyclinic.com.np → localhost:3002)
- [ ] Enable site: `sudo ln -s /etc/nginx/sites-available/hospital /etc/nginx/sites-enabled/`
- [ ] Test config: `sudo nginx -t`
- [ ] Restart Nginx: `sudo systemctl restart nginx`

### DNS Configuration
- [ ] Verify DNS A record: aajminpolyclinic.com.np → 65.0.78.75
- [ ] Verify DNS A record: api.aajminpolyclinic.com.np → 65.0.78.75
- [ ] Verify DNS A record: www.aajminpolyclinic.com.np → 65.0.78.75
- [ ] Test DNS: `nslookup aajminpolyclinic.com.np`
- [ ] Wait for DNS propagation if needed (up to 24 hours)

---

## 🔒 Phase 6: SSL Setup (30 min)

### Install Certbot
- [ ] `sudo apt install -y certbot`
- [ ] For Apache: `sudo apt install -y python3-certbot-apache`
- [ ] For Nginx: `sudo apt install -y python3-certbot-nginx`

### Obtain Certificates
- [ ] Run certbot for all domains
- [ ] Apache: `sudo certbot --apache -d aajminpolyclinic.com.np -d www.aajminpolyclinic.com.np -d api.aajminpolyclinic.com.np`
- [ ] Nginx: `sudo certbot --nginx -d aajminpolyclinic.com.np -d www.aajminpolyclinic.com.np -d api.aajminpolyclinic.com.np`
- [ ] Verify certificates: `sudo certbot certificates`
- [ ] Test auto-renewal: `sudo certbot renew --dry-run`

### Update Configuration for HTTPS
- [ ] Update vhost/config for HTTPS (port 443)
- [ ] Add HTTP to HTTPS redirect
- [ ] Test config
- [ ] Restart web server

---

## 🗄️ Phase 7: Database & Tenant Setup (30 min)

### Create Tenant
- [ ] Connect to database: `psql -U hospital_user -d multitenant_db`
- [ ] Insert tenant record for aajmin_polyclinic
- [ ] Create tenant schema: `CREATE SCHEMA "tenant_aajmin";`
- [ ] Run tenant-specific migrations
- [ ] Verify tenant tables exist
- [ ] Create admin user for tenant
- [ ] Assign admin role
- [ ] Document tenant ID and credentials

### Test Database
- [ ] Query tenants: `SELECT * FROM tenants;`
- [ ] Verify tenant schema exists
- [ ] Test API with tenant headers
- [ ] Exit database

---

## 🔥 Phase 8: Firewall & Security (15 min)

### Configure Firewall
- [ ] Check status: `sudo ufw status`
- [ ] Allow SSH: `sudo ufw allow 22/tcp`
- [ ] Allow HTTP: `sudo ufw allow 80/tcp`
- [ ] Allow HTTPS: `sudo ufw allow 443/tcp`
- [ ] Block 3001: `sudo ufw deny 3001/tcp` (optional)
- [ ] Block 3002: `sudo ufw deny 3002/tcp` (optional)
- [ ] Enable firewall: `sudo ufw enable`
- [ ] Verify: `sudo ufw status verbose`

### Security Checks
- [ ] Verify .env files have correct permissions (600)
- [ ] Verify database password is strong
- [ ] Verify API keys are set
- [ ] Verify JWT secret is set
- [ ] No sensitive data in logs

---

## ✅ Phase 9: Testing (45 min)

### Backend API Tests
- [ ] Health check: `curl https://api.aajminpolyclinic.com.np/health`
- [ ] Test signin endpoint
- [ ] Test with tenant headers
- [ ] Verify CORS headers
- [ ] Check response times
- [ ] Review API logs for errors

### Frontend Tests
- [ ] Access: `https://aajminpolyclinic.com.np`
- [ ] Verify page loads
- [ ] Test login functionality
- [ ] Test navigation
- [ ] Check browser console for errors
- [ ] Test API calls from frontend
- [ ] Verify tenant isolation

### Performance Tests
- [ ] Backend load test: `ab -n 100 -c 10 https://api.aajminpolyclinic.com.np/health`
- [ ] Frontend load test: `ab -n 50 -c 5 https://aajminpolyclinic.com.np/`
- [ ] Check response times acceptable
- [ ] Monitor server resources during tests

### Cross-Browser Testing
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test on mobile device

---

## 📊 Phase 10: Monitoring Setup (30 min)

### Log Rotation
- [ ] Create logrotate config: `/etc/logrotate.d/hospital-management`
- [ ] Test logrotate: `sudo logrotate -f /etc/logrotate.d/hospital-management`

### PM2 Monitoring
- [ ] Install pm2-logrotate: `pm2 install pm2-logrotate`
- [ ] Configure log rotation
- [ ] Test: `pm2 logs --lines 10`

### Health Checks
- [ ] Create health-check.sh script
- [ ] Make executable: `chmod +x health-check.sh`
- [ ] Test script: `./health-check.sh`
- [ ] Add to crontab: `crontab -e`
- [ ] Add: `*/5 * * * * /opt/hospital-management/health-check.sh`

### Backup Setup
- [ ] Create backup-db.sh script
- [ ] Create backup-app.sh script
- [ ] Make executable
- [ ] Test both scripts
- [ ] Add to crontab (daily DB, weekly app)
- [ ] Verify backups created

---

## 📝 Phase 11: Documentation (30 min)

### Create Operations Manual
- [ ] Document all URLs
- [ ] Document all credentials (securely)
- [ ] Document common commands
- [ ] Document troubleshooting steps
- [ ] Document update procedure
- [ ] Document rollback procedure

### Team Handover
- [ ] Share access credentials securely
- [ ] Walkthrough deployment with team
- [ ] Demonstrate common operations
- [ ] Review monitoring setup
- [ ] Review backup/restore procedure

---

## 🎉 Phase 12: Go Live (15 min)

### Final Checks
- [ ] All services running: `pm2 status`
- [ ] SSL certificates valid
- [ ] DNS resolving correctly
- [ ] Frontend accessible
- [ ] Backend API responding
- [ ] No errors in logs
- [ ] Monitoring active
- [ ] Backups configured

### Announce Go-Live
- [ ] Notify stakeholders
- [ ] Share URLs
- [ ] Share support contacts
- [ ] Monitor for first 24 hours

---

## 📞 Post-Deployment

### Day 1 Monitoring
- [ ] Check logs every 2 hours
- [ ] Monitor server resources
- [ ] Check for errors
- [ ] Verify backups running
- [ ] Test all major features

### Week 1 Tasks
- [ ] Daily log review
- [ ] Performance monitoring
- [ ] User feedback collection
- [ ] Address any issues
- [ ] Optimize as needed

### Ongoing Maintenance
- [ ] Weekly log review
- [ ] Monthly security updates
- [ ] Quarterly SSL renewal check
- [ ] Regular backup verification
- [ ] Performance optimization

---

## 🚨 Rollback Procedure (If Needed)

- [ ] Stop PM2 services
- [ ] Restore database from backup
- [ ] Restore application files from backup
- [ ] Restart services
- [ ] Verify rollback successful
- [ ] Document what went wrong
- [ ] Plan fix for next deployment

---

## ✍️ Sign-Off

**Deployment Completed By**: _______________  
**Date**: _______________  
**Time**: _______________  
**Status**: ⬜ Success ⬜ Partial ⬜ Rolled Back  

**Notes**:
_____________________________________________
_____________________________________________
_____________________________________________

**Next Steps**:
_____________________________________________
_____________________________________________
_____________________________________________
