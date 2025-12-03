#!/usr/bin/env pwsh
# Optimized Deployment Script - Avoids Server Overload
# Deploys backend and frontend incrementally with resource checks

$ErrorActionPreference = "Stop"

$SERVER = "65.0.78.75"
$USER = "bitnami"
$KEY = "n8n\LightsailDefaultKey-ap-south-1.pem"

Write-Host "🚀 Hospital Management System - Optimized Deployment" -ForegroundColor Cyan
Write-Host "Server: $SERVER" -ForegroundColor Yellow
Write-Host ""

# Function to check server resources
function Test-ServerResources {
    Write-Host "🔍 Checking server resources..." -ForegroundColor Yellow
    $resources = ssh -i $KEY "$USER@$SERVER" @"
free -m | grep Mem | awk '{print \$4}'
df -h /home | tail -1 | awk '{print \$4}'
"@
    
    $lines = $resources -split [Environment]::NewLine
    $freeMem = [int]($lines[0].Trim())
    $freeDisk = $lines[1].Trim()
    
    Write-Host "  Available Memory: $freeMem MB" -ForegroundColor Gray
    Write-Host "  Available Disk: $freeDisk" -ForegroundColor Gray
    
    if ($freeMem -lt 200) {
        Write-Host "⚠️  Warning: Low memory available" -ForegroundColor Yellow
        return $false
    }
    return $true
}

