# ===================================
# EMERGENCY AWS CREDENTIAL REMEDIATION
# ===================================
# Date: December 4, 2025
# Status: CRITICAL SECURITY INCIDENT

Write-Host "🚨 EMERGENCY AWS CREDENTIAL REMEDIATION" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

# Step 1: Remove credentials from .env files
Write-Host "Step 1: Sanitizing .env files..." -ForegroundColor Yellow

$envFiles = @(
    "backend\.env.production",
    "backend\.env.development",
    "backend\.env.migration"
)

foreach ($file in $envFiles) {
    if (Test-Path $file) {
        Write-Host "  Sanitizing $file..." -ForegroundColor Cyan
        
        # Read content
        $content = Get-Content $file -Raw
        
        # Replace actual credentials with placeholders
        $content = $content -replace 'AWS_ACCESS_KEY_ID=AKIAUAT3BEGMWNJF44ND', 'AWS_ACCESS_KEY_ID=your-access-key-here'
        $content = $content -replace 'AWS_SECRET_ACCESS_KEY=wCCDmmX5HGvJX1gvYINY62INJUD3gOTKBIz3crBU', 'AWS_SECRET_ACCESS_KEY=your-secret-key-here'
        $content = $content -replace 'SNS_ACCESS_KEY_ID=AKIAUAT3BEGM2H5JM46D', 'SNS_ACCESS_KEY_ID=your-sns-access-key-here'
        $content = $content -replace 'SNS_SECRET_ACCESS_KEY=8RUoLzzzOtIPVk08vPuG2WjJfc9JAlGPvdyqFDQt', 'SNS_SECRET_ACCESS_KEY=your-sns-secret-key-here'
        $content = $content -replace 'COGNITO_SECRET=1ea4ja2qnsmlmorlp0dbq6est0pkkif4ndke8gkhe009gu8uagrh', 'COGNITO_SECRET=your-cognito-secret-here'
        $content = $content -replace 'JWT_SECRET=4Vl0Th1zn3aG\+1T5dhLynENkCxKJGdi2eS3MOQX1WGk=', 'JWT_SECRET=your-jwt-secret-here'
        $content = $content -replace 'N8N_WEBHOOK_AUTH_TOKEN=Aspiration101\$', 'N8N_WEBHOOK_AUTH_TOKEN=your-n8n-token-here'
        
        # Write back
        Set-Content -Path $file -Value $content -NoNewline
        Write-Host "  ✅ $file sanitized" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Step 2: Verify .gitignore..." -ForegroundColor Yellow

# Check if .env files are in .gitignore
$gitignoreContent = Get-Content "backend\.gitignore" -Raw

$requiredEntries = @(
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
    ".env.migration"
)

$missing = @()
foreach ($entry in $requiredEntries) {
    if ($gitignoreContent -notmatch [regex]::Escape($entry)) {
        $missing += $entry
    }
}

if ($missing.Count -gt 0) {
    Write-Host "  ⚠️  Missing entries in .gitignore:" -ForegroundColor Yellow
    foreach ($entry in $missing) {
        Write-Host "    - $entry" -ForegroundColor Red
    }
    
    # Add missing entries
    Add-Content -Path "backend\.gitignore" -Value "`n# Environment files (CRITICAL - NEVER COMMIT)"
    foreach ($entry in $missing) {
        Add-Content -Path "backend\.gitignore" -Value $entry
    }
    Write-Host "  ✅ Added missing entries to .gitignore" -ForegroundColor Green
} else {
    Write-Host "  ✅ All .env files in .gitignore" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 3: Remove from git history..." -ForegroundColor Yellow
Write-Host "  ⚠️  WARNING: This will rewrite git history!" -ForegroundColor Red
Write-Host "  Run these commands manually:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  git filter-branch --force --index-filter \" -ForegroundColor Cyan
Write-Host "    git rm --cached --ignore-unmatch backend/.env.production \" -ForegroundColor Cyan
Write-Host "    git rm --cached --ignore-unmatch backend/.env.development \" -ForegroundColor Cyan
Write-Host "    git rm --cached --ignore-unmatch backend/.env.migration \" -ForegroundColor Cyan
Write-Host "  \" --prune-empty --tag-name-filter cat -- --all" -ForegroundColor Cyan
Write-Host ""
Write-Host "  git push origin --force --all" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 4: Commit sanitized files..." -ForegroundColor Yellow
git add backend/.env.production backend/.env.development backend/.env.migration backend/.gitignore
git commit -m "security: sanitize AWS credentials from .env files [CRITICAL]"
Write-Host "  ✅ Changes committed" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Red
Write-Host "🚨 IMMEDIATE ACTIONS REQUIRED:" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""
Write-Host "1. ⚠️  ROTATE AWS CREDENTIALS IMMEDIATELY:" -ForegroundColor Yellow
Write-Host "   - Go to AWS IAM Console" -ForegroundColor Cyan
Write-Host "   - Deactivate compromised keys:" -ForegroundColor Cyan
Write-Host "     * AKIAUAT3BEGMWNJF44ND (S3 Access)" -ForegroundColor Red
Write-Host "     * AKIAUAT3BEGM2H5JM46D (SNS Access)" -ForegroundColor Red
Write-Host "   - Create new access keys" -ForegroundColor Cyan
Write-Host "   - Update production server .env file" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. ⚠️  CHECK AWS SUPPORT CASE:" -ForegroundColor Yellow
Write-Host "   - Visit: https://aws.amazon.com/support" -ForegroundColor Cyan
Write-Host "   - Review the security case opened by AWS" -ForegroundColor Cyan
Write-Host "   - Follow AWS recommendations" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. ⚠️  AUDIT AWS ACCOUNT:" -ForegroundColor Yellow
Write-Host "   - Check CloudTrail for unauthorized access" -ForegroundColor Cyan
Write-Host "   - Review S3 bucket access logs" -ForegroundColor Cyan
Write-Host "   - Check for unauthorized EC2 instances" -ForegroundColor Cyan
Write-Host "   - Review billing for unexpected charges" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. ⚠️  UPDATE PRODUCTION SERVER:" -ForegroundColor Yellow
Write-Host "   - SSH to production: ssh bitnami@65.0.78.75" -ForegroundColor Cyan
Write-Host "   - Update /home/bitnami/multi-tenant-backend/.env" -ForegroundColor Cyan
Write-Host "   - Use NEW AWS credentials" -ForegroundColor Cyan
Write-Host "   - Restart backend: pm2 restart multi-tenant-backend" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. ⚠️  CLEAN GIT HISTORY:" -ForegroundColor Yellow
Write-Host "   - Run the git filter-branch commands above" -ForegroundColor Cyan
Write-Host "   - Force push to remove credentials from history" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Red
Write-Host "Script completed. Follow the steps above IMMEDIATELY!" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
