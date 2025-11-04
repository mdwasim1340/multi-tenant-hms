export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: TierFeatures;
  limits: TierLimits;
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TierFeatures {
  patients: boolean;
  appointments: boolean;
  medical_records: boolean;
  custom_fields: boolean;
  file_storage: boolean;
  mobile_app: boolean;
  api_access: boolean;
  custom_branding: boolean;
}

export interface TierLimits {
  max_patients: number;      // -1 = unlimited
  max_users: number;         // -1 = unlimited
  storage_gb: number;        // -1 = unlimited
  api_calls_per_day: number; // -1 = unlimited
}

export interface TenantSubscription {
  id: number;
  tenant_id: string;
  tier_id: string;
  status: 'active' | 'suspended' | 'cancelled' | 'trial';
  billing_cycle: 'monthly' | 'yearly';
  next_billing_date: Date | null;
  trial_ends_at: Date | null;
  usage_limits: TierLimits;
  current_usage: CurrentUsage;
  created_at: Date;
  updated_at: Date;
}

export interface CurrentUsage {
  patients_count: number;
  users_count: number;
  storage_used_gb: number;
  api_calls_today: number;
}

export interface SubscriptionWithTier extends TenantSubscription {
  tier: SubscriptionTier;
}

// Feature access check result
export interface FeatureAccessResult {
  hasAccess: boolean;
  reason?: string;
  upgradeRequired?: boolean;
}

// Usage limit check result
export interface UsageLimitResult {
  withinLimit: boolean;
  currentValue: number;
  limit: number;
  percentage: number;
}