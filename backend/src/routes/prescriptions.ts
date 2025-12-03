import { Router } from 'express';
import {
  createPrescription,
  getPrescription,
  getPrescriptions,
  getPatientPrescriptions,
  updatePrescription,
  discontinuePrescription,
  deletePrescription,
  checkDrugInteractions,
  processRefill,
  updateExpiredPrescriptions
} from '../controllers/prescription.controller';

export const createPrescriptionsRouter = () => {
  const router = Router();

  // Prescription CRUD
  router.post('/', createPrescription);
  router.get('/', getPrescriptions);
  router.get('/:id', getPrescription);
  router.put('/:id', updatePrescription);
  router.delete('/:id', deletePrescription);

  // Get prescriptions by patient
  router.get('/patient/:patientId', getPatientPrescriptions);

  // Discontinue prescription
  router.post('/:id/discontinue', discontinuePrescription);

  // Process refill
  router.post('/:id/refill', processRefill);

  // Check drug interactions
  router.get('/patient/:patientId/interactions', checkDrugInteractions);

  // Update expired prescriptions (maintenance endpoint)
  router.post('/maintenance/update-expired', updateExpiredPrescriptions);

  return router;
};
