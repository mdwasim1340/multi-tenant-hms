/**
 * Team Alpha - Cost Monitoring Service
 * Business logic for storage cost tracking and optimization
 */

import pool from '../database';
import {
  StorageMetrics,
  CostAlert,
  FileAccessLog,
  CreateStorageMetricsDTO,
  CreateCostAlertDTO,
  CreateFileAccessLogDTO,
  StorageUsageFilters,
  CostTrend,
  StorageCostReport,
  FileUsage,
  AccessPattern,
  OptimizationRecommendation,
  S3_PRICING,
  StorageClassBreakdown,
  CostBreakdown,
} from '../types/storage';

/**
 * Calculate storage costs based on usage
 */
export function calculateStorageCosts(
  sizeBytes: number,
  storageClassBreakdown: StorageClassBreakdown
): CostBreakdown {
  const sizeGB = sizeBytes / (1024 * 1024 * 1024);
  
  let storageCost = 0;
  
  // Calculate cost for each storage class
  Object.entries(storageClassBreakdown).forEach(([storageClass, bytes]) => {
    if (bytes && bytes > 0) {
      const gb = bytes / (1024 * 1024 * 1024);
      const pricePerGB = S3_PRICING[storageClass as keyof typeof S3_PRICING] || S3_PRICING.STANDARD;
      storageCost += gb * pricePerGB;
    }
  });
  
  // Estimate request costs (rough approximation)
  const requestCost = sizeGB * 0.0004; // $0.0004 per 1000 requests
  
  // Estimate data transfer costs (minimal for internal access)
  const dataTransferCost = sizeGB * 0.01; // $0.01 per GB for data transfer
  
  const totalCost = storageCost + requestCost + dataTransferCost;
  
  return {
    storage_cost: Math.round(storageCost * 100) / 100,
    request_cost: Math.round(requestCost * 100) / 100,
    data_transfer_cost: Math.round(dataTransferCost * 100) / 100,
    total_cost: Math.round(totalCost * 100) / 100,
  };
}

/**
 * Create storage metrics record
 */
export async function createStorageMetrics(
  data: CreateStorageMetricsDTO
): Promise<StorageMetrics> {
  const query = `
    INSERT INTO public.storage_metrics (
      tenant_id, total_size_bytes, file_count, storage_class_breakdown,
      estimated_monthly_cost, cost_breakdown, compression_savings_bytes, compression_ratio
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;

  const values = [
    data.tenant_id,
    data.total_size_bytes,
    data.file_count,
    JSON.stringify(data.storage_class_breakdown),
    data.estimated_monthly_cost,
    JSON.stringify(data.cost_breakdown),
    data.compression_savings_bytes || null,
    data.compression_ratio || null,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Get latest storage metrics for a tenant
 */
export async function getLatestStorageMetrics(
  tenantId: string
): Promise<StorageMetrics | null> {
  const query = `
    SELECT *
    FROM public.storage_metrics
    WHERE tenant_id = $1
    ORDER BY recorded_at DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [tenantId]);
  return result.rows[0] || null;
}

/**
 * Get storage metrics with filters
 */
