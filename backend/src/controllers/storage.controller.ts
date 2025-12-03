/**
 * Team Alpha - Storage Cost Controller
 * HTTP handlers for storage cost monitoring endpoints
 */

import { Request, Response } from 'express';
import {
  getLatestStorageMetrics,
  getStorageMetrics,
  getCostTrends,
  getActiveCostAlerts,
  resolveCostAlert,
  generateStorageCostReport,
  updateTenantStorageMetrics,
  checkCostThresholds,
  logFileAccess,
} from '../services/cost.service';
import { StorageUsageFilters } from '../types/storage';

/**
 * GET /api/storage/metrics
 * Get current storage metrics for tenant
 */
export async function getCurrentMetrics(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const metrics = await getLatestStorageMetrics(tenantId);

    if (!metrics) {
      // If no metrics exist, create initial metrics
      const initialMetrics = await updateTenantStorageMetrics(tenantId);
      res.json(initialMetrics);
      return;
    }

    res.json(metrics);
  } catch (error) {
    console.error('Error getting current metrics:', error);
    res.status(500).json({
      error: 'Failed to get storage metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/storage/metrics/history
 * Get historical storage metrics
 */
export async function getMetricsHistory(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const filters: StorageUsageFilters = {
      tenant_id: tenantId,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 30,
    };

    const metrics = await getStorageMetrics(filters);

    res.json({
      metrics,
      total: metrics.length,
    });
  } catch (error) {
    console.error('Error getting metrics history:', error);
    res.status(500).json({
      error: 'Failed to get metrics history',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/storage/costs
 * Get cost breakdown and trends
 */
export async function getCostBreakdown(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const days = req.query.days ? parseInt(req.query.days as string) : 30;

    const [currentMetrics, costTrends] = await Promise.all([
      getLatestStorageMetrics(tenantId),
      getCostTrends(tenantId, days),
    ]);

    res.json({
      current_metrics: currentMetrics,
      cost_trends: costTrends,
      period_days: days,
    });
  } catch (error) {
    console.error('Error getting cost breakdown:', error);
    res.status(500).json({
      error: 'Failed to get cost breakdown',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/storage/trends
 * Get cost trends over time
 */
export async function getCostTrendsData(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const days = req.query.days ? parseInt(req.query.days as string) : 30;

    const trends = await getCostTrends(tenantId, days);

    res.json({
      trends,
      period_days: days,
    });
  } catch (error) {
    console.error('Error getting cost trends:', error);
    res.status(500).json({
      error: 'Failed to get cost trends',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/storage/alerts
 * Get active cost alerts
 */
export async function getCostAlerts(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const alerts = await getActiveCostAlerts(tenantId);

    res.json({
      alerts,
      total: alerts.length,
    });
  } catch (error) {
    console.error('Error getting cost alerts:', error);
    res.status(500).json({
      error: 'Failed to get cost alerts',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * POST /api/storage/alerts/:id/resolve
 * Resolve a cost alert
 */
export async function resolveAlert(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const alertId = parseInt(req.params.id);

    await resolveCostAlert(alertId);

    res.json({
      message: 'Alert resolved successfully',
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      error: 'Failed to resolve alert',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/storage/report
 * Generate comprehensive storage cost report
 */
export async function getStorageReport(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const report = await generateStorageCostReport(tenantId);

    res.json(report);
  } catch (error) {
    console.error('Error generating storage report:', error);
    res.status(500).json({
      error: 'Failed to generate storage report',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * POST /api/storage/refresh
 * Refresh storage metrics (manual trigger)
 */
export async function refreshMetrics(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const metrics = await updateTenantStorageMetrics(tenantId);

    // Check thresholds after update
    const thresholds = {
      warning: req.body.warning_threshold || 50, // $50 warning
      critical: req.body.critical_threshold || 100, // $100 critical
    };

    await checkCostThresholds(tenantId, thresholds);

    res.json({
      message: 'Storage metrics refreshed successfully',
      metrics,
    });
  } catch (error) {
    console.error('Error refreshing metrics:', error);
    res.status(500).json({
      error: 'Failed to refresh metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * POST /api/storage/access-log
 * Log file access for optimization
 */
export async function logAccess(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = (req as any).user?.id;

    const {
      file_id,
      file_path,
      access_type,
      file_size_bytes,
      storage_class,
    } = req.body;

    if (!file_id || !file_path || !access_type) {
      res.status(400).json({
        error: 'Missing required fields',
        required: ['file_id', 'file_path', 'access_type'],
      });
      return;
    }

    const accessLog = await logFileAccess({
      tenant_id: tenantId,
      file_id,
      file_path,
      access_type,
      user_id: userId,
      file_size_bytes,
      storage_class,
    });

    res.json({
      message: 'File access logged successfully',
      access_log: accessLog,
    });
  } catch (error) {
    console.error('Error logging file access:', error);
    res.status(500).json({
      error: 'Failed to log file access',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/storage/export
 * Export storage metrics to CSV
 */
export async function exportMetrics(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const days = req.query.days ? parseInt(req.query.days as string) : 30;

    const [metrics, trends] = await Promise.all([
      getStorageMetrics({
        tenant_id: tenantId,
        limit: 1000,
      }),
      getCostTrends(tenantId, days),
    ]);

    // Create CSV content
    const headers = [
      'Date',
      'Total Size (GB)',
      'File Count',
      'Monthly Cost ($)',
      'Storage Cost ($)',
      'Compression Savings (GB)',
      'Compression Ratio',
    ];

    const rows = metrics.map((metric) => [
      metric.recorded_at.toISOString().split('T')[0],
      (metric.total_size_bytes / (1024 * 1024 * 1024)).toFixed(2),
      metric.file_count,
      metric.estimated_monthly_cost.toFixed(2),
      metric.cost_breakdown.storage_cost.toFixed(2),
      metric.compression_savings_bytes
        ? (metric.compression_savings_bytes / (1024 * 1024 * 1024)).toFixed(2)
        : '0',
      metric.compression_ratio ? (metric.compression_ratio * 100).toFixed(1) + '%' : '0%',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="storage-metrics-${tenantId}-${Date.now()}.csv"`
    );

    // Send CSV with UTF-8 BOM for Excel compatibility
    res.send('\uFEFF' + csvContent);
  } catch (error) {
    console.error('Error exporting metrics:', error);
    res.status(500).json({
      error: 'Failed to export metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}