# Hospital Management System - Deployment Quick Reference

## 🎯 Server Details
- **IP**: 65.0.78.75
- **User**: bitnami
- **SSH Key**: `n8n/LightsailDefaultKey-ap-south-1.pem`
- **Domain**: https://aajminpolyclinic.com.np
- **Tenant**: aajmin_polyclinic

## 🔌 Port Allocation
| Port | Service | Status |
|------|---------|--------|
| 80 | Apache/Nginx HTTP | Existing |
| 443 | Apache/Nginx HTTPS | Existing |
| 3000 | **Existing Backend Service** | ⚠️ DO NOT TOUCH |
| 3001 | Hospital Backend API | ← Deploy Here |
| 3002 | Hospital Frontend | ← Deploy Here |
| 3003 | Admin Dashboard | Future |
| 5432 | PostgreSQL | Existing/New |

## 📁 Directory Structure
```
/opt/hospital-management/
├── backend/              # Backend API (Port 3001)
├── frontend/             # Hospital Frontend (Port 3002)
├── logs/                 # Application logs
├── backups/              # Database & app backups
├── ecosystem.config.js   # PM2 configuration
└── README.md            # Operations manual
```

## 🚀 Quick Commands

### Connect to Server
```bash
ssh -i "n8n/LightsailDefaultKey-ap-south-1.pem" bitnami@65.0.78.75
```

### Upload Files
```bash
# Backend
scp -i "n8n/LightsailDefaultKey-ap-south-1.pem" -r backend/* bitnami@65.0.78.75:/opt/hospital-management/backend/

# Frontend
scp -i "n8n/LightsailDefaultKey-ap-south-1.pem" -r hospital-management-system/* bitnami@65.0.78.75:/opt/hospital-management/frontend/
```

### PM2 Management
```bash
# Start services
pm2 start ecosystem.config.js

# Stop services
pm2 stop hospital-backend hospital-frontend

# Restart services
pm2 restart hospital-backend hospital-frontend

# View logs
pm2 logs
pm2 logs hospital-backend --lines 100
pm2 logs hospital-frontend --lines 100

# Monitor
pm2 monit

# Status
pm2 status
```

### Database Operations
```bash
# Connect to database
psql -U hospital_user -d multitenant_db

# Run migrations
cd /opt/hospital-management/backend
npm run migrate up

# Backup database
pg_dump -U hospital_user -d multitenant_db | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore database
gunzip < backup.sql.gz | psql -U hospital_user -d multitenant_db
```

### Apache/Nginx Management
```bash
# Apache (Bitnami)
sudo /opt/bitnami/ctlscript.sh restart apache
sudo /opt/bitnami/ctlscript.sh status apache

# Nginx
sudo systemctl restart nginx
sudo systemctl status nginx

# Test configuration
sudo /opt/bitnami/apache/bin/apachectl configtest  # Apache
sudo nginx -t  # Nginx
```

### Check Application Status
```bash
# Test backend
curl http://localhost:3001/health
curl https://api.aajminpolyclinic.com.np/health

# Test frontend
curl http://localhost:3002
curl https://aajminpolyclinic.com.np

# Check ports
sudo netstat -tulpn | grep -E '3001|3002'

# Check processes
ps aux | grep node
```

### View Logs
```bash
# PM2 logs
pm2 logs --lines 50

# Application logs
tail -f /opt/hospital-management/logs/backend-error.log
tail -f /opt/hospital-management/logs/frontend-error.log

# Apache logs
tail -f /opt/bitnami/apache/logs/api-error.log
tail -f /opt/bitnami/apache/logs/frontend-error.log

# System logs
journalctl -u apache2 -n 50
journalctl -u nginx -n 50
```

## 🔧 Troubleshooting

### Backend Not Starting
```bash
# Check logs
pm2 logs hospital-backend --lines 100

# Check environment variables
pm2 env hospital-backend

# Check port availability
sudo lsof -i :3001

# Restart
pm2 restart hospital-backend
```

### Frontend Not Starting
```bash
# Check logs
pm2 logs hospital-frontend --lines 100

# Check build
cd /opt/hospital-management/frontend
npm run build

# Check port availability
sudo lsof -i :3002

# Restart
pm2 restart hospital-frontend
```

### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U hospital_user -d multitenant_db -h localhost

# Check credentials in .env
cat /opt/hospital-management/backend/.env | grep DATABASE
```

### SSL Certificate Issues
```bash
# Check certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

