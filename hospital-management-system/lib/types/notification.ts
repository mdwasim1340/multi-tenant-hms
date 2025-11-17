/**
 * Notification Types - Frontend
 * Team: Epsilon
 * Purpose: TypeScript interfaces for notification system
 */

export const NotificationType = {
  CRITICAL_ALERT: 'critical_alert',
  APPOINTMENT_REMINDER: 'appointment_reminder',
  LAB_RESULT: 'lab_result',
  BILLING_UPDATE: 'billing_update',
  STAFF_SCHEDULE: 'staff_schedule',
  INVENTORY_ALERT: 'inventory_alert',
  SYSTEM_MAINTENANCE: 'system_maintenance',
  GENERAL_INFO: 'general_info',
} as const;

export const NotificationPriority = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

export interface Notification {
  id: number;
  user_id: number;
  type: keyof typeof NotificationType;
  priority: keyof typeof NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, any>;
  read_at?: string | null;
  archived_at?: string | null;
  deleted_at?: string | null;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  id: number;
  user_id: number;
  notification_type: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
  digest_mode: boolean;
  digest_frequency?: 'hourly' | 'daily' | 'weekly' | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  critical: number;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
}

export interface NotificationListResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  unread_count: number;
}

export interface NotificationHistory {
  id: number;
  notification_id: number;
  channel: 'email' | 'sms' | 'push' | 'in_app';
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  delivery_attempt: number;
  error_message?: string | null;
  delivered_at?: string | null;
  created_at: string;
}

export interface DeliveryStats {
  total: number;
  by_channel: Record<
    string,
    {
      total: number;
      successful: number;
      failed: number;
    }
  >;
}

export interface ConnectionStats {
  global: {
    websocket: { total: number };
    sse: { total: number };
  };
  tenant: {
    websocket: number;
    sse: number;
  };
  user: {
    websocket: number;
    sse: number;
  };
}

// Filter types
export interface NotificationFilters {
  type?: keyof typeof NotificationType;
  priority?: keyof typeof NotificationPriority;
  read?: boolean;
  archived?: boolean;
  search?: string;
  sort_by?: 'created_at' | 'priority' | 'type';
  sort_order?: 'asc' | 'desc';
}

// Helper functions
export function getNotificationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    critical_alert: 'Critical Alert',
    appointment_reminder: 'Appointment Reminder',
    lab_result: 'Lab Result',
    billing_update: 'Billing Update',
    staff_schedule: 'Staff Schedule',
    inventory_alert: 'Inventory Alert',
    system_maintenance: 'System Maintenance',
    general_info: 'General Info',
  };
  return labels[type] || type;
}

export function getNotificationPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    critical: 'text-red-600 bg-red-50',
    high: 'text-orange-600 bg-orange-50',
    medium: 'text-blue-600 bg-blue-50',
    low: 'text-gray-600 bg-gray-50',
  };
  return colors[priority] || colors.medium;
}

export function getNotificationTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    critical_alert: '🚨',
    appointment_reminder: '📅',
    lab_result: '🧪',
    billing_update: '💰',
    staff_schedule: '👥',
    inventory_alert: '📦',
    system_maintenance: '🔧',
    general_info: 'ℹ️',
  };
  return icons[type] || 'ℹ️';
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}
