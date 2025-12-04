# 🚨 CRITICAL SECURITY INCIDENT - AWS Credentials Exposed

**Date**: December 4, 2025  
**Severity**: CRITICAL  
**Status**: REMEDIATION IN PROGRESS  
**Incident ID**: SEC-2025-12-04-001

---

## Executive Summary

AWS credentials were accidentally committed to the public GitHub repository, triggering an AWS security alert. Immediate remediation actions have been taken to sanitize the repository and rotate credentials.

## Compromised Credentials

### AWS IAM Access Keys (COMPROMISED)
```
AWS_ACCESS_KEY_ID: AKIAUAT3BEGMWNJF44ND (S3 Access)
AWS_SECRET_ACCESS_KEY: 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

SNS_ACCESS_KEY_ID: AKIAUAT3BEGM2H5JM46D (SNS Access)
SNS_SECRET_ACCESS_KEY: 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
```

### Other Exposed Secrets
```
COGNITO_SECRET: 1ea4ja2qnsmlmorlp0dbq6est0pkkif4ndke8gkhe009gu8uagrh
JWT_SECRET: 4Vl0Th1zn3aG+1T5dhLynENkCxKJGdi2eS3MOQX1WGk=
N8N_WEBHOOK_AUTH_TOKEN: Aspiration101$
```

### Exposed Files
- `backend/.env.production`
- `backend/.env.development`
- `backend/.env.migration`

### AWS Resources at Risk
- S3 Bucket: `multi-tenant-12` (contains tenant medical records)
- SNS Topics: Android/iOS push notifications
- Cognito User Pool: `us-east-1_tvpXwEgfS`
- AWS Account: `276209672601`

---

## Immediate Actions Taken ✅

### 1. Repository Sanitization (COMPLETED)
- ✅ Sanitized `backend/.env.production`
- ✅ Sanitized `backend/.env.development`
- ✅ Sanitized `backend/.env.migration`
- ✅ Replaced all credentials with placeholders
- ✅ Verified `.gitignore` includes all .env files
- ✅ Created remediation scripts

### 2. Documentation Created
- ✅ `backend/scripts/security/EMERGENCY_AWS_CREDENTIAL_REMEDIATION.ps1`
- ✅ `docs/SECURITY_INCIDENT_AWS_CREDENTIALS_DEC_4_2025.md` (this file)

---

## CRITICAL ACTIONS REQUIRED (DO NOW!)

### ⚠️ STEP 1: Deactivate Compromised AWS Keys (URGENT)

```bash
# Login to AWS Console
# https://console.aws.amazon.com/iam/

# Navigate to: IAM > Users > [your-user] > Security credentials

# Deactivate these keys IMMEDIATELY:
# - AKIAUAT3BEGMWNJF44ND (S3 Access)
# - AKIAUAT3BEGM2H5JM46D (SNS Access)

# Then DELETE the keys after creating new ones
```

### ⚠️ STEP 2: Create New AWS Access Keys

```bash
# In AWS IAM Console:
# 1. Create new access key for S3
# 2. Create new access key for SNS
# 3. Download and save securely
# 4. Update production server .env file
```

### ⚠️ STEP 3: Rotate All Secrets

Generate new secrets for:
```bash
# Cognito Secret (if possible)
# JWT Secret
openssl rand -base64 32

# n8n Webhook Token
openssl rand -hex 16
```

### ⚠️ STEP 4: Update Production Server

```bash
# SSH to production
ssh -i "C:\app_dev\multi-tenant-backend\n8n\LightsailDefaultKey-ap-south-1.pem" bitnami@65.0.78.75

# Edit .env file
nano /home/bitnami/multi-tenant-backend/.env

# Update with NEW credentials:
# - AWS_ACCESS_KEY_ID=<new-key>
# - AWS_SECRET_ACCESS_KEY=<new-secret>
# - SNS_ACCESS_KEY_ID=<new-sns-key>
# - SNS_SECRET_ACCESS_KEY=<new-sns-secret>
# - JWT_SECRET=<new-jwt-secret>
# - N8N_WEBHOOK_AUTH_TOKEN=<new-n8n-token>

# Restart backend
pm2 restart multi-tenant-backend

# Verify
pm2 logs multi-tenant-backend --lines 50
```

### ⚠️ STEP 5: Clean Git History

```powershell
# WARNING: This rewrites git history!
# Backup your repository first

# Remove .env files from git history
git filter-branch --force --index-filter `
  "git rm --cached --ignore-unmatch backend/.env.production backend/.env.development backend/.env.migration" `
  --prune-empty --tag-name-filter cat -- --all

# Force push to remove from GitHub
git push origin --force --all
git push origin --force --tags

# Clean local repository
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### ⚠️ STEP 6: Audit AWS Account

```bash
# Check CloudTrail for unauthorized access
# https://console.aws.amazon.com/cloudtrail/

# Review S3 bucket access logs
# Check for unauthorized file access/downloads

# Check EC2 instances
# Look for unauthorized instances (crypto mining)

# Review billing
# Check for unexpected charges

