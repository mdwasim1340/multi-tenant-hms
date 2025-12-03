import express from 'express';
import { 
  getMedicalRecords, 
  createMedicalRecord, 
  getMedicalRecordById,
  updateMedicalRecord,
  finalizeMedicalRecord
} from '../controllers/medical-record.controller';
import * as medicalRecordController from '../controllers/medicalRecord.controller';
import { requirePermission } from '../middleware/authorization';
import { auditMedicalRecordOperation } from '../middleware/audit.middleware';

const router = express.Router();

// GET /api/medical-records - List medical records (requires read permission)
router.get('/', requirePermission('patients', 'read'), getMedicalRecords);

// POST /api/medical-records - Create medical record (requires write permission)
router.post('/', requirePermission('patients', 'write'), createMedicalRecord);

// S3 Upload/Download URL endpoints (must be before :id routes)
router.post('/upload-url', requirePermission('patients', 'write'), medicalRecordController.getUploadUrl);
router.get('/download-url/:attachmentId', requirePermission('patients', 'read'), medicalRecordController.getDownloadUrl);

// GET /api/medical-records/:id - Get medical record by ID (requires read permission)
router.get('/:id', requirePermission('patients', 'read'), getMedicalRecordById);

// PUT /api/medical-records/:id - Update medical record (requires write permission)
router.put('/:id', requirePermission('patients', 'write'), updateMedicalRecord);

// POST /api/medical-records/:id/finalize - Finalize medical record (requires write permission)
router.post('/:id/finalize', requirePermission('patients', 'write'), finalizeMedicalRecord);

// Attachment routes
router.get('/:id/attachments', requirePermission('patients', 'read'), medicalRecordController.getRecordAttachments);
router.post('/:id/attachments', requirePermission('patients', 'write'), medicalRecordController.addRecordAttachment);
router.delete('/attachments/:attachmentId', requirePermission('patients', 'write'), medicalRecordController.deleteRecordAttachment);

export default router;
