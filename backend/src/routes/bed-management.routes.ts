import express from 'express';
import { BedController } from '../controllers/bed.controller';
import { BedAssignmentController } from '../controllers/bed-assignment.controller';
import { BedTransferController } from '../controllers/bed-transfer.controller';
import { DepartmentController } from '../controllers/department.controller';
// import { authenticate, authorize } from '../middleware/auth'; // to be implemented

const bedRoutes = express.Router();
const assignmentRoutes = express.Router();
const transferRoutes = express.Router();
const departmentRoutes = express.Router();

const bedController = new BedController();
const assignmentController = new BedAssignmentController();
const transferController = new BedTransferController();
const departmentController = new DepartmentController();

// Bed routes
bedRoutes.get('/', bedController.listBeds.bind(bedController));
bedRoutes.post('/', bedController.createBed.bind(bedController));
bedRoutes.get('/:id', bedController.getBedById.bind(bedController));
bedRoutes.put('/:id', bedController.updateBed.bind(bedController));
bedRoutes.delete('/:id', bedController.deleteBed.bind(bedController));
// Add routes for occupancy and availability if needed

// Bed Assignment routes
assignmentRoutes.get('/', assignmentController.listAssignments.bind(assignmentController));
assignmentRoutes.post('/', assignmentController.createAssignment.bind(assignmentController));
assignmentRoutes.get('/:id', assignmentController.getAssignmentById.bind(assignmentController));
assignmentRoutes.put('/:id', assignmentController.updateAssignment.bind(assignmentController));
assignmentRoutes.post('/:id/discharge', assignmentController.dischargeAssignment.bind(assignmentController));
assignmentRoutes.get('/patient/:patientId', assignmentController.getPatientHistory.bind(assignmentController));
assignmentRoutes.get('/bed/:bedId', assignmentController.getBedHistory.bind(assignmentController));

// Bed Transfer routes
transferRoutes.get('/', transferController.listTransfers.bind(transferController));
transferRoutes.post('/', transferController.createTransfer.bind(transferController));
transferRoutes.get('/:id', transferController.getTransferById.bind(transferController));
transferRoutes.put('/:id', transferController.updateTransfer.bind(transferController));
transferRoutes.post('/:id/complete', transferController.completeTransfer.bind(transferController));
transferRoutes.post('/:id/cancel', transferController.cancelTransfer.bind(transferController));
transferRoutes.get('/patient/:patientId/history', transferController.getPatientTransferHistory.bind(transferController));

// Department routes
departmentRoutes.get('/', departmentController.listDepartments.bind(departmentController));
departmentRoutes.post('/', departmentController.createDepartment.bind(departmentController));
departmentRoutes.get('/:id', departmentController.getDepartmentById.bind(departmentController));
departmentRoutes.put('/:id', departmentController.updateDepartment.bind(departmentController));
departmentRoutes.get('/:id/stats', departmentController.getDepartmentStats.bind(departmentController));

export {
  bedRoutes,
  assignmentRoutes,
  transferRoutes,
  departmentRoutes,
};
