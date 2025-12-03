# Backward Compatible Fix Deployment - v2
# December 3, 2025

$ErrorActionPreference = "Stop"

$SERVER_IP = "65.0.78.75"
$SERVER_USER = "bitnami"
$SSH_KEY = "n8n/LightsailDefaultKey-ap-south-1.pem"

Write-Host "🔧 Deploying Backward Compatible Fix (v2)..." -ForegroundColor Cyan
Write-Host ""

# Upload files
Write-Host "📤 Uploading backend..." -ForegroundColor Yellow
scp -i $SSH_KEY backend-tenant-fix-v2-dec3.zip "${SERVER_USER}@${SERVER_IP}:/home/bitnami/"

Write-Host "📤 Uploading frontend (.next)..." -ForegroundColor Yellow
scp -i $SSH_KEY frontend-tenant-fix-v2-dec3-next.zip "${SERVER_USER}@${SERVER_IP}:/home/bitnami/"

Write-Host "📤 Uploading frontend (other)..." -ForegroundColor Yellow
scp -i $SSH_KEY frontend-tenant-fix-v2-dec3-other.zip "${SERVER_USER}@${SERVER_IP}:/home/bitnami/"

Write-Host ""
Write-Host "🚀 Deploying on server..." -ForegroundColor Yellow

# Create deployment script
$deployScript = @'
#!/bin/bash
set -e

echo "⏸️  Stopping services..."
pm2 stop backend hospital-frontend || true

echo "💾 Creating backups..."
cp -r backend backend-backup-v2-$(date +%H%M%S) || true
cp -r hospital-management-system hospital-backup-v2-$(date +%H%M%S) || true

echo "📦 Extracting backend v2..."
cd backend
unzip -o ../backend-tenant-fix-v2-dec3.zip
cd ..

echo "📦 Extracting frontend v2..."
cd hospital-management-system
rm -rf .next
unzip -o ../frontend-tenant-fix-v2-dec3-next.zip
unzip -o ../frontend-tenant-fix-v2-dec3-other.zip
cd ..

echo "🚀 Restarting services..."
pm2 restart backend hospital-frontend

echo "⏳ Waiting for services..."
sleep 5

echo ""
echo "✅ v2 Deployment complete!"
echo ""
echo "📊 Service Status:"
pm2 list

echo ""
echo "📋 Recent Backend Logs:"
pm2 logs backend --lines 20 --nostream

echo ""
echo "✅ All existing users should now be able to login!"
'@

# Save script to temp file
$deployScript | Out-File -FilePath "deploy-temp.sh" -Encoding ASCII

# Upload and execute
Write-Host "📤 Uploading deployment script..." -ForegroundColor Yellow
scp -i $SSH_KEY deploy-temp.sh "${SERVER_USER}@${SERVER_IP}:/home/bitnami/"

Write-Host "🚀 Executing deployment..." -ForegroundColor Yellow
ssh -i $SSH_KEY "${SERVER_USER}@${SERVER_IP}" 'chmod +x deploy-temp.sh && ./deploy-temp.sh'

# Cleanup
Remove-Item deploy-temp.sh

Write-Host ""
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 What Changed:" -ForegroundColor Yellow
Write-Host "✅ Subdomain validation is now optional" -ForegroundColor White
Write-Host "✅ Existing users can login without subdomains" -ForegroundColor White
Write-Host "✅ System logs warnings for monitoring" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Test Now:" -ForegroundColor Yellow
Write-Host "Try logging in with existing credentials" -ForegroundColor White
Write-Host ""
