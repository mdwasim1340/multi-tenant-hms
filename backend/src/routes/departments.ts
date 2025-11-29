/**
 * Departments Routes
 * Separate router for department endpoints to avoid conflicts
 */

import express from 'express';
import * as departmentController from '../controllers/department.controller';

const router = express.Router();

// ==================
// Department Routes
// ==================

router.get('/', departmentController.getDepartments);
router.post('/', departmentController.createDepartment);
router.get('/occupancy', departmentController.getDepartmentsWithOccupancy);
router.get('/:id', departmentController.getDepartmentById);
router.put('/:id', departmentController.updateDepartment);
router.get('/:id/stats', departmentController.getDepartmentStats);

export default router;