# Check server resources
if (-not (Test-ServerResources)) {
    Write-Host "⚠️  Server resources are low. Proceeding with caution..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "📦 Step 1/5: Preparing Directories..." -ForegroundColor Green

ssh -i $KEY "$USER@$SERVER" @"
mkdir -p /home/bitnami/backend/dist
mkdir -p /home/bitnami/backend/migrations
mkdir -p /home/bitnami/hospital-frontend
echo '✓ Directories ready'
"@

Write-Host "✅ Directories prepared" -ForegroundColor Green
Write-Host ""

# Step 2: Deploy Backend (if dist exists)
if (Test-Path "backend\dist") {
    Write-Host "📦 Step 2/5: Deploying Backend..." -ForegroundColor Green
    
    # Upload backend dist (compiled code only)
    Write-Host "  → Uploading compiled backend (dist)..."
    scp -i $KEY -C -r backend/dist "$USER@${SERVER}:/home/bitnami/backend/" 2>&1 | Out-Null
    
    # Upload package files
    Write-Host "  → Uploading package.json..."
    scp -i $KEY backend/package.json "$USER@${SERVER}:/home/bitnami/backend/"
    scp -i $KEY backend/package-lock.json "$USER@${SERVER}:/home/bitnami/backend/"
    
    # Upload migrations
    Write-Host "  → Uploading migrations..."
    scp -i $KEY -C -r backend/migrations "$USER@${SERVER}:/home/bitnami/backend/"
    
    # Upload .env if exists
    if (Test-Path "backend\.env") {
        Write-Host "  → Uploading .env..."
        scp -i $KEY backend/.env "$USER@${SERVER}:/home/bitnami/backend/"
    }
    
    Write-Host "✅ Backend uploaded" -ForegroundColor Green
} else {
    Write-Host "⚠️  Backend dist not found - skipping backend deployment" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Deploy Frontend (if build exists)
if (Test-Path "hospital-management-system\.next") {
    Write-Host "📦 Step 3/5: Deploying Frontend..." -ForegroundColor Green
    
    # Compress .next folder before upload (saves bandwidth and time)
    Write-Host "  → Compressing .next folder..."
    if (Test-Path "hospital-management-system\.next.tar.gz") {
        Remove-Item "hospital-management-system\.next.tar.gz" -Force
    }
    
    tar -czf hospital-management-system/.next.tar.gz -C hospital-management-system .next
    
    # Upload compressed file
    Write-Host "  → Uploading compressed build..."
    scp -i $KEY hospital-management-system/.next.tar.gz "$USER@${SERVER}:/home/bitnami/hospital-frontend/"
    
    # Extract on server
    Write-Host "  → Extracting on server..."
    ssh -i $KEY "$USER@$SERVER" @"
cd /home/bitnami/hospital-frontend
tar -xzf .next.tar.gz
rm .next.tar.gz
echo '✓ Build extracted'
"@
    
    # Upload other necessary files
    Write-Host "  → Uploading configuration files..."
    scp -i $KEY hospital-management-system/package.json "$USER@${SERVER}:/home/bitnami/hospital-frontend/"
    scp -i $KEY hospital-management-system/package-lock.json "$USER@${SERVER}:/home/bitnami/hospital-frontend/"
    scp -i $KEY hospital-management-system/next.config.mjs "$USER@${SERVER}:/home/bitnami/hospital-frontend/"
    
    # Upload public folder (smaller, can be direct)
    Write-Host "  → Uploading public assets..."
    scp -i $KEY -r hospital-management-system/public "$USER@${SERVER}:/home/bitnami/hospital-frontend/"
    
    # Upload .env.production if exists
    if (Test-Path "hospital-management-system\.env.production") {
        Write-Host "  → Uploading .env.production..."
        scp -i $KEY hospital-management-system/.env.production "$USER@${SERVER}:/home/bitnami/hospital-frontend/"
    }
    
    # Cleanup local compressed file
    Remove-Item "hospital-management-system/.next.tar.gz" -Force
    
    Write-Host "✅ Frontend uploaded" -ForegroundColor Green
} else {
    Write-Host "⚠️  Frontend build not found - skipping frontend deployment" -ForegroundColor Yellow
}

Write-Host ""

# Step 4: Install Dependencies (only if needed)
Write-Host "📦 Step 4/5: Installing Dependencies..." -ForegroundColor Green

ssh -i $KEY "$USER@$SERVER" @"
set -e

# Check if backend needs dependencies
if [ -d /home/bitnami/backend/dist ] && [ ! -d /home/bitnami/backend/node_modules ]; then
    echo '→ Installing backend dependencies...'
    cd /home/bitnami/backend
    npm install --production --no-audit --no-fund
else
    echo '✓ Backend dependencies already installed'
fi

# Check if frontend needs dependencies
if [ -d /home/bitnami/hospital-frontend/.next ] && [ ! -d /home/bitnami/hospital-frontend/node_modules ]; then
    echo '→ Installing frontend dependencies...'
    cd /home/bitnami/hospital-frontend
    npm install --production --no-audit --no-fund
else
    echo '✓ Frontend dependencies already installed'
fi

# Ensure PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo '→ Installing PM2...'
    sudo npm install -g pm2
else
    echo '✓ PM2 already installed'
fi
"@

Write-Host "✅ Dependencies ready" -ForegroundColor Green
Write-Host ""

# Step 5: Start/Restart Services
Write-Host "🚀 Step 5/5: Managing Services..." -ForegroundColor Green

ssh -i $KEY "$USER@$SERVER" @"
set -e

# Check if services are already running
BACKEND_RUNNING=\$(pm2 list | grep -c 'backend.*online' || echo '0')
FRONTEND_RUNNING=\$(pm2 list | grep -c 'hospital-frontend.*online' || echo '0')

# Backend
if [ -d /home/bitnami/backend/dist ]; then
    cd /home/bitnami/backend
    if [ "\$BACKEND_RUNNING" -gt "0" ]; then
        echo '→ Restarting backend...'
        pm2 restart backend
    else
        echo '→ Starting backend on port 3000...'
        pm2 start dist/index.js --name backend --time
    fi
fi

# Frontend
if [ -d /home/bitnami/hospital-frontend/.next ]; then
    cd /home/bitnami/hospital-frontend
    if [ "\$FRONTEND_RUNNING" -gt "0" ]; then
        echo '→ Restarting frontend...'
        pm2 restart hospital-frontend
    else
        echo '→ Starting frontend on port 3001...'
        pm2 start npm --name hospital-frontend --time -- start
    fi
fi

# Save PM2 configuration
pm2 save

echo '✅ Services updated'
"@

Write-Host "✅ Services running" -ForegroundColor Green
Write-Host ""

# Health Check
Write-Host "🏥 Running Health Checks..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

ssh -i $KEY "$USER@$SERVER" @"
echo '→ PM2 Status:'
pm2 status

echo ''
echo '→ Backend Health:'
curl -s http://localhost:3000/health 2>/dev/null && echo ' ✓' || echo ' ✗ Not responding'

echo ''
echo '→ Frontend Health:'
curl -s -I http://localhost:3001 2>/dev/null | head -n 1 || echo '✗ Not responding'
"@

Write-Host ""
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Access Points:" -ForegroundColor Cyan
Write-Host "   Frontend: http://$SERVER:3001" -ForegroundColor Yellow
Write-Host "   Backend:  http://$SERVER:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "📊 Useful Commands:" -ForegroundColor Cyan
Write-Host "   ssh -i $KEY $USER@$SERVER 'pm2 status'" -ForegroundColor Gray
Write-Host "   ssh -i $KEY $USER@$SERVER 'pm2 logs'" -ForegroundColor Gray
Write-Host "   ssh -i $KEY $USER@$SERVER 'pm2 monit'" -ForegroundColor Gray
Write-Host ""
