# Medical Records Management System Integration - Design Document

## Overview

This design document outlines the architecture for integrating medical records management with S3-based file storage, implementing comprehensive cost optimization strategies while maintaining HIPAA compliance and multi-tenant isolation. The design focuses on efficient file handling, automatic cost optimization, and secure access control.

## S3 Cost Optimization Strategy

### 1. Storage Class Optimization

**S3 Intelligent-Tiering (Primary Strategy)**
```typescript
// S3 bucket configuration
const s3BucketConfig = {
  StorageClass: 'INTELLIGENT_TIERING',
  IntelligentTieringConfiguration: {
    Id: 'medical-records-tiering',
    Status: 'Enabled',
    Tierings: [
      {
        Days: 90,
        AccessTier: 'ARCHIVE_ACCESS' // Move to Glacier after 90 days
      },
      {
        Days: 180,
        AccessTier: 'DEEP_ARCHIVE_ACCESS' // Move to Deep Archive after 180 days
      }
    ]
  }
};
```

**Cost Savings:**
- Frequent Access Tier: $0.023/GB (first 30 days)
- Infrequent Access Tier: $0.0125/GB (30-90 days) - **46% savings**
- Archive Access Tier: $0.004/GB (90-180 days) - **83% savings**
- Deep Archive: $0.00099/GB (>180 days) - **96% savings**

### 2. File Compression Strategy

```typescript
// Compression decision logic
interface CompressionStrategy {
  shouldCompress(fileType: string, fileSize: number): boolean;
  getCompressionLevel(fileType: string): number;
}

const compressionStrategy: CompressionStrategy = {
  shouldCompress(fileType, fileSize) {
    // Compress text-based files
    const compressibleTypes = ['application/pdf', 'text/plain', 'application/msword'];
    // Skip already compressed formats
    const skipTypes = ['image/jpeg', 'image/png', 'video/mp4'];
    
    return compressibleTypes.includes(fileType) && 
           !skipTypes.includes(fileType) &&
           fileSize > 1024; // Only compress files > 1KB
  },
  
  getCompressionLevel(fileType) {
    // Higher compression for text, lower for PDFs
    return fileType === 'text/plain' ? 9 : 6;
  }
};
```

**Expected Compression Ratios:**
- PDF files: 10-30% reduction
- Text files: 60-80% reduction
- Word documents: 40-60% reduction
- **Average savings: 30-40% on storage costs**

### 3. S3 Key Structure for Cost Optimization

```
s3://medical-records-bucket/
├── {tenant-id}/                    # Tenant isolation
│   ├── {year}/                     # Year-based partitioning
│   │   ├── {month}/                # Month-based partitioning
│   │   │   ├── {record-id}/        # Record-specific folder
│   │   │   │   ├── {file-id}.{ext} # Actual file
│   │   │   │   └── metadata.json   # File metadata
```

**Benefits:**
- Easy lifecycle policy application by date
- Efficient tenant data export
- Simplified cost tracking per tenant
- Optimized S3 LIST operations

### 4. Multipart Upload for Large Files

```typescript
interface MultipartUploadConfig {
  threshold: number; // 5MB - use multipart above this
  partSize: number;  // 5MB - optimal part size
  maxConcurrency: number; // 3 - parallel uploads
}

const multipartConfig: MultipartUploadConfig = {
  threshold: 5 * 1024 * 1024,      // 5MB
  partSize: 5 * 1024 * 1024,       // 5MB parts
  maxConcurrency: 3                 // 3 parallel uploads
};
```

**Cost Benefits:**
- Reduced failed upload costs (resume capability)
- Faster uploads (parallel processing)
- Lower bandwidth costs (retry only failed parts)

### 5. Lifecycle Policies

