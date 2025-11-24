import { Router, Request, Response } from 'express';
import { aiFeatureManager } from '../services/ai-feature-manager';
import pool from '../database';

/**
 * Bed Management Admin Routes
 * 
 * Admin-only endpoints for managing bed management features and viewing performance metrics.
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 12.1, 12.2, 12.3, 12.4, 12.5, 10.1, 10.2, 10.3, 10.4, 10.5
 */

const router = Router();

/**
 * GET /api/bed-management/admin/features
 * Get all bed management features and their status
 * 
 * Requirements: 11.1, 11.2, 11.3
 */
router.get('/features', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      return res.status(400).json({
        error: 'X-Tenant-ID header is required'
      });
    }

    // Get all bed management features
    const features = [
      'los_prediction',
      'bed_assignment_optimization',
      'discharge_readiness',
      'transfer_optimization',
      'capacity_forecasting'
    ];

    const featureStatuses = await Promise.all(
      features.map(async (feature) => {
        const isEnabled = await aiFeatureManager.isFeatureEnabled(tenantId, feature);
        
        // Get feature metadata
        const result = await pool.query(`
          SELECT 
            feature_name,
            enabled,
            enabled_at,
            enabled_by,
            disabled_at,
            disabled_by,
            configuration
          FROM ai_features
          WHERE tenant_id = $1 AND feature_name = $2
        `, [tenantId, feature]);

        const featureData = result.rows[0] || {
          feature_name: feature,
          enabled: false,
          enabled_at: null,
          enabled_by: null,
          disabled_at: null,
          disabled_by: null,
          configuration: {}
        };

        return {
          feature_name: feature,
          display_name: getFeatureDisplayName(feature),
          description: getFeatureDescription(feature),
          enabled: isEnabled,
          enabled_at: featureData.enabled_at,
          enabled_by: featureData.enabled_by,
          disabled_at: featureData.disabled_at,
          disabled_by: featureData.disabled_by,
          configuration: featureData.configuration || {}
        };
      })
    );

    res.json({
      success: true,
      data: featureStatuses,
      count: featureStatuses.length
    });

  } catch (error) {
    console.error('Error fetching bed management features:', error);
    res.status(500).json({
      error: 'Failed to fetch bed management features'
    });
  }
});

/**
 * POST /api/bed-management/admin/features/:feature/enable
 * Enable a specific bed management feature
 * 
 * Requirements: 11.2, 11.4, 12.2, 12.3
 */
router.post('/features/:feature/enable', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { feature } = req.params;
    const { enabled_by, reason, configuration } = req.body;

    if (!tenantId) {
      return res.status(400).json({
        error: 'X-Tenant-ID header is required'
      });
    }

    if (!enabled_by) {
      return res.status(400).json({
        error: 'enabled_by is required'
      });
    }

    // Validate feature name
    const validFeatures = [
      'los_prediction',
      'bed_assignment_optimization',
      'discharge_readiness',
      'transfer_optimization',
      'capacity_forecasting'
    ];

    if (!validFeatures.includes(feature)) {
      return res.status(400).json({
        error: 'Invalid feature name',
        valid_features: validFeatures
      });
    }

    // Enable the feature
    await aiFeatureManager.enableFeature(tenantId, feature, enabled_by);

    // Update configuration if provided
    if (configuration) {
      await pool.query(`
        UPDATE ai_features
        SET configuration = $1
        WHERE tenant_id = $2 AND feature_name = $3
      `, [JSON.stringify(configuration), tenantId, feature]);
    }

    // Log the action in audit log
    await pool.query(`
      INSERT INTO ai_feature_audit_log (
        tenant_id, feature_name, action, performed_by, reason, created_at
      ) VALUES ($1, $2, 'enable', $3, $4, NOW())
    `, [tenantId, feature, enabled_by, reason || 'Feature enabled']);

    res.json({
      success: true,
      message: `Feature ${feature} enabled successfully`,
      data: {
        feature_name: feature,
        enabled: true,
        enabled_by,
        enabled_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error enabling feature:', error);
    res.status(500).json({
      error: 'Failed to enable feature'
    });
  }
});

/**
 * POST /api/bed-management/admin/features/:feature/disable
 * Disable a specific bed management feature
 * 
 * Requirements: 11.2, 11.4, 12.2, 12.4
 */
router.post('/features/:feature/disable', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { feature } = req.params;
    const { disabled_by, reason } = req.body;

    if (!tenantId) {
      return res.status(400).json({
        error: 'X-Tenant-ID header is required'
      });
    }

    if (!disabled_by) {
      return res.status(400).json({
        error: 'disabled_by is required'
      });
    }

    if (!reason) {
      return res.status(400).json({
        error: 'reason is required when disabling a feature'
      });
    }

    // Validate feature name
    const validFeatures = [
      'los_prediction',
      'bed_assignment_optimization',
      'discharge_readiness',
      'transfer_optimization',
      'capacity_forecasting'
    ];

    if (!validFeatures.includes(feature)) {
      return res.status(400).json({
        error: 'Invalid feature name',
        valid_features: validFeatures
      });
    }

    // Disable the feature
    await aiFeatureManager.disableFeature(tenantId, feature, disabled_by);

    // Log the action in audit log
    await pool.query(`
      INSERT INTO ai_feature_audit_log (
        tenant_id, feature_name, action, performed_by, reason, created_at
      ) VALUES ($1, $2, 'disable', $3, $4, NOW())
    `, [tenantId, feature, disabled_by, reason]);

    res.json({
      success: true,
      message: `Feature ${feature} disabled successfully`,
      data: {
        feature_name: feature,
        enabled: false,
        disabled_by,
        disabled_at: new Date().toISOString(),
        reason
      }
    });

  } catch (error) {
    console.error('Error disabling feature:', error);
    res.status(500).json({
      error: 'Failed to disable feature'
    });
  }
});

