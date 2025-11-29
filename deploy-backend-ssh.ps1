# Deploy Backend via SSH to multi-tenant-backend folder

$SERVER = "65.0.78.75"
$KEY = "C:\app_dev\multi-tenant-backend\n8n\LightsailDefaultKey-ap-south-1.pem"
$USER = "ubuntu"

Write-Host "Deploying Backend CORS Fix..." -ForegroundColor Green

# Try to connect and deploy
$deployScript = @'
cd /home/ubuntu/multi-tenant-backend/backend || cd ~/multi-tenant-backend/backend || exit 1
echo "Current directory: $(pwd)"
echo "Git status:"
git status
echo ""
echo "Backing up config files..."
cp .env.production .env.production.backup 2>/dev/null || true
cp ecosystem.config.js ecosystem.config.js.backup 2>/dev/null || true
echo ""
echo "Pulling latest code..."
git fetch origin
git reset --hard origin/main
echo ""
echo "Restoring config files..."
cp .env.production.backup .env.production 2>/dev/null || true
cp ecosystem.config.js.backup ecosystem.config.js 2>/dev/null || true
echo ""
echo "Building..."
npm run build
echo ""
echo "Restarting backend..."
pm2 restart backend || pm2 restart all
echo ""
echo "Status:"
pm2 status
echo ""
echo "Health check:"
curl -s http://localhost:3000/health
'@

Write-Host "Executing deployment script..." -ForegroundColor Cyan
ssh -i $KEY ${USER}@${SERVER} $deployScript

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Deployment successful!" -ForegroundColor Green
    Write-Host "Test frontend: https://aajminpolyclinic.healthsync.live" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Deployment failed" -ForegroundColor Red
    Write-Host "`nTry AWS Console method:" -ForegroundColor Yellow
    Write-Host "1. Go to https://lightsail.aws.amazon.com/" -ForegroundColor White
    Write-Host "2. Click instance -> Connect using SSH" -ForegroundColor White
    Write-Host "3. Run: cd ~/multi-tenant-backend/backend && git pull origin main && npm run build && pm2 restart backend" -ForegroundColor White
}
