# Deploy Backend to Production
# Server: 65.0.78.75 (bitnami user)

$SERVER = "65.0.78.75"
$USER = "bitnami"
$KEY = "C:\app_dev\multi-tenant-backend\n8n\LightsailDefaultKey-ap-south-1.pem"
$LOCAL_BACKEND = "backend"
$REMOTE_PATH = "/home/bitnami/backend"

Write-Host "🚀 Deploying Backend..." -ForegroundColor Cyan
Write-Host ""

# Create remote directory
Write-Host "📁 Creating remote directory..." -ForegroundColor Yellow
ssh -i $KEY "$USER@$SERVER" "mkdir -p $REMOTE_PATH"

# Upload source files (excluding node_modules)
Write-Host "📤 Uploading backend source files..." -ForegroundColor Yellow
scp -i $KEY -r $LOCAL_BACKEND/src "$USER@$SERVER:$REMOTE_PATH/"
scp -i $KEY -r $LOCAL_BACKEND/migrations "$USER@$SERVER:$REMOTE_PATH/"
scp -i $KEY -r $LOCAL_BACKEND/scripts "$USER@$SERVER:$REMOTE_PATH/"

# Upload package files
Write-Host "📤 Uploading package.json..." -ForegroundColor Yellow
scp -i $KEY $LOCAL_BACKEND/package.json "$USER@$SERVER:$REMOTE_PATH/"
scp -i $KEY $LOCAL_BACKEND/package-lock.json "$USER@$SERVER:$REMOTE_PATH/"

# Upload tsconfig
Write-Host "📤 Uploading tsconfig.json..." -ForegroundColor Yellow
scp -i $KEY $LOCAL_BACKEND/tsconfig.json "$USER@$SERVER:$REMOTE_PATH/"

# Upload .env (if exists)
if (Test-Path "$LOCAL_BACKEND/.env") {
    Write-Host "📤 Uploading .env file..." -ForegroundColor Yellow
    scp -i $KEY $LOCAL_BACKEND/.env "$USER@$SERVER:$REMOTE_PATH/"
}

# Install dependencies
Write-Host "📦 Installing dependencies on server..." -ForegroundColor Yellow
ssh -i $KEY "$USER@$SERVER" @"
cd $REMOTE_PATH
npm install --production
"@

Write-Host ""
Write-Host "✅ Backend Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the backend:" -ForegroundColor Cyan
Write-Host "ssh -i $KEY $USER@$SERVER" -ForegroundColor White
Write-Host "cd $REMOTE_PATH" -ForegroundColor White
Write-Host "npm start" -ForegroundColor White
Write-Host ""
Write-Host "Or with PM2:" -ForegroundColor Cyan
Write-Host "pm2 start npm --name backend -- start" -ForegroundColor White
Write-Host "pm2 save" -ForegroundColor White
Write-Host ""
