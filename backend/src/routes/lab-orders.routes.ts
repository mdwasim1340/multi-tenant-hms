/**
 * Lab Orders Routes
 * 
 * API routes for laboratory order management
 */

import { Router } from 'express';
import * as labOrderController from '../controllers/labOrder.controller';

const router = Router();

/**
 * GET /api/lab-orders
 * Get all lab orders with optional filtering
 */
router.get('/', labOrderController.getLabOrders);

/**
 * GET /api/lab-orders/statistics
 * Get order statistics
 */
router.get('/statistics', labOrderController.getLabOrderStatistics);

/**
 * GET /api/lab-orders/patient/:patientId
 * Get orders by patient
 */
router.get('/patient/:patientId', labOrderController.getOrdersByPatient);

/**
 * GET /api/lab-orders/:id
 * Get lab order by ID with full details
 */
router.get('/:id', labOrderController.getLabOrderById);

/**
 * POST /api/lab-orders
 * Create new lab order
 */
router.post('/', labOrderController.createLabOrder);

/**
 * PUT /api/lab-orders/:id
 * Update lab order
 */
router.put('/:id', labOrderController.updateLabOrder);

/**
 * DELETE /api/lab-orders/:id
 * Cancel lab order
 */
router.delete('/:id', labOrderController.cancelLabOrder);

/**
 * POST /api/lab-orders/:id/collect
 * Mark specimen collected
 */
router.post('/:id/collect', labOrderController.collectSpecimen);

/**
 * POST /api/lab-orders/:id/process
 * Start processing order
 */
router.post('/:id/process', labOrderController.startProcessing);

export default router;
