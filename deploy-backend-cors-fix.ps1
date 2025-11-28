# Deploy Backend CORS Fix to Production Server
# This script uploads the deployment script and executes it

$SERVER = "65.0.78.75"
$KEY = "n8n\LightsailDefaultKey-ap-south-1.pem"
$USER = "ubuntu"

Write-Host "🚀 Deploying Backend CORS Fix to Production..." -ForegroundColor Green

# Step 1: Upload deployment script
Write-Host "`n📤 Uploading deployment script..." -ForegroundColor Cyan
scp -i $KEY deploy-backend-cors-fix.sh ${USER}@${SERVER}:/home/ubuntu/

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload deployment script" -ForegroundColor Red
    Write-Host "`n💡 Alternative: Manually run these commands on the server:" -ForegroundColor Yellow
    Write-Host @"
    
ssh -i $KEY ${USER}@${SERVER}
cd /home/ubuntu/backend
git pull origin development
npm install
npm run build
pm2 restart backend
pm2 status
"@
    exit 1
}

# Step 2: Execute deployment script
Write-Host "`n🔧 Executing deployment on server..." -ForegroundColor Cyan
ssh -i $KEY ${USER}@${SERVER} "bash /home/ubuntu/deploy-backend-cors-fix.sh"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Backend CORS fix deployed successfully!" -ForegroundColor Green
    Write-Host "`n🌐 Test the frontend now:" -ForegroundColor Cyan
    Write-Host "   https://aajminpolyclinic.healthsync.live" -ForegroundColor White
} else {
    Write-Host "`n❌ Deployment failed" -ForegroundColor Red
}
