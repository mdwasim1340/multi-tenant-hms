# AWS Lightsail Deployment Plan - Hospital Management System

**Target Domain**: https://aajminpolyclinic.com.np  
**Tenant**: aajmin_polyclinic  
**Server IP**: 65.0.78.75  
**User**: bitnami  
**Date**: November 28, 2025

---

## 🎯 Deployment Overview

### Current Architecture
```
Multi-Tenant Hospital Management System
├── Backend API (Node.js/Express) - Port 3001 (UPDATED)
├── Hospital Frontend (Next.js) - Port 3002 (UPDATED)
├── Admin Dashboard (Next.js) - Port 3003 (UPDATED)
└── PostgreSQL Database
```

### Target Architecture on Lightsail
```
AWS Lightsail Instance (65.0.78.75)
├── Apache/Nginx (Reverse Proxy) - Port 80/443
│   └── SSL: aajminpolyclinic.com.np
├── **EXISTING SERVICE** - Port 3000 (DO NOT TOUCH)
├── Hospital Backend API - Port 3001 (PM2) ← NEW
├── Hospital Frontend - Port 3002 (PM2) ← NEW
├── PostgreSQL - Port 5432
└── Other Existing Services (DO NOT TOUCH)
```

### ⚠️ IMPORTANT: Port Allocation
- **Port 3000**: Already in use by existing service - DO NOT USE
- **Port 3001**: Hospital Backend API (this deployment)
- **Port 3002**: Hospital Frontend (this deployment)
- **Port 3003**: Available for Admin Dashboard (future)

---

## 🔍 Phase 0: Run Analysis Script (15 minutes)

### Step 0.1: Upload and Run Analysis Script
```bash
# From your local machine (Windows PowerShell)
# Upload the analysis script
scp -i "n8n/LightsailDefaultKey-ap-south-1.pem" analyze-lightsail-deployment.sh bitnami@65.0.78.75:~/

# Connect to server
ssh -i "n8n/LightsailDefaultKey-ap-south-1.pem" bitnami@65.0.78.75

# Make script executable and run
chmod +x ~/analyze-lightsail-deployment.sh
./analyze-lightsail-deployment.sh > deployment-analysis.txt

# Review the output
cat deployment-analysis.txt

# Download analysis for review
# Exit SSH and run from local machine:
scp -i "n8n/LightsailDefaultKey-ap-south-1.pem" bitnami@65.0.78.75:~/deployment-analysis.txt .
```

### Step 0.2: Review Analysis Output
Check for:
- ✅ Port 3000 is in use (existing service)
- ✅ Ports 3001, 3002 are available
- ✅ Web server type (Apache/Nginx)
- ✅ Existing virtual hosts
- ✅ Database availability
- ✅ Available disk space (need at least 5GB)
- ✅ Available memory (need at least 2GB free)
- ✅ PM2 installation status

**⚠️ STOP HERE if any conflicts are found. Resolve them before proceeding.**

---

## 📋 Phase 1: Pre-Deployment Analysis (30 minutes)

### Step 1.1: Connect and Analyze Existing Setup
```bash
# Connect to server
ssh -i "n8n/LightsailDefaultKey-ap-south-1.pem" bitnami@65.0.78.75

# Check existing services
sudo systemctl list-units --type=service --state=running
sudo netstat -tulpn | grep LISTEN
pm2 list
docker ps

# Check web server
sudo systemctl status apache2
sudo systemctl status nginx
ls -la /opt/bitnami/apache/conf/vhosts/
ls -la /etc/nginx/sites-enabled/

# Check available ports
sudo lsof -i -P -n | grep LISTEN

# Check disk space
df -h

# Check memory
free -h
```

### Step 1.2: Identify Existing Services
Document what's already running:
- [ ] Web server (Apache/Nginx)
- [ ] Database (PostgreSQL/MySQL)
- [ ] Node.js applications
- [ ] Docker containers
- [ ] Other services

---

## 📦 Phase 2: Prepare Application for Deployment (1 hour)

### Step 2.1: Build Production Artifacts Locally
```bash
# On your local machine

# 1. Build Backend
cd backend
npm install --production
npm run build

# 2. Build Hospital Frontend
cd ../hospital-management-system
npm install --production
npm run build

# 3. Create deployment package
cd ..
mkdir -p deployment-package
cp -r backend deployment-package/
cp -r hospital-management-system deployment-package/
```

