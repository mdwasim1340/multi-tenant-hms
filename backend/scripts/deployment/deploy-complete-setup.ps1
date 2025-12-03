# Complete Tenant Setup and Deployment
# December 3, 2025

$ErrorActionPreference = "Stop"

$SERVER_IP = "65.0.78.75"
$SERVER_USER = "bitnami"
$SSH_KEY = "n8n/LightsailDefaultKey-ap-south-1.pem"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Complete Tenant Setup and Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Setup Cognito Users
Write-Host "Step 1: Setting up Cognito users..." -ForegroundColor Yellow
Set-Location backend
node ../setup-cognito-users.js
Set-Location ..
Write-Host "Cognito users created!" -ForegroundColor Green
Write-Host ""

# Step 2: Upload SQL script
Write-Host "Step 2: Uploading database setup script..." -ForegroundColor Yellow
scp -i $SSH_KEY setup-proper-tenants.sql "${SERVER_USER}@${SERVER_IP}:/home/bitnami/"
Write-Host "SQL script uploaded!" -ForegroundColor Green
Write-Host ""

# Step 3: Run database setup
Write-Host "Step 3: Setting up database..." -ForegroundColor Yellow
ssh -i $SSH_KEY "${SERVER_USER}@${SERVER_IP}" "docker exec -i backend-postgres-1 psql -U postgres -d multitenant_db < /home/bitnami/setup-proper-tenants.sql"
Write-Host "Database setup complete!" -ForegroundColor Green
Write-Host ""

# Step 4: Deploy v2 fix
Write-Host "Step 4: Deploying v2 fix..." -ForegroundColor Yellow
.\deploy-fix.ps1
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "6 Tenants Created:" -ForegroundColor Yellow
Write-Host "1. Aajmin Polyclinic    - admin@aajmin.hospital / AajminAdmin@2024" -ForegroundColor White
Write-Host "2. Sunrise Medical      - admin@sunrise.hospital / SunriseAdmin@2024" -ForegroundColor White
Write-Host "3. City General         - admin@city.hospital / CityAdmin@2024" -ForegroundColor White
Write-Host "4. Green Valley         - admin@valley.hospital / ValleyAdmin@2024" -ForegroundColor White
Write-Host "5. Riverside Medical    - admin@riverside.hospital / RiversideAdmin@2024" -ForegroundColor White
Write-Host "6. General Hospital     - admin@general.hospital / GeneralAdmin@2024" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Configure DNS for subdomains (aajmin, sunrise, city, valley, riverside, general)" -ForegroundColor White
Write-Host "2. Configure Apache virtual hosts" -ForegroundColor White
Write-Host "3. Test login for each hospital" -ForegroundColor White
Write-Host ""
Write-Host "See PROPER_TENANT_CREDENTIALS.md for full details" -ForegroundColor Cyan
Write-Host ""
