import express from 'express';
import {
  getPatients,
  createPatient,
  getPatientById,
  updatePatient,
} from '../controllers/patient.controller';

const router = express.Router();

// GET /api/patients - List patients
router.get('/', getPatients);

// POST /api/patients - Create patient
router.post('/', createPatient);

// GET /api/patients/:id - Get patient by ID
router.get('/:id', getPatientById);

// PUT /api/patients/:id - Update patient
router.put('/:id', updatePatient);

export default router;
