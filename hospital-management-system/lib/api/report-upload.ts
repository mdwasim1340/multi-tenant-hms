/**
 * Report Upload API Client
 * Handles file upload operations for EMR reports
 */

import api from './client';

export interface UploadUrlResponse {
  upload_url: string;
  download_url: string;
  file_id: string;
  expires_in: number;
}

export interface UploadMetadata {
  filename: string;
  content_type: string;
  file_size: number;
  description?: string;
}

/**
 * Request presigned URL for file upload
 */
export async function requestUploadUrl(
  filename: string,
  contentType: string,
  fileSize: number
): Promise<UploadUrlResponse> {
  const response = await api.post('/api/reports/upload-url', {
    filename,
    content_type: contentType,
    file_size: fileSize
  });
  return response.data.data;
}

/**
 * Get presigned URL for file download
 */
export async function getDownloadUrl(fileId: string) {
  const response = await api.get(`/api/reports/download-url/${fileId}`);
  return response.data;
}

/**
 * Upload file to S3 using presigned URL
 */
export async function uploadFileToS3(
  uploadUrl: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress(percentComplete);
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(new Response(xhr.response, {
          status: xhr.status,
          statusText: xhr.statusText
        }));
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'));
    });

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

/**
 * Complete file upload workflow
 * 1. Request upload URL
 * 2. Upload file to S3
 * 3. Return file metadata
 */
export async function uploadFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ file_id: string; download_url: string }> {
  // Step 1: Request upload URL
  const { upload_url, file_id, download_url } = await requestUploadUrl(
    file.name,
    file.type,
    file.size
  );

  // Step 2: Upload to S3
  await uploadFileToS3(upload_url, file, onProgress);

  // Step 3: Return file metadata
  return { file_id, download_url };
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const {
    maxSize = 25 * 1024 * 1024, // 25MB default
    allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']
  } = options;

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  return { valid: true };
}
