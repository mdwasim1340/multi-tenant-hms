# Deploy Hospital Management System Frontend to Production
# Server: 65.0.78.75 (bitnami user)

$SERVER = "65.0.78.75"
$USER = "bitnami"
$KEY = "C:\app_dev\multi-tenant-backend\n8n\LightsailDefaultKey-ap-south-1.pem"
$LOCAL_BUILD = "hospital-management-system\.next"
$REMOTE_PATH = "/home/bitnami/hospital-frontend"
$REMOTE_USER_SERVER = "${USER}@${SERVER}"

Write-Host "Deploying Hospital Management System Frontend..." -ForegroundColor Cyan
Write-Host ""

# Check if build exists
if (-not (Test-Path $LOCAL_BUILD)) {
    Write-Host "Build folder not found at: $LOCAL_BUILD" -ForegroundColor Red
    Write-Host "Please run 'npm run build' first" -ForegroundColor Yellow
    exit 1
}

Write-Host "Build folder found" -ForegroundColor Green

# Create remote directory
Write-Host "Creating remote directory..." -ForegroundColor Yellow
ssh -i $KEY $REMOTE_USER_SERVER "mkdir -p $REMOTE_PATH"

# Upload .next folder
Write-Host "Uploading .next folder..." -ForegroundColor Yellow
scp -i $KEY -r $LOCAL_BUILD "${REMOTE_USER_SERVER}:${REMOTE_PATH}/"

# Upload package files
Write-Host "Uploading package.json..." -ForegroundColor Yellow
scp -i $KEY hospital-management-system/package.json "${REMOTE_USER_SERVER}:${REMOTE_PATH}/"
scp -i $KEY hospital-management-system/package-lock.json "${REMOTE_USER_SERVER}:${REMOTE_PATH}/"

# Upload next.config.mjs
Write-Host "Uploading next.config.mjs..." -ForegroundColor Yellow
scp -i $KEY hospital-management-system/next.config.mjs "${REMOTE_USER_SERVER}:${REMOTE_PATH}/"

# Upload public folder
Write-Host "Uploading public folder..." -ForegroundColor Yellow
scp -i $KEY -r hospital-management-system/public "${REMOTE_USER_SERVER}:${REMOTE_PATH}/"

# Upload .env.production
Write-Host "Uploading environment file..." -ForegroundColor Yellow
scp -i $KEY hospital-management-system/.env.production "${REMOTE_USER_SERVER}:${REMOTE_PATH}/.env.production"

# Install dependencies and start
Write-Host "Installing dependencies on server..." -ForegroundColor Yellow
ssh -i $KEY $REMOTE_USER_SERVER "cd $REMOTE_PATH && npm install --production"

Write-Host ""
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the application:" -ForegroundColor Cyan
Write-Host "ssh -i $KEY $REMOTE_USER_SERVER" -ForegroundColor White
Write-Host "cd $REMOTE_PATH" -ForegroundColor White
Write-Host "npm start" -ForegroundColor White
Write-Host ""
Write-Host "Or with PM2:" -ForegroundColor Cyan
Write-Host "pm2 start npm --name hospital-frontend -- start" -ForegroundColor White
Write-Host "pm2 save" -ForegroundColor White
Write-Host ""
