import express from 'express';
import { 
  createPrescription, 
  getPrescriptionsByPatient, 
  cancelPrescription 
} from '../controllers/prescription.controller';
import { requirePermission } from '../middleware/authorization';

const router = express.Router();

// POST /api/prescriptions - Create prescription (requires write permission)
router.post('/', requirePermission('patients', 'write'), createPrescription);

// GET /api/prescriptions/patient/:patientId - Get prescriptions by patient (requires read permission)
router.get('/patient/:patientId', requirePermission('patients', 'read'), getPrescriptionsByPatient);

// DELETE /api/prescriptions/:id - Cancel prescription (requires write permission)
router.delete('/:id', requirePermission('patients', 'write'), cancelPrescription);

export default router;
