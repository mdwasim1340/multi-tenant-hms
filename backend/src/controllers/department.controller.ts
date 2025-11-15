import { Request, Response, NextFunction } from 'express';
import { DepartmentService } from '../services/department.service';
import { CreateDepartmentSchema, UpdateDepartmentSchema } from '../validation/bed.validation';

export class DepartmentController {
  private readonly service = new DepartmentService();

  async listDepartments(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      // TODO: this.service.getDepartments(tenantId)
      res.json({ /* departments */ });
    } catch (error) {
      next(error);
    }
  }

  async createDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const data = CreateDepartmentSchema.parse(req.body);
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.user?.id;
      // TODO: this.service.createDepartment(data, tenantId, userId)
      res.status(201).json({ /* department */ });
    } catch (error) {
      next(error);
    }
  }

  async getDepartmentById(req: Request, res: Response, next: NextFunction) {
    try {
      const departmentId = Number(req.params.id);
      const tenantId = req.headers['x-tenant-id'] as string;
      // TODO: this.service.getDepartmentById(departmentId, tenantId)
      res.json({ /* department */ });
    } catch (error) {
      next(error);
    }
  }

  async updateDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const data = UpdateDepartmentSchema.parse(req.body);
      const departmentId = Number(req.params.id);
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.user?.id;
      // TODO: this.service.updateDepartment(departmentId, data, tenantId, userId)
      res.json({ /* department */ });
    } catch (error) {
      next(error);
    }
  }

  async getDepartmentStats(req: Request, res: Response, next: NextFunction) {
    try {
      const departmentId = Number(req.params.id);
      const tenantId = req.headers['x-tenant-id'] as string;
      // TODO: this.service.getDepartmentStats(departmentId, tenantId)
      res.json({ /* stats */ });
    } catch (error) {
      next(error);
    }
  }
}
