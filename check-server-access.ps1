# Check Server Access and Directory Structure

$SERVER = "65.0.78.75"
$KEY = "C:\app_dev\multi-tenant-backend\n8n\LightsailDefaultKey-ap-south-1.pem"

Write-Host "Checking Server Access..." -ForegroundColor Cyan

# Method 1: Try with ubuntu user
Write-Host "`nTrying with ubuntu user..." -ForegroundColor Yellow
ssh -i $KEY ubuntu@$SERVER "pwd; ls -la" 2>&1

# Method 2: Try with ec2-user
Write-Host "`nTrying with ec2-user..." -ForegroundColor Yellow
ssh -i $KEY ec2-user@$SERVER "pwd; ls -la" 2>&1

# Check key file
Write-Host "`nChecking key file..." -ForegroundColor Yellow
if (Test-Path $KEY) {
    Write-Host "Key file exists" -ForegroundColor Green
    $content = Get-Content $KEY -First 1
    Write-Host "Key starts with: $content" -ForegroundColor White
} else {
    Write-Host "Key file not found" -ForegroundColor Red
}

Write-Host "`nAlternative: Use AWS Lightsail Console" -ForegroundColor Cyan
Write-Host "Go to: https://lightsail.aws.amazon.com/" -ForegroundColor White
Write-Host "Click your instance and Connect using SSH button" -ForegroundColor White
