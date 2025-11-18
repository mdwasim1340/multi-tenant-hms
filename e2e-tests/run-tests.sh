#!/bin/bash

# Team Gamma - Billing Integration E2E Test Runner
# This script runs comprehensive E2E tests for the billing system

echo "=================================="
echo "Billing Integration E2E Tests"
echo "Team Gamma"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if backend is running
echo "Checking if backend is running..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Backend is running on port 3000"
else
    echo -e "${RED}✗${NC} Backend is not running on port 3000"
    echo "Please start the backend server:"
    echo "  cd backend && npm run dev"
    exit 1
fi

# Check if frontend is running
echo "Checking if frontend is running..."
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Frontend is running on port 3001"
else
    echo -e "${RED}✗${NC} Frontend is not running on port 3001"
    echo "Please start the frontend server:"
    echo "  cd hospital-management-system && npm run dev"
    exit 1
fi

echo ""
echo "=================================="
echo "Running E2E Tests"
echo "=================================="
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Install Playwright browsers if needed
if [ ! -d "node_modules/@playwright" ]; then
    echo "Installing Playwright browsers..."
    npm run install
fi

# Run tests
echo "Running tests..."
npm test

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "=================================="
    echo -e "${GREEN}✓ All Tests Passed!${NC}"
    echo "=================================="
    echo ""
    echo "View detailed report:"
    echo "  npm run test:report"
else
    echo ""
    echo "=================================="
    echo -e "${RED}✗ Some Tests Failed${NC}"
    echo "=================================="
    echo ""
    echo "View detailed report:"
    echo "  npm run test:report"
    echo ""
    echo "Run in debug mode:"
    echo "  npm run test:debug"
    exit 1
fi
