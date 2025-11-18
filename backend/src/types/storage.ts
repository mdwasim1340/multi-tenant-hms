/**
 * Team Alpha - Storage Cost Monitoring Types
 * TypeScript interfaces for storage cost tracking system
 */

export interface StorageMetrics {
  id: number;
  tenant_id: string;
  total_size_bytes: number;
  file_count: number;
  storage_class_breakdown: StorageClassBreakdown;
  estimated_monthly_cost: number;
  cost_breakdown: CostBreakdown;
  compression_savings_bytes?: number;
  compression_ratio?: number;
  recorded_at: Date;
}

export interface StorageClassBreakdown {
  STANDARD?: number;
  STANDARD_IA?: number;
  INTELLIGENT_TIERING?: number;
  GLACIER?: number;
  DEEP_ARCHIVE?: number;
}

export interface CostBreakdown {
  storage_cost: number;
  request_cost: number;
  data_transfer_cost: number;
  total_cost: number;
  savings_from_compression?: number;
  savings_from_tiering?: number;
}

export interface CostAlert {
  id: number;
  tenant_id: string;
  alert_type: AlertType;
  threshold_amount?: number;
  current_amount?: number;
  alert_message: string;
  is_active: boolean;
  created_at: Date;
  resolved_at?: Date;
}

export type AlertType = 'threshold' | 'spike' | 'trend';

export interface FileAccessLog {
  id: number;
  tenant_id: string;
  file_id: string;
  file_path: string;
  access_type: AccessType;
  user_id?: number;
  file_size_bytes?: number;
  storage_class?: string;
  accessed_at: Date;
}

export type AccessType = 'download' | 'view' | 'upload';

export interface CreateStorageMetricsDTO {
  tenant_id: string;
  total_size_bytes: number;
  file_count: number;
  storage_class_breakdown: StorageClassBreakdown;
  estimated_monthly_cost: number;
  cost_breakdown: CostBreakdown;
  compression_savings_bytes?: number;
  compression_ratio?: number;
}

export interface CreateCostAlertDTO {
  tenant_id: string;
  alert_type: AlertType;
  threshold_amount?: number;
  current_amount?: number;
  alert_message: string;
}

export interface CreateFileAccessLogDTO {
  tenant_id: string;
  file_id: string;
  file_path: string;
  access_type: AccessType;
  user_id?: number;
  file_size_bytes?: number;
  storage_class?: string;
}

export interface StorageUsageFilters {
  tenant_id?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
}

export interface CostTrend {
  date: string;
  total_cost: number;
  storage_cost: number;
  file_count: number;
  total_size_gb: number;
}

export interface StorageCostReport {
  tenant_id: string;
  current_metrics: StorageMetrics;
  cost_trends: CostTrend[];
  active_alerts: CostAlert[];
  top_files_by_size: FileUsage[];
  access_patterns: AccessPattern[];
  optimization_recommendations: OptimizationRecommendation[];
}

export interface FileUsage {
  file_id: string;
  file_path: string;
  file_size_bytes: number;
  storage_class: string;
  last_accessed: Date;
  access_count: number;
  monthly_cost: number;
}

export interface AccessPattern {
  storage_class: string;
  access_count: number;
  avg_days_since_upload: number;
  recommended_class?: string;
  potential_savings?: number;
}

export interface OptimizationRecommendation {
  type: 'compression' | 'tiering' | 'lifecycle' | 'cleanup';
  title: string;
  description: string;
  potential_savings: number;
  effort_level: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high';
}

export interface S3CostCalculator {
  STANDARD: number;
  STANDARD_IA: number;
  INTELLIGENT_TIERING: number;
  GLACIER: number;
  DEEP_ARCHIVE: number;
}

// S3 pricing per GB per month (US East 1)
export const S3_PRICING: S3CostCalculator = {
  STANDARD: 0.023,
  STANDARD_IA: 0.0125,
  INTELLIGENT_TIERING: 0.0125, // Average between frequent and infrequent
  GLACIER: 0.004,
  DEEP_ARCHIVE: 0.00099,
};

export interface StorageStatsResponse {
  current_metrics: StorageMetrics;
  cost_trends: CostTrend[];
  alerts: CostAlert[];
  recommendations: OptimizationRecommendation[];
}