import { Request, Response, NextFunction } from 'express';
import { BedTransferService } from '../services/bed-transfer.service';
import {
  CreateBedTransferSchema,
  CompleteBedTransferSchema,
} from '../validation/bed.validation';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/AppError';

/**
 * BedTransferController
 * Handles all HTTP requests related to bed transfers
 */
export class BedTransferController {
  private readonly service = new BedTransferService();

  /**
   * List all bed transfers with optional filtering
   * GET /api/bed-transfers
   */
  listTransfers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;

      const {
        page = '1',
        limit = '10',
        status,
        patientId,
      } = req.query;

      const filters: any = {};
      
      if (status) {
        filters.status = status as string;
      }
      
      if (patientId) {
        filters.patient_id = Number(patientId);
      }

      const result = await this.service.getTransfers(tenantId, {
        page: Number(page),
        limit: Number(limit),
        ...filters,
      });

      res.status(200).json({
        success: true,
        message: 'Bed transfers retrieved successfully',
        data: result.transfers,
        pagination: {
          total: result.total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(result.total / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * Create a new bed transfer request
   * POST /api/bed-transfers
   */
  createTransfer = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = CreateBedTransferSchema.parse(req.body);
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.user?.id;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const transfer = await this.service.createBedTransfer(data, tenantId, userId);

      res.status(201).json({
        success: true,
        message: 'Bed transfer request created successfully',
        data: transfer,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get bed transfer by ID
   * GET /api/bed-transfers/:id
   */
  getTransferById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const transferId = Number(req.params.id);
      const tenantId = req.headers['x-tenant-id'] as string;

      if (isNaN(transferId)) {
        throw new ValidationError('Invalid transfer ID');
      }

      const transfer = await this.service.getBedTransferById(transferId, tenantId);

      if (!transfer) {
        throw new NotFoundError('Bed transfer not found');
      }

      res.status(200).json({
        success: true,
        message: 'Bed transfer retrieved successfully',
        data: transfer,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * Complete a bed transfer
   * POST /api/bed-transfers/:id/complete
   */
  completeTransfer = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const transferId = Number(req.params.id);
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.user?.id;

      if (isNaN(transferId)) {
        throw new ValidationError('Invalid transfer ID');
      }

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const data = CompleteBedTransferSchema.parse(req.body);

      const transfer = await this.service.completeBedTransfer(
        transferId,
        data,
        tenantId,
        userId
      );

      res.status(200).json({
        success: true,
        message: 'Bed transfer completed successfully',
        data: transfer,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * Cancel a bed transfer
   * POST /api/bed-transfers/:id/cancel
   */
  cancelTransfer = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const transferId = Number(req.params.id);
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.user?.id;

      if (isNaN(transferId)) {
        throw new ValidationError('Invalid transfer ID');
      }

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const { cancellation_reason } = req.body;

      if (!cancellation_reason) {
        throw new ValidationError('Cancellation reason is required');
      }

      const transfer = await this.service.cancelBedTransfer(
        transferId,
        cancellation_reason,
        tenantId,
        userId
      );

      res.status(200).json({
        success: true,
        message: 'Bed transfer cancelled successfully',
        data: transfer,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get transfer history for a specific bed
   * GET /api/bed-transfers/history/bed/:bedId
   */
  getTransferHistory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bedId = Number(req.params.bedId);
      const tenantId = req.headers['x-tenant-id'] as string;

      if (isNaN(bedId)) {
        throw new ValidationError('Invalid bed ID');
      }

      const history = await this.service.getTransferHistory(bedId, tenantId);

      res.status(200).json({
        success: true,
        message: 'Bed transfer history retrieved successfully',
        data: history,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get transfer history for a specific patient
   * GET /api/bed-transfers/history/patient/:patientId
   */
  getPatientTransferHistory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = Number(req.params.patientId);
      const tenantId = req.headers['x-tenant-id'] as string;

      if (isNaN(patientId)) {
        throw new ValidationError('Invalid patient ID');
      }

      const history = await this.service.getPatientTransferHistory(patientId, tenantId);

      res.status(200).json({
        success: true,
        message: 'Patient transfer history retrieved successfully',
        data: history,
      });
    } catch (error) {
      next(error);
    }
  });
}
