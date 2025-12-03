/**
 * Team Alpha - Medical Record Controller
 * HTTP request handlers for medical records API
 */

import { Request, Response } from 'express';
import * as medicalRecordService from '../services/medicalRecord.service';
import * as s3Service from '../services/s3.service';
import {
  CreateMedicalRecordDTO,
  UpdateMedicalRecordDTO,
  MedicalRecordFilters,
} from '../types/medicalRecord';

/**
 * GET /api/medical-records
 * List medical records with filters and pagination
 */
export async function getMedicalRecords(req: Request, res: Response) {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'X-Tenant-ID header is required',
      });
    }

    const filters: MedicalRecordFilters = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      patient_id: req.query.patient_id ? parseInt(req.query.patient_id as string) : undefined,
      doctor_id: req.query.doctor_id ? parseInt(req.query.doctor_id as string) : undefined,
      status: req.query.status as 'draft' | 'finalized' | undefined,
      date_from: req.query.date_from as string | undefined,
      date_to: req.query.date_to as string | undefined,
      search: req.query.search as string | undefined,
    };

    const { records, total } = await medicalRecordService.getMedicalRecords(tenantId, filters);

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const pages = Math.ceil(total / limit);

    return res.json({
      success: true,
      data: {
        records,
        pagination: {
          page,
          limit,
          total,
          pages,
          has_next: page < pages,
          has_prev: page > 1,
        },
      },
    });
  } catch (error: any) {
    console.error('Error getting medical records:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get medical records',
      message: error.message,
    });
  }
}

/**
 * GET /api/medical-records/:id
 * Get medical record by ID
 */
export async function getMedicalRecordById(req: Request, res: Response) {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const recordId = parseInt(req.params.id);

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'X-Tenant-ID header is required',
      });
    }

    if (isNaN(recordId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid record ID',
      });
    }

    const record = await medicalRecordService.getMedicalRecordById(tenantId, recordId);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Medical record not found',
      });
    }

    // Get attachments
    const attachments = await medicalRecordService.getRecordAttachments(tenantId, recordId);

    return res.json({
      success: true,
      data: {
        record,
        attachments,
      },
    });
  } catch (error: any) {
    console.error('Error getting medical record:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get medical record',
      message: error.message,
    });
  }
}

/**
 * POST /api/medical-records
 * Create new medical record
 */
export async function createMedicalRecord(req: Request, res: Response) {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'X-Tenant-ID header is required',
      });
    }

    const data: CreateMedicalRecordDTO = req.body;

    // Validate required fields
    if (!data.patient_id || !data.doctor_id || !data.visit_date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: patient_id, doctor_id, visit_date',
      });
    }

    const record = await medicalRecordService.createMedicalRecord(tenantId, data);

    return res.status(201).json({
      success: true,
      data: { record },
      message: 'Medical record created successfully',
    });
  } catch (error: any) {
    console.error('Error creating medical record:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create medical record',
      message: error.message,
    });
  }
}

/**
 * PUT /api/medical-records/:id
 * Update medical record
 */
export async function updateMedicalRecord(req: Request, res: Response) {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const recordId = parseInt(req.params.id);

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'X-Tenant-ID header is required',
      });
    }

    if (isNaN(recordId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid record ID',
      });
    }

    const data: UpdateMedicalRecordDTO = req.body;

    const record = await medicalRecordService.updateMedicalRecord(tenantId, recordId, data);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Medical record not found',
      });
    }

    return res.json({
      success: true,
      data: { record },
      message: 'Medical record updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating medical record:', error);
    
    if (error.message === 'Cannot update finalized medical record') {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to update medical record',
      message: error.message,
    });
  }
}

/**
 * DELETE /api/medical-records/:id
 * Delete medical record
 */
export async function deleteMedicalRecord(req: Request, res: Response) {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const recordId = parseInt(req.params.id);

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'X-Tenant-ID header is required',
      });
    }

    if (isNaN(recordId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid record ID',
      });
    }

    const deleted = await medicalRecordService.deleteMedicalRecord(tenantId, recordId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Medical record not found',
      });
    }

    return res.json({
      success: true,
      message: 'Medical record deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting medical record:', error);
    
    if (error.message === 'Cannot delete finalized medical record') {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to delete medical record',
      message: error.message,
    });
  }
}

/**
 * POST /api/medical-records/:id/finalize
 * Finalize medical record (lock from further edits)
 */
export async function finalizeMedicalRecord(req: Request, res: Response) {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const recordId = parseInt(req.params.id);
    const userId = (req as any).user?.id; // From auth middleware

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'X-Tenant-ID header is required',
      });
    }

    if (isNaN(recordId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid record ID',
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required',
      });
    }

    const record = await medicalRecordService.finalizeMedicalRecord(tenantId, recordId, userId);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Medical record not found or already finalized',
      });
    }

    return res.json({
      success: true,
      data: { record },
      message: 'Medical record finalized successfully',
    });
  } catch (error: any) {
    console.error('Error finalizing medical record:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to finalize medical record',
      message: error.message,
    });
  }
}

/**
 * GET /api/medical-records/:id/attachments
 * Get attachments for a medical record
 */
export async function getRecordAttachments(req: Request, res: Response) {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const recordId = parseInt(req.params.id);

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'X-Tenant-ID header is required',
      });
    }

    if (isNaN(recordId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid record ID',
      });
    }

    const attachments = await medicalRecordService.getRecordAttachments(tenantId, recordId);

    return res.json({
      success: true,
      data: { attachments },
    });
  } catch (error: any) {
    console.error('Error getting attachments:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get attachments',
      message: error.message,
    });
  }
}

/**
 * POST /api/medical-records/:id/attachments
 * Add attachment to medical record
 */
