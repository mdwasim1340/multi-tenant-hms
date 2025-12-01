# Check current mode (Development or Production)

Write-Host "Checking current mode..." -ForegroundColor Cyan
Write-Host ""

$envFile = ".env.local"

if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    
    if ($content -match "NEXT_PUBLIC_API_URL=http://localhost:3000") {
        Write-Host "Current Mode: DEVELOPMENT" -ForegroundColor Green
        Write-Host "Backend: http://localhost:3000" -ForegroundColor Yellow
        Write-Host "Frontend: http://localhost:3001" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "To switch to production: .\switch-to-prod.ps1" -ForegroundColor Cyan
    } elseif ($content -match "NEXT_PUBLIC_API_URL=https://backend\.aajminpolyclinic\.com\.np") {
        Write-Host "Current Mode: PRODUCTION" -ForegroundColor Green
        Write-Host "Backend: https://backend.aajminpolyclinic.com.np" -ForegroundColor Yellow
        Write-Host "Frontend: http://localhost:3001" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "To switch to development: .\switch-to-dev.ps1" -ForegroundColor Cyan
    } else {
        Write-Host "Unknown mode or configuration error" -ForegroundColor Red
    }
} else {
    Write-Host "Error: .env.local file not found!" -ForegroundColor Red
    exit 1
}
