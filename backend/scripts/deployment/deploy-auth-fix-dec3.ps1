# Deploy Auth Middleware Fix - December 3, 2025
# Fixes: Hospital Admin 403 errors on medical records viewing

Write-Host "Deploying Auth Middleware Fix..." -ForegroundColor Cyan

# Configuration
$SERVER = "ubuntu@13.127.62.146"
$KEY_PATH = "~/.ssh/LightsailDefaultKey-ap-south-1.pem"
$BACKEND_DIR = "/home/ubuntu/backend"

Write-Host "Step 1: Creating deployment package..." -ForegroundColor Yellow
if (Test-Path "backend-auth-fix-dec3.tar.gz") {
    Remove-Item "backend-auth-fix-dec3.tar.gz" -Force
}

tar -czf backend-auth-fix-dec3.tar.gz -C backend/dist .

Write-Host "Step 2: Uploading to server..." -ForegroundColor Yellow
scp -i $KEY_PATH backend-auth-fix-dec3.tar.gz "${SERVER}:/tmp/"

Write-Host "Step 3: Deploying on server..." -ForegroundColor Yellow
ssh -i $KEY_PATH $SERVER @"
    set -e
    
    echo 'Extracting files...'
    cd $BACKEND_DIR
    tar -xzf /tmp/backend-auth-fix-dec3.tar.gz
    
    echo 'Restarting backend...'
    pm2 restart backend
    
    echo 'Waiting for backend to start...'
    sleep 5
    
    echo 'Checking backend status...'
    pm2 status backend
    
    echo 'Recent logs:'
    pm2 logs backend --lines 20 --nostream
    
    rm /tmp/backend-auth-fix-dec3.tar.gz
    
    echo 'Deployment complete'
"@

Write-Host "Auth middleware fix deployed successfully" -ForegroundColor Green
Write-Host "Changes:" -ForegroundColor Cyan
Write-Host "  - Removed strict Cognito group checks from hospitalAuthMiddleware"
Write-Host "  - Now allows all authenticated users through to permission checks"
Write-Host "  - Authorization service handles UUID users gracefully"
Write-Host "  - Hospital Admin users can now view medical records and attachments"
Write-Host ""
Write-Host "Test: Login as Hospital Admin, upload file, view record and attachments" -ForegroundColor Cyan
