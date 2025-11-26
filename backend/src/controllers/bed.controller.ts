/**
 * Bed Controller
 * HTTP request handlers for bed management endpoints
 */

import { Request, Response } from 'express';
import bedService from '../services/bed.service';
import bedAvailabilityService from '../services/bed-availability.service';
import {
  BedSearchSchema,
  CreateBedSchema,
  UpdateBedSchema,
  AvailableBedsQuerySchema,
} from '../validation/bed.validation';
import { BedNotFoundError } from '../types/bed';

/**
 * GET /api/beds
 * List beds with filtering and pagination
 */
export const getBeds = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    
    // Validate query parameters
    const params = BedSearchSchema.parse(req.query);
    
    console.log('🔍 BACKEND - getBeds called with params:', {
      limit: params.limit,
      page: params.page,
      rawQuery: req.query
    });
    
    const result = await bedService.getBeds(tenantId, params);
    
    console.log('🔍 BACKEND - getBeds returning:', {
      bedsCount: result.beds.length,
      total: result.pagination.total,
      limit: result.pagination.limit
    });
    
    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error,
      });
    }
    
    console.error('Get beds error:', error);
    res.status(500).json({
      error: 'Failed to fetch beds',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * GET /api/beds/:id
 * Get bed by ID
 */
export const getBedById = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const bedId = parseInt(req.params.id);
    
    if (isNaN(bedId)) {
      return res.status(400).json({ error: 'Invalid bed ID' });
    }
    
    const bed = await bedService.getBedById(tenantId, bedId);
    
    res.json({ bed });
  } catch (error) {
    if (error instanceof BedNotFoundError) {
      return res.status(404).json({
        error: error.message,
        code: error.code,
      });
    }
    
    console.error('Get bed error:', error);
    res.status(500).json({
      error: 'Failed to fetch bed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * POST /api/beds
 * Create new bed
 */
export const createBed = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = (req as any).user?.id;
    
    // Validate request body
    const data = CreateBedSchema.parse(req.body);
    
    const bed = await bedService.createBed(tenantId, data, userId);
    
    res.status(201).json({
      message: 'Bed created successfully',
      bed,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error,
      });
    }
    
    console.error('Create bed error:', error);
    res.status(500).json({
      error: 'Failed to create bed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * PUT /api/beds/:id
 * Update bed
 */
export const updateBed = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const bedId = parseInt(req.params.id);
    const userId = (req as any).user?.id;
    
    if (isNaN(bedId)) {
      return res.status(400).json({ error: 'Invalid bed ID' });
    }
    
    // Validate request body
    const data = UpdateBedSchema.parse(req.body);
    
    const bed = await bedService.updateBed(tenantId, bedId, data, userId);
    
    res.json({
      message: 'Bed updated successfully',
      bed,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error,
      });
    }
    
    if (error instanceof BedNotFoundError) {
      return res.status(404).json({
        error: error.message,
        code: error.code,
      });
    }
    
    console.error('Update bed error:', error);
    res.status(500).json({
      error: 'Failed to update bed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * DELETE /api/beds/:id
 * Delete bed (soft delete)
 */
export const deleteBed = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const bedId = parseInt(req.params.id);
    const userId = (req as any).user?.id;
    
    if (isNaN(bedId)) {
      return res.status(400).json({ error: 'Invalid bed ID' });
    }
    
    await bedService.deleteBed(tenantId, bedId, userId);
    
    res.json({
      message: 'Bed deleted successfully',
    });
  } catch (error) {
    if (error instanceof BedNotFoundError) {
      return res.status(404).json({
        error: error.message,
        code: error.code,
      });
    }
    
    console.error('Delete bed error:', error);
    res.status(500).json({
      error: 'Failed to delete bed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * GET /api/beds/occupancy
 * Get bed occupancy metrics
 */
export const getBedOccupancy = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    
    const metrics = await bedService.getBedOccupancy(tenantId);
    
    res.json({
      occupancy: metrics,
    });
  } catch (error) {
    console.error('Get occupancy error:', error);
    res.status(500).json({
      error: 'Failed to fetch occupancy metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * GET /api/beds/available
 * Get available beds
 */
export const getAvailableBeds = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    
    // Validate query parameters
    const query = AvailableBedsQuerySchema.parse(req.query);
    
    const beds = await bedAvailabilityService.getAvailableBeds(tenantId, query);
    
    res.json({
      beds,
      count: beds.length,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error,
      });
    }
    
    console.error('Get available beds error:', error);
    res.status(500).json({
      error: 'Failed to fetch available beds',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * GET /api/beds/:id/availability
 * Check bed availability
 */
export const checkBedAvailability = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const bedId = parseInt(req.params.id);
    
    if (isNaN(bedId)) {
      return res.status(400).json({ error: 'Invalid bed ID' });
    }
    
    const availability = await bedAvailabilityService.checkBedAvailable(tenantId, bedId);
    
    res.json(availability);
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({
      error: 'Failed to check bed availability',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
