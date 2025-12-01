#!/usr/bin/env pwsh
# Switch Hospital Management System to Development Mode

Write-Host "🔧 Switching to DEVELOPMENT mode..." -ForegroundColor Cyan

$envFile = ".env.local"

if (Test-Path $envFile) {
    # Read the file
    $content = Get-Content $envFile -Raw
    
    # Comment out production URLs
    $content = $content -replace "^NEXT_PUBLIC_API_URL=https://backend\.aajminpolyclinic\.com\.np", "# NEXT_PUBLIC_API_URL=https://backend.aajminpolyclinic.com.np"
    $content = $content -replace "^NEXT_PUBLIC_API_BASE_URL=https://backend\.aajminpolyclinic\.com\.np", "# NEXT_PUBLIC_API_BASE_URL=https://backend.aajminpolyclinic.com.np"
    
    # Uncomment development URLs
    $content = $content -replace "^# NEXT_PUBLIC_API_URL=http://localhost:3000", "NEXT_PUBLIC_API_URL=http://localhost:3000"
    $content = $content -replace "^# NEXT_PUBLIC_API_BASE_URL=http://localhost:3000", "NEXT_PUBLIC_API_BASE_URL=http://localhost:3000"
    
    # Write back to file
    Set-Content -Path $envFile -Value $content -NoNewline
    
    Write-Host "✅ Switched to DEVELOPMENT mode!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 Backend URL: http://localhost:3000" -ForegroundColor Yellow
    Write-Host "📍 Frontend URL: http://localhost:3001" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "⚠️  Remember to restart your frontend server:" -ForegroundColor Magenta
    Write-Host "   npm run dev" -ForegroundColor White
} else {
    Write-Host "❌ Error: .env.local file not found!" -ForegroundColor Red
    exit 1
}
