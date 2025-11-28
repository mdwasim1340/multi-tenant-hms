# Simple Health Check Script

Write-Host "========================================" -ForegroundColor Green
Write-Host "Backend Health Check" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Test API Health Endpoint
Write-Host "Testing API health endpoint..." -ForegroundColor Yellow
$url = "https://backend.aajminpolyclinic.com.np/health"

try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 10
    Write-Host "✓ API is ONLINE" -ForegroundColor Green
    Write-Host "  Status Code: $($response.StatusCode)" -ForegroundColor Gray
    Write-Host "  Response: $($response.Content)" -ForegroundColor Gray
}
catch {
    Write-Host "X API health check failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Check PM2 Status
Write-Host "Checking PM2 status on server..." -ForegroundColor Yellow
ssh -i ..\n8n\LightsailDefaultKey-ap-south-1.pem bitnami@65.0.78.75 "pm2 list"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Health Check Complete" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