export async function getStorageMetrics(
  filters: StorageUsageFilters = {}
): Promise<StorageMetrics[]> {
  const { tenant_id, date_from, date_to, limit = 30 } = filters;

  const conditions: string[] = ['1=1'];
  const params: any[] = [];
  let paramIndex = 1;

  if (tenant_id) {
    conditions.push(`tenant_id = $${paramIndex}`);
    params.push(tenant_id);
    paramIndex++;
  }

  if (date_from) {
    conditions.push(`recorded_at >= $${paramIndex}`);
    params.push(date_from);
    paramIndex++;
  }

  if (date_to) {
    conditions.push(`recorded_at <= $${paramIndex}`);
    params.push(date_to);
    paramIndex++;
  }

  const query = `
    SELECT *
    FROM public.storage_metrics
    WHERE ${conditions.join(' AND ')}
    ORDER BY recorded_at DESC
    LIMIT $${paramIndex}
  `;
  params.push(limit);

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Get cost trends for a tenant
 */
export async function getCostTrends(
  tenantId: string,
  days: number = 30
): Promise<CostTrend[]> {
  const query = `
    SELECT 
      DATE(recorded_at) as date,
      AVG(estimated_monthly_cost) as total_cost,
      AVG((cost_breakdown->>'storage_cost')::decimal) as storage_cost,
      AVG(file_count) as file_count,
      AVG(total_size_bytes / (1024.0 * 1024.0 * 1024.0)) as total_size_gb
    FROM public.storage_metrics
    WHERE tenant_id = $1
      AND recorded_at >= NOW() - INTERVAL '${days} days'
    GROUP BY DATE(recorded_at)
    ORDER BY date DESC
  `;

  const result = await pool.query(query, [tenantId]);
  return result.rows.map((row) => ({
    date: row.date,
    total_cost: parseFloat(row.total_cost) || 0,
    storage_cost: parseFloat(row.storage_cost) || 0,
    file_count: parseInt(row.file_count) || 0,
    total_size_gb: parseFloat(row.total_size_gb) || 0,
  }));
}

/**
 * Create cost alert
 */
export async function createCostAlert(
  data: CreateCostAlertDTO
): Promise<CostAlert> {
  const query = `
    INSERT INTO public.cost_alerts (
      tenant_id, alert_type, threshold_amount, current_amount, alert_message
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const values = [
    data.tenant_id,
    data.alert_type,
    data.threshold_amount || null,
    data.current_amount || null,
    data.alert_message,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Get active cost alerts for a tenant
 */
export async function getActiveCostAlerts(
  tenantId: string
): Promise<CostAlert[]> {
  const query = `
    SELECT *
    FROM public.cost_alerts
    WHERE tenant_id = $1 AND is_active = true
    ORDER BY created_at DESC
  `;

  const result = await pool.query(query, [tenantId]);
  return result.rows;
}

/**
 * Resolve cost alert
 */
export async function resolveCostAlert(alertId: number): Promise<void> {
  const query = `
    UPDATE public.cost_alerts
    SET is_active = false, resolved_at = NOW()
    WHERE id = $1
  `;

  await pool.query(query, [alertId]);
}

/**
 * Log file access for optimization
 */
export async function logFileAccess(
  data: CreateFileAccessLogDTO
): Promise<FileAccessLog> {
  const query = `
    INSERT INTO public.file_access_logs (
      tenant_id, file_id, file_path, access_type, user_id, file_size_bytes, storage_class
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;

  const values = [
    data.tenant_id,
    data.file_id,
    data.file_path,
    data.access_type,
    data.user_id || null,
    data.file_size_bytes || null,
    data.storage_class || null,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Get file access patterns for optimization
 */
export async function getAccessPatterns(
  tenantId: string,
  days: number = 30
): Promise<AccessPattern[]> {
  const query = `
    SELECT 
      storage_class,
      COUNT(*) as access_count,
      AVG(EXTRACT(EPOCH FROM (NOW() - accessed_at)) / 86400) as avg_days_since_upload
    FROM public.file_access_logs
    WHERE tenant_id = $1
      AND accessed_at >= NOW() - INTERVAL '${days} days'
      AND storage_class IS NOT NULL
    GROUP BY storage_class
    ORDER BY access_count DESC
  `;

  const result = await pool.query(query, [tenantId]);
  return result.rows.map((row) => ({
    storage_class: row.storage_class,
    access_count: parseInt(row.access_count),
    avg_days_since_upload: parseFloat(row.avg_days_since_upload) || 0,
  }));
}

/**
 * Get top files by size and cost
 */
export async function getTopFilesBySize(
  tenantId: string,
  limit: number = 10
): Promise<FileUsage[]> {
  const query = `
    SELECT 
      file_id,
      file_path,
      file_size_bytes,
      storage_class,
      MAX(accessed_at) as last_accessed,
      COUNT(*) as access_count,
      (file_size_bytes / (1024.0 * 1024.0 * 1024.0)) * 0.023 as monthly_cost
    FROM public.file_access_logs
    WHERE tenant_id = $1
      AND file_size_bytes IS NOT NULL
    GROUP BY file_id, file_path, file_size_bytes, storage_class
    ORDER BY file_size_bytes DESC
    LIMIT $2
  `;

  const result = await pool.query(query, [tenantId, limit]);
  return result.rows.map((row) => ({
    file_id: row.file_id,
    file_path: row.file_path,
    file_size_bytes: parseInt(row.file_size_bytes),
    storage_class: row.storage_class || 'STANDARD',
    last_accessed: row.last_accessed,
    access_count: parseInt(row.access_count),
    monthly_cost: parseFloat(row.monthly_cost) || 0,
  }));
}

/**
 * Generate optimization recommendations
 */
export async function generateOptimizationRecommendations(
  tenantId: string
): Promise<OptimizationRecommendation[]> {
  const recommendations: OptimizationRecommendation[] = [];
  
  // Get current metrics
  const currentMetrics = await getLatestStorageMetrics(tenantId);
  if (!currentMetrics) {
    return recommendations;
  }

  // Get access patterns
  const accessPatterns = await getAccessPatterns(tenantId);
  
  // Recommendation 1: Enable compression for uncompressed files
  if (!currentMetrics.compression_savings_bytes || currentMetrics.compression_savings_bytes === 0) {
    recommendations.push({
      type: 'compression',
      title: 'Enable File Compression',
      description: 'Compress text-based files (PDFs, documents) to reduce storage costs by 30-40%',
      potential_savings: currentMetrics.estimated_monthly_cost * 0.35,
      effort_level: 'low',
      priority: 'high',
    });
  }

  // Recommendation 2: Optimize storage classes based on access patterns
  const standardFiles = accessPatterns.find(p => p.storage_class === 'STANDARD');
  if (standardFiles && standardFiles.avg_days_since_upload > 30) {
    recommendations.push({
      type: 'tiering',
      title: 'Move Old Files to Infrequent Access',
      description: 'Files not accessed in 30+ days should be moved to Standard-IA for 46% cost savings',
      potential_savings: currentMetrics.estimated_monthly_cost * 0.46,
      effort_level: 'low',
      priority: 'high',
    });
  }

  // Recommendation 3: Set up lifecycle policies
  if (currentMetrics.file_count > 100) {
    recommendations.push({
      type: 'lifecycle',
      title: 'Configure Lifecycle Policies',
      description: 'Automatically transition files to cheaper storage classes after 90/180 days',
      potential_savings: currentMetrics.estimated_monthly_cost * 0.70,
      effort_level: 'medium',
      priority: 'medium',
    });
  }

  // Recommendation 4: Clean up old files
  const totalSizeGB = currentMetrics.total_size_bytes / (1024 * 1024 * 1024);
  if (totalSizeGB > 10) {
    recommendations.push({
      type: 'cleanup',
      title: 'Review and Clean Up Old Files',
      description: 'Review files older than 2 years and consider archiving or deletion',
      potential_savings: currentMetrics.estimated_monthly_cost * 0.20,
      effort_level: 'high',
      priority: 'low',
    });
  }

  return recommendations;
}

/**
 * Generate comprehensive storage cost report
 */
export async function generateStorageCostReport(
  tenantId: string
): Promise<StorageCostReport> {
  const [
    currentMetrics,
    costTrends,
    activeAlerts,
    topFiles,
    accessPatterns,
    recommendations,
  ] = await Promise.all([
    getLatestStorageMetrics(tenantId),
    getCostTrends(tenantId, 30),
    getActiveCostAlerts(tenantId),
    getTopFilesBySize(tenantId, 10),
    getAccessPatterns(tenantId, 30),
    generateOptimizationRecommendations(tenantId),
  ]);

  return {
    tenant_id: tenantId,
    current_metrics: currentMetrics!,
    cost_trends: costTrends,
    active_alerts: activeAlerts,
    top_files_by_size: topFiles,
    access_patterns: accessPatterns,
    optimization_recommendations: recommendations,
  };
}

/**
 * Check cost thresholds and create alerts
 */
export async function checkCostThresholds(
  tenantId: string,
  thresholds: { warning: number; critical: number }
): Promise<void> {
  const currentMetrics = await getLatestStorageMetrics(tenantId);
  if (!currentMetrics) return;

  const currentCost = currentMetrics.estimated_monthly_cost;

  // Check warning threshold
  if (currentCost >= thresholds.warning && currentCost < thresholds.critical) {
    await createCostAlert({
      tenant_id: tenantId,
      alert_type: 'threshold',
      threshold_amount: thresholds.warning,
      current_amount: currentCost,
      alert_message: `Storage costs have reached warning threshold: $${currentCost.toFixed(2)} (threshold: $${thresholds.warning.toFixed(2)})`,
    });
  }

  // Check critical threshold
  if (currentCost >= thresholds.critical) {
    await createCostAlert({
      tenant_id: tenantId,
      alert_type: 'threshold',
      threshold_amount: thresholds.critical,
      current_amount: currentCost,
      alert_message: `Storage costs have reached critical threshold: $${currentCost.toFixed(2)} (threshold: $${thresholds.critical.toFixed(2)})`,
    });
  }
}

/**
 * Update storage metrics for a tenant (called by scheduled job)
 */
export async function updateTenantStorageMetrics(
  tenantId: string
): Promise<StorageMetrics> {
  // This would typically integrate with AWS S3 API to get real usage data
  // For now, we'll simulate the data collection
  
  // TODO: Integrate with AWS S3 API
  // const s3Usage = await getS3Usage(tenantId);
  
  // Simulated data for now
  const mockData: CreateStorageMetricsDTO = {
    tenant_id: tenantId,
    total_size_bytes: Math.floor(Math.random() * 10000000000), // Random size up to 10GB
    file_count: Math.floor(Math.random() * 1000) + 100,
    storage_class_breakdown: {
      STANDARD: Math.floor(Math.random() * 5000000000),
      INTELLIGENT_TIERING: Math.floor(Math.random() * 3000000000),
      GLACIER: Math.floor(Math.random() * 2000000000),
    },
    estimated_monthly_cost: 0,
    cost_breakdown: {
      storage_cost: 0,
      request_cost: 0,
      data_transfer_cost: 0,
      total_cost: 0,
    },
    compression_savings_bytes: Math.floor(Math.random() * 1000000000),
    compression_ratio: 0.35,
  };

  // Calculate costs
  mockData.cost_breakdown = calculateStorageCosts(
    mockData.total_size_bytes,
    mockData.storage_class_breakdown
  );
  mockData.estimated_monthly_cost = mockData.cost_breakdown.total_cost;

  return await createStorageMetrics(mockData);
}