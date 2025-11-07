import express from 'express';
import {
  getPatients,
  createPatient,
  getPatientById,
} from '../controllers/patient.controller';

const router = express.Router();

// GET /api/patients - List patients
router.get('/', getPatients);

// POST /api/patients - Create patient
router.post('/', createPatient);

// GET /api/patients/:id - Get patient by ID
router.get('/:id', getPatientById);

export default router;
