/**
 * Lab Tests Routes
 * 
 * API routes for laboratory test management system
 */

import { Router } from 'express';
import * as labTestController from '../controllers/labTest.controller';
import * as labOrderController from '../controllers/labOrder.controller';
import * as labResultController from '../controllers/labResult.controller';

const router = Router();

// ============================================================================
// Lab Tests Routes
// ============================================================================

/**
 * GET /api/lab-tests
 * Get all lab tests with optional filtering
 * Query params: category_id, specimen_type, status, search, page, limit
 */
router.get('/lab-tests', labTestController.getLabTests);

/**
 * GET /api/lab-tests/categories
 * Get all test categories
 */
router.get('/lab-tests/categories', labTestController.getLabTestCategories);

/**
 * GET /api/lab-tests/specimen-types
 * Get all specimen types
 */
router.get('/lab-tests/specimen-types', labTestController.getSpecimenTypes);

/**
 * GET /api/lab-tests/:id
 * Get lab test by ID
 */
router.get('/lab-tests/:id', labTestController.getLabTestById);

/**
 * POST /api/lab-tests
 * Create new lab test (admin only)
 * Body: { category_id, test_code, test_name, description, normal_range_text, unit, specimen_type, price, turnaround_time, preparation_instructions, status }
 */
router.post('/lab-tests', labTestController.createLabTest);

/**
 * PUT /api/lab-tests/:id
 * Update lab test (admin only)
 * Body: Partial lab test fields
 */
router.put('/lab-tests/:id', labTestController.updateLabTest);

/**
 * DELETE /api/lab-tests/:id
 * Deactivate lab test (admin only)
 */
router.delete('/lab-tests/:id', labTestController.deactivateLabTest);

// ============================================================================
// Lab Orders Routes
// ============================================================================

/**
 * GET /api/lab-orders
 * Get all lab orders with optional filtering
 * Query params: patient_id, medical_record_id, appointment_id, ordered_by, priority, status, order_date_from, order_date_to, search, page, limit, sort_by, sort_order
 */
router.get('/lab-orders', labOrderController.getLabOrders);

/**
 * GET /api/lab-orders/statistics
 * Get order statistics
 */
router.get('/lab-orders/statistics', labOrderController.getLabOrderStatistics);

/**
 * GET /api/lab-orders/patient/:patientId
 * Get orders by patient
 */
router.get('/lab-orders/patient/:patientId', labOrderController.getOrdersByPatient);

/**
 * GET /api/lab-orders/:id
 * Get lab order by ID with full details
 */
router.get('/lab-orders/:id', labOrderController.getLabOrderById);

/**
 * POST /api/lab-orders
 * Create new lab order
 * Body: { patient_id, medical_record_id?, appointment_id?, ordered_by, priority?, clinical_notes?, special_instructions?, test_ids: number[] }
 */
router.post('/lab-orders', labOrderController.createLabOrder);

/**
 * PUT /api/lab-orders/:id
 * Update lab order
 * Body: { priority?, clinical_notes?, special_instructions? }
 */
router.put('/lab-orders/:id', labOrderController.updateLabOrder);

/**
 * DELETE /api/lab-orders/:id
 * Cancel lab order
 * Body: { reason?: string }
 */
router.delete('/lab-orders/:id', labOrderController.cancelLabOrder);

/**
 * POST /api/lab-orders/:id/collect
 * Mark specimen collected
 * Body: { collected_by: number }
 */
router.post('/lab-orders/:id/collect', labOrderController.collectSpecimen);

/**
 * POST /api/lab-orders/:id/process
 * Start processing order
 */
router.post('/lab-orders/:id/process', labOrderController.startProcessing);

// ============================================================================
// Lab Results Routes
// ============================================================================

/**
 * GET /api/lab-results
 * Get lab results with optional filtering
 * Query params: order_id, patient_id, is_abnormal, verified, result_date_from, result_date_to, page, limit
 */
router.get('/lab-results', labResultController.getLabResults);

/**
 * GET /api/lab-results/abnormal
 * Get abnormal results
 * Query params: patient_id?
 */
router.get('/lab-results/abnormal', labResultController.getAbnormalResults);

/**
 * GET /api/lab-results/critical
 * Get critical results (HH/LL flags)
 */
router.get('/lab-results/critical', labResultController.getCriticalResults);

/**
 * GET /api/lab-results/statistics
 * Get result statistics
 */
router.get('/lab-results/statistics', labResultController.getLabResultStatistics);

/**
 * GET /api/lab-results/history/:patientId
 * Get result history for patient
 * Query params: test_code?
 */
router.get('/lab-results/history/:patientId', labResultController.getResultHistory);

/**
 * GET /api/lab-results/order/:orderId
 * Get results by order ID
 */
router.get('/lab-results/order/:orderId', labResultController.getResultsByOrder);

/**
 * GET /api/lab-results/:id
 * Get lab result by ID
 */
router.get('/lab-results/:id', labResultController.getLabResultById);

/**
 * POST /api/lab-results
 * Add new lab result
 * Body: { order_item_id, result_value?, result_numeric?, result_text?, result_unit?, reference_range?, performed_by?, interpretation?, notes?, attachments? }
 */
router.post('/lab-results', labResultController.addLabResult);

/**
 * PUT /api/lab-results/:id
 * Update lab result
 * Body: Partial result fields
 */
router.put('/lab-results/:id', labResultController.updateLabResult);

/**
 * POST /api/lab-results/:id/verify
 * Verify lab result
 * Body: { verified_by: number }
 */
router.post('/lab-results/:id/verify', labResultController.verifyLabResult);

export default router;
