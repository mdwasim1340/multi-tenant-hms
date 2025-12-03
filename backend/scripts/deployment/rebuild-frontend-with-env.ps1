# Rebuild Frontend with Environment Variables
# Date: December 3, 2025

Write-Host "🔨 Rebuilding frontend with environment variables..." -ForegroundColor Cyan

# Step 1: Build locally with production env
Write-Host "`n📦 Step 1: Building frontend locally..." -ForegroundColor Yellow
cd hospital-management-system

# Create .env.production locally
Write-Host "Creating .env.production file..." -ForegroundColor Gray
@"
NEXT_PUBLIC_API_URL=https://backend.aajminpolyclinic.com.np
NEXT_PUBLIC_APP_ID=hospital-management
NEXT_PUBLIC_API_KEY=hospital-dev-key-123
"@ | Out-File -FilePath .env.production -Encoding utf8

# Build
Write-Host "Running npm run build..." -ForegroundColor Gray
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completed successfully!" -ForegroundColor Green

# Step 2: Create tarball
Write-Host "`n📦 Step 2: Creating tarball..." -ForegroundColor Yellow
cd ..
tar -czf frontend-with-env-dec3.tar.gz -C hospital-management-system .next

Write-Host "✅ Tarball created: frontend-with-env-dec3.tar.gz" -ForegroundColor Green

# Step 3: Upload to server
Write-Host "`n📤 Step 3: Uploading to server..." -ForegroundColor Yellow
scp -i n8n/LightsailDefaultKey-ap-south-1.pem frontend-with-env-dec3.tar.gz bitnami@65.0.78.75:~/frontend-with-env-dec3.tar.gz

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Upload failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Upload completed!" -ForegroundColor Green

# Step 4: Extract and restart on server
Write-Host "`n🚀 Step 4: Deploying on server..." -ForegroundColor Yellow

$commands = @"
cd ~/hospital-frontend && \
rm -rf .next && \
tar -xzf ~/frontend-with-env-dec3.tar.gz && \
pm2 restart hospital-frontend && \
pm2 logs hospital-frontend --lines 20 --nostream
"@

ssh -i n8n/LightsailDefaultKey-ap-south-1.pem bitnami@65.0.78.75 $commands

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Frontend rebuilt and deployed with environment variables!" -ForegroundColor Green
Write-Host "🌐 Test at: https://sunrise.aajminpolyclinic.com.np" -ForegroundColor Cyan
