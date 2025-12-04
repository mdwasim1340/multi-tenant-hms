# 🚨 IMMEDIATE ACTIONS REQUIRED - December 4, 2025

**Status**: CRITICAL - AWS Credentials Compromised  
**Priority**: P0 - Drop Everything and Execute  
**Time Sensitive**: Complete within 1 hour

---

## ✅ COMPLETED ACTIONS

1. ✅ **Repository Sanitized**
   - All AWS credentials removed from .env files
   - Replaced with placeholders
   - Changes committed and pushed to GitHub

2. ✅ **n8n Chat Widget Fixed**
   - Removed hardcoded localhost URL
   - Now uses `NEXT_PUBLIC_API_URL` environment variable
   - Changes committed and pushed

3. ✅ **Documentation Created**
   - Security incident report
   - Remediation scripts
   - Deployment guides

---

## 🚨 CRITICAL ACTIONS (DO NOW!)

### ACTION 1: Rotate AWS Credentials (15 minutes)

#### Step 1.1: Deactivate Compromised Keys
```bash
# Login to AWS Console
https://console.aws.amazon.com/iam/

# Navigate to: IAM > Users > [your-user] > Security credentials

# Deactivate IMMEDIATELY:
AKIAUAT3BEGMWNJF44ND (S3 Access)
AKIAUAT3BEGM2H5JM46D (SNS Access)

# DO NOT DELETE YET - deactivate first, test new keys, then delete
```

#### Step 1.2: Create New Access Keys
```bash
# In AWS IAM Console:
1. Click "Create access key"
2. Select "Application running outside AWS"
3. Download credentials CSV
4. Save securely (password manager)
5. Copy new keys for next step
```

#### Step 1.3: Generate New Secrets
```powershell
# Generate new JWT secret
$jwtSecret = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
Write-Host "JWT_SECRET=$jwtSecret"

# Generate new n8n token
$n8nToken = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
Write-Host "N8N_WEBHOOK_AUTH_TOKEN=$n8nToken"
```

---

### ACTION 2: Update Production Server (10 minutes)

```bash
# SSH to production
ssh -i "C:\app_dev\multi-tenant-backend\n8n\LightsailDefaultKey-ap-south-1.pem" bitnami@65.0.78.75

# Edit backend .env
nano /home/bitnami/multi-tenant-backend/.env

# Update these values with NEW credentials:
AWS_ACCESS_KEY_ID=<new-s3-access-key>
AWS_SECRET_ACCESS_KEY=<new-s3-secret-key>
SNS_ACCESS_KEY_ID=<new-sns-access-key>
SNS_SECRET_ACCESS_KEY=<new-sns-secret-key>
JWT_SECRET=<new-jwt-secret>
N8N_WEBHOOK_AUTH_TOKEN=<new-n8n-token>

# Save and exit (Ctrl+X, Y, Enter)

# Restart backend
pm2 restart multi-tenant-backend

# Verify it started
pm2 logs multi-tenant-backend --lines 50

# Test S3 access
curl http://localhost:3001/health | jq '.services.s3'

# Should show: "status": "healthy"
```

---

### ACTION 3: Deploy n8n Chat Fix (10 minutes)

Since frontend is not a git repo, we need to manually update the file:

```bash
# Still SSH'd to production
cd /home/bitnami/hospital-frontend

# Backup current file
cp components/chat-widget.tsx components/chat-widget.tsx.backup

# Edit the file
nano components/chat-widget.tsx

# Find line ~42 (in ChatWidget function):
# Add this line after the recognitionRef declaration:
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

# Find line ~100 (in handleSendMessage function):
# Change:
const response = await fetch("http://localhost:3000/api/n8n/chat", {
# To:
const response = await fetch(`${API_URL}/api/n8n/chat`, {

# Also update headers to include:
headers: { 
  "Content-Type": "application/json",
  "X-App-ID": "hospital-management",
  "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "hospital-dev-key-123"
},

# Save and exit

# Rebuild frontend
npm run build

# Restart frontend
pm2 restart hospital-frontend

# Check logs
pm2 logs hospital-frontend --lines 50
```

**Alternative**: Copy the fixed file from local:
```powershell
# From your local machine
scp -i "C:\app_dev\multi-tenant-backend\n8n\LightsailDefaultKey-ap-south-1.pem" `
  hospital-management-system/components/chat-widget.tsx `
  bitnami@65.0.78.75:/home/bitnami/hospital-frontend/components/chat-widget.tsx

# Then SSH and rebuild
ssh -i "C:\app_dev\multi-tenant-backend\n8n\LightsailDefaultKey-ap-south-1.pem" bitnami@65.0.78.75
cd /home/bitnami/hospital-frontend
npm run build
pm2 restart hospital-frontend
```

---

### ACTION 4: Verify Everything Works (5 minutes)

#### Test Backend
```bash
# Health check
curl https://backend.aajminpolyclinic.com.np/health

# n8n status
curl https://backend.aajminpolyclinic.com.np/api/n8n/status

# Test n8n chat
curl -X POST https://backend.aajminpolyclinic.com.np/api/n8n/chat \
  -H "Content-Type: application/json" \
  -H "X-App-ID: hospital-management" \
  -H "X-API-Key: hospital-dev-key-123" \
  -d '{
    "message": "Hello",
    "sessionId": "test-123",
    "department": "general"
  }'
```

