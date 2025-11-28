# PowerShell Deployment Health Check Script

# Configuration
$SERVER_IP = "65.0.78.75"
$SERVER_USER = "bitnami"
$SSH_KEY = "..\..\n8n\LightsailDefaultKey-ap-south-1.pem"
$BACKEND_URL = "https://backend.aajminpolyclinic.com.np"

Write-Host "========================================" -ForegroundColor Green
Write-Host "Deployment Health Check" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check SSH key
if (-not (Test-Path $SSH_KEY)) {
    Write-Host "X SSH key not found" -ForegroundColor Red
    exit 1
}
Write-Host "✓ SSH key found" -ForegroundColor Green

# Check SSH connection
Write-Host "Checking SSH connection..." -ForegroundColor Yellow
$testCmd = "echo 'Connected'"
$testResult = ssh -i $SSH_KEY -o ConnectTimeout=5 "$SERVER_USER@$SERVER_IP" $testCmd 2>&1

if ($testResult -match "Connected") {
    Write-Host "✓ SSH connection successful" -ForegroundColor Green
}
else {
    Write-Host "X SSH connection failed" -ForegroundColor Red
    exit 1
}

# Check server status
Write-Host ""
Write-Host "Checking server status..." -ForegroundColor Yellow

$statusCmd = "cd /home/bitnami/multi-tenant-backend && echo 'Project directory: OK' && git branch --show-current && pm2 list"
ssh -i $SSH_KEY "$SERVER_USER@$SERVER_IP" $statusCmd

# Check API health endpoint
Write-Host ""
Write-Host "Checking API health endpoint..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ API health check passed" -ForegroundColor Green
        Write-Host "  Status Code: $($response.StatusCode)" -ForegroundColor Gray
    }
}
catch {
    Write-Host "X API health check failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Health Check Complete" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