### Step 2.2: Prepare Environment Files
```bash
# backend/.env.production
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://postgres:password@localhost:5432/multitenant_db

# AWS Cognito
COGNITO_USER_POOL_ID=your_pool_id
COGNITO_CLIENT_ID=your_client_id
COGNITO_REGION=ap-south-1
COGNITO_JWKS_URI=https://cognito-idp.ap-south-1.amazonaws.com/...

# AWS S3
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# AWS SES
SES_REGION=ap-south-1
SES_FROM_EMAIL=noreply@aajminpolyclinic.com.np

# Security
JWT_SECRET=your_jwt_secret_here
HOSPITAL_APP_API_KEY=your_hospital_api_key
ADMIN_APP_API_KEY=your_admin_api_key

# hospital-management-system/.env.production
NEXT_PUBLIC_API_URL=https://api.aajminpolyclinic.com.np
NEXT_PUBLIC_API_KEY=your_hospital_api_key
PORT=3002
```

---

## 🚀 Phase 3: Server Setup (1 hour)

### Step 3.1: Install Required Software
```bash
# Connect to server
ssh -i "n8n/LightsailDefaultKey-ap-south-1.pem" bitnami@65.0.78.75

# Update system
sudo apt update
sudo apt upgrade -y

# Install Node.js 20.x (if not present)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install PostgreSQL (if not present)
sudo apt install -y postgresql postgresql-contrib

# Verify installations
node --version
npm --version
pm2 --version
psql --version
```

### Step 3.2: Setup PostgreSQL Database
```bash
# Switch to postgres user
sudo -u postgres psql

-- Create database
CREATE DATABASE multitenant_db;

-- Create user
CREATE USER hospital_user WITH ENCRYPTED PASSWORD 'secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE multitenant_db TO hospital_user;

-- Exit
\q

# Test connection
psql -U hospital_user -d multitenant_db -h localhost
```

### Step 3.3: Create Application Directories
```bash
# Create app directory
sudo mkdir -p /opt/hospital-management
sudo chown bitnami:bitnami /opt/hospital-management

# Create subdirectories
mkdir -p /opt/hospital-management/backend
mkdir -p /opt/hospital-management/frontend
mkdir -p /opt/hospital-management/logs
```

---

## 📤 Phase 4: Upload and Deploy Application (1 hour)

### Step 4.1: Transfer Files to Server
```bash
# From your local machine (Windows PowerShell)

# Transfer backend
scp -i "n8n/LightsailDefaultKey-ap-south-1.pem" -r backend/* bitnami@65.0.78.75:/opt/hospital-management/backend/

# Transfer frontend
scp -i "n8n/LightsailDefaultKey-ap-south-1.pem" -r hospital-management-system/* bitnami@65.0.78.75:/opt/hospital-management/frontend/

# Transfer environment files
scp -i "n8n/LightsailDefaultKey-ap-south-1.pem" backend/.env.production bitnami@65.0.78.75:/opt/hospital-management/backend/.env
scp -i "n8n/LightsailDefaultKey-ap-south-1.pem" hospital-management-system/.env.production bitnami@65.0.78.75:/opt/hospital-management/frontend/.env.local
```

### Step 4.2: Setup Backend on Server
```bash
# SSH into server
ssh -i "n8n/LightsailDefaultKey-ap-south-1.pem" bitnami@65.0.78.75

# Navigate to backend
cd /opt/hospital-management/backend

# Install dependencies
npm install --production

# Run database migrations
npm run migrate up

# Test backend
node src/index.js

# If successful, stop with Ctrl+C
```

### Step 4.3: Setup Frontend on Server
```bash
# Navigate to frontend
cd /opt/hospital-management/frontend

# Install dependencies
npm install --production

# Build for production (if not already built)
npm run build

# Test frontend
npm start

# If successful, stop with Ctrl+C
```

---

## 🔧 Phase 5: Configure PM2 Process Manager (30 minutes)

### Step 5.1: Create PM2 Ecosystem File
```bash
# Create ecosystem.config.js
cat > /opt/hospital-management/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'hospital-backend',
      cwd: '/opt/hospital-management/backend',
      script: 'src/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/opt/hospital-management/logs/backend-error.log',
      out_file: '/opt/hospital-management/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
      watch: false
    },
    {
      name: 'hospital-frontend',
      cwd: '/opt/hospital-management/frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3002',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: '/opt/hospital-management/logs/frontend-error.log',
      out_file: '/opt/hospital-management/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
      watch: false
    }
  ]
};
EOF
```

