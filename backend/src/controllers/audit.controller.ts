/**
 * Team Alpha - Audit Controller
 * HTTP handlers for audit trail endpoints
 */

import { Request, Response } from 'express';
import {
  getAuditLogs,
  getAuditLogById,
  getResourceAuditLogs,
  getAuditLogStats,
  exportAuditLogs,
} from '../services/audit.service';
import { AuditLogFilters } from '../types/audit';

/**
 * GET /api/audit-logs
 * List audit logs with filters and pagination
 */
export async function listAuditLogs(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const filters: AuditLogFilters = {
      tenant_id: tenantId,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      user_id: req.query.user_id
        ? parseInt(req.query.user_id as string)
        : undefined,
      action: req.query.action as any,
      resource_type: req.query.resource_type as any,
      resource_id: req.query.resource_id
        ? parseInt(req.query.resource_id as string)
        : undefined,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
      search: req.query.search as string,
    };

    const result = await getAuditLogs(filters);

    res.json(result);
  } catch (error) {
    console.error('Error listing audit logs:', error);
    res.status(500).json({
      error: 'Failed to list audit logs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/audit-logs/:id
 * Get a specific audit log by ID
 */
export async function getAuditLog(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const id = parseInt(req.params.id);

    const log = await getAuditLogById(id, tenantId);

    if (!log) {
      res.status(404).json({
        error: 'Audit log not found',
      });
      return;
    }

    res.json(log);
  } catch (error) {
    console.error('Error getting audit log:', error);
    res.status(500).json({
      error: 'Failed to get audit log',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/audit-logs/resource/:resourceType/:resourceId
 * Get audit logs for a specific resource
 */
export async function getResourceAuditLog(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const resourceType = req.params.resourceType;
    const resourceId = parseInt(req.params.resourceId);

    const logs = await getResourceAuditLogs(tenantId, resourceType, resourceId);

    res.json({
      logs,
      total: logs.length,
    });
  } catch (error) {
    console.error('Error getting resource audit logs:', error);
    res.status(500).json({
      error: 'Failed to get resource audit logs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/audit-logs/stats
 * Get audit log statistics
 */
export async function getAuditStats(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const dateFrom = req.query.date_from as string;
    const dateTo = req.query.date_to as string;

    const stats = await getAuditLogStats(tenantId, dateFrom, dateTo);

    res.json(stats);
  } catch (error) {
    console.error('Error getting audit stats:', error);
    res.status(500).json({
      error: 'Failed to get audit statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/audit-logs/export
 * Export audit logs to CSV
 */
export async function exportAuditLogsCSV(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const filters: AuditLogFilters = {
      tenant_id: tenantId,
      user_id: req.query.user_id
        ? parseInt(req.query.user_id as string)
        : undefined,
      action: req.query.action as any,
      resource_type: req.query.resource_type as any,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
    };

    const csv = await exportAuditLogs(filters);

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="audit-logs-${tenantId}-${Date.now()}.csv"`
    );

    // Send CSV with UTF-8 BOM for Excel compatibility
    res.send('\uFEFF' + csv);
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({
      error: 'Failed to export audit logs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
