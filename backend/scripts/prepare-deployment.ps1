# PowerShell Deployment Preparation Script

# Configuration
$SERVER_IP = "65.0.78.75"
$SERVER_USER = "bitnami"
$SSH_KEY = "..\..\n8n\LightsailDefaultKey-ap-south-1.pem"

Write-Host "========================================" -ForegroundColor Green
Write-Host "Deployment Preparation" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check SSH key
if (-not (Test-Path $SSH_KEY)) {
    Write-Host "Error: SSH key not found at $SSH_KEY" -ForegroundColor Red
    exit 1
}

Write-Host "✓ SSH key found" -ForegroundColor Green

# Test SSH connection
Write-Host "Testing SSH connection..." -ForegroundColor Yellow
$testCmd = "echo 'Connection successful'"
$testResult = ssh -i $SSH_KEY -o ConnectTimeout=10 "$SERVER_USER@$SERVER_IP" $testCmd 2>&1

if ($testResult -match "Connection successful") {
    Write-Host "✓ SSH connection successful" -ForegroundColor Green
}
else {
    Write-Host "X SSH connection failed" -ForegroundColor Red
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "  1. Server is running"
    Write-Host "  2. SSH key is correct"
    Write-Host "  3. Network connectivity"
    exit 1
}

Write-Host ""
Write-Host "Checking server status..." -ForegroundColor Yellow

# Check server components
$checkCmd = "echo 'Checking installed software...' && command -v node && command -v pm2 && command -v psql && command -v nginx && ls -la /home/bitnami/multi-tenant-backend 2>/dev/null || echo 'Project not found'"
ssh -i $SSH_KEY "$SERVER_USER@$SERVER_IP" $checkCmd

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Preparation Complete" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Deploy application:" -ForegroundColor Blue
Write-Host "   .\deploy.ps1"
Write-Host ""
Write-Host "2. Verify deployment:" -ForegroundColor Blue
Write-Host "   .\scripts\check-deployment.ps1"
Write-Host ""