### Step 5.2: Start Applications with PM2
```bash
# Start applications
cd /opt/hospital-management
pm2 start ecosystem.config.js

# Check status
pm2 status
pm2 logs

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs

# Test applications
curl http://localhost:3001/health
curl http://localhost:3002
```

---

## 🌐 Phase 6: Configure Reverse Proxy (1 hour)

### Option A: Apache Configuration (Bitnami Default)

#### Step 6.1: Create Virtual Host Configuration
```bash
# Create vhost file
sudo nano /opt/bitnami/apache/conf/vhosts/hospital-vhost.conf
```

```apache
# Backend API
<VirtualHost *:80>
    ServerName api.aajminpolyclinic.com.np
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:3001/
    ProxyPassReverse / http://localhost:3001/
    
    ErrorLog /opt/bitnami/apache/logs/api-error.log
    CustomLog /opt/bitnami/apache/logs/api-access.log combined
</VirtualHost>

# Frontend Application
<VirtualHost *:80>
    ServerName aajminpolyclinic.com.np
    ServerAlias www.aajminpolyclinic.com.np
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:3002/
    ProxyPassReverse / http://localhost:3002/
    
    # WebSocket support for Next.js HMR (if needed)
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*)           ws://localhost:3002/$1 [P,L]
    
    ErrorLog /opt/bitnami/apache/logs/frontend-error.log
    CustomLog /opt/bitnami/apache/logs/frontend-access.log combined
</VirtualHost>
```

#### Step 6.2: Enable Required Apache Modules
```bash
# Enable proxy modules
sudo /opt/bitnami/apache/bin/apachectl -M | grep proxy

# If not enabled, enable them
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_wstunnel
sudo a2enmod rewrite

# Test configuration
sudo /opt/bitnami/apache/bin/apachectl configtest

# Restart Apache
sudo /opt/bitnami/ctlscript.sh restart apache
```

### Option B: Nginx Configuration (Alternative)

```bash
# Create nginx config
sudo nano /etc/nginx/sites-available/hospital
```

```nginx
# Backend API
server {
    listen 80;
    server_name api.aajminpolyclinic.com.np;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend Application
server {
    listen 80;
    server_name aajminpolyclinic.com.np www.aajminpolyclinic.com.np;
    
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/hospital /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

---

## 🔒 Phase 7: SSL Certificate Setup (30 minutes)

### Step 7.1: Install Certbot
```bash
# Install certbot
sudo apt install -y certbot

# For Apache
sudo apt install -y python3-certbot-apache

# For Nginx
sudo apt install -y python3-certbot-nginx
```

### Step 7.2: Obtain SSL Certificates
```bash
# For Apache
sudo certbot --apache -d aajminpolyclinic.com.np -d www.aajminpolyclinic.com.np -d api.aajminpolyclinic.com.np

# For Nginx
sudo certbot --nginx -d aajminpolyclinic.com.np -d www.aajminpolyclinic.com.np -d api.aajminpolyclinic.com.np

# Test auto-renewal
sudo certbot renew --dry-run
```

### Step 7.3: Update Virtual Host for HTTPS (Apache)
```apache
<VirtualHost *:443>
    ServerName aajminpolyclinic.com.np
    ServerAlias www.aajminpolyclinic.com.np
    
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/aajminpolyclinic.com.np/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/aajminpolyclinic.com.np/privkey.pem
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:3002/
    ProxyPassReverse / http://localhost:3002/
    
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*)           ws://localhost:3002/$1 [P,L]
</VirtualHost>

<VirtualHost *:443>
    ServerName api.aajminpolyclinic.com.np
    
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/aajminpolyclinic.com.np/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/aajminpolyclinic.com.np/privkey.pem
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:3001/
    ProxyPassReverse / http://localhost:3001/
</VirtualHost>

# Redirect HTTP to HTTPS
<VirtualHost *:80>
    ServerName aajminpolyclinic.com.np
    ServerAlias www.aajminpolyclinic.com.np
    Redirect permanent / https://aajminpolyclinic.com.np/
</VirtualHost>

<VirtualHost *:80>
    ServerName api.aajminpolyclinic.com.np
    Redirect permanent / https://api.aajminpolyclinic.com.np/
</VirtualHost>
```

---

## 🔥 Phase 8: Configure Firewall (15 minutes)

```bash
# Check current firewall status
sudo ufw status

# Allow necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Block direct access to application ports (optional)
# Note: Port 3000 is used by existing service - DO NOT BLOCK
sudo ufw deny 3001/tcp
sudo ufw deny 3002/tcp

# Enable firewall (if not already enabled)
sudo ufw enable

