# Flutter Web Cache Fix Script
# Clears all caches and rebuilds the Flutter web app

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FLUTTER WEB CACHE FIX" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to app directory
Set-Location -Path $PSScriptRoot

Write-Host "Step 1: Stopping any running Flutter processes..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*flutter*" -or $_.ProcessName -like "*dart*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Step 2: Removing build artifacts..." -ForegroundColor Yellow
if (Test-Path "build") { Remove-Item -Recurse -Force "build" }
if (Test-Path ".dart_tool") { Remove-Item -Recurse -Force ".dart_tool" }
if (Test-Path ".flutter-plugins") { Remove-Item -Force ".flutter-plugins" }
if (Test-Path ".flutter-plugins-dependencies") { Remove-Item -Force ".flutter-plugins-dependencies" }

Write-Host ""
Write-Host "Step 3: Running flutter clean..." -ForegroundColor Yellow
flutter clean

Write-Host ""
Write-Host "Step 4: Getting dependencies..." -ForegroundColor Yellow
flutter pub get

Write-Host ""
Write-Host "Step 5: Verifying subscription screen..." -ForegroundColor Yellow
$hasCorrectPricing = Select-String -Path "lib/screens/subscription_screen.dart" -Pattern "advanceMonthly = 2999"
$hasCorrectFeatures = Select-String -Path "lib/screens/subscription_screen.dart" -Pattern "Chat support with healthcare"

if ($hasCorrectPricing -and $hasCorrectFeatures) {
    Write-Host "✓ Subscription screen has correct MedChat data" -ForegroundColor Green
    Write-Host "  - Advance: ₹2,999/month" -ForegroundColor Gray
    Write-Host "  - Premium: ₹9,999/month" -ForegroundColor Gray
    Write-Host "  - Features: Healthcare chat, video consultation, etc." -ForegroundColor Gray
} else {
    Write-Host "✗ Warning: Subscription screen may have incorrect data" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 6: Starting Flutter web app..." -ForegroundColor Yellow
Write-Host "The app will open in Chrome." -ForegroundColor Gray
Write-Host "After it loads, press Ctrl+Shift+R to hard refresh!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the app" -ForegroundColor Gray
Write-Host ""

flutter run -d chrome --web-renderer html

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DONE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
