# Backward Compatible Fix Deployment - v2
# December 3, 2025
# Fixes: Restores login for all existing users

$ErrorActionPreference = "Stop"

Write-Host "🔧 Deploying Backward Compatible Fix (v2)..." -ForegroundColor Cyan
Write-Host "This will restore login functionality for all users" -ForegroundColor Yellow
Write-Host ""

# Configuration
$SERVER_IP = "65.0.78.75"
$SERVER_USER = "bitnami"
$SSH_KEY = "n8n/LightsailDefaultKey-ap-south-1.pem"

Write-Host "📤 Uploading v2 packages..." -ForegroundColor Yellow
scp -i $SSH_KEY backend-tenant-fix-v2-dec3.zip "${SERVER_USER}@${SERVER_IP}:/home/bitnami/"
scp -i $SSH_KEY frontend-tenant-fix-v2-dec3-next.zip "${SERVER_USER}@${SERVER_IP}:/home/bitnami/"
scp -i $SSH_KEY frontend-tenant-fix-v2-dec3-other.zip "${SERVER_USER}@${SERVER_IP}:/home/bitnami/"

Write-Host ""
Write-Host "🚀 Deploying on server..." -ForegroundColor Yellow

ssh -i $SSH_KEY "${SERVER_USER}@${SERVER_IP}" @"
set -e

echo '⏸️  Stopping services...'
pm2 stop backend hospital-frontend

echo '💾 Creating backups...'
cp -r backend backend-backup-v2-$(date +%H%M%S)
cp -r hospital-management-system hospital-backup-v2-$(date +%H%M%S)

echo '📦 Extracting backend v2...'
cd backend
unzip -o ../backend-tenant-fix-v2-dec3.zip
cd ..

echo '📦 Extracting frontend v2...'
cd hospital-management-system
rm -rf .next
unzip -o ../frontend-tenant-fix-v2-dec3-next.zip
unzip -o ../frontend-tenant-fix-v2-dec3-other.zip
cd ..

echo '🚀 Restarting services...'
pm2 restart backend hospital-frontend

echo '⏳ Waiting for services...'
sleep 5

echo ''
echo '✅ v2 Deployment complete!'
echo ''
echo '📊 Service Status:'
pm2 list

echo ''
echo '📋 Recent Backend Logs:'
pm2 logs backend --lines 20 --nostream

echo ''
echo '✅ All existing users should now be able to login!'
echo ''
echo '🔍 Monitor logs:'
echo '   pm2 logs backend | grep "Login without tenant context"'
"@

Write-Host ""
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 What Changed:" -ForegroundColor Yellow
Write-Host "✅ Subdomain validation is now optional" -ForegroundColor White
Write-Host "✅ Existing users can login without subdomains" -ForegroundColor White
Write-Host "✅ System logs warnings for monitoring" -ForegroundColor White
Write-Host "✅ Future subdomain security still available" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Test Now:" -ForegroundColor Yellow
Write-Host "Try logging in with any existing user credentials" -ForegroundColor White
Write-Host "Example: mdwasimkrm13 at gmail.com / Advanture101" -ForegroundColor White
Write-Host ""
