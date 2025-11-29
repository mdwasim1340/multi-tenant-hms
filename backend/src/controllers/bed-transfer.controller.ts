/**
 * Bed Transfer Controller
 * HTTP request handlers for bed transfer endpoints
 */

import { Request, Response } from 'express';
import bedTransferService from '../services/bed-transfer.service';
import {
  BedTransferSearchSchema,
  CreateBedTransferSchema,
  UpdateBedTransferSchema,
  CancelBedTransferSchema,
} from '../validation/bed.validation';
import { InvalidTransferError } from '../types/bed';

/**
 * GET /api/bed-transfers
 * List bed transfers with filtering
 */
export const getBedTransfers = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    
    // Validate query parameters
    const params = BedTransferSearchSchema.parse(req.query);
    
    const result = await bedTransferService.getBedTransfers(tenantId, params);
    
    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error,
      });
    }
    
    console.error('Get transfers error:', error);
    res.status(500).json({
      error: 'Failed to fetch bed transfers',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * GET /api/bed-transfers/:id
 * Get bed transfer by ID
 */
export const getBedTransferById = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const transferId = parseInt(req.params.id);
    
    if (isNaN(transferId)) {
      return res.status(400).json({ error: 'Invalid transfer ID' });
    }
    
    const transfer = await bedTransferService.getBedTransferById(tenantId, transferId);
    
    res.json({ transfer });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    
    console.error('Get transfer error:', error);
    res.status(500).json({
      error: 'Failed to fetch bed transfer',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * POST /api/bed-transfers
 * Create bed transfer
 */
export const createBedTransfer = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = (req as any).user?.id;
    
    // Validate request body
    const data = CreateBedTransferSchema.parse(req.body);
    
    const transfer = await bedTransferService.createBedTransfer(tenantId, data, userId);
    
    res.status(201).json({
      message: 'Bed transfer initiated successfully',
      transfer,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error,
      });
    }
    
    if (error instanceof InvalidTransferError) {
      return res.status(400).json({
        error: error.message,
        code: error.code,
      });
    }
    
    console.error('Create transfer error:', error);
    res.status(500).json({
      error: 'Failed to create bed transfer',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * PUT /api/bed-transfers/:id
 * Update bed transfer
 */
export const updateBedTransfer = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const transferId = parseInt(req.params.id);
    const userId = (req as any).user?.id;
    
    if (isNaN(transferId)) {
      return res.status(400).json({ error: 'Invalid transfer ID' });
    }
    
    // Validate request body
    const data = UpdateBedTransferSchema.parse(req.body);
    
    const transfer = await bedTransferService.updateBedTransfer(
      tenantId,
      transferId,
      data,
      userId
    );
    
    res.json({
      message: 'Bed transfer updated successfully',
      transfer,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error,
      });
    }
    
    if (error instanceof InvalidTransferError) {
      return res.status(400).json({
        error: error.message,
        code: error.code,
      });
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    
    console.error('Update transfer error:', error);
    res.status(500).json({
      error: 'Failed to update bed transfer',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * POST /api/bed-transfers/:id/complete
 * Complete bed transfer
 */
export const completeBedTransfer = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const transferId = parseInt(req.params.id);
    const userId = (req as any).user?.id;
    
    if (isNaN(transferId)) {
      return res.status(400).json({ error: 'Invalid transfer ID' });
    }
    
    const transfer = await bedTransferService.completeBedTransfer(tenantId, transferId, userId);
    
    res.json({
      message: 'Bed transfer completed successfully',
      transfer,
    });
  } catch (error) {
    if (error instanceof InvalidTransferError) {
      return res.status(400).json({
        error: error.message,
        code: error.code,
      });
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    
    console.error('Complete transfer error:', error);
    res.status(500).json({
      error: 'Failed to complete bed transfer',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * POST /api/bed-transfers/:id/cancel
 * Cancel bed transfer
 */
export const cancelBedTransfer = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const transferId = parseInt(req.params.id);
    const userId = (req as any).user?.id;
    
    if (isNaN(transferId)) {
      return res.status(400).json({ error: 'Invalid transfer ID' });
    }
    
    // Validate request body
    const data = CancelBedTransferSchema.parse(req.body);
    
    const transfer = await bedTransferService.cancelBedTransfer(
      tenantId,
      transferId,
      data.cancellation_reason,
      userId
    );
    
    res.json({
      message: 'Bed transfer cancelled successfully',
      transfer,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error,
      });
    }
    
    if (error instanceof InvalidTransferError) {
      return res.status(400).json({
        error: error.message,
        code: error.code,
      });
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    
    console.error('Cancel transfer error:', error);
    res.status(500).json({
      error: 'Failed to cancel bed transfer',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * GET /api/bed-transfers/patient/:patientId/history
 * Get patient transfer history
 */
export const getPatientTransferHistory = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const patientId = parseInt(req.params.patientId);
    
    if (isNaN(patientId)) {
      return res.status(400).json({ error: 'Invalid patient ID' });
    }
    
    const history = await bedTransferService.getPatientTransferHistory(tenantId, patientId);
    
    res.json({
      patient_id: patientId,
      history,
      count: history.length,
    });
  } catch (error) {
    console.error('Get patient transfer history error:', error);
    res.status(500).json({
      error: 'Failed to fetch patient transfer history',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
