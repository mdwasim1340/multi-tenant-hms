# Final Deployment Guide - CORS Fix

## ✅ What's Ready

1. **CORS Fix Committed**: Changes are in `backend/src/middleware/appAuth.ts`
2. **Pushed to Git**: Available in https://github.com/mdwasim1340/multi-tenant-backend-only.git
3. **Changes Include**:
   - Added `https://aajminpolyclinic.healthsync.live` to ALLOWED_ORIGINS
   - Added `http://aajminpolyclinic.healthsync.live` to ALLOWED_ORIGINS
   - Updated subdomain validation to allow all `*.healthsync.live` domains

## 🚀 Deploy Now (AWS Console Method)

### Step 1: Access Server
1. Go to: **https://lightsail.aws.amazon.com/**
2. Sign in to your AWS account
3. Click on your instance
4. Click **"Connect using SSH"** button (orange button)

### Step 2: Navigate to Backend
```bash
cd ~/multi-tenant-backend/backend
```

### Step 3: Check Current Status
```bash
pwd
git status
git remote -v
```

### Step 4: Deploy (Copy & Paste All)
```bash
# Backup config files
cp .env.production .env.production.backup 2>/dev/null || true
cp ecosystem.config.js ecosystem.config.js.backup 2>/dev/null || true

# Pull latest code
git fetch origin
git reset --hard origin/main

# Restore config files
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

### Step 5: Verify Deployment
Expected output:
```
✅ Build successful
✅ PM2 shows backend as "online"
✅ Health check returns: {"status":"ok","timestamp":"..."}
```

## 🧪 Test Frontend

1. Open: **https://aajminpolyclinic.healthsync.live**
2. Open browser console (F12)
3. Check for errors:
   - ❌ Before: "CORS policy: No 'Access-Control-Allow-Origin' header"
   - ✅ After: No CORS errors, API calls succeed

## 📁 Server Structure

```
/home/ubuntu/
└── multi-tenant-backend/
    ├── backend/              ← Backend API (separate git repo)
    │   ├── src/
    │   │   └── middleware/
    │   │       └── appAuth.ts  ← CORS fix here
    │   ├── dist/
    │   ├── .env.production
    │   └── ecosystem.config.js
    └── hospital-frontend/    ← Frontend (Next.js build)
        └── .next/
```

## 🔧 Troubleshooting

### Issue: "No such directory"
```bash
# Find the backend
find /home -name "backend" -type d 2>/dev/null
# Then cd to the correct path
```

### Issue: Git pull fails
```bash
# Force reset to remote
cd ~/multi-tenant-backend/backend
git fetch origin
git reset --hard origin/main
```

### Issue: Build fails
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Issue: PM2 not restarting
```bash
# Check PM2 list
pm2 list

# Restart by ID if needed
pm2 restart 0

# Or restart all
pm2 restart all

# Check logs
pm2 logs backend --lines 20
```

### Issue: Still seeing CORS errors
```bash
# Verify the changes are in the file
cd ~/multi-tenant-backend/backend
grep -n "healthsync.live" src/middleware/appAuth.ts

# Should show:
# Line 8: 'https://aajminpolyclinic.healthsync.live',
# Line 9: 'http://aajminpolyclinic.healthsync.live',
# Line 21: if (url.hostname.endsWith('.healthsync.live')) {
```

## 📊 What This Fixes

### Before (CORS Blocked)
```
Console Error:
Access to XMLHttpRequest at 'http://65.0.78.75:3000/api/tenants/by-subdomain/aajminpolyclinic'
from origin 'https://aajminpolyclinic.healthsync.live' has been blocked by CORS policy
```

### After (Working)
```
✅ API requests succeed
✅ Tenant data loads
✅ Dashboard shows correct information
✅ All features functional
```

## 🎯 One-Line Deploy (Copy & Paste)

```bash
cd ~/multi-tenant-backend/backend && cp .env.production .env.backup 2>/dev/null; cp ecosystem.config.js ecosystem.backup 2>/dev/null; git fetch origin && git reset --hard origin/main && cp .env.backup .env.production 2>/dev/null; cp ecosystem.backup ecosystem.config.js 2>/dev/null; npm run build && pm2 restart backend && echo "✅ Deployed!" && pm2 status
```

## 📝 Summary

- **Local Changes**: ✅ Complete
- **Git Commit**: ✅ Complete  
- **Git Push**: ✅ Complete
- **Server Deployment**: ⏳ Pending (run commands above)
- **Testing**: ⏳ Pending (after deployment)

## 🆘 If SSH Key Issues Persist

The SSH key authentication is failing. The AWS Console method is the most reliable:
1. Use browser-based SSH (no key needed)
2. Direct access to server
3. Copy/paste commands
4. Immediate feedback

**AWS Console SSH is the recommended method for this deployment.**