# Verify
sudo ufw status verbose
```

---

## 🗄️ Phase 9: Database Migration and Tenant Setup (30 minutes)

### Step 9.1: Run Database Migrations
```bash
cd /opt/hospital-management/backend

# Run migrations
npm run migrate up

# Verify tables
psql -U hospital_user -d multitenant_db -c "\dt"
```

### Step 9.2: Create Tenant for Aajmin Polyclinic
```bash
# Connect to database
psql -U hospital_user -d multitenant_db

-- Create tenant
INSERT INTO tenants (id, name, subdomain, status, created_at, updated_at)
VALUES ('tenant_aajmin', 'Aajmin Polyclinic', 'aajminpolyclinic', 'active', NOW(), NOW());

-- Create tenant schema
CREATE SCHEMA "tenant_aajmin";

-- Run tenant-specific migrations
-- (Your migration scripts should handle this)

-- Create admin user for tenant
INSERT INTO users (email, name, tenant_id, created_at, updated_at)
VALUES ('admin@aajminpolyclinic.com.np', 'Admin User', 'tenant_aajmin', NOW(), NOW());

-- Assign admin role
-- (Based on your role system)

\q
```

---

## 📊 Phase 10: Monitoring and Logging (30 minutes)

### Step 10.1: Setup Log Rotation
```bash
# Create logrotate config
sudo nano /etc/logrotate.d/hospital-management
```

```
/opt/hospital-management/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 bitnami bitnami
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Step 10.2: Setup PM2 Monitoring
```bash
# Install PM2 monitoring (optional)
pm2 install pm2-logrotate

# Configure
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true

# View logs
pm2 logs hospital-backend
pm2 logs hospital-frontend

# Monitor resources
pm2 monit
```

### Step 10.3: Setup Health Checks
```bash
# Create health check script
cat > /opt/hospital-management/health-check.sh << 'EOF'
#!/bin/bash

# Check backend
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
if [ "$BACKEND_STATUS" != "200" ]; then
    echo "Backend is down! Status: $BACKEND_STATUS"
    pm2 restart hospital-backend
fi

# Check frontend
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001)
if [ "$FRONTEND_STATUS" != "200" ]; then
    echo "Frontend is down! Status: $FRONTEND_STATUS"
    pm2 restart hospital-frontend
fi
EOF

chmod +x /opt/hospital-management/health-check.sh

# Add to crontab
crontab -e
# Add: */5 * * * * /opt/hospital-management/health-check.sh >> /opt/hospital-management/logs/health-check.log 2>&1
```

---

## ✅ Phase 11: Testing and Verification (30 minutes)

### Step 11.1: Test Backend API
```bash
# Health check
curl https://api.aajminpolyclinic.com.np/health

# Test authentication
curl -X POST https://api.aajminpolyclinic.com.np/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aajminpolyclinic.com.np","password":"your_password"}'

# Test tenant endpoint
curl https://api.aajminpolyclinic.com.np/api/tenants \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Tenant-ID: tenant_aajmin" \
  -H "X-App-ID: hospital-management" \
  -H "X-API-Key: YOUR_API_KEY"
```

### Step 11.2: Test Frontend Application
```bash
# Access from browser
https://aajminpolyclinic.com.np

# Check console for errors
# Test login functionality
# Test navigation
# Test API calls
```

### Step 11.3: Performance Testing
```bash
# Install Apache Bench (if not present)
sudo apt install -y apache2-utils

# Test backend
ab -n 1000 -c 10 https://api.aajminpolyclinic.com.np/health

# Test frontend
ab -n 100 -c 5 https://aajminpolyclinic.com.np/
```

---

## 🔄 Phase 12: Backup and Recovery Setup (30 minutes)

### Step 12.1: Database Backup Script
```bash
# Create backup script
cat > /opt/hospital-management/backup-db.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/hospital-management/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/multitenant_db_$DATE.sql.gz"

mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U hospital_user -d multitenant_db | gzip > $BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
EOF

chmod +x /opt/hospital-management/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /opt/hospital-management/backup-db.sh >> /opt/hospital-management/logs/backup.log 2>&1
```

