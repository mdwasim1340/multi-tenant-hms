/**
 * Team Alpha - Audit Service
 * Business logic for audit trail system
 */

import pool from '../database';
import {
  AuditLog,
  CreateAuditLogDTO,
  AuditLogFilters,
  AuditLogResponse,
  AuditLogStats,
} from '../types/audit';

/**
 * Create an audit log entry
 */
export async function createAuditLog(
  data: CreateAuditLogDTO
): Promise<AuditLog | null> {
  const {
    tenant_id,
    user_id,
    action,
    resource_type,
    resource_id,
    changes,
    ip_address,
    user_agent,
  } = data;

  // Skip audit log if user_id is missing (required field)
  if (!user_id) {
    console.warn('Skipping audit log - user_id is required but was not provided');
    return null;
  }

  const query = `
    INSERT INTO public.audit_logs (
      tenant_id, user_id, action, resource_type, resource_id,
      changes, ip_address, user_agent
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;

  const values = [
    tenant_id,
    user_id,
    action,
    resource_type,
    resource_id || null,
    changes ? JSON.stringify(changes) : null,
    ip_address || null,
    user_agent || null,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Get audit logs with filters and pagination
 */
export async function getAuditLogs(
  filters: AuditLogFilters = {}
): Promise<AuditLogResponse> {
  const {
    page = 1,
    limit = 50,
    tenant_id,
    user_id,
    action,
    resource_type,
    resource_id,
    date_from,
    date_to,
    search,
  } = filters;

  const offset = (page - 1) * limit;

  // Build WHERE clause
  const conditions: string[] = ['1=1'];
  const params: any[] = [];
  let paramIndex = 1;

  if (tenant_id) {
    conditions.push(`tenant_id = $${paramIndex}`);
    params.push(tenant_id);
    paramIndex++;
  }

  if (user_id) {
    conditions.push(`user_id = $${paramIndex}`);
    params.push(user_id);
    paramIndex++;
  }

  if (action) {
    conditions.push(`action = $${paramIndex}`);
    params.push(action);
    paramIndex++;
  }

  if (resource_type) {
    conditions.push(`resource_type = $${paramIndex}`);
    params.push(resource_type);
    paramIndex++;
  }

  if (resource_id) {
    conditions.push(`resource_id = $${paramIndex}`);
    params.push(resource_id);
    paramIndex++;
  }

  if (date_from) {
    conditions.push(`created_at >= $${paramIndex}`);
    params.push(date_from);
    paramIndex++;
  }

  if (date_to) {
    conditions.push(`created_at <= $${paramIndex}`);
    params.push(date_to);
    paramIndex++;
  }

  if (search) {
    conditions.push(`(
      action ILIKE $${paramIndex} OR
      resource_type ILIKE $${paramIndex} OR
      ip_address ILIKE $${paramIndex}
    )`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM public.audit_logs
    WHERE ${whereClause}
  `;
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].total);

  // Get paginated logs
  const logsQuery = `
    SELECT *
    FROM public.audit_logs
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  params.push(limit, offset);

  const logsResult = await pool.query(logsQuery, params);

  return {
    logs: logsResult.rows,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

/**
 * Get a specific audit log by ID
 */
export async function getAuditLogById(
  id: number,
  tenantId: string
): Promise<AuditLog | null> {
  const query = `
    SELECT *
    FROM public.audit_logs
    WHERE id = $1 AND tenant_id = $2
  `;

  const result = await pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

/**
 * Get audit logs for a specific resource
 */
export async function getResourceAuditLogs(
  tenantId: string,
  resourceType: string,
  resourceId: number
): Promise<AuditLog[]> {
  const query = `
    SELECT *
    FROM public.audit_logs
    WHERE tenant_id = $1
      AND resource_type = $2
      AND resource_id = $3
    ORDER BY created_at DESC
  `;

  const result = await pool.query(query, [tenantId, resourceType, resourceId]);
  return result.rows;
}

/**
 * Get audit log statistics
 */
export async function getAuditLogStats(
  tenantId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<AuditLogStats> {
  const conditions: string[] = ['tenant_id = $1'];
  const params: any[] = [tenantId];
  let paramIndex = 2;

  if (dateFrom) {
    conditions.push(`created_at >= $${paramIndex}`);
    params.push(dateFrom);
    paramIndex++;
  }

  if (dateTo) {
    conditions.push(`created_at <= $${paramIndex}`);
    params.push(dateTo);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  // Get total logs
  const totalQuery = `
    SELECT COUNT(*) as total
    FROM public.audit_logs
    WHERE ${whereClause}
  `;
  const totalResult = await pool.query(totalQuery, params);
  const total_logs = parseInt(totalResult.rows[0].total);

  // Get logs by action
  const actionQuery = `
    SELECT action, COUNT(*) as count
    FROM public.audit_logs
    WHERE ${whereClause}
    GROUP BY action
  `;
  const actionResult = await pool.query(actionQuery, params);
  const logs_by_action = actionResult.rows.reduce((acc, row) => {
    acc[row.action] = parseInt(row.count);
    return acc;
  }, {} as Record<string, number>);

  // Get logs by resource type
  const resourceQuery = `
    SELECT resource_type, COUNT(*) as count
    FROM public.audit_logs
    WHERE ${whereClause}
    GROUP BY resource_type
  `;
  const resourceResult = await pool.query(resourceQuery, params);
  const logs_by_resource = resourceResult.rows.reduce((acc, row) => {
    acc[row.resource_type] = parseInt(row.count);
    return acc;
  }, {} as Record<string, number>);

  // Get logs by user (top 10)
  const userQuery = `
    SELECT 
      al.user_id,
      u.name as user_name,
      COUNT(*) as log_count
    FROM public.audit_logs al
    LEFT JOIN public.users u ON al.user_id = u.id
    WHERE ${whereClause}
    GROUP BY al.user_id, u.name
    ORDER BY log_count DESC
    LIMIT 10
  `;
  const userResult = await pool.query(userQuery, params);
  const logs_by_user = userResult.rows.map((row) => ({
    user_id: row.user_id,
    user_name: row.user_name || 'Unknown User',
    log_count: parseInt(row.log_count),
  }));

  // Get recent activity (last 20)
  const recentQuery = `
    SELECT *
    FROM public.audit_logs
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT 20
  `;
  const recentResult = await pool.query(recentQuery, params);
  const recent_activity = recentResult.rows;

  return {
    total_logs,
    logs_by_action,
    logs_by_resource,
    logs_by_user,
    recent_activity,
  };
}

/**
 * Export audit logs to CSV
 */
export async function exportAuditLogs(
  filters: AuditLogFilters = {}
): Promise<string> {
  const { logs } = await getAuditLogs({ ...filters, limit: 10000 });

  // CSV headers
  const headers = [
    'ID',
    'Tenant ID',
    'User ID',
    'Action',
    'Resource Type',
    'Resource ID',
    'IP Address',
    'Created At',
  ];

  // CSV rows
  const rows = logs.map((log) => [
    log.id,
    log.tenant_id,
    log.user_id,
    log.action,
    log.resource_type,
    log.resource_id || '',
    log.ip_address || '',
    log.created_at.toISOString(),
  ]);

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n');

  return csvContent;
}

/**
 * Delete old audit logs (for retention policy)
 * Note: HIPAA requires 7 years retention, so this should only be used after that period
 */
export async function deleteOldAuditLogs(
  olderThanDate: Date
): Promise<number> {
  const query = `
    DELETE FROM public.audit_logs
    WHERE created_at < $1
    RETURNING id
  `;

  const result = await pool.query(query, [olderThanDate]);
  return result.rowCount || 0;
}
