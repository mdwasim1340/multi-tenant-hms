/**
 * Lab Test Controller
 * 
 * HTTP request handlers for laboratory test management
 */

import { Request, Response } from 'express';
import * as labTestService from '../services/labTest.service';
import { LabTestSchema } from '../types/labTest';

/**
 * GET /api/lab-tests
 * Get all lab tests with optional filtering
 */
export async function getLabTests(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ error: 'X-Tenant-ID header is required' });
      return;
    }

    const filters = {
      category_id: req.query.category_id ? parseInt(req.query.category_id as string) : undefined,
      specimen_type: req.query.specimen_type as string,
      status: req.query.status as 'active' | 'inactive' | 'discontinued',
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50
    };

    const result = await labTestService.getLabTests(tenantId, filters);

    res.json(result);
  } catch (error) {
    console.error('Error getting lab tests:', error);
    res.status(500).json({ error: 'Failed to get lab tests' });
  }
}

/**
 * GET /api/lab-tests/:id
 * Get lab test by ID
 */
export async function getLabTestById(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const testId = parseInt(req.params.id);

    if (!tenantId) {
      res.status(400).json({ error: 'X-Tenant-ID header is required' });
      return;
    }

    if (isNaN(testId)) {
      res.status(400).json({ error: 'Invalid test ID' });
      return;
    }

    const test = await labTestService.getLabTestById(tenantId, testId);

    if (!test) {
      res.status(404).json({ error: 'Lab test not found' });
      return;
    }

    res.json(test);
  } catch (error) {
    console.error('Error getting lab test:', error);
    res.status(500).json({ error: 'Failed to get lab test' });
  }
}

/**
 * POST /api/lab-tests
 * Create new lab test (admin only)
 */
export async function createLabTest(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ error: 'X-Tenant-ID header is required' });
      return;
    }

    // Validate request body
    const validationResult = LabTestSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: validationResult.error.issues 
      });
      return;
    }

    // Check if test code already exists
    const existingTest = await labTestService.getLabTestByCode(tenantId, req.body.test_code);
    if (existingTest) {
      res.status(409).json({ error: 'Test code already exists' });
      return;
    }

    const test = await labTestService.createLabTest(tenantId, validationResult.data);

    res.status(201).json({
      message: 'Lab test created successfully',
      test
    });
  } catch (error) {
    console.error('Error creating lab test:', error);
    res.status(500).json({ error: 'Failed to create lab test' });
  }
}

/**
 * PUT /api/lab-tests/:id
 * Update lab test (admin only)
 */
export async function updateLabTest(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const testId = parseInt(req.params.id);

    if (!tenantId) {
      res.status(400).json({ error: 'X-Tenant-ID header is required' });
      return;
    }

    if (isNaN(testId)) {
      res.status(400).json({ error: 'Invalid test ID' });
      return;
    }

    // Validate request body (partial)
    const validationResult = LabTestSchema.partial().safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: validationResult.error.issues 
      });
      return;
    }

    const test = await labTestService.updateLabTest(tenantId, testId, validationResult.data);

    if (!test) {
      res.status(404).json({ error: 'Lab test not found' });
      return;
    }

    res.json({
      message: 'Lab test updated successfully',
      test
    });
  } catch (error) {
    console.error('Error updating lab test:', error);
    res.status(500).json({ error: 'Failed to update lab test' });
  }
}

/**
 * DELETE /api/lab-tests/:id
 * Deactivate lab test (admin only)
 */
export async function deactivateLabTest(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const testId = parseInt(req.params.id);

    if (!tenantId) {
      res.status(400).json({ error: 'X-Tenant-ID header is required' });
      return;
    }

    if (isNaN(testId)) {
      res.status(400).json({ error: 'Invalid test ID' });
      return;
    }

    const success = await labTestService.deactivateLabTest(tenantId, testId);

    if (!success) {
      res.status(404).json({ error: 'Lab test not found' });
      return;
    }

    res.json({ message: 'Lab test deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating lab test:', error);
    res.status(500).json({ error: 'Failed to deactivate lab test' });
  }
}

/**
 * GET /api/lab-tests/categories
 * Get all test categories
 */
export async function getLabTestCategories(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ error: 'X-Tenant-ID header is required' });
      return;
    }

    const categories = await labTestService.getLabTestCategories(tenantId);

    res.json({ categories });
  } catch (error) {
    console.error('Error getting lab test categories:', error);
    res.status(500).json({ error: 'Failed to get lab test categories' });
  }
}

/**
 * GET /api/lab-tests/specimen-types
 * Get all specimen types
 */
export async function getSpecimenTypes(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ error: 'X-Tenant-ID header is required' });
      return;
    }

    const specimenTypes = await labTestService.getSpecimenTypes(tenantId);

    res.json({ specimen_types: specimenTypes });
  } catch (error) {
    console.error('Error getting specimen types:', error);
    res.status(500).json({ error: 'Failed to get specimen types' });
  }
}