### Port Conflicts
```bash
# Check what's using a port
sudo lsof -i :3001
sudo netstat -tulpn | grep 3001

# Kill process (if needed)
sudo kill -9 <PID>
```

## 📊 Monitoring

### System Resources
```bash
# CPU and Memory
htop
top

# Disk usage
df -h

# Memory usage
free -h

# Process list
pm2 list
```

### Application Health
```bash
# Backend health check
curl https://api.aajminpolyclinic.com.np/health

# Frontend check
curl -I https://aajminpolyclinic.com.np

# Database check
psql -U hospital_user -d multitenant_db -c "SELECT COUNT(*) FROM tenants;"
```

## 🔄 Update Procedure

### Update Backend
```bash
# Stop service
pm2 stop hospital-backend

# Backup current version
cd /opt/hospital-management
tar -czf backend-backup-$(date +%Y%m%d).tar.gz backend/

# Upload new files
# (from local machine)
scp -i "n8n/LightsailDefaultKey-ap-south-1.pem" -r backend/* bitnami@65.0.78.75:/opt/hospital-management/backend/

# Install dependencies
cd /opt/hospital-management/backend
npm install --production

# Run migrations
npm run migrate up

# Start service
pm2 start hospital-backend
pm2 save
```

### Update Frontend
```bash
# Stop service
pm2 stop hospital-frontend

# Backup current version
cd /opt/hospital-management
tar -czf frontend-backup-$(date +%Y%m%d).tar.gz frontend/

# Upload new files
# (from local machine)
scp -i "n8n/LightsailDefaultKey-ap-south-1.pem" -r hospital-management-system/* bitnami@65.0.78.75:/opt/hospital-management/frontend/

# Install dependencies and build
cd /opt/hospital-management/frontend
npm install --production
npm run build

# Start service
pm2 start hospital-frontend
pm2 save
```

## 🆘 Emergency Procedures

### Rollback Application
```bash
# Stop services
pm2 stop hospital-backend hospital-frontend

# Restore from backup
cd /opt/hospital-management
tar -xzf backend-backup-YYYYMMDD.tar.gz
tar -xzf frontend-backup-YYYYMMDD.tar.gz

# Start services
pm2 start ecosystem.config.js
```

### Rollback Database
```bash
# Stop backend
pm2 stop hospital-backend

# Restore database
gunzip < /opt/hospital-management/backups/multitenant_db_YYYYMMDD.sql.gz | psql -U hospital_user -d multitenant_db

# Start backend
pm2 start hospital-backend
```

### Complete Service Restart
```bash
# Stop all hospital services
pm2 stop hospital-backend hospital-frontend

# Restart database
sudo systemctl restart postgresql

# Restart web server
sudo /opt/bitnami/ctlscript.sh restart apache  # or nginx

# Start hospital services
pm2 start ecosystem.config.js

# Verify
pm2 status
curl https://aajminpolyclinic.com.np
```

## 📞 Support Checklist

When reporting issues, provide:
- [ ] PM2 status: `pm2 status`
- [ ] Recent logs: `pm2 logs --lines 100`
- [ ] System resources: `free -h && df -h`
- [ ] Port status: `sudo netstat -tulpn | grep -E '3001|3002'`
- [ ] Error messages from browser console
- [ ] Steps to reproduce the issue

## 🔐 Security Notes

- ✅ Never commit `.env` files to git
- ✅ Rotate API keys regularly
- ✅ Keep SSL certificates up to date
- ✅ Monitor access logs for suspicious activity
- ✅ Keep system packages updated
- ✅ Use strong database passwords
- ✅ Restrict SSH access to known IPs (optional)

## 📚 Important Files

| File | Location | Purpose |
|------|----------|---------|
| Backend .env | `/opt/hospital-management/backend/.env` | Backend configuration |
| Frontend .env | `/opt/hospital-management/frontend/.env.local` | Frontend configuration |
| PM2 Config | `/opt/hospital-management/ecosystem.config.js` | Process management |
| Apache VHost | `/opt/bitnami/apache/conf/vhosts/hospital-vhost.conf` | Web server config |
| SSL Certs | `/etc/letsencrypt/live/aajminpolyclinic.com.np/` | SSL certificates |
| Backups | `/opt/hospital-management/backups/` | Database backups |
| Logs | `/opt/hospital-management/logs/` | Application logs |

---

**Last Updated**: November 28, 2025  
**Version**: 1.0  
**Deployment Status**: Planning Phase
