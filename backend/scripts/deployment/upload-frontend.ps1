# Frontend Upload Script
$ErrorActionPreference = "Stop"

Write-Host "========================================"
Write-Host "Frontend Upload to AWS Lightsail"
Write-Host "========================================"
Write-Host ""

$SSH_KEY = "n8n/LightsailDefaultKey-ap-south-1.pem"
$SERVER = "bitnami@65.0.78.75"
$REMOTE_DIR = "/opt/hospital-management/frontend"

if (-not (Test-Path $SSH_KEY)) {
    Write-Host "ERROR: SSH key not found" -ForegroundColor Red
    exit 1
}

Write-Host "Creating remote directory..."
ssh -i $SSH_KEY $SERVER "sudo mkdir -p $REMOTE_DIR && sudo chown bitnami:bitnami $REMOTE_DIR"
Write-Host "Done" -ForegroundColor Green
Write-Host ""

Write-Host "Uploading files (this may take a few minutes)..."
scp -i $SSH_KEY -r hospital-management-system/.next "${SERVER}:${REMOTE_DIR}/"
scp -i $SSH_KEY -r hospital-management-system/app "${SERVER}:${REMOTE_DIR}/"
scp -i $SSH_KEY -r hospital-management-system/components "${SERVER}:${REMOTE_DIR}/"
scp -i $SSH_KEY -r hospital-management-system/hooks "${SERVER}:${REMOTE_DIR}/"
scp -i $SSH_KEY -r hospital-management-system/lib "${SERVER}:${REMOTE_DIR}/"
scp -i $SSH_KEY -r hospital-management-system/public "${SERVER}:${REMOTE_DIR}/"
scp -i $SSH_KEY -r hospital-management-system/styles "${SERVER}:${REMOTE_DIR}/"
scp -i $SSH_KEY hospital-management-system/package.json "${SERVER}:${REMOTE_DIR}/"
scp -i $SSH_KEY hospital-management-system/package-lock.json "${SERVER}:${REMOTE_DIR}/"
scp -i $SSH_KEY hospital-management-system/next.config.mjs "${SERVER}:${REMOTE_DIR}/"
scp -i $SSH_KEY hospital-management-system/tsconfig.json "${SERVER}:${REMOTE_DIR}/"
scp -i $SSH_KEY hospital-management-system/postcss.config.mjs "${SERVER}:${REMOTE_DIR}/"
scp -i $SSH_KEY hospital-management-system/components.json "${SERVER}:${REMOTE_DIR}/"
scp -i $SSH_KEY hospital-management-system/.env.production "${SERVER}:${REMOTE_DIR}/.env.local"

Write-Host "Done" -ForegroundColor Green
Write-Host ""

Write-Host "Uploading deployment script..."
scp -i $SSH_KEY deploy-frontend-only.sh "${SERVER}:~/"
Write-Host "Done" -ForegroundColor Green
Write-Host ""

Write-Host "========================================"
Write-Host "Upload Complete!" -ForegroundColor Green
Write-Host "========================================"
Write-Host ""
Write-Host "Next: Connect to server and run deployment"
Write-Host ""
