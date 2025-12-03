# Flutter App Rebuild Script
# Fixes cache issues and rebuilds the app with latest code

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  REBUILDING MEDCHAT FLUTTER APP" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Navigate to app directory
Set-Location -Path $PSScriptRoot

Write-Host "Step 1: Cleaning build cache..." -ForegroundColor Yellow
flutter clean

Write-Host "`nStep 2: Getting dependencies..." -ForegroundColor Yellow
flutter pub get

Write-Host "`nStep 3: Verifying subscription screen..." -ForegroundColor Yellow
$hasCorrectPricing = Select-String -Path "lib/screens/subscription_screen.dart" -Pattern "advanceMonthly = 2999"
$hasCorrectFeatures = Select-String -Path "lib/screens/subscription_screen.dart" -Pattern "Chat support with healthcare"

if ($hasCorrectPricing -and $hasCorrectFeatures) {
    Write-Host "✓ Subscription screen has correct data" -ForegroundColor Green
} else {
    Write-Host "✗ Warning: Subscription screen may have incorrect data" -ForegroundColor Red
}

Write-Host "`nStep 4: Starting app..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the app`n" -ForegroundColor Gray

flutter run

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  APP REBUILD COMPLETE" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
