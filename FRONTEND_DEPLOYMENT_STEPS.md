# Frontend Deployment - Quick Steps

**Server**: 65.0.78.75  
**Backend**: Already deployed on port 3001  
**Frontend**: Deploy on port 3002  
**SSL**: Cloudflare (no Let's Encrypt needed)

---

## 🚀 Quick Deployment (30 minutes)

### Step 1: Build Frontend Locally (5 min)

```powershell
# On your Windows machine
cd hospital-management-system

# Install dependencies
npm install --production

# Build for production
npm run build

# Verify .next folder created
ls .next
```

### Step 2: Create Environment File (2 min)

Create `hospital-management-system/.env.production`:

```env
NEXT_PUBLIC_API_URL=https://api.aajminpolyclinic.com.np
NEXT_PUBLIC_API_KEY=your_hospital_api_key_here
PORT=3002
NODE_ENV=production
```

### Step 3: Upload Frontend to Server (5 min)

```powershell
# Upload frontend files
scp -i "n8n/LightsailDefaultKey-ap-south-1.pem" -r hospital-management-system/* bitnami@65.0.78.75:/opt/hospital-management/frontend/

# Upload deployment script
scp -i "n8n/LightsailDefaultKey-ap-south-1.pem" deploy-frontend-only.sh bitnami@65.0.78.75:~/
```

### Step 4: Connect to Server (1 min)

```powershell
ssh -i "n8n/LightsailDefaultKey-ap-south-1.pem" bitnami@65.0.78.75
```

### Step 5: Verify Backend is Running (2 min)

```bash
# Check backend status
pm2 list

# Test backend
curl http://localhost:3001/health

# Should return: {"status":"ok"} or similar
```

### Step 6: Run Deployment Script (10 min)

```bash
# Make script executable
chmod +x ~/deploy-frontend-only.sh

# Run deployment
./deploy-frontend-only.sh
```

The script will:
- ✅ Verify backend is running
- ✅ Check port 3002 availability
- ✅ Verify frontend files
- ✅ Configure PM2
- ✅ Start frontend service
- ✅ Configure Apache reverse proxy
- ✅ Test all endpoints

### Step 7: Verify Deployment (5 min)

```bash
# Check PM2 status
pm2 status

# Should show:
# hospital-backend  | online
# hospital-frontend | online

# Test frontend locally
curl http://localhost:3002

# View logs
pm2 logs hospital-frontend --lines 20

# Monitor in real-time
pm2 monit
```

### Step 8: Configure Cloudflare (5 min)

1. **DNS Records** (if not already set):
   ```
   Type: A
   Name: @
   Content: 65.0.78.75
   Proxy: Enabled (orange cloud)

   Type: A
   Name: www
   Content: 65.0.78.75
   Proxy: Enabled (orange cloud)

   Type: A
   Name: api
   Content: 65.0.78.75
   Proxy: Enabled (orange cloud)
   ```

2. **SSL/TLS Settings**:
   - Go to SSL/TLS → Overview
   - Set to **"Full"** or **"Full (strict)"**
   - NOT "Flexible" (this will cause redirect loops)

3. **Always Use HTTPS**:
   - Go to SSL/TLS → Edge Certificates
   - Enable "Always Use HTTPS"

### Step 9: Test Live Site (2 min)

```bash
# From your local machine or server
curl https://aajminpolyclinic.com.np
curl https://api.aajminpolyclinic.com.np/health

# Or open in browser:
# https://aajminpolyclinic.com.np
```

---

## 🔧 Manual Deployment (If Script Fails)

### Manual Step 1: Install Dependencies

```bash
cd /opt/hospital-management/frontend
npm install --production
```

### Manual Step 2: Create/Verify .env.local

```bash
cat > /opt/hospital-management/frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=https://api.aajminpolyclinic.com.np
NEXT_PUBLIC_API_KEY=your_api_key_here
PORT=3002
NODE_ENV=production
EOF
```

### Manual Step 3: Test Frontend

```bash
cd /opt/hospital-management/frontend
npm start -- -p 3002

# Press Ctrl+C after verifying it starts
```

### Manual Step 4: Create PM2 Config

```bash
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
      autorestart: true,
      max_memory_restart: '1G'
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
      autorestart: true,
      max_memory_restart: '1G'
    }
  ]
};
EOF
```

### Manual Step 5: Start with PM2

```bash
cd /opt/hospital-management
pm2 start ecosystem.config.js --only hospital-frontend
pm2 save
```

### Manual Step 6: Configure Apache

```bash
sudo nano /opt/bitnami/apache/conf/vhosts/hospital-vhost.conf
```

Add this content:

```apache
# Backend API
<VirtualHost *:80>
    ServerName api.aajminpolyclinic.com.np
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:3001/
    ProxyPassReverse / http://localhost:3001/
    
    RequestHeader set X-Forwarded-Proto "https"
    
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
    
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*)           ws://localhost:3002/$1 [P,L]
    
    RequestHeader set X-Forwarded-Proto "https"
    
    ErrorLog /opt/bitnami/apache/logs/frontend-error.log
    CustomLog /opt/bitnami/apache/logs/frontend-access.log combined
</VirtualHost>
```

### Manual Step 7: Restart Apache

```bash
# Test configuration
sudo /opt/bitnami/apache/bin/apachectl configtest

# Restart Apache
sudo /opt/bitnami/ctlscript.sh restart apache
```

---

## ✅ Verification Checklist

- [ ] Backend responding: `curl http://localhost:3001/health`
- [ ] Frontend responding: `curl http://localhost:3002`
- [ ] PM2 shows both services online: `pm2 status`
- [ ] No errors in logs: `pm2 logs --lines 20`
- [ ] Apache configuration valid: `sudo /opt/bitnami/apache/bin/apachectl configtest`
- [ ] Apache running: `sudo /opt/bitnami/ctlscript.sh status apache`
- [ ] Cloudflare DNS configured
- [ ] Cloudflare SSL set to "Full"
- [ ] Site accessible: https://aajminpolyclinic.com.np
- [ ] API accessible: https://api.aajminpolyclinic.com.np/health

---

## 🐛 Troubleshooting

### Frontend Won't Start

```bash
# Check logs
pm2 logs hospital-frontend --lines 50

# Check if port is in use
sudo lsof -i :3002

# Check .next build exists
ls -la /opt/hospital-management/frontend/.next

# Rebuild if needed
cd /opt/hospital-management/frontend
npm run build
```

### Can't Access via Domain

```bash
# Check Apache is running
sudo /opt/bitnami/ctlscript.sh status apache

# Check Apache logs
tail -f /opt/bitnami/apache/logs/frontend-error.log

# Test locally first
curl -H "Host: aajminpolyclinic.com.np" http://localhost

# Check Cloudflare DNS
nslookup aajminpolyclinic.com.np
```

### API Calls Failing from Frontend

1. Check NEXT_PUBLIC_API_URL in .env.local
2. Verify Cloudflare SSL is "Full" not "Flexible"
3. Check CORS headers in backend
4. Check browser console for errors

### 502 Bad Gateway

```bash
# Backend might be down
pm2 restart hospital-backend

# Check backend logs
pm2 logs hospital-backend

# Test backend directly
curl http://localhost:3001/health
```

---

## 📊 Post-Deployment

### Monitor Services

```bash
# Real-time monitoring
pm2 monit

# Check status
pm2 status

# View logs
pm2 logs

# Restart if needed
pm2 restart hospital-frontend
```

### Update Frontend

```bash
# Stop service
pm2 stop hospital-frontend

# Upload new files
# (from local machine)

# Rebuild
cd /opt/hospital-management/frontend
npm install --production
npm run build

# Start service
pm2 start hospital-frontend
```

---

## 📞 Quick Commands Reference

```bash
# PM2
pm2 status
pm2 logs hospital-frontend
pm2 restart hospital-frontend
pm2 stop hospital-frontend
pm2 start hospital-frontend

# Apache
sudo /opt/bitnami/ctlscript.sh status apache
sudo /opt/bitnami/ctlscript.sh restart apache
sudo /opt/bitnami/apache/bin/apachectl configtest

# Testing
curl http://localhost:3001/health  # Backend
curl http://localhost:3002          # Frontend
curl https://aajminpolyclinic.com.np  # Live site

# Logs
pm2 logs --lines 50
tail -f /opt/bitnami/apache/logs/frontend-error.log
tail -f /opt/hospital-management/logs/frontend-error.log
```

---

**Ready to deploy? Start with Step 1!** 🚀
