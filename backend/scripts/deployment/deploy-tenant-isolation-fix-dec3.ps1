# Tenant Isolation Security Fix Deployment Script
# December 3, 2025

$ErrorActionPreference = "Stop"

Write-Host "🔒 Tenant Isolation Security Fix Deployment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$SERVER_IP = "13.127.xxx.xxx"  # Replace with actual IP
$SERVER_USER = "ubuntu"
$TIMESTAMP = Get-Date -Format "yyyyMMdd-HHmmss"

# Step 1: Build Backend
Write-Host "📦 Step 1: Building Backend..." -ForegroundColor Yellow
Set-Location backend
if (Test-Path "dist") {
    Remove-Item -Recurse -Force dist
}
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend built successfully" -ForegroundColor Green
Set-Location ..

# Step 2: Build Frontend
Write-Host ""
Write-Host "📦 Step 2: Building Frontend..." -ForegroundColor Yellow
Set-Location hospital-management-system
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
}
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend built successfully" -ForegroundColor Green
Set-Location ..

# Step 3: Create Deployment Packages
Write-Host ""
Write-Host "📦 Step 3: Creating Deployment Packages..." -ForegroundColor Yellow

# Backend package
Set-Location backend
tar -czf "../backend-tenant-fix-$TIMESTAMP.tar.gz" dist/ package.json package-lock.json
Set-Location ..
Write-Host "✅ Backend package created: backend-tenant-fix-$TIMESTAMP.tar.gz" -ForegroundColor Green

# Frontend package
Set-Location hospital-management-system
tar -czf "../frontend-tenant-fix-$TIMESTAMP.tar.gz" .next/ package.json package-lock.json public/ next.config.js
Set-Location ..
Write-Host "✅ Frontend package created: frontend-tenant-fix-$TIMESTAMP.tar.gz" -ForegroundColor Green

# Step 4: Upload to Server
Write-Host ""
Write-Host "📤 Step 4: Uploading to Server..." -ForegroundColor Yellow
Write-Host "Server: $SERVER_USER@$SERVER_IP" -ForegroundColor Cyan

scp "backend-tenant-fix-$TIMESTAMP.tar.gz" "${SERVER_USER}@${SERVER_IP}:/home/ubuntu/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend upload failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend uploaded" -ForegroundColor Green

scp "frontend-tenant-fix-$TIMESTAMP.tar.gz" "${SERVER_USER}@${SERVER_IP}:/home/ubuntu/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend upload failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend uploaded" -ForegroundColor Green

# Step 5: Deploy on Server
Write-Host ""
Write-Host "🚀 Step 5: Deploying on Server..." -ForegroundColor Yellow

$DEPLOY_SCRIPT = @"
#!/bin/bash
set -e

echo '🔒 Starting Tenant Isolation Fix Deployment...'
echo ''

# Stop services
echo '⏸️  Stopping services...'
pm2 stop backend || true
pm2 stop hospital-frontend || true
echo '✅ Services stopped'
echo ''

# Backup current deployment
echo '💾 Creating backups...'
if [ -d backend ]; then
    cp -r backend backend-backup-$TIMESTAMP
    echo '✅ Backend backed up'
fi
if [ -d hospital-management-system ]; then
    cp -r hospital-management-system hospital-backup-$TIMESTAMP
    echo '✅ Frontend backed up'
fi
echo ''

# Extract backend
echo '📦 Extracting backend...'
cd backend
tar -xzf ../backend-tenant-fix-$TIMESTAMP.tar.gz
echo '✅ Backend extracted'
cd ..
echo ''

# Extract frontend
echo '📦 Extracting frontend...'
cd hospital-management-system
tar -xzf ../frontend-tenant-fix-$TIMESTAMP.tar.gz
echo '✅ Frontend extracted'
cd ..
echo ''

# Restart services
echo '🚀 Restarting services...'
pm2 restart backend
pm2 restart hospital-frontend
echo '✅ Services restarted'
echo ''

# Wait for services to start
echo '⏳ Waiting for services to start...'
sleep 5
echo ''

# Check status
echo '📊 Service Status:'
pm2 list
echo ''

# Show recent logs
echo '📋 Recent Backend Logs:'
pm2 logs backend --lines 20 --nostream
echo ''

echo '📋 Recent Frontend Logs:'
pm2 logs hospital-frontend --lines 20 --nostream
echo ''

echo '✅ Deployment Complete!'
echo ''
echo '🔍 Monitor for tenant isolation logs:'
echo '   pm2 logs backend | grep \"TENANT ISOLATION\"'
echo ''
echo '🔄 Rollback command (if needed):'
echo '   pm2 stop backend hospital-frontend'
echo '   rm -rf backend hospital-management-system'
echo '   mv backend-backup-$TIMESTAMP backend'
echo '   mv hospital-backup-$TIMESTAMP hospital-management-system'
echo '   pm2 restart backend hospital-frontend'
"@

# Save deploy script to temp file
$DEPLOY_SCRIPT | Out-File -FilePath "deploy-script-$TIMESTAMP.sh" -Encoding ASCII

# Upload and execute deploy script
scp "deploy-script-$TIMESTAMP.sh" "${SERVER_USER}@${SERVER_IP}:/home/ubuntu/"
ssh "${SERVER_USER}@${SERVER_IP}" "chmod +x deploy-script-$TIMESTAMP.sh && ./deploy-script-$TIMESTAMP.sh"

# Cleanup local files
Write-Host ""
Write-Host "🧹 Cleaning up local files..." -ForegroundColor Yellow
Remove-Item "backend-tenant-fix-$TIMESTAMP.tar.gz"
Remove-Item "frontend-tenant-fix-$TIMESTAMP.tar.gz"
Remove-Item "deploy-script-$TIMESTAMP.sh"
Write-Host "✅ Cleanup complete" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Test login at each hospital subdomain" -ForegroundColor White
Write-Host "2. Verify tenant isolation is working" -ForegroundColor White
Write-Host "3. Monitor logs for security breach attempts" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Monitor Command:" -ForegroundColor Yellow
Write-Host "   ssh $SERVER_USER@$SERVER_IP 'pm2 logs backend | grep TENANT'" -ForegroundColor White
Write-Host ""
Write-Host "📊 Test URLs:" -ForegroundColor Yellow
Write-Host "   http://aajminpolyclinic.exo.com.np" -ForegroundColor White
Write-Host "   http://citycare.exo.com.np" -ForegroundColor White
Write-Host "   http://greenvalley.exo.com.np" -ForegroundColor White
Write-Host ""
