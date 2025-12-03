# Deploy v2 Fix
$ErrorActionPreference = "Stop"

$SERVER_IP = "65.0.78.75"
$SERVER_USER = "bitnami"
$SSH_KEY = "n8n/LightsailDefaultKey-ap-south-1.pem"

Write-Host "Deploying v2 fix..." -ForegroundColor Cyan

# Upload files
Write-Host "Uploading backend..." -ForegroundColor Yellow
scp -i $SSH_KEY backend-tenant-fix-v2-dec3.zip "${SERVER_USER}@${SERVER_IP}:/home/bitnami/"

Write-Host "Uploading frontend next..." -ForegroundColor Yellow
scp -i $SSH_KEY frontend-tenant-fix-v2-dec3-next.zip "${SERVER_USER}@${SERVER_IP}:/home/bitnami/"

Write-Host "Uploading frontend other..." -ForegroundColor Yellow
scp -i $SSH_KEY frontend-tenant-fix-v2-dec3-other.zip "${SERVER_USER}@${SERVER_IP}:/home/bitnami/"

Write-Host "Creating deployment script..." -ForegroundColor Yellow

# Create simple deployment script
@'
#!/bin/bash
set -e
echo "Stopping services..."
pm2 stop backend hospital-frontend || true
echo "Backing up..."
cp -r backend backend-backup-v2 || true
cp -r hospital-management-system hospital-backup-v2 || true
echo "Extracting backend..."
cd backend
unzip -o ../backend-tenant-fix-v2-dec3.zip
cd ..
echo "Extracting frontend..."
cd hospital-management-system
rm -rf .next
unzip -o ../frontend-tenant-fix-v2-dec3-next.zip
unzip -o ../frontend-tenant-fix-v2-dec3-other.zip
cd ..
echo "Restarting services..."
pm2 restart backend hospital-frontend
sleep 5
echo "Deployment complete!"
pm2 list
'@ | Out-File -FilePath "deploy.sh" -Encoding ASCII -NoNewline

Write-Host "Uploading deployment script..." -ForegroundColor Yellow
scp -i $SSH_KEY deploy.sh "${SERVER_USER}@${SERVER_IP}:/home/bitnami/"

Write-Host "Executing deployment..." -ForegroundColor Yellow
ssh -i $SSH_KEY "${SERVER_USER}@${SERVER_IP}" "bash deploy.sh"

Remove-Item deploy.sh

Write-Host ""
Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "All users should now be able to login" -ForegroundColor White
Write-Host ""
