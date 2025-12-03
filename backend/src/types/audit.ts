/**
 * Team Alpha - Audit Trail Types
 * TypeScript interfaces for audit logging system
 */

export interface AuditLog {
  id: number;
  tenant_id: string;
  user_id: number;
  action: AuditAction;
  resource_type: ResourceType;
  resource_id?: number;
  changes?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VIEW'
  | 'DOWNLOAD'
  | 'UPLOAD'
  | 'FINALIZE'
  | 'RESTORE'
  | 'EXPORT'
  | 'LOGIN'
  | 'LOGOUT'
  | 'ACCESS_DENIED';

export type ResourceType =
  | 'medical_record'
  | 'record_attachment'
  | 'patient'
  | 'appointment'
  | 'lab_order'
  | 'lab_result'
  | 'prescription'
  | 'user'
  | 'staff'
  | 'template';

export interface CreateAuditLogDTO {
  tenant_id: string;
  user_id: number;
  action: AuditAction;
  resource_type: ResourceType;
  resource_id?: number;
  changes?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  tenant_id?: string;
  user_id?: number;
  action?: AuditAction;
  resource_type?: ResourceType;
  resource_id?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface AuditLogResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AuditLogStats {
  total_logs: number;
  logs_by_action: Record<AuditAction, number>;
  logs_by_resource: Record<ResourceType, number>;
  logs_by_user: Array<{
    user_id: number;
    user_name: string;
    log_count: number;
  }>;
  recent_activity: AuditLog[];
}
