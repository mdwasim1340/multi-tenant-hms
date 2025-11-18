/**
 * Notification Types and Schemas
 * Team: Epsilon
 * Purpose: TypeScript interfaces and Zod validation for notification system
 */

import { z } from 'zod';

// ============================================================================
// Enums and Constants
// ============================================================================

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

export const NotificationChannel = {
  IN_APP: 'in_app',
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
} as const;

export const DeliveryStatus = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed',
} as const;

export const DigestFrequency = {
  HOURLY: 'hourly',
  DAILY: 'daily',
  WEEKLY: 'weekly',
} as const;

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface Notification {
  id: number;
  user_id: number;
  type: keyof typeof NotificationType;
  priority: keyof typeof NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, any>;
  read_at?: Date | null;
  archived_at?: Date | null;
  deleted_at?: Date | null;
  created_by?: number | null;
  created_at: Date;
  updated_at: Date;
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
  digest_frequency?: keyof typeof DigestFrequency | null;
  created_at: Date;
  updated_at: Date;
}

export interface NotificationTemplate {
  id: number;
  template_key: string;
  name: string;
  description?: string | null;
  subject_template?: string | null;
  body_template?: string | null;
  sms_template?: string | null;
  push_template?: string | null;
  variables?: string[];
  created_at: Date;
  updated_at: Date;
}

export interface NotificationHistory {
  id: number;
  notification_id: number;
  channel: keyof typeof NotificationChannel;
  status: keyof typeof DeliveryStatus;
  delivery_attempt: number;
  error_message?: string | null;
  delivered_at?: Date | null;
  created_at: Date;
}

export interface NotificationChannel {
  id: number;
  channel_name: string;
  enabled: boolean;
  config?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// Zod Validation Schemas
// ============================================================================

// Create Notification Schema
export const CreateNotificationSchema = z.object({
  user_id: z.number().int().positive(),
  type: z.enum([
    NotificationType.CRITICAL_ALERT,
    NotificationType.APPOINTMENT_REMINDER,
    NotificationType.LAB_RESULT,
    NotificationType.BILLING_UPDATE,
    NotificationType.STAFF_SCHEDULE,
    NotificationType.INVENTORY_ALERT,
    NotificationType.SYSTEM_MAINTENANCE,
    NotificationType.GENERAL_INFO,
  ]),
  priority: z.enum([
    NotificationPriority.CRITICAL,
    NotificationPriority.HIGH,
    NotificationPriority.MEDIUM,
    NotificationPriority.LOW,
  ]).default(NotificationPriority.MEDIUM),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  data: z.record(z.string(), z.any()).optional(),
  created_by: z.number().int().positive().optional(),
});

export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>;

// Update Notification Schema
export const UpdateNotificationSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  message: z.string().min(1).optional(),
  data: z.record(z.string(), z.any()).optional(),
  priority: z.enum([
    NotificationPriority.CRITICAL,
    NotificationPriority.HIGH,
    NotificationPriority.MEDIUM,
    NotificationPriority.LOW,
  ]).optional(),
});

export type UpdateNotificationInput = z.infer<typeof UpdateNotificationSchema>;

// List Notifications Query Schema
export const ListNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: z.enum([
    NotificationType.CRITICAL_ALERT,
    NotificationType.APPOINTMENT_REMINDER,
    NotificationType.LAB_RESULT,
    NotificationType.BILLING_UPDATE,
    NotificationType.STAFF_SCHEDULE,
    NotificationType.INVENTORY_ALERT,
    NotificationType.SYSTEM_MAINTENANCE,
    NotificationType.GENERAL_INFO,
  ]).optional(),
  priority: z.enum([
    NotificationPriority.CRITICAL,
    NotificationPriority.HIGH,
    NotificationPriority.MEDIUM,
    NotificationPriority.LOW,
  ]).optional(),
  read: z.enum(['true', 'false']).optional(),
  archived: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
  sort_by: z.enum(['created_at', 'priority', 'type']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type ListNotificationsQuery = z.infer<typeof ListNotificationsQuerySchema>;

// Bulk Operation Schema
export const BulkOperationSchema = z.object({
  notification_ids: z.array(z.number().int().positive()).min(1).max(100),
});

export type BulkOperationInput = z.infer<typeof BulkOperationSchema>;

// Notification Settings Schema
export const NotificationSettingsSchema = z.object({
  notification_type: z.string().min(1).max(50),
  email_enabled: z.boolean().default(true),
  sms_enabled: z.boolean().default(false),
  push_enabled: z.boolean().default(true),
  in_app_enabled: z.boolean().default(true),
  quiet_hours_start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  quiet_hours_end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  digest_mode: z.boolean().default(false),
  digest_frequency: z.enum([
    DigestFrequency.HOURLY,
    DigestFrequency.DAILY,
    DigestFrequency.WEEKLY,
  ]).optional(),
});

export type NotificationSettingsInput = z.infer<typeof NotificationSettingsSchema>;

// Update Multiple Settings Schema
export const UpdateMultipleSettingsSchema = z.object({
  settings: z.array(NotificationSettingsSchema).min(1),
});

export type UpdateMultipleSettingsInput = z.infer<typeof UpdateMultipleSettingsSchema>;

// Notification Template Schema (Admin)
export const CreateNotificationTemplateSchema = z.object({
  template_key: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  subject_template: z.string().optional(),
  body_template: z.string().optional(),
  sms_template: z.string().optional(),
  push_template: z.string().optional(),
  variables: z.array(z.string()).optional(),
});

export type CreateNotificationTemplateInput = z.infer<typeof CreateNotificationTemplateSchema>;

// Update Template Schema
export const UpdateNotificationTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  subject_template: z.string().optional(),
  body_template: z.string().optional(),
  sms_template: z.string().optional(),
  push_template: z.string().optional(),
  variables: z.array(z.string()).optional(),
});

export type UpdateNotificationTemplateInput = z.infer<typeof UpdateNotificationTemplateSchema>;

// ============================================================================
// Response Types
// ============================================================================

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

export interface NotificationResponse {
  notification: Notification;
}

export interface NotificationSettingsResponse {
  settings: NotificationSettings[];
}

export interface NotificationTemplateResponse {
  template: NotificationTemplate;
}

export interface NotificationTemplateListResponse {
  templates: NotificationTemplate[];
}

export interface NotificationHistoryResponse {
  history: NotificationHistory[];
}

export interface BulkOperationResponse {
  success: boolean;
  affected_count: number;
  message: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface NotificationWithUser extends Notification {
  user_name?: string;
  user_email?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  critical: number;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
}
