/**
 * Bed Assignment Controller
 * HTTP request handlers for bed assignment endpoints
 */

import { Request, Response } from 'express';
import bedAssignmentService from '../services/bed-assignment.service';
import {
  BedAssignmentSearchSchema,
  CreateBedAssignmentSchema,
  UpdateBedAssignmentSchema,
  DischargeBedAssignmentSchema,
} from '../validation/bed.validation';
import { BedAssignmentConflictError, BedUnavailableError } from '../types/bed';

/**
 * GET /api/bed-assignments
 * List bed assignments with filtering
 */
export const getBedAssignments = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    
    // Validate query parameters
    const params = BedAssignmentSearchSchema.parse(req.query);
    
    const result = await bedAssignmentService.getBedAssignments(tenantId, params);
    
    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error,
      });
    }
    
    console.error('Get assignments error:', error);
    res.status(500).json({
      error: 'Failed to fetch bed assignments',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * GET /api/bed-assignments/:id
 * Get bed assignment by ID
 */
export const getBedAssignmentById = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const assignmentId = parseInt(req.params.id);
    
    if (isNaN(assignmentId)) {
      return res.status(400).json({ error: 'Invalid assignment ID' });
    }
    
    const assignment = await bedAssignmentService.getBedAssignmentById(tenantId, assignmentId);
    
    res.json({ assignment });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    
    console.error('Get assignment error:', error);
    res.status(500).json({
      error: 'Failed to fetch bed assignment',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * POST /api/bed-assignments
 * Create bed assignment
 */
export const createBedAssignment = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = (req as any).user?.id;
    
    // Validate request body
    const data = CreateBedAssignmentSchema.parse(req.body);
    
    const assignment = await bedAssignmentService.createBedAssignment(tenantId, data, userId);
    
    res.status(201).json({
      message: 'Bed assigned successfully',
      assignment,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error,
      });
    }
    
    if (error instanceof BedUnavailableError) {
      return res.status(409).json({
        error: error.message,
        code: error.code,
      });
    }
    
    if (error instanceof BedAssignmentConflictError) {
      return res.status(409).json({
        error: error.message,
        code: error.code,
      });
    }
    
    console.error('Create assignment error:', error);
    res.status(500).json({
      error: 'Failed to create bed assignment',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * PUT /api/bed-assignments/:id
 * Update bed assignment
 */
export const updateBedAssignment = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const assignmentId = parseInt(req.params.id);
    const userId = (req as any).user?.id;
    
    if (isNaN(assignmentId)) {
      return res.status(400).json({ error: 'Invalid assignment ID' });
    }
    
    // Validate request body
    const data = UpdateBedAssignmentSchema.parse(req.body);
    
    const assignment = await bedAssignmentService.updateBedAssignment(
      tenantId,
      assignmentId,
      data,
      userId
    );
    
    res.json({
      message: 'Bed assignment updated successfully',
      assignment,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error,
      });
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    
    console.error('Update assignment error:', error);
    res.status(500).json({
      error: 'Failed to update bed assignment',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * POST /api/bed-assignments/:id/discharge
 * Discharge patient from bed
 */
export const dischargeBedAssignment = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const assignmentId = parseInt(req.params.id);
    const userId = (req as any).user?.id;
    
    if (isNaN(assignmentId)) {
      return res.status(400).json({ error: 'Invalid assignment ID' });
    }
    
    // Validate request body
    const data = DischargeBedAssignmentSchema.parse(req.body);
    
    const assignment = await bedAssignmentService.dischargeBedAssignment(
      tenantId,
      assignmentId,
      data,
      userId
    );
    
    res.json({
      message: 'Patient discharged successfully',
      assignment,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error,
      });
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    
    console.error('Discharge assignment error:', error);
    res.status(500).json({
      error: 'Failed to discharge patient',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * GET /api/bed-assignments/patient/:patientId/history
 * Get patient bed history
 */
export const getPatientBedHistory = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const patientId = parseInt(req.params.patientId);
    
    if (isNaN(patientId)) {
      return res.status(400).json({ error: 'Invalid patient ID' });
    }
    
    const history = await bedAssignmentService.getPatientBedHistory(tenantId, patientId);
    
    res.json({
      patient_id: patientId,
      history,
      count: history.length,
    });
  } catch (error) {
    console.error('Get patient history error:', error);
    res.status(500).json({
      error: 'Failed to fetch patient bed history',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * GET /api/bed-assignments/bed/:bedId/history
 * Get bed assignment history
 */
export const getBedAssignmentHistory = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const bedId = parseInt(req.params.bedId);
    
    if (isNaN(bedId)) {
      return res.status(400).json({ error: 'Invalid bed ID' });
    }
    
    const history = await bedAssignmentService.getBedAssignmentHistory(tenantId, bedId);
    
    res.json({
      bed_id: bedId,
      history,
      count: history.length,
    });
  } catch (error) {
    console.error('Get bed history error:', error);
    res.status(500).json({
      error: 'Failed to fetch bed assignment history',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
