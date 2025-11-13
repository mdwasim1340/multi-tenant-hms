import express from 'express';
import { 
  getMedicalRecords, 
  createMedicalRecord, 
  getMedicalRecordById,
  updateMedicalRecord,
  finalizeMedicalRecord
} from '../controllers/medical-record.controller';
import { requirePermission } from '../middleware/authorization';

const router = express.Router();

// GET /api/medical-records - List medical records (requires read permission)
router.get('/', requirePermission('patients', 'read'), getMedicalRecords);

// POST /api/medical-records - Create medical record (requires write permission)
router.post('/', requirePermission('patients', 'write'), createMedicalRecord);

// GET /api/medical-records/:id - Get medical record by ID (requires read permission)
router.get('/:id', requirePermission('patients', 'read'), getMedicalRecordById);

// PUT /api/medical-records/:id - Update medical record (requires write permission)
router.put('/:id', requirePermission('patients', 'write'), updateMedicalRecord);

// POST /api/medical-records/:id/finalize - Finalize medical record (requires write permission)
router.post('/:id/finalize', requirePermission('patients', 'write'), finalizeMedicalRecord);

export default router;
