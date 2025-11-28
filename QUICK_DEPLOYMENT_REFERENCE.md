# Quick Deployment Reference Card

## 🎯 One-Command Deployment

```bash
# Automated deployment to production
./backend/deploy.sh
```

## 🔑 SSH Access

```bash
# Connect to production server
ssh -i n8n/LightsailDefaultKey-ap-south-1.pem bitnami@65.0.78.75
```

## 📊 Health Check

```bash
# Check deployment status
./backend/scripts/check-deployment.sh

# Or manually
curl https://backend.aajminpolyclinic.com.np/health
```

## 🔄 PM2 Commands (On Server)

```bash
pm2 list                    # List processes
pm2 logs backend-api-prod   # View logs
pm2 restart backend-api-prod # Restart app
pm2 monit                   # Monitor resources
```

## 🗄️ Database Commands (On Server)

```bash
# Connect to database
psql -U postgres -d multitenant_db

# Run migrations
npm run migrate up

# Backup database
pg_dump -U postgres multitenant_db > backup.sql
```

## 🚨 Emergency Procedures

### Application Down
```bash
ssh -i n8n/LightsailDefaultKey-ap-south-1.pem bitnami@65.0.78.75
cd /home/bitnami/multi-tenant-backend
pm2 restart backend-api-prod
pm2 logs backend-api-prod --lines 50
```

### Rollback to Previous Version
```bash
git log --oneline -10
git checkout <previous-commit>
npm install && npm run build
pm2 restart backend-api-prod
```

### Database Issues
```bash
sudo systemctl status postgresql
sudo systemctl restart postgresql
psql -U postgres -d multitenant_db
```

## 📝 Environment Setup

### Development
```bash
cp backend/.env.development backend/.env
cd backend && npm run dev
```

### Production (First Time)
```bash
# On server
cp .env.production .env
nano .env  # Update credentials
npm run build
pm2 start ecosystem.config.js --env production
```

## 🔐 Security Checklist

- [ ] SSH key permissions: `chmod 400 n8n/LightsailDefaultKey-ap-south-1.pem`
- [ ] Strong DB password in `.env`
- [ ] JWT secret generated
- [ ] CORS origins configured
- [ ] SSL certificate active

## 📞 Quick Links

- **Backend**: https://backend.aajminpolyclinic.com.np
- **Health**: https://backend.aajminpolyclinic.com.np/health
- **GitHub**: https://github.com/mdwasim1340/multi-tenant-backend-only.git
- **Server IP**: 65.0.78.75

## 🛠️ Common Issues

| Issue | Solution |
|-------|----------|
| Port 3000 in use | `sudo lsof -i :3000` then kill process |
| PM2 not found | `sudo npm install -g pm2` |
| Database connection failed | Check PostgreSQL: `sudo systemctl status postgresql` |
| Nginx error | `sudo nginx -t` then `sudo systemctl restart nginx` |
| SSL expired | `sudo certbot renew` |

---

**Full Guide**: See `DEPLOYMENT_GUIDE.md`
