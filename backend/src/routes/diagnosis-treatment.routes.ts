import express from 'express';
import { 
  createDiagnosis, 
  createTreatment, 
  discontinueTreatment 
} from '../controllers/diagnosis-treatment.controller';
import { requirePermission } from '../middleware/authorization';

const router = express.Router();

// POST /api/medical-records/diagnoses - Create diagnosis (requires write permission)
router.post('/diagnoses', requirePermission('patients', 'write'), createDiagnosis);

// POST /api/medical-records/treatments - Create treatment (requires write permission)
router.post('/treatments', requirePermission('patients', 'write'), createTreatment);

// DELETE /api/medical-records/treatments/:id - Discontinue treatment (requires write permission)
router.delete('/treatments/:id', requirePermission('patients', 'write'), discontinueTreatment);

export default router;
