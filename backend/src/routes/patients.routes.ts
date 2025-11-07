import express from 'express';
import { getPatients, createPatient } from '../controllers/patient.controller';

const router = express.Router();

// GET /api/patients - List patients
router.get('/', getPatients);

// POST /api/patients - Create patient
router.post('/', createPatient);

export default router;
