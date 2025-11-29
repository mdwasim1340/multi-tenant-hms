# Production API Testing Script

$API_BASE = "https://backend.aajminpolyclinic.com.np"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Production API Testing" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$API_BASE/health" -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    if ($data.status -eq "ok") {
        Write-Host "✓ PASSED - Health check successful" -ForegroundColor Green
        Write-Host "  Response: $($response.Content)" -ForegroundColor Gray
    } else {
        Write-Host "✗ FAILED - Unexpected response" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Health Database
Write-Host "Test 2: Database Health" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$API_BASE/health/db" -UseBasicParsing
    Write-Host "✓ PASSED - Database health check accessible" -ForegroundColor Green
    Write-Host "  Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "✗ FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Health Redis
Write-Host "Test 3: Redis Health" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$API_BASE/health/redis" -UseBasicParsing
    Write-Host "✓ PASSED - Redis health check accessible" -ForegroundColor Green
    Write-Host "  Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "✗ FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Comprehensive Health
Write-Host "Test 4: Comprehensive Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$API_BASE/health/all" -UseBasicParsing
    Write-Host "✓ PASSED - Comprehensive health check accessible" -ForegroundColor Green
    Write-Host "  Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "✗ FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 5: Response Time
Write-Host "Test 5: Response Time" -ForegroundColor Yellow
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
try {
    $response = Invoke-WebRequest -Uri "$API_BASE/health" -UseBasicParsing
    $stopwatch.Stop()
    $responseTime = $stopwatch.ElapsedMilliseconds
    
    if ($responseTime -lt 1000) {
        Write-Host "✓ PASSED - Response time: ${responseTime}ms (Good)" -ForegroundColor Green
    } elseif ($responseTime -lt 3000) {
        Write-Host "⚠ WARNING - Response time: ${responseTime}ms (Acceptable)" -ForegroundColor Yellow
    } else {
        Write-Host "✗ FAILED - Response time: ${responseTime}ms (Too slow)" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 6: SSL Certificate
Write-Host "Test 6: SSL Certificate" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$API_BASE/health" -UseBasicParsing
    Write-Host "✓ PASSED - SSL certificate valid" -ForegroundColor Green
} catch {
    Write-Host "✗ FAILED - SSL certificate issue" -ForegroundColor Red
}

Write-Host ""

# Test 7: CORS Headers
Write-Host "Test 7: CORS Configuration" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$API_BASE/health" -UseBasicParsing
    $corsHeader = $response.Headers['Access-Control-Allow-Origin']
    if ($corsHeader) {
        Write-Host "✓ PASSED - CORS headers present" -ForegroundColor Green
        Write-Host "  Access-Control-Allow-Origin: $corsHeader" -ForegroundColor Gray
    } else {
        Write-Host "⚠ WARNING - CORS headers not found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend URL: $API_BASE" -ForegroundColor Gray
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
