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
