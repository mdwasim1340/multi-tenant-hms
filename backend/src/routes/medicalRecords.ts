/**
 * Team Alpha - Medical Records Routes
 * API routes for medical records management
 */

import { Router } from 'express';
import * as medicalRecordController from '../controllers/medicalRecord.controller';

const router = Router();

// ============================================================================
// Medical Records CRUD Routes
// ============================================================================

/**
 * GET /api/medical-records
 * List medical records with filters and pagination
 * Query params: page, limit, patient_id, doctor_id, status, date_from, date_to, search
 */
router.get('/', medicalRecordController.getMedicalRecords);

/**
 * GET /api/medical-records/:id
 * Get medical record by ID with attachments
 */
router.get('/:id', medicalRecordController.getMedicalRecordById);

/**
 * POST /api/medical-records
 * Create new medical record
 * Body: { patient_id, doctor_id, visit_date, chief_complaint, diagnosis, ... }
 */
router.post('/', medicalRecordController.createMedicalRecord);

/**
 * PUT /api/medical-records/:id
 * Update medical record (draft only)
 * Body: { visit_date?, chief_complaint?, diagnosis?, ... }
 */
router.put('/:id', medicalRecordController.updateMedicalRecord);

/**
 * DELETE /api/medical-records/:id
 * Delete medical record (draft only)
 */
router.delete('/:id', medicalRecordController.deleteMedicalRecord);

/**
 * POST /api/medical-records/:id/finalize
 * Finalize medical record (lock from further edits)
 */
router.post('/:id/finalize', medicalRecordController.finalizeMedicalRecord);

// ============================================================================
// File Attachment Routes
// ============================================================================

/**
 * GET /api/medical-records/:id/attachments
 * Get attachments for a medical record
 */
router.get('/:id/attachments', medicalRecordController.getRecordAttachments);

/**
 * POST /api/medical-records/:id/attachments
 * Add attachment to medical record
 * Body: { file_name, file_type, file_size, s3_key, s3_bucket, description? }
 */
router.post('/:id/attachments', medicalRecordController.addRecordAttachment);

/**
 * DELETE /api/medical-records/attachments/:attachmentId
 * Delete attachment from medical record
 */
router.delete('/attachments/:attachmentId', medicalRecordController.deleteRecordAttachment);

// ============================================================================
// S3 Presigned URL Routes
// ============================================================================

/**
 * POST /api/medical-records/upload-url
 * Get presigned URL for uploading a file to S3
 * Body: { record_id, filename, content_type }
 */
router.post('/upload-url', medicalRecordController.getUploadUrl);

/**
 * GET /api/medical-records/download-url/:attachmentId
 * Get presigned URL for downloading a file from S3
 */
router.get('/download-url/:attachmentId', medicalRecordController.getDownloadUrl);

export default router;
