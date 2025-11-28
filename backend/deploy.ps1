# PowerShell Deployment Script for Windows
# Deploys backend to AWS Lightsail instance

# Configuration
$SERVER_IP = "65.0.78.75"
$SERVER_USER = "bitnami"
$SSH_KEY = "..\n8n\LightsailDefaultKey-ap-south-1.pem"

Write-Host "========================================" -ForegroundColor Green
Write-Host "Multi-Tenant Backend Deployment" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check if SSH key exists
if (-not (Test-Path $SSH_KEY)) {
    Write-Host "Error: SSH key not found at $SSH_KEY" -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Connecting to server..." -ForegroundColor Yellow

# Create deployment commands
$deployCommands = "cd /home/bitnami/multi-tenant-backend && git pull origin main && npm install --production=false && npm run build && mkdir -p logs && pm2 stop backend-api-prod 2>/dev/null || true && pm2 start ecosystem.config.js --env production --only backend-api-prod && pm2 save && pm2 status"

# Execute deployment via SSH
Write-Host "Step 2: Executing deployment commands..." -ForegroundColor Yellow
ssh -i $SSH_KEY "$SERVER_USER@$SERVER_IP" $deployCommands

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Deployment Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Backend URL: https://backend.aajminpolyclinic.com.np" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Verify: .\scripts\check-deployment.ps1"
    Write-Host "2. Test: curl https://backend.aajminpolyclinic.com.np/health"
    Write-Host ""
}
else {
    Write-Host ""
    Write-Host "Deployment failed!" -ForegroundColor Red
    Write-Host "Check the error messages above." -ForegroundColor Yellow
    exit 1
}
