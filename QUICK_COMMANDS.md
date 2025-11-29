# Quick Commands Reference

## 🚀 Deployment

```powershell
# Deploy from Windows
cd backend
.\deploy.ps1
```

## 🔍 Health Check

```powershell
# Test API
curl https://backend.aajminpolyclinic.com.np/health

# Expected: {"status":"ok"}
```

## 🖥️ SSH Access

```bash
# Connect to server
ssh -i n8n\LightsailDefaultKey-ap-south-1.pem bitnami@65.0.78.75

# Navigate to project
cd /home/bitnami/multi-tenant-backend
```

## 📊 PM2 Commands

```bash
# List all processes
pm2 list

# View logs
pm2 logs multi-tenant-backend

# View last 50 lines
pm2 logs multi-tenant-backend --lines 50

# Monitor resources
pm2 monit

# Restart application
pm2 restart multi-tenant-backend

# Stop application
pm2 stop multi-tenant-backend

# Start application
pm2 start multi-tenant-backend

# Save configuration
pm2 save
```

## 🔄 Manual Deployment

```bash
# On server
cd /home/bitnami/multi-tenant-backend
git pull origin main
npm install --production=false
npm run build
pm2 restart multi-tenant-backend
pm2 logs multi-tenant-backend
```

## 🗄️ Database

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

## 🔧 Troubleshooting

```bash
# Check PM2 status
pm2 status

# Check logs for errors
pm2 logs multi-tenant-backend --err

# Check environment
cat .env | head -20

# Check PostgreSQL
systemctl status postgresql

# Check Nginx
systemctl status nginx

# Restart services
pm2 restart multi-tenant-backend
systemctl restart nginx
systemctl restart postgresql
```

## 📝 File Locations

```bash
# Project directory
/home/bitnami/multi-tenant-backend

# Environment file
/home/bitnami/multi-tenant-backend/.env

# Logs
/home/bitnami/.pm2/logs/

# PM2 config
/home/bitnami/multi-tenant-backend/ecosystem.config.js
```

## 🌐 URLs

- **Production**: https://backend.aajminpolyclinic.com.np
- **Health**: https://backend.aajminpolyclinic.com.np/health
- **n8n**: https://n8n.aajminpolyclinic.com.np

## 📞 Quick Status Check

```bash
# One-liner status check
ssh -i n8n\LightsailDefaultKey-ap-south-1.pem bitnami@65.0.78.75 "pm2 list && curl -s http://localhost:3001/health"
```

---

**Save this file for quick reference!**