# Check IAM users
# Look for unauthorized users/roles
```

### ⚠️ STEP 7: Review AWS Support Case

```bash
# Visit: https://aws.amazon.com/support
# Review the security case opened by AWS
# Follow all AWS recommendations
# Respond to AWS with remediation actions taken
```

---

## Security Audit Checklist

### AWS Account Security
- [ ] Compromised access keys deactivated
- [ ] New access keys created and secured
- [ ] CloudTrail logs reviewed for unauthorized access
- [ ] S3 bucket access logs reviewed
- [ ] No unauthorized EC2 instances found
- [ ] No unexpected billing charges
- [ ] No unauthorized IAM users/roles
- [ ] MFA enabled on root account
- [ ] MFA enabled on IAM users

### Application Security
- [ ] Production server .env updated with new credentials
- [ ] Backend service restarted successfully
- [ ] S3 file uploads working with new keys
- [ ] SNS notifications working with new keys
- [ ] Cognito authentication working
- [ ] JWT tokens validating correctly
- [ ] n8n webhooks working with new token

### Repository Security
- [ ] All .env files sanitized
- [ ] Git history cleaned (credentials removed)
- [ ] Force push completed
- [ ] .gitignore verified
- [ ] No credentials in any committed files
- [ ] Security documentation updated

### Monitoring & Prevention
- [ ] AWS CloudWatch alarms configured
- [ ] S3 bucket policies reviewed
- [ ] IAM policies reviewed (least privilege)
- [ ] Git pre-commit hooks added (prevent .env commits)
- [ ] Team trained on security best practices
- [ ] Incident response plan updated

---

## Root Cause Analysis

### How Did This Happen?

1. **Developer Error**: .env files were committed to repository
2. **Missing Pre-commit Hooks**: No automated checks to prevent .env commits
3. **Insufficient Training**: Team not fully aware of credential security
4. **Process Gap**: No security review before pushing to public repo

### Why Wasn't This Caught Earlier?

1. `.gitignore` was properly configured, but files were already tracked
2. No automated scanning for secrets in commits
3. No manual security review process

---

## Prevention Measures (Implement Immediately)

### 1. Git Pre-commit Hooks

Create `.git/hooks/pre-commit`:
```bash
#!/bin/bash
# Prevent committing .env files

if git diff --cached --name-only | grep -E '\.env$|\.env\.(production|development|local)$'; then
    echo "❌ ERROR: Attempting to commit .env files!"
    echo "These files contain sensitive credentials and should never be committed."
    exit 1
fi

# Check for AWS credentials in staged files
if git diff --cached | grep -E 'AKIA[0-9A-Z]{16}'; then
    echo "❌ ERROR: AWS credentials detected in staged files!"
    exit 1
fi

exit 0
```

### 2. GitHub Secret Scanning

Enable GitHub secret scanning:
- Go to repository Settings > Security > Code security and analysis
- Enable "Secret scanning"
- Enable "Push protection"

### 3. Use AWS Secrets Manager

Instead of .env files in production:
```typescript
// Use AWS Secrets Manager
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: "us-east-1" });
const secret = await client.send(
  new GetSecretValueCommand({ SecretId: "prod/backend/credentials" })
);
```

### 4. Environment Variable Management

Production server should use:
- AWS Secrets Manager (recommended)
- AWS Systems Manager Parameter Store
- HashiCorp Vault
- Never commit .env files

### 5. Regular Security Audits

- Weekly: Review IAM access logs
- Monthly: Rotate credentials
- Quarterly: Full security audit
- Annually: Penetration testing

### 6. Team Training

- Security awareness training
- Git best practices
- Credential management
- Incident response procedures

---

## Timeline

| Time | Event |
|------|-------|
| Unknown | AWS credentials committed to repository |
| Dec 4, 2025 | AWS security alert received |
| Dec 4, 2025 14:00 | Incident identified |
| Dec 4, 2025 14:15 | Repository sanitization started |
| Dec 4, 2025 14:30 | .env files sanitized |
| Dec 4, 2025 14:45 | Documentation created |
| Dec 4, 2025 15:00 | Awaiting AWS key rotation |

---

## Communication Plan

### Internal
- ✅ Development team notified
- ⏳ Management notification pending
- ⏳ Security team notification pending

### External
- ⏳ AWS Support case response pending
- ⏳ Customers notification (if data breach confirmed)

---

## Lessons Learned

1. **Never commit .env files** - Even with .gitignore
2. **Use pre-commit hooks** - Automated prevention
3. **Regular security audits** - Catch issues early
4. **Secrets management** - Use AWS Secrets Manager
5. **Team training** - Security awareness critical

---

## Related Documents

- `backend/scripts/security/EMERGENCY_AWS_CREDENTIAL_REMEDIATION.ps1`
- `backend/.env.example` (safe template)
- `.gitignore` (verified)

---

## Status Updates

### December 4, 2025 - 14:45
- ✅ Repository sanitized
- ✅ Documentation created
- ⏳ Awaiting AWS credential rotation
- ⏳ Awaiting production server update
- ⏳ Awaiting git history cleanup

---

## Contact Information

**Security Team**: [security@aajminpolyclinic.com.np]  
**AWS Support**: https://aws.amazon.com/support  
**Incident Commander**: [Your Name]

---

**REMEMBER**: This is a CRITICAL security incident. Follow ALL steps above IMMEDIATELY!