```typescript
const lifecyclePolicies = [
  {
    Id: 'TransitionToGlacier',
    Status: 'Enabled',
    Transitions: [
      {
        Days: 90,
        StorageClass: 'GLACIER'
      },
      {
        Days: 365,
        StorageClass: 'DEEP_ARCHIVE'
      }
    ]
  },
  {
    Id: 'DeleteIncompleteMultipart',
    Status: 'Enabled',
    AbortIncompleteMultipartUpload: {
      DaysAfterInitiation: 7
    }
  },
  {
    Id: 'DeleteOldVersions',
    Status: 'Enabled',
    NoncurrentVersionExpiration: {
      NoncurrentDays: 30
    }
  }
];
```

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                   Hospital Management System                 │
│                        (Frontend - Next.js)                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Medical    │  │   Medical    │  │     File     │      │
│  │   Records    │  │    Record    │  │   Upload     │      │
│  │     List     │  │    Details   │  │  Component   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                   ┌────────▼────────┐                        │
│                   │ Medical Record  │                        │
│                   │     Hooks       │                        │
│                   │ (useMedicalRecs │                        │
│                   │  useFileUpload) │                        │
│                   └────────┬────────┘                        │
│                            │                                 │
│                   ┌────────▼────────┐                        │
│                   │   API Client    │                        │
│                   └────────┬────────┘                        │
└────────────────────────────┼────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  1. Request     │
                    │  Presigned URL  │
                    └────────┬────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                      Backend API Server                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Medical Records Routes                       │   │
│  │  GET    /api/medical-records                         │   │
│  │  POST   /api/medical-records                         │   │
│  │  GET    /api/medical-records/:id                     │   │
│  │  PUT    /api/medical-records/:id                     │   │
│  │  POST   /api/medical-records/:id/finalize            │   │
│  │  POST   /api/files/upload-url                        │   │
│  │  POST   /api/files/download-url                      │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────────────┐   │
│  │         S3 Service (NEW)                             │   │
│  │  - Generate presigned URLs                           │   │
│  │  - Compress files                                    │   │
│  │  - Multipart upload handling                         │   │
│  │  - Cost tracking                                     │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│                     │  2. Return Presigned URL              │
└─────────────────────┼────────────────────────────────────────┘
                      │
                      │  3. Direct Upload to S3
                      │
┌─────────────────────▼────────────────────────────────────────┐
│                      AWS S3 Bucket                            │
│                  (Intelligent-Tiering)                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  tenant_123/                                                  │
│  ├── 2024/                                                    │
│  │   ├── 11/                                                  │
│  │   │   ├── record_456/                                      │
│  │   │   │   ├── lab_report.pdf.gz (compressed)              │
│  │   │   │   ├── xray_image.jpg (not compressed)             │
│  │   │   │   └── metadata.json                               │
│  │   │   └── record_457/                                      │
│  │   └── 12/                                                  │
│  └── 2023/ (moved to Glacier after 90 days)                  │
│                                                               │
│  Lifecycle Policies:                                          │
│  - Intelligent-Tiering: Automatic optimization                │
│  - 90 days → Glacier                                          │
│  - 365 days → Deep Archive                                    │
│  - Delete incomplete multipart after 7 days                   │
└───────────────────────────────────────────────────────────────┘
```

## Data Models

### Medical Record with Attachments

```typescript
interface MedicalRecord {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_id?: number;
  visit_date: string;
  visit_type: string;
  chief_complaint?: string;
  history_of_present_illness?: string;
  physical_examination?: string;
  diagnoses: Diagnosis[];
  treatments: Treatment[];
  prescriptions: Prescription[];
  lab_orders: LabOrder[];
  vital_signs?: VitalSigns;
  follow_up_required: boolean;
  follow_up_date?: string;
  notes?: string;
  status: 'draft' | 'finalized';
  finalized_at?: string;
  finalized_by?: number;
  
  // File attachments
  attachments: MedicalRecordAttachment[];
  
  // Audit
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
}

