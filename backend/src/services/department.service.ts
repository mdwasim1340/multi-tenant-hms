import { Department, CreateDepartmentData, UpdateDepartmentData } from '../types/bed';
import { DepartmentNotFoundError, DepartmentCodeExistsError, BedValidationError } from '../errors/BedError';
import { CreateDepartmentSchema, UpdateDepartmentSchema } from '../validation/bed.validation';

export class DepartmentService {
  async getDepartments(tenantId: string): Promise<Department[]> {
    // TODO: List all departments for a tenant
    throw new Error('Not implemented');
  }

  async getDepartmentById(departmentId: number, tenantId: string): Promise<Department> {
    // TODO: Get department by ID
    // If not found, throw DepartmentNotFoundError
    throw new Error('Not implemented');
  }

  async createDepartment(data: CreateDepartmentData, tenantId: string, userId: number): Promise<Department> {
    const payload = CreateDepartmentSchema.parse(data);
    // TODO: Insert department, enforce code uniqueness
    // Throw DepartmentCodeExistsError on duplicate
    throw new Error('Not implemented');
  }

  async updateDepartment(
    departmentId: number,
    data: UpdateDepartmentData,
    tenantId: string,
    userId: number
  ): Promise<Department> {
    const payload = UpdateDepartmentSchema.parse(data);
    // TODO: Update department
    throw new Error('Not implemented');
  }

  async getDepartmentStats(departmentId: number, tenantId: string): Promise<any> {
    // TODO: Aggregate bed occupancy data
    throw new Error('Not implemented');
  }
}
