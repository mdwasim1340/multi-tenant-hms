import express from 'express';
import { BedController } from '../controllers/bed.controller';
import { BedAssignmentController } from '../controllers/bed-assignment.controller';
import { BedTransferController } from '../controllers/bed-transfer.controller';
import { DepartmentController } from '../controllers/department.controller';

const router = express.Router();

const bedController = new BedController();
const assignmentController = new BedAssignmentController();
const transferController = new BedTransferController();
const departmentController = new DepartmentController();

// ==========================================
// Bed Routes - /api/beds
// ==========================================
router.get('/', bedController.listBeds.bind(bedController));
router.post('/', bedController.createBed.bind(bedController));
router.get('/occupancy', bedController.getBedOccupancy.bind(bedController));
router.get('/availability', bedController.checkBedAvailability.bind(bedController));
router.get('/:id', bedController.getBedById.bind(bedController));
router.put('/:id', bedController.updateBed.bind(bedController));
router.delete('/:id', bedController.deleteBed.bind(bedController));

// ==========================================
// Bed Assignment Routes - /api/beds/assignments
// ==========================================
router.get('/assignments', assignmentController.listAssignments.bind(assignmentController));
router.post('/assignments', assignmentController.createAssignment.bind(assignmentController));
router.get('/assignments/:id', assignmentController.getAssignmentById.bind(assignmentController));
router.put('/assignments/:id', assignmentController.updateAssignment.bind(assignmentController));
router.post('/assignments/:id/discharge', assignmentController.dischargeAssignment.bind(assignmentController));
router.get('/assignments/patient/:patientId', assignmentController.getPatientHistory.bind(assignmentController));
router.get('/assignments/bed/:bedId', assignmentController.getBedHistory.bind(assignmentController));

// ==========================================
// Bed Transfer Routes - /api/beds/transfers
// ==========================================
router.get('/transfers', transferController.listTransfers.bind(transferController));
router.post('/transfers', transferController.createTransfer.bind(transferController));
router.get('/transfers/:id', transferController.getTransferById.bind(transferController));
router.put('/transfers/:id', transferController.updateTransfer.bind(transferController));
router.post('/transfers/:id/complete', transferController.completeTransfer.bind(transferController));
router.post('/transfers/:id/cancel', transferController.cancelTransfer.bind(transferController));
router.get('/transfers/patient/:patientId/history', transferController.getPatientTransferHistory.bind(transferController));

// ==========================================
// Department Routes - /api/beds/departments
// ==========================================
router.get('/departments', departmentController.listDepartments.bind(departmentController));
router.post('/departments', departmentController.createDepartment.bind(departmentController));
router.get('/departments/:id', departmentController.getDepartmentById.bind(departmentController));
router.put('/departments/:id', departmentController.updateDepartment.bind(departmentController));
router.get('/departments/:id/stats', departmentController.getDepartmentStats.bind(departmentController));

export default router;
