# Optimized Deployment Script - Avoids Server Overload
# Deploys backend and frontend incrementally

$ErrorActionPreference = "Stop"

$SERVER = "65.0.78.75"
$USER = "bitnami"
$KEY = "n8n\LightsailDefaultKey-ap-south-1.pem"

Write-Host "Hospital Management System - Optimized Deployment" -ForegroundColor Cyan
Write-Host "Server: $SERVER" -ForegroundColor Yellow
Write-Host ""

# Step 1: Prepare Directories
Write-Host "Step 1/5: Preparing Directories..." -ForegroundColor Green

ssh -i $KEY "$USER@$SERVER" "mkdir -p /home/bitnami/backend/dist && mkdir -p /home/bitnami/backend/migrations && mkdir -p /home/bitnami/hospital-frontend"

Write-Host "Directories prepared" -ForegroundColor Green
Write-Host ""

# Step 2: Deploy Backend
if (Test-Path "backend\dist") {
    Write-Host "Step 2/5: Deploying Backend..." -ForegroundColor Green
    
    Write-Host "  Uploading compiled backend..."
    scp -i $KEY -C -r backend/dist "$USER@${SERVER}:/home/bitnami/backend/" 2>&1 | Out-Null
    
    Write-Host "  Uploading package files..."
    scp -i $KEY backend/package.json "$USER@${SERVER}:/home/bitnami/backend/" 2>&1 | Out-Null
    scp -i $KEY backend/package-lock.json "$USER@${SERVER}:/home/bitnami/backend/" 2>&1 | Out-Null
    
    Write-Host "  Uploading migrations..."
    scp -i $KEY -C -r backend/migrations "$USER@${SERVER}:/home/bitnami/backend/" 2>&1 | Out-Null
    
    if (Test-Path "backend\.env") {
        Write-Host "  Uploading .env..."
        scp -i $KEY backend/.env "$USER@${SERVER}:/home/bitnami/backend/" 2>&1 | Out-Null
    }
    
    Write-Host "Backend uploaded" -ForegroundColor Green
} else {
    Write-Host "Backend dist not found - skipping" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Deploy Frontend
if (Test-Path "hospital-management-system\.next") {
    Write-Host "Step 3/5: Deploying Frontend..." -ForegroundColor Green
    
    Write-Host "  Compressing .next folder..."
    if (Test-Path "hospital-management-system\.next.tar.gz") {
        Remove-Item "hospital-management-system\.next.tar.gz" -Force
    }
    
    tar -czf hospital-management-system/.next.tar.gz -C hospital-management-system .next 2>&1 | Out-Null
    
    Write-Host "  Uploading compressed build..."
    scp -i $KEY hospital-management-system/.next.tar.gz "$USER@${SERVER}:/home/bitnami/hospital-frontend/" 2>&1 | Out-Null
    
    Write-Host "  Extracting on server..."
    ssh -i $KEY "$USER@$SERVER" "cd /home/bitnami/hospital-frontend && tar -xzf .next.tar.gz && rm .next.tar.gz"
    
    Write-Host "  Uploading configuration files..."
    scp -i $KEY hospital-management-system/package.json "$USER@${SERVER}:/home/bitnami/hospital-frontend/" 2>&1 | Out-Null
    scp -i $KEY hospital-management-system/package-lock.json "$USER@${SERVER}:/home/bitnami/hospital-frontend/" 2>&1 | Out-Null
    scp -i $KEY hospital-management-system/next.config.mjs "$USER@${SERVER}:/home/bitnami/hospital-frontend/" 2>&1 | Out-Null
    
    Write-Host "  Uploading public assets..."
    scp -i $KEY -r hospital-management-system/public "$USER@${SERVER}:/home/bitnami/hospital-frontend/" 2>&1 | Out-Null
    
    if (Test-Path "hospital-management-system\.env.production") {
        Write-Host "  Uploading .env.production..."
        scp -i $KEY hospital-management-system/.env.production "$USER@${SERVER}:/home/bitnami/hospital-frontend/" 2>&1 | Out-Null
    }
    
    Remove-Item "hospital-management-system/.next.tar.gz" -Force
    
    Write-Host "Frontend uploaded" -ForegroundColor Green
} else {
    Write-Host "Frontend build not found - skipping" -ForegroundColor Yellow
}

Write-Host ""

# Step 4: Install Dependencies
Write-Host "Step 4/5: Installing Dependencies..." -ForegroundColor Green

$installScript = @'
#!/bin/bash
set -e

if [ -d /home/bitnami/backend/dist ] && [ ! -d /home/bitnami/backend/node_modules ]; then
    echo "Installing backend dependencies..."
    cd /home/bitnami/backend
    npm install --production --no-audit --no-fund
else
    echo "Backend dependencies already installed"
fi

if [ -d /home/bitnami/hospital-frontend/.next ] && [ ! -d /home/bitnami/hospital-frontend/node_modules ]; then
    echo "Installing frontend dependencies..."
    cd /home/bitnami/hospital-frontend
    npm install --production --no-audit --no-fund
else
    echo "Frontend dependencies already installed"
fi

if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
else
    echo "PM2 already installed"
fi
'@

$installScript | ssh -i $KEY "$USER@$SERVER" "bash -s"

Write-Host "Dependencies ready" -ForegroundColor Green
Write-Host ""

# Step 5: Start/Restart Services
Write-Host "Step 5/5: Managing Services..." -ForegroundColor Green

$serviceScript = @'
#!/bin/bash
set -e

BACKEND_RUNNING=$(pm2 list | grep -c 'backend.*online' || echo '0')
FRONTEND_RUNNING=$(pm2 list | grep -c 'hospital-frontend.*online' || echo '0')

if [ -d /home/bitnami/backend/dist ]; then
    cd /home/bitnami/backend
    if [ "$BACKEND_RUNNING" -gt "0" ]; then
        echo "Restarting backend..."
        pm2 restart backend
    else
        echo "Starting backend on port 3000..."
        pm2 start dist/index.js --name backend --time
    fi
fi

if [ -d /home/bitnami/hospital-frontend/.next ]; then
    cd /home/bitnami/hospital-frontend
    if [ "$FRONTEND_RUNNING" -gt "0" ]; then
        echo "Restarting frontend..."
        pm2 restart hospital-frontend
    else
        echo "Starting frontend on port 3001..."
        pm2 start npm --name hospital-frontend --time -- start
    fi
fi

pm2 save
echo "Services updated"
'@

$serviceScript | ssh -i $KEY "$USER@$SERVER" "bash -s"

Write-Host "Services running" -ForegroundColor Green
Write-Host ""

# Health Check
Write-Host "Running Health Checks..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

ssh -i $KEY "$USER@$SERVER" "pm2 status"

Write-Host ""
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "  Frontend: http://$SERVER:3001" -ForegroundColor Yellow
Write-Host "  Backend:  http://$SERVER:3000" -ForegroundColor Yellow
Write-Host ""
