import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({ region: process.env.AWS_REGION });

export const getUploadUrl = async (tenantId: string, filename: string) => {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `${tenantId}/${filename}`,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

export const getDownloadUrl = async (tenantId: string, filename: string) => {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `${tenantId}/${filename}`,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
};
