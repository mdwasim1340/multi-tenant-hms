# Test Local Development Setup
# Run this script to verify everything is configured correctly

Write-Host "=== Local Development Setup Test ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if backend directory exists
Write-Host "Test 1: Backend Directory" -ForegroundColor Yellow
if (Test-Path "backend") {
    Write-Host "[OK] Backend directory exists" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Backend directory not found" -ForegroundColor Red
    exit 1
}

# Test 2: Check if frontend directory exists
Write-Host "Test 2: Frontend Directory" -ForegroundColor Yellow
if (Test-Path "hospital-management-system") {
    Write-Host "[OK] Frontend directory exists" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Frontend directory not found" -ForegroundColor Red
    exit 1
}

# Test 3: Check backend package.json
Write-Host "Test 3: Backend Dependencies" -ForegroundColor Yellow
if (Test-Path "backend/package.json") {
    Write-Host "[OK] Backend package.json exists" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Backend package.json not found" -ForegroundColor Red
    exit 1
}

# Test 4: Check frontend package.json
Write-Host "Test 4: Frontend Dependencies" -ForegroundColor Yellow
if (Test-Path "hospital-management-system/package.json") {
    Write-Host "[OK] Frontend package.json exists" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Frontend package.json not found" -ForegroundColor Red
    exit 1
}

# Test 5: Check frontend mode
Write-Host "Test 5: Frontend Mode" -ForegroundColor Yellow
Push-Location hospital-management-system
$envContent = Get-Content .env.local -Raw
if ($envContent -match "NEXT_PUBLIC_API_URL=http://localhost:3000") {
    Write-Host "[OK] Frontend in DEVELOPMENT mode" -ForegroundColor Green
} elseif ($envContent -match "NEXT_PUBLIC_API_URL=https://backend\.aajminpolyclinic\.com\.np") {
    Write-Host "[WARNING] Frontend in PRODUCTION mode" -ForegroundColor Yellow
    Write-Host "         Run .\switch-to-dev.ps1 to switch to development" -ForegroundColor Yellow
} else {
    Write-Host "[FAIL] Cannot determine frontend mode" -ForegroundColor Red
}
Pop-Location

# Test 6: Check if ports are available
Write-Host "Test 6: Port Availability" -ForegroundColor Yellow
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
$port3001 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue

if ($port3000) {
    Write-Host "[WARNING] Port 3000 is in use (Backend may already be running)" -ForegroundColor Yellow
} else {
    Write-Host "[OK] Port 3000 is available" -ForegroundColor Green
}

if ($port3001) {
    Write-Host "[WARNING] Port 3001 is in use (Frontend may already be running)" -ForegroundColor Yellow
} else {
    Write-Host "[OK] Port 3001 is available" -ForegroundColor Green
}

# Test 7: Check Docker (for PostgreSQL)
Write-Host "Test 7: Docker Status" -ForegroundColor Yellow
try {
    $dockerStatus = docker ps 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Docker is running" -ForegroundColor Green
        
        # Check if PostgreSQL container is running
        $postgresContainer = docker ps --filter "name=postgres" --format "{{.Names}}"
        if ($postgresContainer) {
            Write-Host "[OK] PostgreSQL container is running: $postgresContainer" -ForegroundColor Green
        } else {
            Write-Host "[WARNING] PostgreSQL container not found" -ForegroundColor Yellow
            Write-Host "         Run 'docker-compose up -d postgres' to start" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[WARNING] Docker is not running" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[WARNING] Docker not installed or not accessible" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "System is ready for local development!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Start Backend:  cd backend && npm run dev" -ForegroundColor White
Write-Host "2. Start Frontend: cd hospital-management-system && npm run dev" -ForegroundColor White
Write-Host "3. Access at:      http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "Test Credentials:" -ForegroundColor Yellow
Write-Host "  Email:    admin@sunrise.hospital" -ForegroundColor White
Write-Host "  Password: SunriseAdmin@2024" -ForegroundColor White
