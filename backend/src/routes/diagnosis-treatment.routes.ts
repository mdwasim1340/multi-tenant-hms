import express from 'express';
import { 
  createDiagnosis, 
  createTreatment, 
  discontinueTreatment 
} from '../controllers/diagnosis-treatment.controller';

const router = express.Router();

// POST /api/medical-records/diagnoses - Create diagnosis
router.post('/diagnoses', createDiagnosis);

// POST /api/medical-records/treatments - Create treatment
router.post('/treatments', createTreatment);

// DELETE /api/medical-records/treatments/:id - Discontinue treatment
router.delete('/treatments/:id', discontinueTreatment);

export default router;
