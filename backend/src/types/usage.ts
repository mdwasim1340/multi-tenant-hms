export interface UsageTracking {
  id: number;
  tenant_id: string;
  metric_type: UsageMetricType;
  metric_value: number;
  recorded_at: Date;
  billing_period: string;
  metadata: Record<string, any>;
}

export type UsageMetricType = 
  | 'patients_count'
  | 'users_count'
  | 'storage_used_gb'
  | 'api_call'
  | 'file_upload'
  | 'appointment_created'
  | 'patient_created'
  | 'user_created'
  | 'medical_record_created';

export interface UsageSummary {
  id: number;
  tenant_id: string;
  period_start: Date;
  period_end: Date;
  patients_count: number;
  users_count: number;
  storage_used_gb: number;
  api_calls_count: number;
  file_uploads_count: number;
  appointments_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface UsageReport {
  tenant_id: string;
  tenant_name: string;
  tier_id: string;
  tier_name: string;
  current_period: UsageSummary;
  limits: {
    max_patients: number;
    max_users: number;
    storage_gb: number;
    api_calls_per_day: number;
  };
  usage_percentage: {
    patients: number;
    users: number;
    storage: number;
    api_calls: number;
  };
  warnings: string[];
  recommendations: string[];
}

export interface UsageMetrics {
  daily_api_calls: number;
  monthly_patients: number;
  monthly_users: number;
  monthly_storage: number;
  monthly_appointments: number;
  monthly_file_uploads: number;
}

export interface UsageTrend {
  metric_type: UsageMetricType;
  current_value: number;
  previous_value: number;
  change_percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface BillingPeriod {
  start: Date;
  end: Date;
  period_string: string; // e.g., "2025-11"
}

export interface UsageAlert {
  tenant_id: string;
  metric_type: UsageMetricType;
  current_value: number;
  limit: number;
  percentage: number;
  severity: 'warning' | 'critical';
  message: string;
}

// Usage tracking configuration
export interface UsageConfig {
  track_api_calls: boolean;
  track_file_uploads: boolean;
  track_entity_creation: boolean;
  batch_size: number;
  update_frequency: 'realtime' | 'hourly' | 'daily';
}