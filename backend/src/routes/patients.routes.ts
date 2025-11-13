import express from 'express';
import {
  getPatients,
  createPatient,
  getPatientById,
  updatePatient,
  deletePatient,
} from '../controllers/patient.controller';
import { requirePermission } from '../middleware/authorization';

const router = express.Router();

// GET /api/patients - List patients (requires read permission)
router.get('/', requirePermission('patients', 'read'), getPatients);

// POST /api/patients - Create patient (requires write permission)
router.post('/', requirePermission('patients', 'write'), createPatient);

// GET /api/patients/:id - Get patient by ID (requires read permission)
router.get('/:id', requirePermission('patients', 'read'), getPatientById);

// PUT /api/patients/:id - Update patient (requires write permission)
router.put('/:id', requirePermission('patients', 'write'), updatePatient);

// DELETE /api/patients/:id - Soft delete patient (requires admin permission)
router.delete('/:id', requirePermission('patients', 'admin'), deletePatient);

export default router;
