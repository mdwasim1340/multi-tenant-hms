import express, { Request, Response } from 'express';
import { dischargeReadinessPredictor } from '../services/discharge-readiness-predictor';
import { aiFeatureManager } from '../services/ai-feature-manager';

/**
 * Discharge Readiness API Routes
 * 
 * Provides endpoints for discharge planning and readiness prediction.
 * 
 * Requirements: 3.1, 3.2, 3.3, 17.1, 17.2, 17.4, 17.5
 */

const router = express.Router();

/**
 * GET /api/bed-management/discharge-readiness/:patientId
 * Get discharge readiness prediction for a patient
 * Requirements: 3.1, 3.2, 3.3
 */
router.get('/discharge-readiness/:patientId', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const patientId = parseInt(req.params.patientId);
    const admissionId = parseInt(req.query.admissionId as string);

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (isNaN(patientId) || isNaN(admissionId)) {
      return res.status(400).json({ error: 'Invalid patient ID or admission ID' });
    }

    // Check if feature is enabled
    const featureEnabled = await aiFeatureManager.isFeatureEnabled(tenantId, 'discharge_readiness' as any);

    if (!featureEnabled) {
      return res.status(403).json({
        error: 'Discharge readiness prediction is not enabled for this tenant',
        feature: 'discharge_readiness'
      });
    }

    const prediction = await dischargeReadinessPredictor.predictDischargeReadiness(
      tenantId,
      patientId,
      admissionId
    );

    res.json({
      success: true,
      data: prediction
    });
  } catch (error: any) {
    console.error('Error predicting discharge readiness:', error);
    res.status(500).json({
      error: 'Failed to predict discharge readiness',
      message: error.message
    });
  }
});

/**
 * GET /api/bed-management/discharge-ready-patients
 * Get list of patients ready for discharge
 * Requirements: 3.1, 17.2
 */
router.get('/discharge-ready-patients', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const minScore = parseInt(req.query.minScore as string) || 80;

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    // Check if feature is enabled
    const featureEnabled = await aiFeatureManager.isFeatureEnabled(tenantId, 'discharge_readiness' as any);

    if (!featureEnabled) {
      return res.status(403).json({
        error: 'Discharge readiness prediction is not enabled for this tenant',
        feature: 'discharge_readiness'
      });
    }

    const patients = await dischargeReadinessPredictor.getDischargeReadyPatients(
      tenantId,
      minScore
    );

    res.json({
      success: true,
      data: patients,
      count: patients.length
    });
  } catch (error: any) {
    console.error('Error getting discharge-ready patients:', error);
    res.status(500).json({
      error: 'Failed to get discharge-ready patients',
      message: error.message
    });
  }
});

/**
 * POST /api/bed-management/discharge-barriers/:admissionId
 * Update barrier status for an admission
 * Requirements: 3.4, 17.3
 */
router.post('/discharge-barriers/:admissionId', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const admissionId = parseInt(req.params.admissionId);
    const { barrierId, resolved } = req.body;

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (isNaN(admissionId)) {
      return res.status(400).json({ error: 'Invalid admission ID' });
    }

    if (!barrierId || typeof resolved !== 'boolean') {
      return res.status(400).json({
        error: 'barrierId and resolved (boolean) are required'
      });
    }

    // Check if feature is enabled
    const featureEnabled = await aiFeatureManager.isFeatureEnabled(tenantId, 'discharge_readiness' as any);

    if (!featureEnabled) {
      return res.status(403).json({
        error: 'Discharge readiness prediction is not enabled for this tenant',
        feature: 'discharge_readiness'
      });
    }

    await dischargeReadinessPredictor.updateBarrierStatus(
      tenantId,
      admissionId,
      barrierId,
      resolved
    );

    res.json({
      success: true,
      message: 'Barrier status updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating barrier status:', error);
    res.status(500).json({
      error: 'Failed to update barrier status',
      message: error.message
    });
  }
});

/**
 * GET /api/bed-management/discharge-metrics
 * Get discharge performance metrics
 * Requirements: 17.4, 17.5
 */
router.get('/discharge-metrics', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    // Check if feature is enabled
    const featureEnabled = await aiFeatureManager.isFeatureEnabled(tenantId, 'discharge_readiness' as any);

    if (!featureEnabled) {
      return res.status(403).json({
        error: 'Discharge readiness prediction is not enabled for this tenant',
        feature: 'discharge_readiness'
      });
    }

    const metrics = await dischargeReadinessPredictor.getDischargeMetrics(
      tenantId,
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: metrics,
      period: {
        start: startDate,
        end: endDate
      }
    });
  } catch (error: any) {
    console.error('Error getting discharge metrics:', error);
    res.status(500).json({
      error: 'Failed to get discharge metrics',
      message: error.message
    });
  }
});

/**
 * POST /api/bed-management/batch-discharge-predictions
 * Generate discharge predictions for multiple patients
 * Requirements: 3.1, 17.1
 */
router.post('/batch-discharge-predictions', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { admissions } = req.body;

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (!Array.isArray(admissions) || admissions.length === 0) {
      return res.status(400).json({
        error: 'admissions array is required and must not be empty'
      });
    }

    // Check if feature is enabled
    const featureEnabled = await aiFeatureManager.isFeatureEnabled(tenantId, 'discharge_readiness' as any);

    if (!featureEnabled) {
      return res.status(403).json({
        error: 'Discharge readiness prediction is not enabled for this tenant',
        feature: 'discharge_readiness'
      });
    }

    const predictions = [];
    const errors = [];

    for (const admission of admissions) {
      try {
        const prediction = await dischargeReadinessPredictor.predictDischargeReadiness(
          tenantId,
          admission.patientId,
          admission.admissionId
        );
        predictions.push(prediction);
      } catch (error: any) {
        errors.push({
          admissionId: admission.admissionId,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: predictions,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: admissions.length,
        successful: predictions.length,
        failed: errors.length
      }
    });
  } catch (error: any) {
    console.error('Error generating batch discharge predictions:', error);
    res.status(500).json({
      error: 'Failed to generate batch discharge predictions',
      message: error.message
    });
  }
});

export default router;

