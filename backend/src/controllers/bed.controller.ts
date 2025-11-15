import { Request, Response, NextFunction } from 'express';
import { BedService } from '../services/bed.service';
import {
  CreateBedSchema,
  UpdateBedSchema,
  BedSearchSchema,
} from '../validation/bed.validation';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/AppError';

/**
 * BedController
 * Handles all HTTP requests related to bed management
 */
export class BedController {
  private readonly service = new BedService();

  /**
   * List all beds with optional filtering and pagination
   * GET /api/beds
   */
  listBeds = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;

      // Validate query parameters
      const query = BedSearchSchema.parse(req.query);

      const {
        page,
        limit,
        search,
        status,
        departmentId,
      } = query;

      // Call service to get beds
      const result = await this.service.getBeds(
        tenantId,
        { page, limit, search, status, departmentId }
      );

      res.status(200).json({
        success: true,
        message: 'Beds retrieved successfully',
        data: result.beds,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * Create a new bed
   * POST /api/beds
   */
  createBed = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = CreateBedSchema.parse(req.body);
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.user?.id;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const bed = await this.service.createBed(data, tenantId, userId);

      res.status(201).json({
        success: true,
        message: 'Bed created successfully',
        data: bed,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get bed by ID
   * GET /api/beds/:id
   */
  getBedById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bedId = Number(req.params.id);
      const tenantId = req.headers['x-tenant-id'] as string;

      if (isNaN(bedId)) {
        throw new ValidationError('Invalid bed ID');
      }

      const bed = await this.service.getBedById(bedId, tenantId);

      if (!bed) {
        throw new NotFoundError('Bed not found');
      }

      res.status(200).json({
        success: true,
        message: 'Bed retrieved successfully',
        data: bed,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * Update bed
   * PUT /api/beds/:id
   */
  updateBed = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bedId = Number(req.params.id);
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.user?.id;

      if (isNaN(bedId)) {
        throw new ValidationError('Invalid bed ID');
      }

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const data = UpdateBedSchema.parse(req.body);

      const bed = await this.service.updateBed(bedId, data, tenantId, userId);

      res.status(200).json({
        success: true,
        message: 'Bed updated successfully',
        data: bed,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * Delete bed
   * DELETE /api/beds/:id
   */
  deleteBed = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bedId = Number(req.params.id);
      const tenantId = req.headers['x-tenant-id'] as string;

      if (isNaN(bedId)) {
        throw new ValidationError('Invalid bed ID');
      }

      await this.service.deleteBed(bedId, tenantId);

      res.status(200).json({
        success: true,
        message: 'Bed deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get bed occupancy metrics
   * GET /api/beds/occupancy
   */
  getBedOccupancy = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const departmentId = req.query.departmentId 
        ? Number(req.query.departmentId) 
        : undefined;

      const occupancy = await this.service.getBedOccupancy(tenantId, departmentId);

      res.status(200).json({
        success: true,
        message: 'Bed occupancy retrieved successfully',
        data: occupancy,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * Check bed availability
   * GET /api/beds/availability
   */
  checkBedAvailability = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { departmentId, bedType, features } = req.query;

      const criteria: any = {};
      
      if (departmentId) {
        criteria.departmentId = Number(departmentId);
      }
      
      if (bedType) {
        criteria.bed_type = bedType as string;
      }
      
      if (features) {
        criteria.features = (features as string).split(',');
      }

      const availability = await this.service.checkBedAvailability(tenantId, criteria);

      res.status(200).json({
        success: true,
        message: 'Bed availability checked successfully',
        data: availability,
      });
    } catch (error) {
      next(error);
    }
  });
}
