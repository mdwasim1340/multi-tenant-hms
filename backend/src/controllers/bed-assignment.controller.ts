import { Request, Response, NextFunction } from 'express';
import { BedAssignmentService } from '../services/bed-assignment.service';
import { CreateBedAssignmentSchema, UpdateBedAssignmentSchema, DischargeBedAssignmentSchema } from '../validation/bed.validation';
import pool from '../database';

export class BedAssignmentController {
  private readonly service = new BedAssignmentService(pool);

  async listAssignments(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      // TODO: support query params (bedId, patientId, pagination, status)
      // const assignments = await this.service.
      res.json({ /* assignments */ });
    } catch (error) {
      next(error);
    }
  }

  async createAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const data = CreateBedAssignmentSchema.parse(req.body);
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req as any).user?.id;
      // TODO: call service.createBedAssignment(data, tenantId, userId)
      res.status(201).json({ /* assignment */ });
    } catch (error) {
      next(error);
    }
  }

  async getAssignmentById(req: Request, res: Response, next: NextFunction) {
    try {
      const assignmentId = Number(req.params.id);
      const tenantId = req.headers['x-tenant-id'] as string;
      // TODO: call service.getBedAssignmentById(assignmentId, tenantId)
      res.json({ /* assignment */ });
    } catch (error) {
      next(error);
    }
  }

  async updateAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const data = UpdateBedAssignmentSchema.parse(req.body);
      const assignmentId = Number(req.params.id);
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req as any).user?.id;
      // TODO: call service.updateBedAssignment(assignmentId, data, tenantId, userId)
      res.json({ /* assignment */ });
    } catch (error) {
      next(error);
    }
  }

  async dischargeAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const data = DischargeBedAssignmentSchema.parse(req.body);
      const assignmentId = Number(req.params.id);
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req as any).user?.id;
      // TODO: call service.dischargeBedAssignment(assignmentId, data, tenantId, userId)
      res.json({ /* assignment */ });
    } catch (error) {
      next(error);
    }
  }

  async getPatientHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const patientId = Number(req.params.patientId);
      const tenantId = req.headers['x-tenant-id'] as string;
      // TODO: call service.getPatientBedHistory(patientId, tenantId)
      res.json({ /* history */ });
    } catch (error) {
      next(error);
    }
  }

  async getBedHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const bedId = Number(req.params.bedId);
      const tenantId = req.headers['x-tenant-id'] as string;
      // TODO: call service.getBedAssignmentHistory(bedId, tenantId)
      res.json({ /* history */ });
    } catch (error) {
      next(error);
    }
  }
}

