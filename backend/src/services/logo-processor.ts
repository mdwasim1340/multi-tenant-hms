/**
 * Logo Processor Service
 * Purpose: Process and resize uploaded logos for different use cases
 * Requirements: 5.5
 */

import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import pool from '../database';
import { subdomainCache } from './subdomain-cache';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const S3_BUCKET = process.env.S3_BUCKET_NAME || 'your-bucket-name';

interface LogoSizes {
  small: Buffer;
  medium: Buffer;
  large: Buffer;
}

interface LogoUrls {
  original: string;
  small: string;
  medium: string;
  large: string;
}

/**
 * Process logo and generate multiple sizes
 * 
 * @param buffer - Original logo file buffer
 * @param mimeType - MIME type of the image
 * @returns Object with buffers for each size
 */
export async function processLogo(buffer: Buffer, mimeType: string): Promise<LogoSizes> {
  try {
    // Determine output format based on input
    let format: 'png' | 'jpeg' | 'webp' = 'png';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
      format = 'jpeg';
    } else if (mimeType.includes('webp')) {
      format = 'webp';
    }

    // Generate small logo (64x64)
    const small = await sharp(buffer)
      .resize(64, 64, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .toFormat(format)
      .toBuffer();

    // Generate medium logo (128x128)
    const medium = await sharp(buffer)
      .resize(128, 128, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .toFormat(format)
      .toBuffer();

    // Generate large logo (256x256)
    const large = await sharp(buffer)
      .resize(256, 256, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .toFormat(format)
      .toBuffer();

    console.log('✅ Logo processed successfully (small, medium, large)');

    return { small, medium, large };
  } catch (error) {
    console.error('Error processing logo:', error);
    throw new Error('Failed to process logo');
  }
}

/**
 * Upload logo to S3
 * 
 * @param buffer - Image buffer
 * @param key - S3 object key
 * @param mimeType - MIME type of the image
 * @returns S3 URL
 */
async function uploadToS3(buffer: Buffer, key: string, mimeType: string): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ACL: 'private', // Private access, use presigned URLs for retrieval
    });

    await s3Client.send(command);

    // Return S3 URL
    const url = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    console.log(`✅ Uploaded to S3: ${key}`);

    return url;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload logo to S3');
  }
}

/**
 * Process and upload logo with all sizes
 * 
 * @param tenantId - Tenant ID
 * @param originalBuffer - Original logo file buffer
 * @param filename - Original filename
 * @param mimeType - MIME type of the image
 * @returns Object with all logo URLs
 */
export async function processAndUploadLogo(
  tenantId: string,
  originalBuffer: Buffer,
  filename: string,
  mimeType: string
): Promise<LogoUrls> {
  try {
    // Get file extension
    const ext = filename.split('.').pop() || 'png';

    // Process logo to generate different sizes
    const sizes = await processLogo(originalBuffer, mimeType);

    // Upload original
    const originalKey = `${tenantId}/branding/logo-original.${ext}`;
    const originalUrl = await uploadToS3(originalBuffer, originalKey, mimeType);

    // Upload small
    const smallKey = `${tenantId}/branding/logo-small.${ext}`;
    const smallUrl = await uploadToS3(sizes.small, smallKey, mimeType);

    // Upload medium
    const mediumKey = `${tenantId}/branding/logo-medium.${ext}`;
    const mediumUrl = await uploadToS3(sizes.medium, mediumKey, mimeType);

    // Upload large
    const largeKey = `${tenantId}/branding/logo-large.${ext}`;
    const largeUrl = await uploadToS3(sizes.large, largeKey, mimeType);

    console.log(`✅ All logo sizes uploaded for tenant: ${tenantId}`);

    return {
      original: originalUrl,
      small: smallUrl,
      medium: mediumUrl,
      large: largeUrl,
    };
  } catch (error) {
    console.error('Error processing and uploading logo:', error);
    throw error;
  }
}

/**
 * Update tenant branding with logo URLs
 * 
 * @param tenantId - Tenant ID
 * @param logoUrls - Object with all logo URLs
 */
export async function updateTenantBrandingWithLogos(
  tenantId: string,
  logoUrls: LogoUrls
): Promise<void> {
  try {
    await pool.query(
      `UPDATE tenant_branding
       SET logo_url = $1,
           logo_small_url = $2,
           logo_medium_url = $3,
           logo_large_url = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE tenant_id = $5`,
      [logoUrls.original, logoUrls.small, logoUrls.medium, logoUrls.large, tenantId]
    );

    // Invalidate cache
    const tenantResult = await pool.query(
      'SELECT subdomain FROM tenants WHERE id = $1',
      [tenantId]
    );

    if (tenantResult.rows.length > 0 && tenantResult.rows[0].subdomain) {
      await subdomainCache.invalidate(tenantResult.rows[0].subdomain);
    }

    console.log(`✅ Tenant branding updated with logo URLs: ${tenantId}`);
  } catch (error) {
    console.error('Error updating tenant branding:', error);
    throw new Error('Failed to update tenant branding with logo URLs');
  }
}

/**
 * Validate logo file
 * 
 * @param file - Multer file object
 * @returns Validation result
 */
export function validateLogoFile(file: Express.Multer.File): { valid: boolean; error?: string } {
  // Check file size (2MB max)
  const maxSize = 2 * 1024 * 1024; // 2MB in bytes
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size exceeds 2MB limit',
    };
  }

  // Check file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
  if (!allowedTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: 'Invalid file type. Only PNG, JPG, and SVG are allowed',
    };
  }

  return { valid: true };
}
