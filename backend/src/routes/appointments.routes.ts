import express from 'express';
import {
  getAppointments,
  createAppointment,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
} from '../controllers/appointment.controller';

const router = express.Router();

// GET /api/appointments - List appointments
router.get('/', getAppointments);

// POST /api/appointments - Create appointment
router.post('/', createAppointment);

// GET /api/appointments/:id - Get appointment by ID
router.get('/:id', getAppointmentById);

// PUT /api/appointments/:id - Update appointment
router.put('/:id', updateAppointment);

// DELETE /api/appointments/:id - Cancel appointment
router.delete('/:id', cancelAppointment);

export default router;
