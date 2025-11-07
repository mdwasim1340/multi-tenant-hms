import express from 'express';
import { 
  getMedicalRecords, 
  createMedicalRecord, 
  getMedicalRecordById,
  updateMedicalRecord,
  finalizeMedicalRecord
} from '../controllers/medical-record.controller';

const router = express.Router();

// GET /api/medical-records - List medical records
router.get('/', getMedicalRecords);

// POST /api/medical-records - Create medical record
router.post('/', createMedicalRecord);

// GET /api/medical-records/:id - Get medical record by ID
router.get('/:id', getMedicalRecordById);

// PUT /api/medical-records/:id - Update medical record
router.put('/:id', updateMedicalRecord);

// POST /api/medical-records/:id/finalize - Finalize medical record
router.post('/:id/finalize', finalizeMedicalRecord);

export default router;
