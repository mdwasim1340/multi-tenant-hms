/**
 * Lab Result Controller
 * 
 * HTTP request handlers for laboratory result management
 */

import { Request, Response } from 'express';
import * as labResultService from '../services/labResult.service';
import { CreateLabResultSchema, UpdateLabResultSchema, VerifyLabResultSchema } from '../types/labTest';

/**
 * GET /api/lab-results
 * Get lab results with optional filtering
 */
export async function getLabResults(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ error: 'X-Tenant-ID header is required' });
      return;
    }

    const filters = {
      order_id: req.query.order_id ? parseInt(req.query.order_id as string) : undefined,
      patient_id: req.query.patient_id ? parseInt(req.query.patient_id as string) : undefined,
      is_abnormal: req.query.is_abnormal === 'true' ? true : req.query.is_abnormal === 'false' ? false : undefined,
      verified: req.query.verified === 'true' ? true : req.query.verified === 'false' ? false : undefined,
      result_date_from: req.query.result_date_from as string,
      result_date_to: req.query.result_date_to as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50
    };

    const result = await labResultService.getLabResults(tenantId, filters);

    res.json(result);
  } catch (error) {
    console.error('Error getting lab results:', error);
    res.status(500).json({ error: 'Failed to get lab results' });
  }
}

/**
 * GET /api/lab-results/:id
 * Get lab result by ID
 */
export async function getLabResultById(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const resultId = parseInt(req.params.id);

    if (!tenantId) {
      res.status(400).json({ error: 'X-Tenant-ID header is required' });
      return;
    }

    if (isNaN(resultId)) {
      res.status(400).json({ error: 'Invalid result ID' });
      return;
    }

    const result = await labResultService.getLabResultById(tenantId, resultId);

    if (!result) {
      res.status(404).json({ error: 'Lab result not found' });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting lab result:', error);
    res.status(500).json({ error: 'Failed to get lab result' });
  }
}

/**
 * GET /api/lab-results/order/:orderId
 * Get results by order ID
 */
export async function getResultsByOrder(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const orderId = parseInt(req.params.orderId);

    if (!tenantId) {
      res.status(400).json({ error: 'X-Tenant-ID header is required' });
      return;
    }

    if (isNaN(orderId)) {
      res.status(400).json({ error: 'Invalid order ID' });
      return;
    }

    const results = await labResultService.getResultsByOrder(tenantId, orderId);

    res.json({ results });
  } catch (error) {
    console.error('Error getting results by order:', error);
    res.status(500).json({ error: 'Failed to get results by order' });
  }
}

/**
 * POST /api/lab-results
 * Add new lab result
 */
export async function addLabResult(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ error: 'X-Tenant-ID header is required' });
      return;
    }

    // Validate request body
    const validationResult = CreateLabResultSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: validationResult.error.issues 
      });
      return;
    }

    const data = validationResult.data;

    // Support direct lab result creation without order
    if (!data.order_item_id && data.patient_id && data.test_id) {
      // Direct result creation - create a simple result record
      const directResult = await labResultService.addDirectLabResult(tenantId, {
        patient_id: data.patient_id,
        test_id: data.test_id,
        result_value: data.value || data.result_value || '',
        result_unit: data.unit || data.result_unit,
        reference_range: data.reference_range,
        is_abnormal: data.is_abnormal || false,
        abnormal_flag: data.abnormal_flag,
        result_date: data.result_date || new Date().toISOString(),
        notes: data.notes,
        sample_type: data.sample_type,
        ordering_doctor: data.ordering_doctor,
        result_status: data.result_status || 'final',
      });

      res.status(201).json({
        message: 'Lab result added successfully',
        result: directResult
      });
      return;
    }

    // Traditional flow with order_item_id
    if (!data.order_item_id) {
      res.status(400).json({ 
        error: 'Either order_item_id or (patient_id + test_id) is required' 
      });
      return;
    }

    // Check if result already exists for this order item
    const existingResult = await labResultService.getResultByOrderItem(
      tenantId, 
      data.order_item_id
    );

    if (existingResult) {
      res.status(409).json({ error: 'Result already exists for this order item' });
      return;
    }

    const result = await labResultService.addLabResult(tenantId, data as any);

    res.status(201).json({
      message: 'Lab result added successfully',
      result
    });
  } catch (error) {
    console.error('Error adding lab result:', error);
    res.status(500).json({ error: 'Failed to add lab result' });
  }
}

