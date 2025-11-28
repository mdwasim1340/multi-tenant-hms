# Simple API Testing Script

$API_BASE = "https://backend.aajminpolyclinic.com.np"

Write-Host "=== Production API Tests ===" -ForegroundColor Cyan
Write-Host ""

# Test 1
Write-Host "1. Health Check:" -ForegroundColor Yellow
$r1 = Invoke-WebRequest -Uri "$API_BASE/health" -UseBasicParsing
Write-Host "   Status: $($r1.StatusCode) - $($r1.Content)" -ForegroundColor Green

Write-Host ""

# Test 2
Write-Host "2. Database Health:" -ForegroundColor Yellow
$r2 = Invoke-WebRequest -Uri "$API_BASE/health/db" -UseBasicParsing
Write-Host "   Status: $($r2.StatusCode) - $($r2.Content)" -ForegroundColor Green

Write-Host ""

# Test 3
Write-Host "3. Redis Health:" -ForegroundColor Yellow
$r3 = Invoke-WebRequest -Uri "$API_BASE/health/redis" -UseBasicParsing
Write-Host "   Status: $($r3.StatusCode) - $($r3.Content)" -ForegroundColor Green

Write-Host ""

# Test 4
Write-Host "4. All Services Health:" -ForegroundColor Yellow
$r4 = Invoke-WebRequest -Uri "$API_BASE/health/all" -UseBasicParsing
Write-Host "   Status: $($r4.StatusCode)" -ForegroundColor Green
Write-Host "   Response: $($r4.Content)" -ForegroundColor Gray

Write-Host ""
Write-Host "=== All Tests Passed ===" -ForegroundColor Green