export async function addRecordAttachment(req: Request, res: Response) {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const recordId = parseInt(req.params.id);
    const userId = (req as any).user?.id;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'X-Tenant-ID header is required',
      });
    }

    if (isNaN(recordId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid record ID',
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required',
      });
    }

    const { file_name, file_type, file_size, s3_key, s3_bucket, description } = req.body;

    if (!file_name || !file_type || !file_size || !s3_key || !s3_bucket) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: file_name, file_type, file_size, s3_key, s3_bucket',
      });
    }

    const attachment = await medicalRecordService.addRecordAttachment(
      tenantId,
      recordId,
      userId,
      { file_name, file_type, file_size, s3_key, s3_bucket, description }
    );

    return res.status(201).json({
      success: true,
      data: { attachment },
      message: 'Attachment added successfully',
    });
  } catch (error: any) {
    console.error('Error adding attachment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to add attachment',
      message: error.message,
    });
  }
}

/**
 * POST /api/medical-records/upload-url
 * Get presigned URL for uploading a file
 */
export async function getUploadUrl(req: Request, res: Response) {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { record_id, filename, content_type } = req.body;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'X-Tenant-ID header is required',
      });
    }

    if (!record_id || !filename || !content_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: record_id, filename, content_type',
      });
    }

    const { uploadUrl, s3Key } = await s3Service.generateUploadUrl(
      tenantId,
      record_id,
      filename,
      content_type
    );

    return res.json({
      success: true,
      data: {
        uploadUrl,
        s3Key,
      },
      message: 'Upload URL generated successfully',
    });
  } catch (error: any) {
    console.error('Error generating upload URL:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate upload URL',
      message: error.message,
    });
  }
}

/**
 * GET /api/medical-records/download-url/:attachmentId
 * Get presigned URL for downloading a file
 */
export async function getDownloadUrl(req: Request, res: Response) {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const attachmentId = parseInt(req.params.attachmentId);

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'X-Tenant-ID header is required',
      });
    }

    if (isNaN(attachmentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid attachment ID',
      });
    }

    const attachment = await medicalRecordService.getAttachmentById(tenantId, attachmentId);

    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: 'Attachment not found',
      });
    }

    const downloadUrl = await s3Service.generateDownloadUrl(attachment.s3_key);

    return res.json({
      success: true,
      data: {
        downloadUrl,
        fileName: attachment.file_name,
        fileType: attachment.file_type,
        fileSize: attachment.file_size,
      },
      message: 'Download URL generated successfully',
    });
  } catch (error: any) {
    console.error('Error generating download URL:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate download URL',
      message: error.message,
    });
  }
}

/**
 * DELETE /api/medical-records/attachments/:attachmentId
 * Delete attachment
 */
export async function deleteRecordAttachment(req: Request, res: Response) {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const attachmentId = parseInt(req.params.attachmentId);

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'X-Tenant-ID header is required',
      });
    }

    if (isNaN(attachmentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid attachment ID',
      });
    }

    // Get attachment to get S3 key
    const attachment = await medicalRecordService.getAttachmentById(tenantId, attachmentId);

    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: 'Attachment not found',
      });
    }

    // Delete from database
    const deleted = await medicalRecordService.deleteRecordAttachment(tenantId, attachmentId);

    if (deleted) {
      // Delete from S3
      try {
        await s3Service.deleteFile(attachment.s3_key);
      } catch (s3Error) {
        console.error('Error deleting file from S3:', s3Error);
        // Continue even if S3 deletion fails
      }
    }

    return res.json({
      success: true,
      message: 'Attachment deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting attachment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete attachment',
      message: error.message,
    });
  }
}


/**
 * POST /api/medical-records/:id/upload
 * Upload file directly through backend (avoids CORS issues)
 */
export async function uploadFile(req: Request, res: Response) {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const recordId = parseInt(req.params.id);
    const file = req.file;

    console.log('Upload request received:', {
      tenantId,
      recordId,
      hasFile: !!file,
      fileName: file?.originalname,
      fileSize: file?.size,
    });

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'X-Tenant-ID header is required',
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    if (isNaN(recordId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid record ID',
      });
    }

    // Generate S3 key using timestamp and filename
    const timestamp = Date.now();
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key = `${tenantId}/medical-records/${recordId}/${timestamp}-${sanitizedFilename}`;
    
    console.log('Generated S3 key:', s3Key);

    // Upload to S3 using AWS SDK
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const bucketName = process.env.S3_BUCKET_NAME || 'multi-tenant-12';
    console.log('Uploading to S3 bucket:', bucketName);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ServerSideEncryption: 'AES256',
      StorageClass: 'INTELLIGENT_TIERING',
      Metadata: {
        'tenant-id': tenantId,
        'record-id': String(recordId),
        'uploaded-at': new Date().toISOString(),
      },
    });

    await s3Client.send(command);
    console.log('File uploaded to S3 successfully');

    // Add attachment record to database
    const description = req.body.description || '';
    const uploadedBy = 1; // TODO: Get from auth context
    
    console.log('Adding attachment record to database...');
    const attachment = await medicalRecordService.addRecordAttachment(
      tenantId,
      recordId,
      uploadedBy,
      {
        file_name: file.originalname,
        file_type: file.mimetype,
        file_size: file.size,
        s3_key: s3Key,
        s3_bucket: bucketName,
        description,
      }
    );

    console.log('Attachment record created:', attachment.id);

    return res.status(201).json({
      success: true,
      data: attachment,
      message: 'File uploaded successfully',
    });
  } catch (error: any) {
    console.error('Error uploading file - Full error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: 'Failed to upload file',
      message: error.message,
      details: error.toString(),
    });
  }
}
