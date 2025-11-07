import express from 'express';
import { 
  createPrescription, 
  getPrescriptionsByPatient, 
  cancelPrescription 
} from '../controllers/prescription.controller';

const router = express.Router();

// POST /api/prescriptions - Create prescription
router.post('/', createPrescription);

// GET /api/prescriptions/patient/:patientId - Get prescriptions by patient
router.get('/patient/:patientId', getPrescriptionsByPatient);

// DELETE /api/prescriptions/:id - Cancel prescription
router.delete('/:id', cancelPrescription);

export default router;
