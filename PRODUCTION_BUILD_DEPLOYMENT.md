# Production Build Deployment Guide

## Issue Encountered

The server froze when attempting to build Next.js on the Lightsail instance due to insufficient memory. Building Next.js requires significant RAM (2GB+), but the Lightsail instance appears to have limited resources.

## Solution: Build Locally, Deploy Production Build

### Step 1: Build Locally (Windows)

```powershell
# Navigate to frontend directory
cd hospital-management-system

# Build for production
npm run build

# Verify build completed
ls .next/
```

**Expected output:**
- `.next/static/` folder with hashed assets
- `.next/server/` folder with server components
- `BUILD_ID` file

### Step 2: Stop Server Build Process (If Frozen)

**Option A: Via AWS Lightsail Console**
1. Go to AWS Lightsail Console
2. Select your instance
3. Click "Reboot" to restart the server

**Option B: Wait for Recovery**
- The server may recover after the build process times out (10-15 minutes)

### Step 3: Upload Production Build

```powershell
# Remove old .next folder on server
ssh -i "n8n\LightsailDefaultKey-ap-south-1.pem" bitnami@65.0.78.75 "rm -rf /opt/hospital-management/frontend/.next"

# Upload new production build
scp -i "n8n\LightsailDefaultKey-ap-south-1.pem" -r hospital-management-system/.next bitnami@65.0.78.75:/opt/hospital-management/frontend/
```

### Step 4: Restart Frontend Service

```powershell
ssh -i "n8n\LightsailDefaultKey-ap-south-1.pem" bitnami@65.0.78.75 "pm2 restart hospital-frontend"
```

### Step 5: Verify Deployment

```powershell
# Check PM2 status
ssh -i "n8n\LightsailDefaultKey-ap-south-1.pem" bitnami@65.0.78.75 "pm2 status"

# Check logs
ssh -i "n8n\LightsailDefaultKey-ap-south-1.pem" bitnami@65.0.78.75 "pm2 logs hospital-frontend --lines 20"

# Test frontend
curl -I -k https://65.0.78.75
```

## Complete Deployment Script

```powershell
# production-deploy.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== Production Build & Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build locally
Write-Host "Step 1: Building production bundle..." -ForegroundColor Yellow
cd hospital-management-system
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}
cd ..
Write-Host "✓ Build completed" -ForegroundColor Green
Write-Host ""

# Step 2: Backup old build
Write-Host "Step 2: Backing up old build on server..." -ForegroundColor Yellow
ssh -i "n8n\LightsailDefaultKey-ap-south-1.pem" bitnami@65.0.78.75 "cd /opt/hospital-management/frontend && mv .next .next.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true"
Write-Host "✓ Backup completed" -ForegroundColor Green
Write-Host ""

# Step 3: Upload new build
Write-Host "Step 3: Uploading production build..." -ForegroundColor Yellow
scp -i "n8n\LightsailDefaultKey-ap-south-1.pem" -r hospital-management-system/.next bitnami@65.0.78.75:/opt/hospital-management/frontend/
Write-Host "✓ Upload completed" -ForegroundColor Green
Write-Host ""

# Step 4: Restart service
Write-Host "Step 4: Restarting frontend service..." -ForegroundColor Yellow
ssh -i "n8n\LightsailDefaultKey-ap-south-1.pem" bitnami@65.0.78.75 "pm2 restart hospital-frontend"
Start-Sleep -Seconds 3
Write-Host "✓ Service restarted" -ForegroundColor Green
Write-Host ""

# Step 5: Verify
Write-Host "Step 5: Verifying deployment..." -ForegroundColor Yellow
ssh -i "n8n\LightsailDefaultKey-ap-south-1.pem" bitnami@65.0.78.75 "pm2 status | grep hospital-frontend"
Write-Host ""

Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host "Frontend URL: https://65.0.78.75" -ForegroundColor Cyan
Write-Host ""
```

## Why This Approach?

### Memory Requirements
- **Next.js Build**: Requires 2-4GB RAM
- **Lightsail Instance**: Likely 1GB RAM (smallest tier)
- **Result**: Server freezes during build

### Benefits of Local Build
1. ✅ Uses your local machine's resources
2. ✅ Faster build times
3. ✅ Server remains responsive
4. ✅ Can verify build before deployment
5. ✅ Consistent builds across deployments

## Alternative: Upgrade Server

If you want to build on the server:

### Option 1: Add Swap Space
```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Option 2: Upgrade Lightsail Instance
- Upgrade to 2GB RAM instance ($10/month)
- Or 4GB RAM instance ($20/month)
- Provides enough memory for builds

## Troubleshooting

### Server Still Frozen
```powershell
# Reboot via AWS Console
# Or wait 15-20 minutes for recovery
```

### Upload Fails
```powershell
# Check server is responsive
ssh -i "n8n\LightsailDefaultKey-ap-south-1.pem" bitnami@65.0.78.75 "echo 'OK'"

# Check disk space
ssh -i "n8n\LightsailDefaultKey-ap-south-1.pem" bitnami@65.0.78.75 "df -h"
```

### Frontend Still Shows 404s
```powershell
# Verify BUILD_ID matches
ssh -i "n8n\LightsailDefaultKey-ap-south-1.pem" bitnami@65.0.78.75 "cat /opt/hospital-management/frontend/.next/BUILD_ID"

# Check static files exist
ssh -i "n8n\LightsailDefaultKey-ap-south-1.pem" bitnami@65.0.78.75 "ls -la /opt/hospital-management/frontend/.next/static/"

# Restart PM2
ssh -i "n8n\LightsailDefaultKey-ap-south-1.pem" bitnami@65.0.78.75 "pm2 restart hospital-frontend"
```

## Next Steps

1. **Wait for server recovery** (or reboot via AWS Console)
2. **Run the production deployment script**
3. **Verify all assets load correctly**
4. **Configure DNS** to point domain to server

---

*This guide ensures reliable deployments without server resource issues.*
