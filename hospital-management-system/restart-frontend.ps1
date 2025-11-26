# Frontend Restart Script
# This script clears the Next.js cache and restarts the frontend

Write-Host "🔄 Restarting Frontend..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if .next exists
if (Test-Path ".next") {
    Write-Host "1️⃣ Clearing Next.js cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .next
    Write-Host "   ✅ Cache cleared!" -ForegroundColor Green
} else {
    Write-Host "1️⃣ No cache to clear" -ForegroundColor Gray
}

Write-Host ""
Write-Host "2️⃣ Starting frontend server..." -ForegroundColor Yellow
Write-Host "   📍 URL: http://localhost:3001" -ForegroundColor Cyan
Write-Host "   🛑 Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

# Step 2: Start the dev server
npm run dev
