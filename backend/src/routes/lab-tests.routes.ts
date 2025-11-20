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
router.get('/', labTestController.getLabTests);

/**
 * GET /api/lab-tests/categories
 * Get all test categories
 */
router.get('/categories', labTestController.getLabTestCategories);

/**
 * GET /api/lab-tests/specimen-types
 * Get all specimen types
 */
router.get('/specimen-types', labTestController.getSpecimenTypes);

/**
 * GET /api/lab-tests/:id
 * Get lab test by ID
 */
router.get('/:id', labTestController.getLabTestById);

/**
 * POST /api/lab-tests
 * Create new lab test (admin only)
 */
router.post('/', labTestController.createLabTest);

/**
 * PUT /api/lab-tests/:id
 * Update lab test (admin only)
 */
router.put('/:id', labTestController.updateLabTest);

/**
 * DELETE /api/lab-tests/:id
 * Deactivate lab test (admin only)
 */
router.delete('/:id', labTestController.deactivateLabTest);

export default router;