/**
 * PUT /api/lab-results/:id
 * Update lab result
 */
export async function updateLabResult(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const resultId = parseInt(req.params.id);

    if (!tenantId) {
      res.status(400).json({ error: 'X-Tenant-ID header is required' });
      return;
    }

    if (isNaN(resultId)) {
      res.status(400).json({ error: 'Invalid result ID' });
      return;
    }

    // Validate request body
    const validationResult = UpdateLabResultSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: validationResult.error.issues 
      });
      return;
    }

    const result = await labResultService.updateLabResult(tenantId, resultId, validationResult.data);

    if (!result) {
      res.status(404).json({ error: 'Lab result not found' });
      return;
    }

    res.json({
      message: 'Lab result updated successfully',
      result
    });
  } catch (error) {
    console.error('Error updating lab result:', error);
    res.status(500).json({ error: 'Failed to update lab result' });
  }
}

/**
 * POST /api/lab-results/:id/verify
 * Verify lab result
 */
export async function verifyLabResult(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const resultId = parseInt(req.params.id);

    if (!tenantId) {
      res.status(400).json({ error: 'X-Tenant-ID header is required' });
      return;
    }

    if (isNaN(resultId)) {
      res.status(400).json({ error: 'Invalid result ID' });
      return;
    }

    // Validate request body
    const validationResult = VerifyLabResultSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: validationResult.error.issues 
      });
      return;
    }

    const result = await labResultService.verifyLabResult(
      tenantId, 
      resultId, 
      validationResult.data.verified_by
    );

    if (!result) {
      res.status(404).json({ error: 'Lab result not found' });
      return;
    }

    res.json({
      message: 'Lab result verified successfully',
      result
    });
  } catch (error) {
    console.error('Error verifying lab result:', error);
    res.status(500).json({ error: 'Failed to verify lab result' });
  }
}

/**
 * GET /api/lab-results/abnormal
 * Get abnormal results
 */
export async function getAbnormalResults(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ error: 'X-Tenant-ID header is required' });
      return;
    }

    const patientId = req.query.patient_id ? parseInt(req.query.patient_id as string) : undefined;

    const results = await labResultService.getAbnormalResults(tenantId, patientId);

    res.json({ results });
  } catch (error) {
    console.error('Error getting abnormal results:', error);
    res.status(500).json({ error: 'Failed to get abnormal results' });
  }
}

/**
 * GET /api/lab-results/critical
 * Get critical results
 */
export async function getCriticalResults(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ error: 'X-Tenant-ID header is required' });
      return;
    }

    const results = await labResultService.getCriticalResults(tenantId);

    res.json({ results });
  } catch (error) {
    console.error('Error getting critical results:', error);
    res.status(500).json({ error: 'Failed to get critical results' });
  }
}

/**
 * GET /api/lab-results/history/:patientId
 * Get result history for patient
 */
export async function getResultHistory(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const patientId = parseInt(req.params.patientId);

    if (!tenantId) {
      res.status(400).json({ error: 'X-Tenant-ID header is required' });
      return;
    }

    if (isNaN(patientId)) {
      res.status(400).json({ error: 'Invalid patient ID' });
      return;
    }

    const testCode = req.query.test_code as string;

    const results = await labResultService.getResultHistory(tenantId, patientId, testCode);

    res.json({ results });
  } catch (error) {
    console.error('Error getting result history:', error);
    res.status(500).json({ error: 'Failed to get result history' });
  }
}

/**
 * GET /api/lab-results/statistics
 * Get result statistics
 */
export async function getLabResultStatistics(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ error: 'X-Tenant-ID header is required' });
      return;
    }

    const statistics = await labResultService.getLabResultStatistics(tenantId);

    res.json(statistics);
  } catch (error) {
    console.error('Error getting lab result statistics:', error);
    res.status(500).json({ error: 'Failed to get lab result statistics' });
  }
}
