import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({ 
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

export interface FileMetadata {
  key: string;
  filename: string;
  size: number;
  lastModified: Date;
  contentType?: string;
}

export const getUploadUrl = async (tenantId: string, filename: string, contentType?: string) => {
  const key = `${tenantId}/${Date.now()}-${filename}`;
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return { uploadUrl, key };
};

export const getDownloadUrl = async (tenantId: string, key: string, filename?: string) => {
  // Ensure the key belongs to the tenant for security
  if (!key.startsWith(`${tenantId}/`)) {
    throw new Error('Access denied: File does not belong to tenant');
  }

  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    ResponseContentDisposition: filename ? `attachment; filename="${filename}"` : 'attachment',
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

export const deleteFile = async (tenantId: string, key: string) => {
  // Ensure the key belongs to the tenant for security
  if (!key.startsWith(`${tenantId}/`)) {
    throw new Error('Access denied: File does not belong to tenant');
  }

  const command = new DeleteObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
};

export const listFiles = async (tenantId: string): Promise<FileMetadata[]> => {
  const command = new ListObjectsV2Command({
    Bucket: process.env.S3_BUCKET_NAME,
    Prefix: `${tenantId}/`,
  });

  const response = await s3Client.send(command);
  
  if (!response.Contents) {
    return [];
  }

  return response.Contents.map(object => ({
    key: object.Key!,
    filename: object.Key!.split('/').pop()!,
    size: object.Size || 0,
    lastModified: object.LastModified || new Date(),
  }));
};

export const getFileMetadata = async (tenantId: string, key: string) => {
  // Ensure the key belongs to the tenant for security
  if (!key.startsWith(`${tenantId}/`)) {
    throw new Error('Access denied: File does not belong to tenant');
  }

  const command = new HeadObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  });

  const response = await s3Client.send(command);
  
  return {
    key,
    filename: key.split('/').pop()!,
    size: response.ContentLength || 0,
    lastModified: response.LastModified || new Date(),
    contentType: response.ContentType,
  };
};

export const generateShareUrl = async (tenantId: string, key: string, expiresIn: number = 86400) => {
  // Ensure the key belongs to the tenant for security
  if (!key.startsWith(`${tenantId}/`)) {
    throw new Error('Access denied: File does not belong to tenant');
  }

  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
};
