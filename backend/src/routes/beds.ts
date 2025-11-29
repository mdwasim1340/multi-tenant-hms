/**
 * Bed Management Routes
 * API routes for bed management system
 * Updated: Fixed department route conflicts
 */

import express from 'express';
import * as bedController from '../controllers/bed.controller';
import * as bedAssignmentController from '../controllers/bed-assignment.controller';
import * as bedTransferController from '../controllers/bed-transfer.controller';
import * as departmentController from '../controllers/department.controller';

const router = express.Router();

// ==================
// Department Routes - Using different paths to avoid conflicts
// ==================

// ==================
// ALL SPECIFIC ROUTES MUST COME FIRST
// ==================

// Test route to verify router is working
router.get('/test', (req, res) => {
  res.json({ message: 'Test route working' });
});

// Bed Assignment Routes
router.get('/assignments', bedAssignmentController.getBedAssignments);
router.post('/assignments', bedAssignmentController.createBedAssignment);
router.get('/assignments/:id', bedAssignmentController.getBedAssignmentById);
router.put('/assignments/:id', bedAssignmentController.updateBedAssignment);
router.post('/assignments/:id/discharge', bedAssignmentController.dischargeBedAssignment);
router.get('/assignments/patient/:patientId/history', bedAssignmentController.getPatientBedHistory);
router.get('/assignments/bed/:bedId/history', bedAssignmentController.getBedAssignmentHistory);

// Bed Routes - Specific routes first
router.get('/beds', bedController.getBeds);
router.post('/beds', bedController.createBed);
router.get('/beds/occupancy', bedController.getBedOccupancy);
router.get('/beds/available', bedController.getAvailableBeds);
router.get('/beds/:id/availability', bedController.checkBedAvailability);

// PARAMETERIZED ROUTES MUST BE LAST
router.get('/beds/:id', bedController.getBedById);
router.put('/beds/:id', bedController.updateBed);
router.delete('/beds/:id', bedController.deleteBed);

// ==================
// Bed Transfer Routes
// ==================

router.get('/bed-transfers', bedTransferController.getBedTransfers);
router.post('/bed-transfers', bedTransferController.createBedTransfer);
router.get('/bed-transfers/:id', bedTransferController.getBedTransferById);
router.put('/bed-transfers/:id', bedTransferController.updateBedTransfer);
router.post('/bed-transfers/:id/complete', bedTransferController.completeBedTransfer);
router.post('/bed-transfers/:id/cancel', bedTransferController.cancelBedTransfer);
router.get('/bed-transfers/patient/:patientId/history', bedTransferController.getPatientTransferHistory);

export default router;
