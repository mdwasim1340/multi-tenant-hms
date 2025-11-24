import express, { Request, Response } from 'express';
import { transferOptimizer } from '../services/transfer-optimizer';
import { aiFeatureManager } from '../services/ai-feature-manager';

/**
 * Transfer Optimization API Routes
 * 
 * Provides endpoints for ED-to-ward transfer optimization.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

const router = express.Router();

/**
 * GET /api/bed-management/transfer-priorities
 * Get prioritized list of ED patients awaiting transfer
 * Requirements: 4.1, 4.2
 */
router.get('/transfer-priorities', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const unit = req.query.unit as string | undefined;

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    // Check if feature is enabled
    const featureEnabled = await aiFeatureManager.isFeatureEnabled(
      tenantId,
      'transfer_optimization'
    );

    if (!featureEnabled) {
      return res.status(403).json({
        error: 'Transfer optimization is not enabled for this tenant',
        feature: 'transfer_optimization'
      });
    }

    const patients = await transferOptimizer.prioritizeEDPatients(tenantId, unit);

    res.json({
      success: true,
      data: patients,
      count: patients.length,
      unit: unit || 'all'
    });
  } catch (error: any) {
    console.error('Error getting transfer priorities:', error);
    res.status(500).json({
      error: 'Failed to get transfer priorities',
      message: error.message
    });
  }
});

/**
 * POST /api/bed-management/optimize-transfer
 * Optimize transfer timing for a specific patient
 * Requirements: 4.3, 4.4
 */
router.post('/optimize-transfer', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { patientId, admissionId } = req.body;

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (!patientId || !admissionId) {
      return res.status(400).json({
        error: 'patientId and admissionId are required'
      });
    }

    // Check if feature is enabled
    const featureEnabled = await aiFeatureManager.isFeatureEnabled(
      tenantId,
      'transfer_optimization'
    );

    if (!featureEnabled) {
      return res.status(403).json({
        error: 'Transfer optimization is not enabled for this tenant',
        feature: 'transfer_optimization'
      });
    }

    const transferPriority = await transferOptimizer.optimizeTransferTiming(
      tenantId,
      patientId,
      admissionId
    );

    res.json({
      success: true,
      data: transferPriority
    });
  } catch (error: any) {
    console.error('Error optimizing transfer:', error);
    res.status(500).json({
      error: 'Failed to optimize transfer',
      message: error.message
    });
  }
});

/**
 * GET /api/bed-management/bed-availability/:unit
 * Get bed availability prediction for a unit
 * Requirements: 4.3
 */
router.get('/bed-availability/:unit', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const unit = req.params.unit;
    const hours = parseInt(req.query.hours as string) || 8;

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    // Check if feature is enabled
    const featureEnabled = await aiFeatureManager.isFeatureEnabled(
      tenantId,
      'transfer_optimization'
    );

    if (!featureEnabled) {
      return res.status(403).json({
        error: 'Transfer optimization is not enabled for this tenant',
        feature: 'transfer_optimization'
      });
    }

    const availability = await transferOptimizer.predictBedAvailability(
      tenantId,
      unit,
      hours
    );

    res.json({
      success: true,
      data: availability
    });
  } catch (error: any) {
    console.error('Error getting bed availability:', error);
    res.status(500).json({
      error: 'Failed to get bed availability',
      message: error.message
    });
  }
});

/**
 * POST /api/bed-management/notify-transfer
 * Notify receiving unit of incoming transfer
 * Requirements: 4.5
 */
router.post('/notify-transfer', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { admissionId, receivingUnit, estimatedArrival } = req.body;

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (!admissionId || !receivingUnit || !estimatedArrival) {
      return res.status(400).json({
        error: 'admissionId, receivingUnit, and estimatedArrival are required'
      });
    }

    // Check if feature is enabled
    const featureEnabled = await aiFeatureManager.isFeatureEnabled(
      tenantId,
      'transfer_optimization'
    );

    if (!featureEnabled) {
      return res.status(403).json({
        error: 'Transfer optimization is not enabled for this tenant',
        feature: 'transfer_optimization'
      });
    }

    await transferOptimizer.notifyTransfer(
      tenantId,
      admissionId,
      receivingUnit,
      new Date(estimatedArrival)
    );

    res.json({
      success: true,
      message: 'Transfer notification sent successfully'
    });
  } catch (error: any) {
    console.error('Error notifying transfer:', error);
    res.status(500).json({
      error: 'Failed to notify transfer',
      message: error.message
    });
  }
});

/**
 * GET /api/bed-management/transfer-metrics
 * Get transfer performance metrics
 * Requirements: 4.5
 */
router.get('/transfer-metrics', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    // Check if feature is enabled
    const featureEnabled = await aiFeatureManager.isFeatureEnabled(
      tenantId,
      'transfer_optimization'
    );

    if (!featureEnabled) {
      return res.status(403).json({
        error: 'Transfer optimization is not enabled for this tenant',
        feature: 'transfer_optimization'
      });
    }

    const metrics = await transferOptimizer.getTransferMetrics(
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
    console.error('Error getting transfer metrics:', error);
    res.status(500).json({
      error: 'Failed to get transfer metrics',
      message: error.message
    });
  }
});

export default router;
