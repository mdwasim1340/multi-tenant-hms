import express from 'express';
import {
  getAppointments,
  createAppointment,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
} from '../controllers/appointment.controller';
import { requirePermission } from '../middleware/authorization';

const router = express.Router();

// GET /api/appointments - List appointments (requires read permission)
router.get('/', requirePermission('appointments', 'read'), getAppointments);

// POST /api/appointments - Create appointment (requires write permission)
router.post('/', requirePermission('appointments', 'write'), createAppointment);

// GET /api/appointments/:id - Get appointment by ID (requires read permission)
router.get('/:id', requirePermission('appointments', 'read'), getAppointmentById);

// PUT /api/appointments/:id - Update appointment (requires write permission)
router.put('/:id', requirePermission('appointments', 'write'), updateAppointment);

// DELETE /api/appointments/:id - Cancel appointment (requires write permission)
router.delete('/:id', requirePermission('appointments', 'write'), cancelAppointment);

export default router;