### Step 12.2: Application Backup
```bash
# Create app backup script
cat > /opt/hospital-management/backup-app.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/hospital-management/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/app_$DATE.tar.gz"

mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_FILE \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='logs' \
  /opt/hospital-management/backend \
  /opt/hospital-management/frontend

# Keep only last 3 backups
ls -t $BACKUP_DIR/app_*.tar.gz | tail -n +4 | xargs rm -f

echo "App backup completed: $BACKUP_FILE"
EOF

chmod +x /opt/hospital-management/backup-app.sh

# Add to crontab (weekly on Sunday at 3 AM)
crontab -e
# Add: 0 3 * * 0 /opt/hospital-management/backup-app.sh >> /opt/hospital-management/logs/backup.log 2>&1
```

---

## 📝 Phase 13: Documentation and Handover

### Step 13.1: Create Operations Manual
```bash
# Create README
cat > /opt/hospital-management/README.md << 'EOF'
# Hospital Management System - Operations Manual

## Application URLs
- Frontend: https://aajminpolyclinic.com.np
- Backend API: https://api.aajminpolyclinic.com.np

## Common Commands

### Start/Stop Services
```bash
pm2 start ecosystem.config.js
pm2 stop all
pm2 restart all
pm2 reload all  # Zero-downtime restart
```

### View Logs
```bash
pm2 logs
pm2 logs hospital-backend
pm2 logs hospital-frontend
tail -f /opt/hospital-management/logs/backend-error.log
```

### Database Operations
```bash
# Connect to database
psql -U hospital_user -d multitenant_db

# Backup database
/opt/hospital-management/backup-db.sh

# Restore database
gunzip < backup.sql.gz | psql -U hospital_user -d multitenant_db
```

### Update Application
```bash
# Stop services
pm2 stop all

# Pull latest code or upload new files
# ...

# Install dependencies
cd /opt/hospital-management/backend && npm install
cd /opt/hospital-management/frontend && npm install && npm run build

# Run migrations
cd /opt/hospital-management/backend && npm run migrate up

# Start services
pm2 start ecosystem.config.js
```

### Troubleshooting
```bash
# Check service status
pm2 status
systemctl status apache2
systemctl status postgresql

# Check ports
sudo netstat -tulpn | grep LISTEN

# Check logs
pm2 logs --lines 100
journalctl -u apache2 -n 50
```
EOF
```

---

## 🎯 Deployment Checklist

### Pre-Deployment
- [ ] Backup existing server configuration
- [ ] Document existing services and ports
- [ ] Prepare environment variables
- [ ] Build production artifacts locally
- [ ] Test locally before deployment

### Deployment
- [ ] Connect to server and verify access
- [ ] Install required software (Node.js, PM2, PostgreSQL)
- [ ] Create application directories
- [ ] Upload application files
- [ ] Configure environment variables
- [ ] Setup database and run migrations
- [ ] Create tenant for aajmin_polyclinic
- [ ] Configure PM2 and start services
- [ ] Configure reverse proxy (Apache/Nginx)
- [ ] Setup SSL certificates
- [ ] Configure firewall rules

### Post-Deployment
- [ ] Test backend API endpoints
- [ ] Test frontend application
- [ ] Verify SSL certificates
- [ ] Setup monitoring and logging
- [ ] Configure automated backups
- [ ] Document deployment
- [ ] Train team on operations

### Security Checklist
- [ ] Change default passwords
- [ ] Secure database credentials
- [ ] Configure firewall properly
- [ ] Enable SSL/TLS
- [ ] Setup fail2ban (optional)
- [ ] Regular security updates
- [ ] Monitor access logs

---

## 🚨 Rollback Plan

If deployment fails:

```bash
# Stop new services
pm2 stop hospital-backend hospital-frontend
pm2 delete hospital-backend hospital-frontend

# Restore database (if needed)
gunzip < /opt/hospital-management/backups/latest_backup.sql.gz | psql -U hospital_user -d multitenant_db

# Remove application files
rm -rf /opt/hospital-management/backend
rm -rf /opt/hospital-management/frontend

# Restore Apache/Nginx config
sudo rm /opt/bitnami/apache/conf/vhosts/hospital-vhost.conf
sudo /opt/bitnami/ctlscript.sh restart apache
```

---

## 📞 Support Contacts

- **System Admin**: [Your contact]
- **Database Admin**: [Your contact]
- **Application Support**: [Your contact]

---

## 📚 Additional Resources

- PM2 Documentation: https://pm2.keymetrics.io/docs/usage/quick-start/
- Next.js Deployment: https://nextjs.org/docs/deployment
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Let's Encrypt: https://letsencrypt.org/docs/

---

**Estimated Total Time**: 6-8 hours
**Recommended Team Size**: 2 people (1 DevOps, 1 Developer)
**Best Time to Deploy**: Off-peak hours (late evening/early morning)
