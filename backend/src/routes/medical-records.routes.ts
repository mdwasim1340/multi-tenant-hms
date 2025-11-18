import express from 'express';
import { 
  getMedicalRecords, 
  createMedicalRecord, 
  getMedicalRecordById,
  updateMedicalRecord,
  finalizeMedicalRecord
} from '../controllers/medical-record.controller';
import { requirePermission } from '../middleware/authorization';
import { auditMedicalRecordOperation } from '../middleware/audit.middleware';

const router = express.Router();

// GET /api/medical-records - List medical records (requires read permission)
router.get('/', requirePermission('patients', 'read'), getMedicalRecords);

// POST /api/medical-records - Create medical record (requires write permission)
router.post('/', requirePermission('patients', 'write'), auditMedicalRecordOperation('CREATE'), createMedicalRecord);

// GET /api/medical-records/:id - Get medical record by ID (requires read permission)
router.get('/:id', requirePermission('patients', 'read'), auditMedicalRecordOperation('VIEW'), getMedicalRecordById);

// PUT /api/medical-records/:id - Update medical record (requires write permission)
router.put('/:id', requirePermission('patients', 'write'), auditMedicalRecordOperation('UPDATE'), updateMedicalRecord);

// POST /api/medical-records/:id/finalize - Finalize medical record (requires write permission)
router.post('/:id/finalize', requirePermission('patients', 'write'), auditMedicalRecordOperation('FINALIZE'), finalizeMedicalRecord);

export default router;
