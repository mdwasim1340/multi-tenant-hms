import express from 'express';
import * as bedController from '../controllers/bed.controller';
import * as assignmentController from '../controllers/bed-assignment.controller';
import * as transferController from '../controllers/bed-transfer.controller';
import * as departmentController from '../controllers/department.controller';

const router = express.Router();

// ==========================================
// ALL SPECIFIC ROUTES MUST COME BEFORE PARAMETERIZED ROUTES
// ==========================================

// Bed Assignment Routes - /api/beds/assignments
router.get('/assignments', assignmentController.getBedAssignments);
router.post('/assignments', assignmentController.createBedAssignment);
router.get('/assignments/:id', assignmentController.getBedAssignmentById);
router.put('/assignments/:id', assignmentController.updateBedAssignment);
router.post('/assignments/:id/discharge', assignmentController.dischargeBedAssignment);
router.get('/assignments/patient/:patientId', assignmentController.getPatientBedHistory);
router.get('/assignments/bed/:bedId', assignmentController.getBedAssignmentHistory);

// Bed Transfer Routes - /api/beds/transfers
router.get('/transfers', transferController.getBedTransfers);
router.post('/transfers', transferController.createBedTransfer);
router.get('/transfers/:id', transferController.getBedTransferById);
router.post('/transfers/:id/complete', transferController.completeBedTransfer);
router.post('/transfers/:id/cancel', transferController.cancelBedTransfer);
router.get('/transfers/patient/:patientId/history', transferController.getPatientTransferHistory);

// Department Routes - /api/beds/departments  
router.get('/departments', departmentController.getDepartments);
router.post('/departments', departmentController.createDepartment);
router.get('/departments/:id', departmentController.getDepartmentById);
router.put('/departments/:id', departmentController.updateDepartment);
router.get('/departments/:id/stats', departmentController.getDepartmentStats);

// Bed Routes - Specific routes first
router.get('/', bedController.getBeds);
router.post('/', bedController.createBed);
router.get('/occupancy', bedController.getBedOccupancy);
router.get('/availability', bedController.getAvailableBeds);

// PARAMETERIZED ROUTES MUST BE LAST
router.get('/:id', bedController.getBedById);
router.put('/:id', bedController.updateBed);
router.delete('/:id', bedController.deleteBed);

export default router;
