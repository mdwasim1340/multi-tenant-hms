/**
 * Team Alpha - S3 Service
 * Handle S3 file operations with presigned URLs and cost optimization
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createGzip } from 'zlib';
import { promisify } from 'util';
import { pipeline } from 'stream';

const pipelineAsync = promisify(pipeline);

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const S3_BUCKET = process.env.S3_BUCKET_NAME || 'hospital-medical-records';
const PRESIGNED_URL_EXPIRATION = 3600; // 1 hour

/**
 * Generate S3 key for medical record attachment
 * Format: {tenant-id}/medical-records/{year}/{month}/{record-id}/{filename}
 */
export function generateS3Key(
  tenantId: string,
  recordId: number,
  filename: string
): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  // Sanitize filename
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return `${tenantId}/medical-records/${year}/${month}/${recordId}/${sanitizedFilename}`;
}

/**
 * Generate presigned URL for uploading a file to S3
 */
export async function generateUploadUrl(
  tenantId: string,
  recordId: number,
  filename: string,
  contentType: string
): Promise<{ uploadUrl: string; s3Key: string }> {
  const s3Key = generateS3Key(tenantId, recordId, filename);
  
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    ContentType: contentType,
    // Enable server-side encryption
    ServerSideEncryption: 'AES256',
    // Set storage class to Intelligent-Tiering for cost optimization
    StorageClass: 'INTELLIGENT_TIERING',
    // Add metadata
    Metadata: {
      'tenant-id': tenantId,
      'record-id': String(recordId),
      'uploaded-at': new Date().toISOString(),
    },
  });
  
  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: PRESIGNED_URL_EXPIRATION,
  });
  
  return { uploadUrl, s3Key };
}

/**
 * Generate presigned URL for downloading a file from S3
 */
export async function generateDownloadUrl(
  s3Key: string
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
  });
  
  const downloadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: PRESIGNED_URL_EXPIRATION,
  });
  
  return downloadUrl;
}

/**
 * Delete a file from S3
 */
export async function deleteFile(s3Key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
  });
  
  await s3Client.send(command);
}

/**
 * Compress file buffer using gzip
 * Used for text files (PDFs, documents) to reduce storage costs
 */
export async function compressFile(buffer: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const gzip = createGzip();
    
    gzip.on('data', (chunk) => chunks.push(chunk));
    gzip.on('end', () => resolve(Buffer.concat(chunks)));
    gzip.on('error', reject);
    
    gzip.write(buffer);
    gzip.end();
  });
}

/**
 * Check if file type should be compressed
 * Compress text-based files, skip images and already compressed formats
 */
export function shouldCompressFile(contentType: string): boolean {
  const compressibleTypes = [
    'application/pdf',
    'text/',
    'application/json',
    'application/xml',
  ];
  
  const skipTypes = [
    'image/',
    'video/',
    'audio/',
    'application/zip',
    'application/gzip',
  ];
  
  // Skip if already compressed
  if (skipTypes.some(type => contentType.startsWith(type))) {
    return false;
  }
  
  // Compress if text-based
  return compressibleTypes.some(type => contentType.startsWith(type));
}

/**
 * Get file size from S3
 */
export async function getFileSize(s3Key: string): Promise<number> {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
  });
  
  const response = await s3Client.send(command);
  return response.ContentLength || 0;
}

/**
 * List files for a medical record
 */
export async function listRecordFiles(
  tenantId: string,
  recordId: number
): Promise<string[]> {
  // This would use ListObjectsV2Command in production
  // For now, we'll rely on database records
  return [];
}

/**
 * Calculate storage cost estimate
 * Based on AWS S3 Intelligent-Tiering pricing
 */
export function estimateStorageCost(fileSizeBytes: number, daysStored: number = 30): number {
  const fileSizeGB = fileSizeBytes / (1024 * 1024 * 1024);
  
  // Intelligent-Tiering pricing (approximate)
  const frequentAccessCost = 0.023; // per GB per month
  const infrequentAccessCost = 0.0125; // per GB per month
  
  // Assume first 30 days in frequent access, then infrequent
  const monthlyFraction = daysStored / 30;
  const cost = fileSizeGB * frequentAccessCost * monthlyFraction;
  
  return cost;
}

export default {
  generateS3Key,
  generateUploadUrl,
  generateDownloadUrl,
  deleteFile,
  compressFile,
  shouldCompressFile,
  getFileSize,
  listRecordFiles,
  estimateStorageCost,
};

/**
 * Track file access for Intelligent-Tiering optimization
 */
import pool from '../database';

/**
 * Log file access for optimization analysis
 */
