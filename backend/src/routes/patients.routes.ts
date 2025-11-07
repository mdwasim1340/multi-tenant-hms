import express from 'express';
import { getPatients } from '../controllers/patient.controller';

const router = express.Router();

// GET /api/patients - List patients
router.get('/', getPatients);

export default router;
