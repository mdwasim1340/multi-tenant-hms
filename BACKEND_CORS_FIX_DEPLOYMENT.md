# Backend CORS Fix Deployment Guide

## What Was Fixed

Updated `backend/src/middleware/appAuth.ts` to allow requests from:
- `https://aajminpolyclinic.healthsync.live`
- `http://aajminpolyclinic.healthsync.live`
- All `*.healthsync.live` subdomains

## Deployment Options

### Option 1: Automated Deployment (Recommended)

```powershell
# Run from project root
.\deploy-backend-cors-fix.ps1
```

### Option 2: Manual Deployment via SSH

```bash
# Connect to server
ssh -i n8n/LightsailDefaultKey-ap-south-1.pem ubuntu@65.0.78.75

# Navigate to backend
cd /home/ubuntu/backend

# Pull latest code
git pull origin development

# Install dependencies
npm install

# Build TypeScript
npm run build

# Restart backend service
pm2 restart backend

# Verify status
pm2 status

# Test API
curl http://localhost:3000/health
```

### Option 3: Manual File Update (If Git Pull Fails)

1. **Copy the updated file to server:**
```powershell
scp -i n8n/LightsailDefaultKey-ap-south-1.pem backend/src/middleware/appAuth.ts ubuntu@65.0.78.75:/home/ubuntu/backend/src/middleware/
```

2. **SSH to server and rebuild:**
```bash
ssh -i n8n/LightsailDefaultKey-ap-south-1.pem ubuntu@65.0.78.75
cd /home/ubuntu/backend
npm run build
pm2 restart backend
```

## Verification Steps

### 1. Check Backend Status
```bash
pm2 status
# Should show "backend" as "online"
```

### 2. Test API Health
```bash
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":"..."}
```

### 3. Test CORS from Frontend
Open browser console at `https://aajminpolyclinic.healthsync.live` and check:
- No CORS errors in console
- API requests succeed
- Tenant data loads correctly

### 4. Test Tenant Resolution
```bash
curl http://localhost:3000/tenants/by-subdomain/aajminpolyclinic
# Should return tenant data
```

## Troubleshooting

### Issue: SSH Permission Denied

**Solution 1: Check key permissions**
```powershell
icacls "n8n\LightsailDefaultKey-ap-south-1.pem" /inheritance:r /grant:r "$($env:USERNAME):(R)"
```

**Solution 2: Use PuTTY (Windows)**
1. Convert .pem to .ppk using PuTTYgen
2. Use PuTTY to connect with .ppk key

**Solution 3: Use AWS Lightsail Console**
1. Go to AWS Lightsail Console
2. Click on your instance
3. Click "Connect using SSH" (browser-based terminal)
4. Run the manual deployment commands

### Issue: Git Pull Fails

```bash
# Reset to remote state
cd /home/ubuntu/backend
git fetch origin
git reset --hard origin/development
npm install
npm run build
pm2 restart backend
```

### Issue: Build Fails

```bash
# Clean and rebuild
cd /home/ubuntu/backend
rm -rf dist node_modules
npm install
npm run build
pm2 restart backend
```

### Issue: PM2 Process Not Running

```bash
# Start backend manually
cd /home/ubuntu/backend
pm2 start npm --name "backend" -- start
pm2 save
```

## Changes Made

### File: `backend/src/middleware/appAuth.ts`

**Before:**
```typescript
const ALLOWED_ORIGINS = [
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://10.66.66.8:3001',
  'http://10.66.66.8:3002',
  'http://10.66.66.8:3003',
];

const isValidSubdomainOrigin = (origin: string): boolean => {
  try {
    const url = new URL(origin);
    return url.hostname.endsWith('.localhost') && 
           (url.port === '3001' || url.port === '3002' || url.port === '3003');
  } catch {
    return false;
  }
};
```

**After:**
```typescript
const ALLOWED_ORIGINS = [
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://10.66.66.8:3001',
  'http://10.66.66.8:3002',
  'http://10.66.66.8:3003',
  'https://aajminpolyclinic.healthsync.live', // ✅ Added
  'http://aajminpolyclinic.healthsync.live',  // ✅ Added
];

const isValidSubdomainOrigin = (origin: string): boolean => {
  try {
    const url = new URL(origin);
    if (url.hostname.endsWith('.localhost') && 
        (url.port === '3001' || url.port === '3002' || url.port === '3003')) {
      return true;
    }
    // ✅ Added: Allow *.healthsync.live (production subdomains)
    if (url.hostname.endsWith('.healthsync.live')) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
};
```

## Expected Results

After deployment:
- ✅ Frontend loads without CORS errors
- ✅ Tenant resolution works (subdomain → tenant_id)
- ✅ API calls succeed from frontend
- ✅ Dashboard data loads correctly
- ✅ All features functional

## Next Steps After Deployment

1. **Test the frontend:** https://aajminpolyclinic.healthsync.live
2. **Check browser console:** Should have no CORS errors
3. **Verify tenant data:** Dashboard should show correct tenant info
4. **Test navigation:** All pages should work
5. **Test API calls:** Patient list, appointments, etc.

## Support

If deployment fails, provide:
1. PM2 logs: `pm2 logs backend --lines 50`
2. Backend logs: `tail -f /home/ubuntu/backend/logs/error.log`
3. Browser console errors
4. Network tab showing failed requests