/**
 * GET /api/bed-management/admin/audit-log
 * Get audit log of feature changes
 * 
 * Requirements: 12.1, 12.5
 */
router.get('/audit-log', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { feature, limit = 100, offset = 0 } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        error: 'X-Tenant-ID header is required'
      });
    }

    let query = `
      SELECT 
        id,
        feature_name,
        action,
        performed_by,
        reason,
        created_at
      FROM ai_feature_audit_log
      WHERE tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (feature) {
      query += ` AND feature_name = $${params.length + 1}`;
      params.push(feature);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), Number(offset));

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM ai_feature_audit_log
      WHERE tenant_id = $1
    `;
    const countParams: any[] = [tenantId];

    if (feature) {
      countQuery += ` AND feature_name = $2`;
      countParams.push(feature);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = Number(countResult.rows[0].total);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        has_more: Number(offset) + result.rows.length < total
      }
    });

  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({
      error: 'Failed to fetch audit log'
    });
  }
});

/**
 * GET /api/bed-management/admin/metrics/los-accuracy
 * Get LOS prediction accuracy metrics
 * 
 * Requirements: 10.1
 */
router.get('/metrics/los-accuracy', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { start_date, end_date, unit } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        error: 'X-Tenant-ID header is required'
      });
    }

    // Check if feature is enabled
    const isEnabled = await aiFeatureManager.isFeatureEnabled(tenantId, 'los_prediction');
    if (!isEnabled) {
      return res.status(403).json({
        error: 'LOS prediction is not enabled for this tenant',
        feature: 'los_prediction'
      });
    }

    // Build query
    let query = `
      SELECT 
        COUNT(*) as total_predictions,
        AVG(ABS(predicted_los - actual_los)) as mean_absolute_error,
        STDDEV(ABS(predicted_los - actual_los)) as std_deviation,
        COUNT(CASE WHEN ABS(predicted_los - actual_los) <= 1 THEN 1 END) as within_1_day,
        COUNT(CASE WHEN ABS(predicted_los - actual_los) <= 2 THEN 1 END) as within_2_days,
        AVG(confidence_level) as avg_confidence
      FROM los_predictions
      WHERE tenant_id = $1
      AND actual_los IS NOT NULL
    `;
    const params: any[] = [tenantId];

    if (start_date) {
      query += ` AND prediction_date >= $${params.length + 1}`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND prediction_date <= $${params.length + 1}`;
      params.push(end_date);
    }

    if (unit) {
      query += ` AND unit = $${params.length + 1}`;
      params.push(unit);
    }

    const result = await pool.query(query, params);
    const metrics = result.rows[0];

    // Calculate accuracy percentages
    const total = Number(metrics.total_predictions);
    const within1Day = Number(metrics.within_1_day);
    const within2Days = Number(metrics.within_2_days);

    res.json({
      success: true,
      data: {
        total_predictions: total,
        mean_absolute_error: Number(metrics.mean_absolute_error).toFixed(2),
        std_deviation: Number(metrics.std_deviation).toFixed(2),
        accuracy_within_1_day: total > 0 ? ((within1Day / total) * 100).toFixed(1) + '%' : 'N/A',
        accuracy_within_2_days: total > 0 ? ((within2Days / total) * 100).toFixed(1) + '%' : 'N/A',
        avg_confidence: Number(metrics.avg_confidence).toFixed(2),
        period: {
          start_date: start_date || 'all time',
          end_date: end_date || 'present'
        }
      }
    });

  } catch (error) {
    console.error('Error fetching LOS accuracy metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch LOS accuracy metrics'
    });
  }
});

/**
 * GET /api/bed-management/admin/metrics/bed-utilization
 * Get bed utilization metrics
 * 
 * Requirements: 10.2
 */
router.get('/metrics/bed-utilization', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { start_date, end_date, unit } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        error: 'X-Tenant-ID header is required'
      });
    }

    // Get bed utilization metrics from bed_management_performance table
    let query = `
      SELECT 
        unit,
        AVG(bed_utilization_rate) as avg_utilization,
        MAX(bed_utilization_rate) as peak_utilization,
        MIN(bed_utilization_rate) as min_utilization,
        AVG(avg_turnover_time_hours) as avg_turnover_time,
        COUNT(*) as data_points
      FROM bed_management_performance
      WHERE tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (start_date) {
      query += ` AND date >= $${params.length + 1}`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND date <= $${params.length + 1}`;
      params.push(end_date);
    }

    if (unit) {
      query += ` AND unit = $${params.length + 1}`;
      params.push(unit);
    }

    query += ` GROUP BY unit ORDER BY unit`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        unit: row.unit,
        avg_utilization: Number(row.avg_utilization).toFixed(1) + '%',
        peak_utilization: Number(row.peak_utilization).toFixed(1) + '%',
        min_utilization: Number(row.min_utilization).toFixed(1) + '%',
        avg_turnover_time_hours: Number(row.avg_turnover_time_hours).toFixed(1),
        data_points: Number(row.data_points)
      })),
      period: {
        start_date: start_date || 'all time',
        end_date: end_date || 'present'
      }
    });

  } catch (error) {
    console.error('Error fetching bed utilization metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch bed utilization metrics'
    });
  }
});

/**
 * GET /api/bed-management/admin/metrics/ed-boarding
 * Get ED boarding time metrics
 * 
 * Requirements: 10.3
 */
router.get('/metrics/ed-boarding', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { start_date, end_date } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        error: 'X-Tenant-ID header is required'
      });
    }

    // Check if feature is enabled
    const isEnabled = await aiFeatureManager.isFeatureEnabled(tenantId, 'transfer_optimization');
    if (!isEnabled) {
      return res.status(403).json({
        error: 'Transfer optimization is not enabled for this tenant',
        feature: 'transfer_optimization'
      });
    }

    // Get ED boarding metrics
    let query = `
      SELECT 
        AVG(ed_boarding_time_hours) as avg_boarding_time,
        MAX(ed_boarding_time_hours) as max_boarding_time,
        MIN(ed_boarding_time_hours) as min_boarding_time,
        COUNT(*) as total_transfers,
        COUNT(CASE WHEN ed_boarding_time_hours > 4 THEN 1 END) as over_4_hours,
        COUNT(CASE WHEN ed_boarding_time_hours > 8 THEN 1 END) as over_8_hours
      FROM bed_management_performance
      WHERE tenant_id = $1
      AND ed_boarding_time_hours IS NOT NULL
    `;
    const params: any[] = [tenantId];

    if (start_date) {
      query += ` AND date >= $${params.length + 1}`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND date <= $${params.length + 1}`;
      params.push(end_date);
    }

    const result = await pool.query(query, params);
    const metrics = result.rows[0];

    const total = Number(metrics.total_transfers);
    const over4Hours = Number(metrics.over_4_hours);
    const over8Hours = Number(metrics.over_8_hours);

    res.json({
      success: true,
      data: {
        avg_boarding_time_hours: Number(metrics.avg_boarding_time).toFixed(1),
        max_boarding_time_hours: Number(metrics.max_boarding_time).toFixed(1),
        min_boarding_time_hours: Number(metrics.min_boarding_time).toFixed(1),
        total_transfers: total,
        over_4_hours: over4Hours,
        over_4_hours_percentage: total > 0 ? ((over4Hours / total) * 100).toFixed(1) + '%' : 'N/A',
        over_8_hours: over8Hours,
        over_8_hours_percentage: total > 0 ? ((over8Hours / total) * 100).toFixed(1) + '%' : 'N/A',
        period: {
          start_date: start_date || 'all time',
          end_date: end_date || 'present'
        }
      }
    });

  } catch (error) {
    console.error('Error fetching ED boarding metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch ED boarding metrics'
    });
  }
});

