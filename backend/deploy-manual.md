# Manual Deployment Guide

## Prerequisites

1. **SSH Access**: Ensure you have the SSH key at `n8n/LightsailDefaultKey-ap-south-1.pem`
2. **Server Access**: AWS Lightsail instance at `65.0.78.75`
3. **GitHub Access**: Repository at `https://github.com/mdwasim1340/multi-tenant-backend-only.git`

## Production Server Details

- **IP**: 65.0.78.75
- **User**: bitnami
- **SSH Key**: `n8n/LightsailDefaultKey-ap-south-1.pem`
- **Project Directory**: `/home/bitnami/multi-tenant-backend`
- **Domain**: https://backend.aajminpolyclinic.com.np

## Step-by-Step Deployment

### 1. Connect to Server

```bash
# Set correct permissions for SSH key
chmod 400 n8n/LightsailDefaultKey-ap-south-1.pem

# Connect to server
ssh -i n8n/LightsailDefaultKey-ap-south-1.pem bitnami@65.0.78.75
```

### 2. Navigate to Project Directory

```bash
cd /home/bitnami/multi-tenant-backend
```

### 3. Pull Latest Changes

```bash
# Fetch and pull from GitHub
git fetch origin
git pull origin main
```

### 4. Install Dependencies

```bash
# Install all dependencies (including dev dependencies for build)
npm install --production=false
```

### 5. Build TypeScript

```bash
# Compile TypeScript to JavaScript
npm run build
```

### 6. Configure Environment

```bash
# Copy production environment template
cp .env.production .env

# Edit environment file with production credentials
nano .env
```

**Important Environment Variables to Update:**

```bash
# Database
DB_PASSWORD=YOUR_PRODUCTION_DB_PASSWORD

# Security
JWT_SECRET=GENERATE_STRONG_SECRET_HERE

# CORS (add production frontend URLs)
ALLOWED_ORIGINS=https://hospital.aajminpolyclinic.com.np,https://admin.aajminpolyclinic.com.np
```

**Generate JWT Secret:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 7. Setup PM2 (First Time Only)

```bash
# Install PM2 globally if not installed
npm install -g pm2

# Setup PM2 to start on system boot
pm2 startup

# Follow the command output instructions
```

### 8. Start Application

```bash
# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js --env production --only backend-api-prod

# Save PM2 configuration
pm2 save
```

### 9. Verify Deployment

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs backend-api-prod

# Monitor in real-time
pm2 monit
```

### 10. Test API

```bash
# Test health endpoint
curl https://backend.aajminpolyclinic.com.np/health

# Expected response:
# {"status":"ok","timestamp":"..."}
```

## Common PM2 Commands

```bash
# View all processes
pm2 list

# View logs
pm2 logs backend-api-prod

# View specific log lines
pm2 logs backend-api-prod --lines 100

# Restart application
pm2 restart backend-api-prod

# Stop application
pm2 stop backend-api-prod

# Delete process
pm2 delete backend-api-prod

# Monitor resources
pm2 monit

# Save current configuration
pm2 save

# Resurrect saved processes
pm2 resurrect
```

## Database Setup (First Time Only)

### 1. Install PostgreSQL

```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create Database

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE multitenant_db;
CREATE USER postgres WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE multitenant_db TO postgres;
\q
```

### 3. Run Migrations

```bash
cd /home/bitnami/multi-tenant-backend

# Run database migrations
npm run migrate up
```

## Nginx Configuration (If Not Already Setup)

### 1. Install Nginx

```bash
sudo apt update
sudo apt install nginx -y
```

### 2. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/backend
```

**Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name backend.aajminpolyclinic.com.np;

    location / {
        proxy_pass http://localhost:3000;
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

### 3. Enable Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/backend /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 4. Setup SSL with Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d backend.aajminpolyclinic.com.np

# Auto-renewal is configured automatically
```

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs backend-api-prod --lines 50

# Check if port is in use
sudo lsof -i :3000

# Check environment variables
cat .env
```

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
psql -U postgres -d multitenant_db -h localhost

# Check database logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Nginx Issues

```bash
# Check Nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Memory Issues

```bash
# Check memory usage
free -h

# Check PM2 memory
pm2 monit

# Restart with memory limit
pm2 restart backend-api-prod --max-memory-restart 1G
```

## Rollback Procedure

If deployment fails:

```bash
# Stop current process
pm2 stop backend-api-prod

# Checkout previous commit
git log --oneline -10
git checkout <previous-commit-hash>

# Rebuild
npm install
npm run build

# Restart
pm2 restart backend-api-prod
```

## Monitoring

### Setup Monitoring

```bash
# Install PM2 monitoring (optional)
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Health Checks

Create a cron job for health checks:

```bash
# Edit crontab
crontab -e

# Add health check (every 5 minutes)
*/5 * * * * curl -f https://backend.aajminpolyclinic.com.np/health || pm2 restart backend-api-prod
```

## Security Checklist

- [ ] SSH key permissions set to 400
- [ ] Strong database password configured
- [ ] JWT secret generated and configured
- [ ] Firewall configured (allow only 80, 443, 22)
- [ ] SSL certificate installed
- [ ] Environment variables secured
- [ ] Database backups configured
- [ ] PM2 logs rotation enabled
- [ ] CORS origins properly configured
- [ ] AWS credentials secured

## Support

For issues or questions:
1. Check logs: `pm2 logs backend-api-prod`
2. Review this guide
3. Check GitHub repository issues
4. Contact system administrator
