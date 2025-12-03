import express from 'express';
import { 
  createPrescription, 
  getPatientPrescriptions,
  getPrescription,
  updatePrescription,
  discontinuePrescription,
  deletePrescription,
  checkDrugInteractions,
  processRefill,
  updateExpiredPrescriptions
} from '../controllers/prescription.controller';
import { requirePermission } from '../middleware/authorization';

const router = express.Router();

// POST /api/prescriptions - Create prescription (requires write permission)
router.post('/', requirePermission('patients', 'write'), createPrescription);

// GET /api/prescriptions/:id - Get single prescription (requires read permission)
router.get('/:id', requirePermission('patients', 'read'), getPrescription);

// GET /api/prescriptions/patient/:patientId - Get prescriptions by patient (requires read permission)
router.get('/patient/:patientId', requirePermission('patients', 'read'), getPatientPrescriptions);

// PUT /api/prescriptions/:id - Update prescription (requires write permission)
router.put('/:id', requirePermission('patients', 'write'), updatePrescription);

// POST /api/prescriptions/:id/discontinue - Discontinue prescription (requires write permission)
router.post('/:id/discontinue', requirePermission('patients', 'write'), discontinuePrescription);

// DELETE /api/prescriptions/:id - Delete prescription (requires write permission)
router.delete('/:id', requirePermission('patients', 'write'), deletePrescription);

// GET /api/prescriptions/patient/:patientId/interactions - Check drug interactions (requires read permission)
router.get('/patient/:patientId/interactions', requirePermission('patients', 'read'), checkDrugInteractions);

// POST /api/prescriptions/:id/refill - Process refill (requires write permission)
router.post('/:id/refill', requirePermission('patients', 'write'), processRefill);

// POST /api/prescriptions/update-expired - Update expired prescriptions (requires write permission)
router.post('/update-expired', requirePermission('patients', 'write'), updateExpiredPrescriptions);

export default router;
