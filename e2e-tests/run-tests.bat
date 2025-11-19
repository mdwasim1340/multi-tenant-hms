@echo off
REM Team Gamma - Billing Integration E2E Test Runner (Windows)
REM This script runs comprehensive E2E tests for the billing system

echo ==================================
echo Billing Integration E2E Tests
echo Team Gamma
echo ==================================
echo.

REM Check if backend is running
echo Checking if backend is running...
curl -s http://localhost:3000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [32m✓[0m Backend is running on port 3000
) else (
    echo [31m✗[0m Backend is not running on port 3000
    echo Please start the backend server:
    echo   cd backend ^&^& npm run dev
    exit /b 1
)

REM Check if frontend is running
echo Checking if frontend is running...
curl -s http://localhost:3001 >nul 2>&1
if %errorlevel% equ 0 (
    echo [32m✓[0m Frontend is running on port 3001
) else (
    echo [31m✗[0m Frontend is not running on port 3001
    echo Please start the frontend server:
    echo   cd hospital-management-system ^&^& npm run dev
    exit /b 1
)

echo.
echo ==================================
echo Running E2E Tests
echo ==================================
echo.

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

REM Install Playwright browsers if needed
if not exist "node_modules\@playwright" (
    echo Installing Playwright browsers...
    call npm run install
)

REM Run tests
echo Running tests...
call npm test

REM Check exit code
if %errorlevel% equ 0 (
    echo.
    echo ==================================
    echo [32m✓ All Tests Passed![0m
    echo ==================================
    echo.
    echo View detailed report:
    echo   npm run test:report
) else (
    echo.
    echo ==================================
    echo [31m✗ Some Tests Failed[0m
    echo ==================================
    echo.
    echo View detailed report:
    echo   npm run test:report
    echo.
    echo Run in debug mode:
    echo   npm run test:debug
    exit /b 1
)
