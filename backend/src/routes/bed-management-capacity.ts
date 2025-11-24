import express, { Request, Response } from 'express';
import { capacityForecaster } from '../services/capacity-forecaster';
import { aiFeatureManager } from '../services/ai-feature-manager';

/**
 * Capacity Forecasting API Routes
 * 
 * Provides endpoints for capacity predictions, seasonal analysis,
 * staffing recommendations, and surge capacity planning.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

const router = express.Router();

/**
 * GET /api/bed-management/capacity-forecast/:unit
 * Get capacity forecast for 24/48/72 hours
 * Requirements: 5.1
 */
router.get('/capacity-forecast/:unit', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const unit = req.params.unit;
    const hours = parseInt(req.query.hours as string) || 24;

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (!unit) {
      return res.status(400).json({ error: 'Unit parameter is required' });
    }

    if (![24, 48, 72].includes(hours)) {
      return res.status(400).json({ error: 'Hours must be 24, 48, or 72' });
    }

    // Check if feature is enabled
    const featureEnabled = await aiFeatureManager.isFeatureEnabled(
      tenantId,
      'capacity_forecasting'
    );

    if (!featureEnabled) {
      return res.status(403).json({
        error: 'Capacity forecasting is not enabled for this tenant',
        feature: 'capacity_forecasting'
      });
    }

    const forecasts = await capacityForecaster.predictCapacity(
      tenantId,
      unit,
      hours as 24 | 48 | 72
    );

    res.json({
      success: true,
      data: forecasts,
      unit,
      forecast_period_hours: hours,
      intervals: forecasts.length
    });
  } catch (error: any) {
    console.error('Error getting capacity forecast:', error);
    res.status(500).json({
      error: 'Failed to get capacity forecast',
      message: error.message
    });
  }
});

/**
 * GET /api/bed-management/seasonal-patterns/:unit
 * Analyze seasonal occupancy patterns
 * Requirements: 5.2
 */
router.get('/seasonal-patterns/:unit', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const unit = req.params.unit;
    const months = parseInt(req.query.months as string) || 12;

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (!unit) {
      return res.status(400).json({ error: 'Unit parameter is required' });
    }

    // Check if feature is enabled
    const featureEnabled = await aiFeatureManager.isFeatureEnabled(
      tenantId,
      'capacity_forecasting'
    );

    if (!featureEnabled) {
      return res.status(403).json({
        error: 'Capacity forecasting is not enabled for this tenant',
        feature: 'capacity_forecasting'
      });
    }

    const patterns = await capacityForecaster.analyzeSeasonalPatterns(
      tenantId,
      unit,
      months
    );

    res.json({
      success: true,
      data: patterns,
      unit,
      analysis_period_months: months
    });
  } catch (error: any) {
    console.error('Error analyzing seasonal patterns:', error);
    res.status(500).json({
      error: 'Failed to analyze seasonal patterns',
      message: error.message
    });
  }
});

/**
 * GET /api/bed-management/staffing-recommendations/:unit
 * Get staffing recommendations for a specific date
 * Requirements: 5.3
 */
router.get('/staffing-recommendations/:unit', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const unit = req.params.unit;
    const dateStr = req.query.date as string;

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (!unit) {
      return res.status(400).json({ error: 'Unit parameter is required' });
    }

    if (!dateStr) {
      return res.status(400).json({ error: 'Date query parameter is required' });
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Check if feature is enabled
    const featureEnabled = await aiFeatureManager.isFeatureEnabled(
      tenantId,
      'capacity_forecasting'
    );

    if (!featureEnabled) {
      return res.status(403).json({
        error: 'Capacity forecasting is not enabled for this tenant',
        feature: 'capacity_forecasting'
      });
    }

    const recommendations = await capacityForecaster.generateStaffingRecommendations(
      tenantId,
      unit,
      date
    );

    res.json({
      success: true,
      data: recommendations,
      unit,
      target_date: date
    });
  } catch (error: any) {
    console.error('Error generating staffing recommendations:', error);
    res.status(500).json({
      error: 'Failed to generate staffing recommendations',
      message: error.message
    });
  }
});

/**
 * GET /api/bed-management/surge-capacity/:unit
 * Assess surge capacity needs and readiness
 * Requirements: 5.4
 */
router.get('/surge-capacity/:unit', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const unit = req.params.unit;

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (!unit) {
      return res.status(400).json({ error: 'Unit parameter is required' });
    }

    // Check if feature is enabled
    const featureEnabled = await aiFeatureManager.isFeatureEnabled(
      tenantId,
      'capacity_forecasting'
    );

    if (!featureEnabled) {
      return res.status(403).json({
        error: 'Capacity forecasting is not enabled for this tenant',
        feature: 'capacity_forecasting'
      });
    }

    const surgeCapacity = await capacityForecaster.assessSurgeCapacity(
      tenantId,
      unit
    );

    res.json({
      success: true,
      data: surgeCapacity,
      unit
    });
  } catch (error: any) {
    console.error('Error assessing surge capacity:', error);
    res.status(500).json({
      error: 'Failed to assess surge capacity',
      message: error.message
    });
  }
});

/**
 * GET /api/bed-management/capacity-metrics
 * Get capacity performance metrics
 * Requirements: 5.5
 */
router.get('/capacity-metrics', async (req: Request, res: Response) => {
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
      'capacity_forecasting'
    );

    if (!featureEnabled) {
      return res.status(403).json({
        error: 'Capacity forecasting is not enabled for this tenant',
        feature: 'capacity_forecasting'
      });
    }

    const metrics = await capacityForecaster.getCapacityMetrics(
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
    console.error('Error getting capacity metrics:', error);
    res.status(500).json({
      error: 'Failed to get capacity metrics',
      message: error.message
    });
  }
});

export default router;