#### Test Frontend
1. Open: https://sunrise.aajminpolyclinic.com.np/appointments
2. Click chat widget (bottom right)
3. Select "General Query"
4. Type: "Hello"
5. Press Enter
6. Verify response received (not "ERR_CONNECTION_REFUSED")

---

### ACTION 5: Audit AWS Account (15 minutes)

```bash
# Check CloudTrail for unauthorized access
https://console.aws.amazon.com/cloudtrail/

# Look for:
- Unusual API calls
- Access from unknown IP addresses
- Failed authentication attempts
- Resource creation (EC2, Lambda, etc.)

# Check S3 bucket access
https://console.aws.amazon.com/s3/

# Review access logs for multi-tenant-12 bucket
# Look for unauthorized downloads

# Check EC2 instances
https://console.aws.amazon.com/ec2/

# Look for unauthorized instances (crypto mining)

# Review billing
https://console.aws.amazon.com/billing/

# Check for unexpected charges
```

---

### ACTION 6: Respond to AWS Support Case (5 minutes)

```bash
# Visit: https://aws.amazon.com/support

# Find the security case opened by AWS

# Respond with:
Subject: Remediation Actions Completed - Compromised Credentials

Body:
We have completed the following remediation actions:

1. Deactivated compromised access keys:
   - AKIAUAT3BEGMWNJF44ND (S3)
   - AKIAUAT3BEGM2H5JM46D (SNS)

2. Created new access keys and rotated all secrets

3. Updated production server with new credentials

4. Removed credentials from GitHub repository

5. Audited AWS account for unauthorized access:
   - CloudTrail logs reviewed
   - S3 access logs reviewed
   - No unauthorized EC2 instances found
   - No unexpected billing charges

6. Implemented prevention measures:
   - Enhanced .gitignore
   - Created pre-commit hooks
   - Team security training scheduled

Please confirm if any additional actions are required.

Thank you,
[Your Name]
```

---

### ACTION 7: Delete Old AWS Keys (After Verification)

```bash
# ONLY after confirming new keys work:

# In AWS IAM Console:
1. Go to Security credentials
2. Find the deactivated keys
3. Click "Delete"
4. Confirm deletion

# Keys to delete:
- AKIAUAT3BEGMWNJF44ND
- AKIAUAT3BEGM2H5JM46D
```

---

## 📋 Verification Checklist

### AWS Security
- [ ] Old access keys deactivated
- [ ] New access keys created
- [ ] Production server updated with new keys
- [ ] Backend service restarted successfully
- [ ] S3 uploads working
- [ ] SNS notifications working
- [ ] CloudTrail logs reviewed
- [ ] No unauthorized access found
- [ ] No unexpected billing charges
- [ ] Old keys deleted (after verification)

### Application Functionality
- [ ] Backend health check passing
- [ ] n8n status endpoint working
- [ ] n8n chat endpoint responding
- [ ] Frontend chat widget working
- [ ] All 4 departments tested (OPD, Ward, Emergency, General)
- [ ] No console errors
- [ ] PM2 logs clean

### Repository Security
- [ ] Credentials removed from .env files
- [ ] Changes committed and pushed
- [ ] .gitignore verified
- [ ] Security documentation created

### Communication
- [ ] AWS Support case responded to
- [ ] Team notified
- [ ] Management informed (if required)

---

## 🔄 If Something Goes Wrong

### Backend Won't Start
```bash
# Check logs
pm2 logs multi-tenant-backend --lines 100

# Common issues:
# - Invalid AWS credentials format
# - Missing environment variables
# - Database connection failed

# Rollback if needed:
# Restore old .env (but use NEW AWS keys)
```

### S3 Not Working
```bash
# Test AWS credentials
aws s3 ls s3://multi-tenant-12 --profile production

# If fails, verify:
# - Access key format (starts with AKIA)
# - Secret key copied correctly
# - IAM permissions correct
```

### Chat Widget Not Working
```bash
# Check frontend logs
pm2 logs hospital-frontend --lines 100

# Check browser console
# Look for:
# - ERR_CONNECTION_REFUSED (backend down)
# - 403 Forbidden (auth issue)
# - 500 Internal Server Error (backend error)

# Verify environment variable
echo $NEXT_PUBLIC_API_URL
# Should be: https://backend.aajminpolyclinic.com.np
```

---

## 📞 Emergency Contacts

**AWS Support**: https://aws.amazon.com/support  
**Security Team**: security@aajminpolyclinic.com.np  
**On-Call Engineer**: [Your Phone]

---

## 📚 Related Documents

- `docs/SECURITY_INCIDENT_AWS_CREDENTIALS_DEC_4_2025.md` - Full incident report
- `backend/scripts/security/EMERGENCY_AWS_CREDENTIAL_REMEDIATION.ps1` - Automated remediation
- `hospital-management-system/docs/N8N_CHAT_FIX_COMPLETE.md` - Chat fix documentation
- `backend/docs/fixes/N8N_CHAT_INTEGRATION_FIX_DEC_4.md` - Technical details

---

## ⏱️ Timeline

| Time | Action | Duration |
|------|--------|----------|
| Now | Rotate AWS credentials | 15 min |
| +15 | Update production server | 10 min |
| +25 | Deploy n8n chat fix | 10 min |
| +35 | Verify functionality | 5 min |
| +40 | Audit AWS account | 15 min |
| +55 | Respond to AWS Support | 5 min |
| +60 | Delete old keys | 2 min |

**Total Time**: ~60 minutes

---

**START NOW! Every minute counts in a security incident.**
