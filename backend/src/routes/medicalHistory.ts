import { Router } from 'express';
import {
  createMedicalHistory,
  getMedicalHistory,
  getPatientMedicalHistory,
  updateMedicalHistory,
  deleteMedicalHistory,
  getCriticalAllergies,
  getPatientSummary
} from '../controllers/medicalHistory.controller';

export const createMedicalHistoryRouter = () => {
  const router = Router();

  // Medical history CRUD
  router.post('/', createMedicalHistory);
  
  // Get critical allergies (MUST be before /patient/:patientId to avoid route conflict)
  router.get('/patient/:patientId/critical-allergies', getCriticalAllergies);

  // Get patient summary (MUST be before /patient/:patientId to avoid route conflict)
  router.get('/patient/:patientId/summary', getPatientSummary);

  // Get patient medical history (more general route, must come after specific routes)
  router.get('/patient/:patientId', getPatientMedicalHistory);
  
  // Single entry operations
  router.get('/:id', getMedicalHistory);
  router.put('/:id', updateMedicalHistory);
  router.delete('/:id', deleteMedicalHistory);

  return router;
};
