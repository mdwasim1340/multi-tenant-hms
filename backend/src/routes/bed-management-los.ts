/**
 * Bed Management - LOS Prediction API Routes
 * Endpoints for length of stay prediction functionality
 */

import express, { Request, Response } from 'express';
import { losPredictionService } from '../services/los-prediction-service';
import { LOSPredictionSchema } from '../types/bed-management';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = express.Router();

// Apply middleware to all routes
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * POST /api/bed-management/predict-los
 * Create a new LOS prediction for a patient admission
 */
router.post('/predict-los', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = (req as any).user?.id;

    // Validate request body
    const validatedData = LOSPredictionSchema.parse(req.body);

    // Create prediction
    const prediction = await losPredictionService.predictLOS(
      {
        admission_id: validatedData.admission_id,
        patient_id: validatedData.patient_id,
        diagnosis: validatedData.prediction_factors?.diagnosis || '',
        severity: validatedData.prediction_factors?.severity || 'moderate',
        age: validatedData.prediction_factors?.age || 50,
        comorbidities: validatedData.prediction_factors?.comorbidities || [],
        admission_source: validatedData.prediction_factors?.admission_source || 'emergency',
      },
      tenantId,
      userId
    );

    res.status(201).json({
      success: true,
      message: 'LOS prediction created successfully',
      data: prediction,
    });
  } catch (error: any) {
    console.error('Error creating LOS prediction:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.issues,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create LOS prediction',
    });
  }
});

/**
 * GET /api/bed-management/los/:admissionId
 * Get LOS prediction for a specific admission
 */
router.get('/los/:admissionId', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const admissionId = parseInt(req.params.admissionId);

    if (isNaN(admissionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid admission ID',
      });
    }

    const prediction = await losPredictionService.getPrediction(admissionId, tenantId);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        error: 'No prediction found for this admission',
      });
    }

    res.json({
      success: true,
      data: prediction,
    });
  } catch (error: any) {
    console.error('Error getting LOS prediction:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get LOS prediction',
    });
  }
});

/**
 * PUT /api/bed-management/los/:admissionId/actual
 * Update actual LOS when patient is discharged
 */
router.put('/los/:admissionId/actual', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const admissionId = parseInt(req.params.admissionId);
    const { actual_los_days } = req.body;

    if (isNaN(admissionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid admission ID',
      });
    }

    if (!actual_los_days || actual_los_days <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid actual_los_days is required',
      });
    }

    await losPredictionService.updateActualLOS(admissionId, actual_los_days, tenantId);

    res.json({
      success: true,
      message: 'Actual LOS updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating actual LOS:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update actual LOS',
    });
  }
});

/**
 * GET /api/bed-management/los/accuracy-metrics
 * Get accuracy metrics for LOS predictions
 */
router.get('/los/accuracy-metrics', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const days = parseInt(req.query.days as string) || 30;

    const metrics = await losPredictionService.getAccuracyMetrics(tenantId, days);

    res.json({
      success: true,
      data: metrics,
      period_days: days,
    });
  } catch (error: any) {
    console.error('Error getting accuracy metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get accuracy metrics',
    });
  }
});

/**
 * GET /api/bed-management/los/predictions
 * Get all predictions with optional filters
 */
router.get('/los/predictions', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const {
      patient_id,
      start_date,
      end_date,
      limit = '50',
      offset = '0',
    } = req.query;

    const options: any = {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    if (patient_id) {
      options.patientId = parseInt(patient_id as string);
    }

    if (start_date) {
      options.startDate = new Date(start_date as string);
    }

    if (end_date) {
      options.endDate = new Date(end_date as string);
    }

    const result = await losPredictionService.getAllPredictions(tenantId, options);

    res.json({
      success: true,
      data: result.predictions,
      pagination: {
        total: result.total,
        limit: options.limit,
        offset: options.offset,
        pages: Math.ceil(result.total / options.limit),
      },
    });
  } catch (error: any) {
    console.error('Error getting predictions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get predictions',
    });
  }
});

/**
 * PUT /api/bed-management/los/:admissionId/update
 * Update prediction for an admission (recalculate)
 */
router.put('/los/:admissionId/update', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = (req as any).user?.id;
    const admissionId = parseInt(req.params.admissionId);

    if (isNaN(admissionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid admission ID',
      });
    }

    const prediction = await losPredictionService.updatePrediction(admissionId, tenantId, userId);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        error: 'No existing prediction found for this admission',
      });
    }

    res.json({
      success: true,
      message: 'Prediction updated successfully',
      data: prediction,
    });
  } catch (error: any) {
    console.error('Error updating prediction:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update prediction',
    });
  }
});

export default router;
