import express from 'express';
import {
  getAppointments,
  createAppointment,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  getAvailableSlots,
  confirmAppointment,
  completeAppointment,
  markNoShow,
} from '../controllers/appointment.controller';
import { requirePermission } from '../middleware/authorization';

const router = express.Router();

// Use conditional permission middleware based on environment
const permissionMiddleware = (resource: string, action: string) => {
  if (process.env.NODE_ENV === 'development') {
    // In development, skip permission checks (already handled by devAuth middleware)
    return (req: any, res: any, next: any) => next();
  }
  return requirePermission(resource, action);
};

// GET /api/appointments - List appointments (requires read permission)
router.get('/', permissionMiddleware('appointments', 'read'), getAppointments);

// POST /api/appointments - Create appointment (requires write permission)
router.post('/', permissionMiddleware('appointments', 'write'), createAppointment);

// GET /api/appointments/:id - Get appointment by ID (requires read permission)
router.get('/:id', permissionMiddleware('appointments', 'read'), getAppointmentById);

// PUT /api/appointments/:id - Update appointment (requires write permission)
router.put('/:id', permissionMiddleware('appointments', 'write'), updateAppointment);

// DELETE /api/appointments/:id - Cancel appointment (requires write permission)
router.delete('/:id', permissionMiddleware('appointments', 'write'), cancelAppointment);

// GET /api/appointments/available-slots - Get available time slots (requires read permission)
router.get('/available-slots', permissionMiddleware('appointments', 'read'), getAvailableSlots);

// POST /api/appointments/:id/confirm - Confirm appointment (requires write permission)
router.post('/:id/confirm', permissionMiddleware('appointments', 'write'), confirmAppointment);

// POST /api/appointments/:id/complete - Mark appointment as complete (requires write permission)
router.post('/:id/complete', permissionMiddleware('appointments', 'write'), completeAppointment);

// POST /api/appointments/:id/no-show - Mark appointment as no-show (requires write permission)
router.post('/:id/no-show', permissionMiddleware('appointments', 'write'), markNoShow);

export default router;
