/**
 * Department Controller
 * HTTP request handlers for department management endpoints
 */

import { Request, Response } from 'express';
import departmentService from '../services/department.service';
import {
  DepartmentSearchSchema,
  CreateDepartmentSchema,
  UpdateDepartmentSchema,
} from '../validation/bed.validation';
import { DepartmentNotFoundError } from '../types/bed';

/**
 * GET /api/departments
 * List all departments
 */
export const getDepartments = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    
    // Validate query parameters
    const params = DepartmentSearchSchema.parse(req.query);
    
    const result = await departmentService.getDepartments(tenantId, params);
    
    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error,
      });
    }
    
    console.error('Get departments error:', error);
    res.status(500).json({
      error: 'Failed to fetch departments',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * GET /api/departments/:id
 * Get department by ID
 */
export const getDepartmentById = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const departmentId = parseInt(req.params.id);
    
    if (isNaN(departmentId)) {
      return res.status(400).json({ error: 'Invalid department ID' });
    }
    
    const department = await departmentService.getDepartmentById(tenantId, departmentId);
    
    res.json({ department });
  } catch (error) {
    if (error instanceof DepartmentNotFoundError) {
      return res.status(404).json({
        error: error.message,
        code: error.code,
      });
    }
    
    console.error('Get department error:', error);
    res.status(500).json({
      error: 'Failed to fetch department',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * POST /api/departments
 * Create new department
 */
export const createDepartment = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = (req as any).user?.id;
    
    // Validate request body
    const data = CreateDepartmentSchema.parse(req.body);
    
    const department = await departmentService.createDepartment(tenantId, data, userId);
    
    res.status(201).json({
      message: 'Department created successfully',
      department,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error,
      });
    }
    
    console.error('Create department error:', error);
    res.status(500).json({
      error: 'Failed to create department',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * PUT /api/departments/:id
 * Update department
 */
export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const departmentId = parseInt(req.params.id);
    const userId = (req as any).user?.id;
    
    if (isNaN(departmentId)) {
      return res.status(400).json({ error: 'Invalid department ID' });
    }
    
    // Validate request body
    const data = UpdateDepartmentSchema.parse(req.body);
    
    const department = await departmentService.updateDepartment(
      tenantId,
      departmentId,
      data,
      userId
    );
    
    res.json({
      message: 'Department updated successfully',
      department,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error,
      });
    }
    
    if (error instanceof DepartmentNotFoundError) {
      return res.status(404).json({
        error: error.message,
        code: error.code,
      });
    }
    
    console.error('Update department error:', error);
    res.status(500).json({
      error: 'Failed to update department',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * GET /api/departments/:id/stats
 * Get department statistics
 */
export const getDepartmentStats = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const departmentId = parseInt(req.params.id);
    
    if (isNaN(departmentId)) {
      return res.status(400).json({ error: 'Invalid department ID' });
    }
    
    const stats = await departmentService.getDepartmentStats(tenantId, departmentId);
    
    res.json(stats);
  } catch (error) {
    if (error instanceof DepartmentNotFoundError) {
      return res.status(404).json({
        error: error.message,
        code: error.code,
      });
    }
    
    console.error('Get department stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch department statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * GET /api/departments/occupancy
 * Get all departments with occupancy metrics
 */
export const getDepartmentsWithOccupancy = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    
    const departments = await departmentService.getDepartmentsWithOccupancy(tenantId);
    
    res.json({
      departments,
      count: departments.length,
    });
  } catch (error) {
    console.error('Get departments occupancy error:', error);
    res.status(500).json({
      error: 'Failed to fetch departments with occupancy',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
