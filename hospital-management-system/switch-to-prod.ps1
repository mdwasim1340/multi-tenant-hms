#!/usr/bin/env pwsh
# Switch Hospital Management System to Production Mode

Write-Host "🚀 Switching to PRODUCTION mode..." -ForegroundColor Cyan

$envFile = ".env.local"

if (Test-Path $envFile) {
    # Read the file
    $content = Get-Content $envFile -Raw
    
    # Comment out development URLs
    $content = $content -replace "^NEXT_PUBLIC_API_URL=http://localhost:3000", "# NEXT_PUBLIC_API_URL=http://localhost:3000"
    $content = $content -replace "^NEXT_PUBLIC_API_BASE_URL=http://localhost:3000", "# NEXT_PUBLIC_API_BASE_URL=http://localhost:3000"
    
    # Uncomment production URLs
    $content = $content -replace "^# NEXT_PUBLIC_API_URL=https://backend\.aajminpolyclinic\.com\.np", "NEXT_PUBLIC_API_URL=https://backend.aajminpolyclinic.com.np"
    $content = $content -replace "^# NEXT_PUBLIC_API_BASE_URL=https://backend\.aajminpolyclinic\.com\.np", "NEXT_PUBLIC_API_BASE_URL=https://backend.aajminpolyclinic.com.np"
    
    # Write back to file
    Set-Content -Path $envFile -Value $content -NoNewline
    
    Write-Host "✅ Switched to PRODUCTION mode!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 Backend URL: https://backend.aajminpolyclinic.com.np" -ForegroundColor Yellow
    Write-Host "📍 Frontend URL: http://localhost:3001 (testing production API)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "⚠️  Remember to restart your frontend server:" -ForegroundColor Magenta
    Write-Host "   npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  Note: Production backend must be deployed with latest code!" -ForegroundColor Red
} else {
    Write-Host "❌ Error: .env.local file not found!" -ForegroundColor Red
    exit 1
}