/**
 * GET /api/bed-management/admin/metrics/capacity-forecast
 * Get capacity forecast accuracy metrics
 * 
 * Requirements: 10.4
 */
router.get('/metrics/capacity-forecast', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { start_date, end_date, unit } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        error: 'X-Tenant-ID header is required'
      });
    }

    // Check if feature is enabled
    const isEnabled = await aiFeatureManager.isFeatureEnabled(tenantId, 'capacity_forecasting');
    if (!isEnabled) {
      return res.status(403).json({
        error: 'Capacity forecasting is not enabled for this tenant',
        feature: 'capacity_forecasting'
      });
    }

    // Get capacity forecast accuracy metrics
    let query = `
      SELECT 
        unit,
        AVG(ABS(forecast_24h - actual_census_24h)) as mae_24h,
        AVG(ABS(forecast_48h - actual_census_48h)) as mae_48h,
        AVG(ABS(forecast_72h - actual_census_72h)) as mae_72h,
        COUNT(*) as total_forecasts
      FROM capacity_forecasts
      WHERE tenant_id = $1
      AND actual_census_24h IS NOT NULL
    `;
    const params: any[] = [tenantId];

    if (start_date) {
      query += ` AND forecast_date >= $${params.length + 1}`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND forecast_date <= $${params.length + 1}`;
      params.push(end_date);
    }

    if (unit) {
      query += ` AND unit = $${params.length + 1}`;
      params.push(unit);
    }

    query += ` GROUP BY unit ORDER BY unit`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        unit: row.unit,
        mae_24h: Number(row.mae_24h).toFixed(2),
        mae_48h: Number(row.mae_48h).toFixed(2),
        mae_72h: Number(row.mae_72h).toFixed(2),
        total_forecasts: Number(row.total_forecasts)
      })),
      period: {
        start_date: start_date || 'all time',
        end_date: end_date || 'present'
      }
    });

  } catch (error) {
    console.error('Error fetching capacity forecast metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch capacity forecast metrics'
    });
  }
});

/**
 * GET /api/bed-management/admin/metrics/export
 * Export all performance metrics as CSV
 * 
 * Requirements: 10.5
 */
router.get('/metrics/export', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { start_date, end_date, format = 'csv' } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        error: 'X-Tenant-ID header is required'
      });
    }

    // Get all performance metrics
    let query = `
      SELECT 
        date,
        unit,
        bed_utilization_rate,
        avg_turnover_time_hours,
        ed_boarding_time_hours,
        discharge_delays,
        isolation_compliance_rate
      FROM bed_management_performance
      WHERE tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (start_date) {
      query += ` AND date >= $${params.length + 1}`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND date <= $${params.length + 1}`;
      params.push(end_date);
    }

    query += ` ORDER BY date DESC, unit`;

    const result = await pool.query(query, params);

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Date',
        'Unit',
        'Bed Utilization Rate (%)',
        'Avg Turnover Time (hours)',
        'ED Boarding Time (hours)',
        'Discharge Delays',
        'Isolation Compliance Rate (%)'
      ];

      const csvRows = [headers.join(',')];

      result.rows.forEach(row => {
        const values = [
          row.date,
          row.unit,
          row.bed_utilization_rate,
          row.avg_turnover_time_hours,
          row.ed_boarding_time_hours || 'N/A',
          row.discharge_delays || 0,
          row.isolation_compliance_rate || 'N/A'
        ];
        csvRows.push(values.join(','));
      });

      const csv = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="bed-management-metrics-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send('\uFEFF' + csv); // UTF-8 BOM for Excel compatibility

    } else {
      // Return JSON
      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length,
        period: {
          start_date: start_date || 'all time',
          end_date: end_date || 'present'
        }
      });
    }

  } catch (error) {
    console.error('Error exporting metrics:', error);
    res.status(500).json({
      error: 'Failed to export metrics'
    });
  }
});

// Helper functions

function getFeatureDisplayName(feature: string): string {
  const displayNames: { [key: string]: string } = {
    'los_prediction': 'Length of Stay Prediction',
    'bed_assignment_optimization': 'Bed Assignment Optimization',
    'discharge_readiness': 'Discharge Readiness Prediction',
    'transfer_optimization': 'Transfer Optimization',
    'capacity_forecasting': 'Capacity Forecasting'
  };
  return displayNames[feature] || feature;
}

function getFeatureDescription(feature: string): string {
  const descriptions: { [key: string]: string } = {
    'los_prediction': 'Predicts patient length of stay based on diagnosis, severity, and other factors',
    'bed_assignment_optimization': 'Recommends optimal bed assignments considering patient needs and isolation requirements',
    'discharge_readiness': 'Predicts discharge readiness and identifies barriers to timely discharge',
    'transfer_optimization': 'Prioritizes ED-to-ward transfers and optimizes transfer timing',
    'capacity_forecasting': 'Forecasts bed capacity needs and provides staffing recommendations'
  };
  return descriptions[feature] || 'No description available';
}

export default router;