interface MedicalRecordAttachment {
  id: number;
  medical_record_id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  compressed_size?: number;
  compression_ratio?: number;
  s3_key: string;
  s3_bucket: string;
  storage_class: string;
  is_compressed: boolean;
  version: number;
  description?: string;
  uploaded_by: number;
  uploaded_at: string;
  last_accessed_at?: string;
  access_count: number;
  status: 'active' | 'deleted' | 'archived';
}
```

## S3 Service Implementation

### File Upload Flow with Compression

```typescript
// backend/src/services/s3-medical.service.ts

export class S3MedicalService {
  private s3Client: S3Client;
  private bucketName: string;
  
  async generateUploadUrl(
    tenantId: string,
    recordId: number,
    fileName: string,
    fileType: string,
    fileSize: number
  ): Promise<UploadUrlResponse> {
    // Determine if compression is needed
    const shouldCompress = this.shouldCompressFile(fileType, fileSize);
    
    // Generate S3 key with optimized structure
    const s3Key = this.generateS3Key(tenantId, recordId, fileName);
    
    // Determine if multipart upload is needed
    const useMultipart = fileSize > 5 * 1024 * 1024; // 5MB
    
    if (useMultipart) {
      return this.initiateMultipartUpload(s3Key, fileType);
    }
    
    // Generate presigned URL for single upload
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      ContentType: fileType,
      StorageClass: 'INTELLIGENT_TIERING',
      ServerSideEncryption: 'AES256',
      Metadata: {
        'tenant-id': tenantId,
        'record-id': recordId.toString(),
        'compressed': shouldCompress.toString(),
        'original-size': fileSize.toString()
      }
    });
    
    const presignedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 900 // 15 minutes
    });
    
    return {
      uploadUrl: presignedUrl,
      s3Key,
      shouldCompress,
      useMultipart: false
    };
  }
  
  private generateS3Key(
    tenantId: string,
    recordId: number,
    fileName: string
  ): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const fileId = uuidv4();
    const ext = path.extname(fileName);
    
    return `${tenantId}/${year}/${month}/record_${recordId}/${fileId}${ext}`;
  }
  
  private shouldCompressFile(fileType: string, fileSize: number): boolean {
    const compressibleTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    const skipTypes = [
      'image/jpeg',
      'image/png',
      'video/mp4',
      'application/zip'
    ];
    
    return compressibleTypes.includes(fileType) && 
           !skipTypes.includes(fileType) &&
           fileSize > 1024;
  }
  
  async generateDownloadUrl(
    s3Key: string,
    tenantId: string
  ): Promise<string> {
    // Validate tenant owns this file
    if (!s3Key.startsWith(tenantId)) {
      throw new Error('Unauthorized access to file');
    }
    
    // Track access for cost optimization
    await this.trackFileAccess(s3Key);
    
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key
    });
    
    return await getSignedUrl(this.s3Client, command, {
      expiresIn: 900 // 15 minutes
    });
  }
  
  private async trackFileAccess(s3Key: string): Promise<void> {
    // Update access count and last accessed timestamp
    // This data helps with cost optimization decisions
    await pool.query(`
      UPDATE medical_record_attachments
      SET access_count = access_count + 1,
          last_accessed_at = CURRENT_TIMESTAMP
      WHERE s3_key = $1
    `, [s3Key]);
  }
}
```

### Client-Side File Compression

```typescript
// hospital-management-system/lib/fileCompression.ts

export async function compressFile(
  file: File,
  shouldCompress: boolean
): Promise<Blob> {
  if (!shouldCompress) {
    return file;
  }
  
  // Read file as array buffer
  const arrayBuffer = await file.arrayBuffer();
  
  // Compress using pako (gzip)
  const compressed = pako.gzip(new Uint8Array(arrayBuffer), {
    level: 6 // Balanced compression
  });
  
  return new Blob([compressed], {
    type: 'application/gzip'
  });
}

