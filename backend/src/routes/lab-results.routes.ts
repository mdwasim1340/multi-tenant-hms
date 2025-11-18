/**
 * Lab Results Routes
 * 
 * API routes for laboratory result management
 */

import { Router } from 'express';
import * as labResultController from '../controllers/labResult.controller';

const router = Router();

/**
 * GET /api/lab-results
 * Get lab results with optional filtering
 */
router.get('/', labResultController.getLabResults);

/**
 * GET /api/lab-results/abnormal
 * Get abnormal results
 */
router.get('/abnormal', labResultController.getAbnormalResults);

/**
 * GET /api/lab-results/critical
 * Get critical results (HH/LL flags)
 */
router.get('/critical', labResultController.getCriticalResults);

/**
 * GET /api/lab-results/statistics
 * Get result statistics
 */
router.get('/statistics', labResultController.getLabResultStatistics);

/**
 * GET /api/lab-results/history/:patientId
 * Get result history for patient
 */
router.get('/history/:patientId', labResultController.getResultHistory);

/**
 * GET /api/lab-results/order/:orderId
 * Get results by order ID
 */
router.get('/order/:orderId', labResultController.getResultsByOrder);

/**
 * GET /api/lab-results/:id
 * Get lab result by ID
 */
router.get('/:id', labResultController.getLabResultById);

/**
 * POST /api/lab-results
 * Add new lab result
 */
router.post('/', labResultController.addLabResult);

/**
 * PUT /api/lab-results/:id
 * Update lab result
 */
router.put('/:id', labResultController.updateLabResult);

/**
 * POST /api/lab-results/:id/verify
 * Verify lab result
 */
router.post('/:id/verify', labResultController.verifyLabResult);

export default router;