export async function logFileAccess(params: {
  tenantId: string;
  fileId: string;
  filePath: string;
  accessType: 'download' | 'view' | 'upload';
  userId?: number;
  fileSizeBytes?: number;
  storageClass?: string;
  ipAddress?: string;
  userAgent?: string;
  responseTimeMs?: number;
  success?: boolean;
  errorMessage?: string;
}): Promise<void> {
  try {
    await pool.query(`
      INSERT INTO file_access_logs (
        tenant_id, file_id, file_path, access_type, user_id,
        file_size_bytes, storage_class, ip_address, user_agent,
        response_time_ms, success, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      params.tenantId,
      params.fileId,
      params.filePath,
      params.accessType,
      params.userId || null,
      params.fileSizeBytes || null,
      params.storageClass || 'STANDARD',
      params.ipAddress || null,
      params.userAgent || null,
      params.responseTimeMs || null,
      params.success !== false,
      params.errorMessage || null
    ]);
  } catch (error) {
    console.error('Failed to log file access:', error);
    // Don't throw - logging failure shouldn't break file operations
  }
}

/**
 * Enhanced download URL generation with access tracking
 */
export async function generateDownloadUrlWithTracking(
  tenantId: string,
  s3Key: string,
  userId?: number,
  fileSize?: number,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const startTime = Date.now();
  
  try {
    // Generate presigned URL
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
    });

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: PRESIGNED_URL_EXPIRATION,
    });

    const responseTime = Date.now() - startTime;

    // Log file access for optimization
    await logFileAccess({
      tenantId,
      fileId: s3Key.split('/').pop() || s3Key,
      filePath: s3Key,
      accessType: 'download',
      userId,
      fileSizeBytes: fileSize,
      storageClass: 'STANDARD', // Default, could be enhanced to detect actual class
      ipAddress,
      userAgent,
      responseTimeMs: responseTime,
      success: true
    });

    return url;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log failed access
    await logFileAccess({
      tenantId,
      fileId: s3Key.split('/').pop() || s3Key,
      filePath: s3Key,
      accessType: 'download',
      userId,
      fileSizeBytes: fileSize,
      ipAddress,
      userAgent,
      responseTimeMs: responseTime,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });

    throw error;
  }
}

/**
 * Enhanced upload URL generation with access tracking
 */
export async function generateUploadUrlWithTracking(
  tenantId: string,
  recordId: number,
  filename: string,
  contentType: string,
  userId?: number,
  ipAddress?: string,
  userAgent?: string
): Promise<{ uploadUrl: string; s3Key: string }> {
  const startTime = Date.now();
  
  try {
    const result = await generateUploadUrl(tenantId, recordId, filename, contentType);
    const responseTime = Date.now() - startTime;

    // Log file upload initiation
    await logFileAccess({
      tenantId,
      fileId: filename,
      filePath: result.s3Key,
      accessType: 'upload',
      userId,
      storageClass: 'INTELLIGENT_TIERING',
      ipAddress,
      userAgent,
      responseTimeMs: responseTime,
      success: true
    });

    return result;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log failed upload
    await logFileAccess({
      tenantId,
      fileId: filename,
      filePath: `${tenantId}/medical-records/${recordId}/${filename}`,
      accessType: 'upload',
      userId,
      ipAddress,
      userAgent,
      responseTimeMs: responseTime,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });

    throw error;
  }
}

/**
 * Get access patterns for a tenant
 */
export async function getAccessPatterns(tenantId: string): Promise<any[]> {
  const result = await pool.query(`
    SELECT * FROM file_access_patterns
    WHERE tenant_id = $1
    ORDER BY last_accessed DESC
  `, [tenantId]);
  
  return result.rows;
}

/**
 * Get storage optimization recommendations
 */
export async function getStorageRecommendations(tenantId: string): Promise<any[]> {
  const result = await pool.query(`
    SELECT * FROM recommend_storage_transitions($1)
  `, [tenantId]);
  
  return result.rows;
}

/**
 * Get tenant access statistics
 */
export async function getTenantAccessStats(tenantId: string): Promise<any> {
  const result = await pool.query(`
    SELECT * FROM get_tenant_access_stats($1)
  `, [tenantId]);
  
  return result.rows[0] || {
    total_files: 0,
    total_accesses: 0,
    unique_users: 0,
    avg_accesses_per_file: 0,
    files_not_accessed_30_days: 0,
    files_not_accessed_90_days: 0,
    files_not_accessed_180_days: 0,
    recommended_standard: 0,
    recommended_standard_ia: 0,
    recommended_glacier: 0,
    recommended_deep_archive: 0
  };
}