export async function decompressFile(
  compressedBlob: Blob,
  originalType: string
): Promise<Blob> {
  const arrayBuffer = await compressedBlob.arrayBuffer();
  const decompressed = pako.ungzip(new Uint8Array(arrayBuffer));
  
  return new Blob([decompressed], {
    type: originalType
  });
}
```

## Cost Monitoring

### Storage Cost Tracking

```typescript
interface StorageCostMetrics {
  tenant_id: string;
  total_files: number;
  total_size_bytes: number;
  compressed_size_bytes: number;
  storage_savings_bytes: number;
  storage_savings_percent: number;
  estimated_monthly_cost: number;
  cost_by_storage_class: {
    intelligent_tiering: number;
    glacier: number;
    deep_archive: number;
  };
  last_calculated: string;
}

async function calculateStorageCosts(
  tenantId: string
): Promise<StorageCostMetrics> {
  const stats = await pool.query(`
    SELECT 
      COUNT(*) as total_files,
      SUM(file_size) as total_size,
      SUM(COALESCE(compressed_size, file_size)) as stored_size,
      SUM(CASE WHEN storage_class = 'INTELLIGENT_TIERING' THEN compressed_size ELSE 0 END) as it_size,
      SUM(CASE WHEN storage_class = 'GLACIER' THEN compressed_size ELSE 0 END) as glacier_size,
      SUM(CASE WHEN storage_class = 'DEEP_ARCHIVE' THEN compressed_size ELSE 0 END) as deep_archive_size
    FROM medical_record_attachments
    WHERE status = 'active'
  `);
  
  const row = stats.rows[0];
  const totalSizeGB = row.total_size / (1024 ** 3);
  const storedSizeGB = row.stored_size / (1024 ** 3);
  
  // Calculate costs (prices as of 2024)
  const itCost = (row.it_size / (1024 ** 3)) * 0.023;
  const glacierCost = (row.glacier_size / (1024 ** 3)) * 0.004;
  const deepArchiveCost = (row.deep_archive_size / (1024 ** 3)) * 0.00099;
  
  return {
    tenant_id: tenantId,
    total_files: row.total_files,
    total_size_bytes: row.total_size,
    compressed_size_bytes: row.stored_size,
    storage_savings_bytes: row.total_size - row.stored_size,
    storage_savings_percent: ((row.total_size - row.stored_size) / row.total_size) * 100,
    estimated_monthly_cost: itCost + glacierCost + deepArchiveCost,
    cost_by_storage_class: {
      intelligent_tiering: itCost,
      glacier: glacierCost,
      deep_archive: deepArchiveCost
    },
    last_calculated: new Date().toISOString()
  };
}
```

## Security Considerations

### Encryption
- Server-side encryption (SSE-S3 or SSE-KMS)
- Encryption in transit (HTTPS)
- Encrypted presigned URLs

### Access Control
- Short-lived presigned URLs (15 minutes)
- Tenant validation before URL generation
- Audit logging for all file access
- No public bucket access

### HIPAA Compliance
- Encryption at rest and in transit
- Access logging and monitoring
- Data retention policies
- Secure file deletion

## Performance Considerations

### Upload Optimization
- Multipart upload for files >5MB
- Parallel part uploads (3 concurrent)
- Client-side compression before upload
- Progress tracking

### Download Optimization
- Presigned URLs for direct S3 access
- CDN integration (optional)
- Client-side decompression
- File caching

## Migration Strategy

### Phase 1: S3 Setup (Days 1-2)
1. Configure S3 bucket with Intelligent-Tiering
2. Set up lifecycle policies
3. Configure encryption
4. Set up IAM roles

### Phase 2: Backend Implementation (Days 3-5)
1. Implement S3 service
2. Add file upload/download endpoints
3. Implement compression logic
4. Add cost tracking

### Phase 3: Frontend Integration (Days 6-8)
1. Create file upload component
2. Implement compression
3. Connect medical records to API
4. Add file management UI

### Phase 4: Testing and Optimization (Days 9-10)
1. Test file operations
2. Verify cost optimization
3. Test multi-tenant isolation
4. Performance testing
