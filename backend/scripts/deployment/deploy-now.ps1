# Quick Deployment Script - Tenant Isolation Fix
# December 3, 2025

$ErrorActionPreference = "Stop"

Write-Host "🔒 Deploying Tenant Isolation Security Fix..." -ForegroundColor Cyan
Write-Host ""

# Configuration - UPDATE THIS
$SERVER_IP = "13.127.xxx.xxx"  # REPLACE WITH YOUR SERVER IP
$SERVER_USER = "ubuntu"

# Upload files
Write-Host "📤 Uploading backend..." -ForegroundColor Yellow
scp backend-tenant-fix-dec3.zip "${SERVER_USER}@${SERVER_IP}:/home/ubuntu/"

Write-Host "📤 Uploading frontend (.next)..." -ForegroundColor Yellow
scp frontend-tenant-fix-dec3-next.zip "${SERVER_USER}@${SERVER_IP}:/home/ubuntu/"

Write-Host "📤 Uploading frontend (other files)..." -ForegroundColor Yellow
scp frontend-tenant-fix-dec3-other.zip "${SERVER_USER}@${SERVER_IP}:/home/ubuntu/"

Write-Host ""
Write-Host "🚀 Deploying on server..." -ForegroundColor Yellow

# Deploy on server
ssh "${SERVER_USER}@${SERVER_IP}" @"
set -e

echo '⏸️  Stopping services...'
pm2 stop backend hospital-frontend

echo '💾 Creating backups...'
cp -r backend backend-backup-dec3-$(date +%H%M%S)
cp -r hospital-management-system hospital-backup-dec3-$(date +%H%M%S)

echo '📦 Extracting backend...'
cd backend
unzip -o ../backend-tenant-fix-dec3.zip
cd ..

echo '📦 Extracting frontend...'
cd hospital-management-system
rm -rf .next
unzip -o ../frontend-tenant-fix-dec3-next.zip
unzip -o ../frontend-tenant-fix-dec3-other.zip
cd ..

echo '🚀 Restarting services...'
pm2 restart backend hospital-frontend

echo '⏳ Waiting for services...'
sleep 5

echo '✅ Deployment complete!'
pm2 list

echo ''
echo '🔍 Monitor tenant isolation:'
echo '   pm2 logs backend | grep TENANT'
"@

Write-Host ""
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Test the fix:" -ForegroundColor Yellow
Write-Host "1. Try logging into correct hospital - should work" -ForegroundColor White
Write-Host "2. Try logging into wrong hospital - should be blocked" -ForegroundColor White
Write-Host ""
