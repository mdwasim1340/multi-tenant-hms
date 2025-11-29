# Quick Deploy Commands - Copy & Paste

## Access Server
1. Go to: https://lightsail.aws.amazon.com/
2. Click your instance → "Connect using SSH"

## Find Backend
```bash
# Find backend directory
find /home -name "backend" -type d 2>/dev/null
find /var -name "backend" -type d 2>/dev/null

# Or check common locations
ls -la ~/
ls -la /var/www/
ls -la /opt/
```

## Deploy (Copy All Lines) - HANDLES MERGE CONFLICTS
```bash
# Navigate to backend (adjust path if needed)
cd ~/backend || cd /var/www/backend || cd /opt/backend

# Backup local config files
cp .env.production .env.production.backup 2>/dev/null || true
cp ecosystem.config.js ecosystem.config.js.backup 2>/dev/null || true

# Stash local changes (preserves .env.production and ecosystem.config.js)
git stash

# Pull latest code
git pull origin development

# Restore local config files
cp .env.production.backup .env.production 2>/dev/null || true
cp ecosystem.config.js.backup ecosystem.config.js 2>/dev/null || true

# Build
npm run build

# Restart
pm2 restart backend

# Verify
pm2 status
curl http://localhost:3000/health
```

## Alternative: Force Pull (Simpler)
```bash
cd ~/backend || cd /var/www/backend || cd /opt/backend

# Backup important files
cp .env.production .env.production.backup 2>/dev/null || true
cp ecosystem.config.js ecosystem.config.js.backup 2>/dev/null || true

# Force pull (overwrites local changes except backups)
git fetch origin
git reset --hard origin/development

# Restore config files
cp .env.production.backup .env.production 2>/dev/null || true
cp ecosystem.config.js.backup ecosystem.config.js 2>/dev/null || true

# Build and restart
npm install
npm run build
pm2 restart backend
pm2 status
```

## If You See Merge Conflict Error
```bash
# This means .env.production or ecosystem.config.js exist locally
# Solution: Move them temporarily
cd ~/backend
mv .env.production .env.production.backup
mv ecosystem.config.js ecosystem.config.js.backup

# Now pull
git pull origin development

# Restore files
mv .env.production.backup .env.production
mv ecosystem.config.js.backup ecosystem.config.js

# Build and restart
npm run build
pm2 restart backend
```

## Check Logs
```bash
pm2 logs backend --lines 20
```

## Test Frontend
Open: https://aajminpolyclinic.healthsync.live
Check browser console for CORS errors (should be none)

## What This Fixes
- Adds `https://aajminpolyclinic.healthsync.live` to ALLOWED_ORIGINS
- Adds `http://aajminpolyclinic.healthsync.live` to ALLOWED_ORIGINS  
- Allows all `*.healthsync.live` subdomains
- Fixes CORS blocking API requests from frontend
