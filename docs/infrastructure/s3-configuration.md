# S3 Configuration Guide

**Multi-Tenant Hospital Management System**  
**Date**: November 9, 2025  
**Version**: 1.0

---

## Overview

This guide covers setting up AWS S3 for logo storage in the multi-tenant hospital management system. For development, a local storage fallback is available.

---

## Table of Contents

1. [Storage Options](#storage-options)
2. [AWS S3 Setup (Production)](#aws-s3-setup-production)
3. [Local Storage Setup (Development)](#local-storage-setup-development)
4. [Configuration](#configuration)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## Storage Options

### Production: AWS S3
**Recommended for production** - Scalable, reliable, and cost-effective

**Benefits**:
- Unlimited storage capacity
- Built-in redundancy and backup
- Global CDN integration (CloudFront)
- Automatic image resizing support
- Pay-as-you-go pricing

**Cost Estimate**: ~$0.023 per GB/month + ~$0.005 per 1,000 requests

### Development: Local Storage
**Recommended for development** - Simple and free

**Benefits**:
- No AWS account needed
- Zero cost
- Faster for local development
- Easy debugging

**Limitations**:
- Not suitable for production
- No redundancy
- Limited to single server

---

## AWS S3 Setup (Production)

### Prerequisites

- AWS Account (sign up at https://aws.amazon.com)
- AWS CLI installed (optional but recommended)
- IAM user with S3 permissions

### Step 1: Create IAM User

**Why**: Dedicated credentials for the application (avoid using root credentials)

1. Go to AWS Console → IAM → Users
2. Click "Add users"
3. User name: `hospital-system-s3`
4. Access type: ✅ Programmatic access
5. Click "Next: Permissions"

### Step 2: Create IAM Policy

Create a custom policy for minimal required permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3BrandingBucketAccess",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::hospital-system-branding",
        "arn:aws:s3:::hospital-system-branding/*"
      ]
    }
  ]
}
```

**Steps**:
1. Click "Create policy"
2. JSON tab → Paste above policy
3. Name: `HospitalS3BrandingPolicy`
4. Click "Create policy"

### Step 3: Attach Policy to User

1. Go back to user creation
2. Click "Attach existing policies directly"
3. Search for `HospitalS3BrandingPolicy`
4. Select it and click "Next: Tags"
5. (Optional) Add tags
6. Click "Next: Review" → "Create user"
7. **IMPORTANT**: Save the Access Key ID and Secret Access Key

### Step 4: Create S3 Bucket

**Naming Convention**: `{environment}-hospital-system-branding`
- Development: `dev-hospital-system-branding`
- Staging: `staging-hospital-system-branding`
- Production: `prod-hospital-system-branding`

**Via AWS Console**:
1. Go to S3 → "Create bucket"
2. **Bucket name**: `prod-hospital-system-branding`
3. **Region**: Select closest to your users (e.g., `us-east-1`)
4. **Block Public Access settings**: ✅ Keep all blocked (default)
5. **Bucket Versioning**: ✅ Enable (recommended for logo history)
6. **Tags** (optional):
   - Key: `Environment`, Value: `Production`
   - Key: `Application`, Value: `Hospital Management`
7. Click "Create bucket"

**Via AWS CLI**:
```bash
# Create bucket
aws s3api create-bucket \
  --bucket prod-hospital-system-branding \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket prod-hospital-system-branding \
  --versioning-configuration Status=Enabled

# Add tags
aws s3api put-bucket-tagging \
  --bucket prod-hospital-system-branding \
  --tagging 'TagSet=[{Key=Environment,Value=Production},{Key=Application,Value=Hospital Management}]'
```

### Step 5: Configure Bucket CORS

CORS is needed for direct browser uploads from the admin dashboard.

**Via AWS Console**:
1. Go to bucket → "Permissions" tab
2. Scroll to "Cross-origin resource sharing (CORS)"
3. Click "Edit"
4. Paste the following:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": [
      "http://localhost:3002",
      "https://admin.yourdomain.com"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

**Important**: Replace `https://admin.yourdomain.com` with your actual admin dashboard URL

**Via AWS CLI**:
```bash
cat > cors.json << EOF
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedOrigins": [
        "http://localhost:3002",
        "https://admin.yourdomain.com"
      ],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws s3api put-bucket-cors \
  --bucket prod-hospital-system-branding \
  --cors-configuration file://cors.json
```

### Step 6: Configure Lifecycle Rules (Optional)

Automatically delete old logo versions after 90 days to save storage costs.

**Via AWS Console**:
1. Go to bucket → "Management" tab
2. Click "Create lifecycle rule"
3. **Rule name**: `DeleteOldVersions`
4. **Rule scope**: ✅ Apply to all objects
5. **Lifecycle rule actions**: ✅ Expire previous versions of objects
6. **Days after objects become previous versions**: `90`
7. Click "Create rule"

**Via AWS CLI**:
```bash
cat > lifecycle.json << EOF
{
  "Rules": [
    {
      "Id": "DeleteOldVersions",
      "Status": "Enabled",
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 90
      }
    }
  ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
  --bucket prod-hospital-system-branding \
  --lifecycle-configuration file://lifecycle.json
```

### Step 7: Configure Backend

Add to `backend/.env`:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIA...your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=prod-hospital-system-branding

# Important: Set to false to use S3
USE_LOCAL_STORAGE=false
```

---

## Local Storage Setup (Development)

### Step 1: Configure Backend

Add to `backend/.env`:

```env
# Local Storage Configuration
USE_LOCAL_STORAGE=true
UPLOAD_DIR=uploads

# S3 variables not needed when using local storage
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_REGION=
# S3_BUCKET_NAME=
```

### Step 2: Create Upload Directory

The backend will automatically create this directory on startup, but you can create it manually:

```bash
# From project root
cd backend
mkdir uploads
mkdir uploads/logos
```

### Step 3: Add to .gitignore

Ensure uploads directory is not committed:

```bash
# Add to backend/.gitignore
uploads/
*.log
```

### Step 4: File Structure

Local storage will organize files like this:

```
backend/
├── uploads/
│   └── logos/
│       ├── tenant-1/
│       │   ├── small-logo.png
│       │   ├── medium-logo.png
│       │   └── large-logo.png
│       ├── tenant-2/
│       │   └── medium-logo.jpg
│       └── tenant-3/
│           └── small-logo.svg
```

---

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `USE_LOCAL_STORAGE` | Yes | `true` for local, `false` for S3 |
| `AWS_ACCESS_KEY_ID` | S3 only | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | S3 only | AWS secret key |
| `AWS_REGION` | S3 only | AWS region (e.g., `us-east-1`) |
| `S3_BUCKET_NAME` | S3 only | S3 bucket name |
| `UPLOAD_DIR` | Local only | Local directory path (default: `uploads`) |

### Switching Between Storage Types

**Development → Production (Local → S3)**:
1. Create S3 bucket (follow steps above)
2. Get AWS credentials
3. Update `.env`:
   ```env
   USE_LOCAL_STORAGE=false
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=prod-hospital-system-branding
   ```
4. Restart backend
5. (Optional) Migrate existing logos to S3

**Production → Development (S3 → Local)**:
1. Update `.env`:
   ```env
   USE_LOCAL_STORAGE=true
   ```
2. Restart backend
3. Re-upload logos via admin dashboard

---

## Testing

### Test S3 Configuration

**1. Check AWS Credentials**:
```bash
# Install AWS CLI
npm install -g aws-cli

# Configure credentials
aws configure

# Test access
aws s3 ls s3://prod-hospital-system-branding
```

**2. Test Upload from Backend**:
```bash
# From backend directory
npm test -- storage.test.js
```

**3. Test from Admin Dashboard**:
1. Go to Admin Dashboard
2. Create/edit a tenant
3. Navigate to "Branding" tab
4. Upload a logo
5. Check if logo appears correctly
6. Verify in AWS Console: S3 → Bucket → Objects

### Test Local Storage

**1. Check Directory Permissions**:
```bash
# Linux/Mac
ls -la backend/uploads

# Windows
dir backend\uploads
```

**2. Test Upload**:
1. Start backend: `npm run dev`
2. Go to Admin Dashboard
3. Upload logo
4. Check `backend/uploads/logos/tenant-{id}/` directory
5. Verify files exist

---

## Troubleshooting

### Common Issues

**1. "Access Denied" Error (S3)**

**Cause**: IAM user doesn't have permissions

**Solution**:
- Verify IAM policy is attached to user
- Check bucket name matches policy
- Ensure credentials are correct

**Test**:
```bash
aws s3 ls s3://prod-hospital-system-branding
```

**2. "CORS Error" in Browser**

**Cause**: CORS not configured or wrong origin

**Solution**:
- Add your admin dashboard URL to CORS AllowedOrigins
- Include protocol and port (e.g., `http://localhost:3002`)
- Clear browser cache

**3. "Bucket Not Found"**

**Cause**: Wrong bucket name or region

**Solution**:
```bash
# List all buckets
aws s3 ls

# Check region
aws s3api get-bucket-location --bucket prod-hospital-system-branding
```

**4. "Cannot Write to uploads Directory"**

**Cause**: Permission issue (local storage)

**Solution**:
```bash
# Linux/Mac
chmod 755 backend/uploads

# Windows
# Right-click folder → Properties → Security → Edit → Add write permission
```

**5. "File Size Too Large"**

**Cause**: Exceeds MAX_FILE_SIZE

**Solution**:
- Check `backend/.env`: `MAX_FILE_SIZE=2097152` (2MB in bytes)
- Increase if needed: `MAX_FILE_SIZE=5242880` (5MB)
- Restart backend

**6. "Invalid File Type"**

**Cause**: File type not in ALLOWED_FILE_TYPES

**Solution**:
```env
# backend/.env
ALLOWED_FILE_TYPES=image/png,image/jpeg,image/jpg,image/svg+xml
```

---

## Migration: Local to S3

If you've been using local storage and want to migrate to S3:

### Option 1: Manual Upload

1. Set up S3 bucket (follow steps above)
2. For each tenant, re-upload logo via admin dashboard

### Option 2: Automated Migration Script

```bash
# Create migration script
cat > backend/scripts/migrate-logos-to-s3.js << 'EOF'
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const uploadDir = path.join(__dirname, '..', 'uploads', 'logos');
const bucketName = process.env.S3_BUCKET_NAME;

async function migrateLogos() {
  const tenants = fs.readdirSync(uploadDir);

  for (const tenantId of tenants) {
    const tenantDir = path.join(uploadDir, tenantId);
    const files = fs.readdirSync(tenantDir);

    for (const file of files) {
      const filePath = path.join(tenantDir, file);
      const fileContent = fs.readFileSync(filePath);
      const s3Key = `logos/${tenantId}/${file}`;

      await s3.putObject({
        Bucket: bucketName,
        Key: s3Key,
        Body: fileContent,
        ContentType: getContentType(file),
      }).promise();

      console.log(`Uploaded: ${s3Key}`);
    }
  }
}

function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
  };
  return types[ext] || 'application/octet-stream';
}

migrateLogos()
  .then(() => console.log('Migration complete!'))
  .catch(err => console.error('Migration failed:', err));
EOF

# Run migration
cd backend
node scripts/migrate-logos-to-s3.js
```

---

## Best Practices

### Production

✅ **Do**:
- Use S3 for production
- Enable versioning
- Set up lifecycle rules
- Use IAM user (not root)
- Implement CloudFront CDN for faster delivery
- Monitor S3 costs regularly
- Enable S3 server access logging

❌ **Don't**:
- Don't make bucket public
- Don't use root AWS credentials
- Don't skip CORS configuration
- Don't store sensitive data without encryption

### Development

✅ **Do**:
- Use local storage for development
- Add uploads directory to .gitignore
- Test S3 on staging before production
- Keep local backups

❌ **Don't**:
- Don't commit uploads directory
- Don't use production S3 credentials in development
- Don't skip testing file uploads

---

## Cost Optimization

### S3 Storage Costs

**Assumptions**:
- 100 tenants
- Average logo size: 500KB
- 3 sizes per logo (small, medium, large): 1.5MB per tenant
- Total storage: 150MB

**Monthly Cost**:
- Storage: 150MB × $0.023/GB = ~$0.003/month
- Requests: 1,000 PUTs × $0.005/1,000 = ~$0.005
- **Total**: ~$0.01/month

**With 1,000 tenants**: ~$0.10/month

### Cost Reduction Tips

1. **Enable lifecycle rules** - Delete old versions after 90 days
2. **Use CloudFront** - Reduce S3 request costs
3. **Optimize images** - Compress before upload
4. **Use S3 Intelligent-Tiering** - For infrequently accessed logos

---

## Security Checklist

- [ ] S3 bucket is **not public**
- [ ] Using IAM user (not root credentials)
- [ ] IAM policy has minimal required permissions
- [ ] CORS configured with specific origins
- [ ] Bucket versioning enabled
- [ ] Server-side encryption enabled (optional)
- [ ] CloudTrail logging enabled (optional)
- [ ] Regular access key rotation

---

## Next Steps

After configuring storage:

1. Test logo upload/delete functionality
2. Verify images display correctly
3. Test on multiple tenants
4. Monitor storage usage
5. Set up CloudFront (optional)
6. Configure automated backups

**Related Documentation**:
- [Environment Variables Guide](./environment-variables.md)
- [Setup Guide](./setup-guide.md)
- [Deployment Architecture](./deployment-architecture.md)

---

**Storage configured!** 🎉 Your hospital management system is now ready to handle logo uploads securely and efficiently.
