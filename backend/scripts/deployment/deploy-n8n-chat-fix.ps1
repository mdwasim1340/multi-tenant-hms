# ===================================
# Deploy n8n Chat Fix to Production
# ===================================
# Date: December 4, 2025

Write-Host "🚀 Deploying n8n Chat Fix to Production" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Production server details
$SERVER = "65.0.78.75"
$USER = "bitnami"
$KEY_PATH = "C:\app_dev\multi-tenant-backend\n8n\LightsailDefaultKey-ap-south-1.pem"
$BACKEND_PATH = "/home/bitnami/multi-tenant-backend"
$FRONTEND_PATH = "/home/bitnami/hospital-frontend"

Write-Host "📋 Deployment Plan:" -ForegroundColor Yellow
Write-Host "  1. Deploy frontend (n8n chat widget fix)" -ForegroundColor White
Write-Host "  2. Verify n8n configuration" -ForegroundColor White
Write-Host "  3. Test chat functionality" -ForegroundColor White
Write-Host ""

# Step 1: Deploy Frontend
Write-Host "Step 1: Deploying Frontend..." -ForegroundColor Yellow
Write-Host "  Connecting to production server..." -ForegroundColor Cyan

$frontendCommands = @"
cd $FRONTEND_PATH
echo '📥 Pulling latest changes...'
git pull origin main
echo '📦 Installing dependencies...'
npm install
echo '🔨 Building frontend...'
npm run build
echo '🔄 Restarting PM2...'
pm2 restart hospital-frontend
echo '✅ Frontend deployed!'
pm2 logs hospital-frontend --lines 20 --nostream
"@

Write-Host "  Executing deployment commands..." -ForegroundColor Cyan
ssh -i $KEY_PATH "$USER@$SERVER" $frontendCommands

Write-Host ""
Write-Host "Step 2: Verifying n8n Configuration..." -ForegroundColor Yellow

$verifyCommands = @"
cd $BACKEND_PATH
echo '🔍 Checking n8n environment variables...'
cat .env | grep N8N_ | grep -v SECRET | grep -v TOKEN
echo ''
echo '🧪 Testing n8n status endpoint...'
curl -s http://localhost:3001/api/n8n/status | jq '.'
"@

ssh -i $KEY_PATH "$USER@$SERVER" $verifyCommands

Write-Host ""
Write-Host "Step 3: Testing Chat Functionality..." -ForegroundColor Yellow
Write-Host "  Manual testing required:" -ForegroundColor Cyan
Write-Host "  1. Open: https://sunrise.aajminpolyclinic.com.np/appointments" -ForegroundColor White
Write-Host "  2. Click chat widget (bottom right)" -ForegroundColor White
Write-Host "  3. Select department" -ForegroundColor White
Write-Host "  4. Send test message" -ForegroundColor White
Write-Host "  5. Verify response received" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Test chat widget in production" -ForegroundColor White
Write-Host "  2. Monitor PM2 logs for errors" -ForegroundColor White
Write-Host "  3. Verify all 4 departments work" -ForegroundColor White
Write-Host ""
Write-Host "📝 Monitoring Commands:" -ForegroundColor Yellow
Write-Host "  ssh -i $KEY_PATH $USER@$SERVER" -ForegroundColor Cyan
Write-Host "  pm2 logs hospital-frontend --lines 50" -ForegroundColor Cyan
Write-Host "  pm2 logs multi-tenant-backend --lines 50" -ForegroundColor Cyan
Write-Host ""
