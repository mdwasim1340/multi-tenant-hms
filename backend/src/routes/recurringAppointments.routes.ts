/**
 * Team Alpha - Recurring Appointments Routes
 * API routes for recurring appointment management
 */

import express from 'express';
import {
  createRecurringAppointment,
  getRecurringAppointments,
  getRecurringAppointmentById,
  updateRecurringAppointment,
  cancelRecurringAppointment,
} from '../controllers/recurringAppointment.controller';
import { requirePermission } from '../middleware/authorization';

const router = express.Router();

// GET /api/appointments/recurring - List recurring appointments (requires read permission)
router.get('/', requirePermission('appointments', 'read'), getRecurringAppointments);

// POST /api/appointments/recurring - Create recurring appointment (requires write permission)
router.post('/', requirePermission('appointments', 'write'), createRecurringAppointment);

// GET /api/appointments/recurring/:id - Get recurring appointment by ID (requires read permission)
router.get('/:id', requirePermission('appointments', 'read'), getRecurringAppointmentById);

// PUT /api/appointments/recurring/:id - Update recurring appointment (requires write permission)
router.put('/:id', requirePermission('appointments', 'write'), updateRecurringAppointment);

// DELETE /api/appointments/recurring/:id - Cancel recurring appointment (requires write permission)
router.delete('/:id', requirePermission('appointments', 'write'), cancelRecurringAppointment);

export default router;
