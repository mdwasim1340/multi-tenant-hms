// MedChat-specific subscription types
export interface MedChatTierFeatures {
  chat_support: boolean;
  appointment_booking: boolean;
  prescription_access: boolean;
  medical_records_view: boolean;
  video_consultation: boolean;
  priority_support: boolean;
  health_tracking: boolean;
  family_accounts: boolean;
}

export interface MedChatTierLimits {
  max_consultations_per_month: number;  // -1 = unlimited
  max_family_members: number;
  storage_gb: number;
  video_minutes_per_month: number;      // -1 = unlimited
}

export interface MedChatCurrentUsage {
  consultations_this_month: number;
  family_members_count: number;
  storage_used_gb: number;
  video_minutes_used_this_month: number;
}

// Extended subscription tier to support multiple applications
export interface ApplicationSubscriptionTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: MedChatTierFeatures | any;  // Can be hospital features or medchat features
  limits: MedChatTierLimits | any;
  display_order: number;
  is_active: boolean;
  application_id: 'hospital-management' | 'medchat-mobile';
  created_at: Date;
  updated_at: Date;
}
