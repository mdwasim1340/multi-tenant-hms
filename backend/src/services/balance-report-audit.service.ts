import { Pool } from 'pg';

/**
 * Balance Report Audit Service
 * 
 * Provides audit logging functionality for balance report generation and access.
 * Ensures immutability and comprehensive tracking of all report operations.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

export interface AuditLogEntry {
  id?: number;
  tenant_id: string;
  user_id: string | number;
  user_name?: string;
  user_email?: string;
  report_type: 'profit_loss' | 'balance_sheet' | 'cash_flow';
  action: 'generate' | 'view' | 'export';
  parameters: Record<string, any>;
  timestamp: Date;
  execution_time_ms?: number;
  record_count?: number;
  success?: boolean;
  error_message?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface AuditLogFilters {
  user_id?: string;
  report_type?: string;
  action?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedAuditLogs {
  logs: AuditLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class BalanceReportAuditService {
  /**
   * Create an audit log entry for a balance report operation
   * 
   * This operation is atomic and uses a transaction to ensure consistency.
   * If audit logging fails, the entire operation should fail to maintain
   * complete audit trail.
   * 
   * @param pool - Database connection pool
   * @param entry - Audit log entry data
   * @returns Created audit log entry with ID
   * @throws Error if audit log creation fails
   */
  static async createAuditLog(
    pool: Pool,
    entry: AuditLogEntry
  ): Promise<AuditLogEntry> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Include action in parameters since the table doesn't have an action column
      const parametersWithAction = {
        ...entry.parameters,
        action: entry.action
      };
      
      const query = `
        INSERT INTO balance_report_audit_logs (
          tenant_id,
          user_id,
          user_name,
          user_email,
          report_type,
          parameters,
          generated_at,
          execution_time_ms,
          record_count,
          success,
          error_message,
          ip_address,
          user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;
      
      // Convert user_id to integer if it's a string
      const userId = typeof entry.user_id === 'string' 
        ? parseInt(entry.user_id, 10) || 0 
        : entry.user_id || 0;
      
      const values = [
        entry.tenant_id,
        userId,
        entry.user_name || null,
        entry.user_email || null,
        entry.report_type,
        JSON.stringify(parametersWithAction),
        entry.timestamp || new Date(),
        entry.execution_time_ms || null,
        entry.record_count || null,
        entry.success !== false, // Default to true
        entry.error_message || null,
        entry.ip_address || null,
        entry.user_agent || null
      ];
      
      const result = await client.query(query, values);
      
      await client.query('COMMIT');
      
      const createdLog = result.rows[0];
      return {
        ...createdLog,
        parameters: typeof createdLog.parameters === 'string' 
          ? JSON.parse(createdLog.parameters) 
          : createdLog.parameters
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Failed to create audit log:', error);
      throw new Error('Audit log creation failed. Operation aborted for security.');
    } finally {
      client.release();
    }
  }

  /**
   * Retrieve audit logs with filtering and pagination
   * 
   * @param pool - Database connection pool
   * @param tenantId - Tenant ID for isolation
   * @param filters - Filter criteria
   * @returns Paginated audit logs
   */
  static async getAuditLogs(
    pool: Pool,
    tenantId: string,
    filters: AuditLogFilters = {}
  ): Promise<PaginatedAuditLogs> {
    const {
      user_id,
      report_type,
      action,
      start_date,
      end_date,
      page = 1,
      limit = 50
    } = filters;

    // Build WHERE clause dynamically
    const conditions: string[] = ['tenant_id = $1'];
    const values: any[] = [tenantId];
    let paramIndex = 2;

    if (user_id) {
      conditions.push(`user_id = $${paramIndex}`);
      values.push(user_id);
      paramIndex++;
    }

    if (report_type) {
      conditions.push(`report_type = $${paramIndex}`);
      values.push(report_type);
      paramIndex++;
    }

    if (action) {
      conditions.push(`action = $${paramIndex}`);
      values.push(action);
      paramIndex++;
    }

    if (start_date) {
      conditions.push(`timestamp >= $${paramIndex}`);
      values.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      conditions.push(`timestamp <= $${paramIndex}`);
      values.push(end_date);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM balance_report_audit_logs
      WHERE ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated results
    const offset = (page - 1) * limit;
    const dataQuery = `
      SELECT *
      FROM balance_report_audit_logs
      WHERE ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    values.push(limit, offset);
    const dataResult = await pool.query(dataQuery, values);

    // Parse JSON parameters
    const logs = dataResult.rows.map(row => ({
      ...row,
      parameters: typeof row.parameters === 'string' 
        ? JSON.parse(row.parameters) 
        : row.parameters
    }));

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Verify audit log immutability
   * 
   * Attempts to update an audit log entry should fail due to database constraints.
   * This method is for testing purposes to verify the immutability constraint.
   * 
   * @param pool - Database connection pool
   * @param logId - Audit log ID to attempt update
   * @returns false (update should always fail)
   * @throws Error if update succeeds (immutability broken)
   */
  static async verifyImmutability(
    pool: Pool,
    logId: number
  ): Promise<boolean> {
    try {
      // Attempt to update - this should fail
      const query = `
        UPDATE balance_report_audit_logs
        SET action = 'modified'
        WHERE id = $1
      `;
      
      const result = await pool.query(query, [logId]);
      
      // If we reach here without error, immutability is broken
      // Check if any rows were affected
      if (result.rowCount && result.rowCount > 0) {
        throw new Error('Audit log immutability constraint is not enforced!');
      }
      
      // No rows affected (log doesn't exist), but no constraint error either
      // This is still a problem if the log should exist
      throw new Error('Audit log immutability constraint is not enforced!');
    } catch (error: any) {
      // Check if this is our intentional error about broken immutability
      if (error.message === 'Audit log immutability constraint is not enforced!') {
        throw error; // Re-throw to fail the test
      }
      
      // Expected behavior - update should fail with constraint error
      if (error.message && (
          error.message.includes('immutability') || 
          error.message.includes('trigger') ||
          error.message.includes('constraint')
        ) || error.code === '23514') {
        return false; // Immutability is enforced
      }
      
      // Unexpected error - re-throw
      throw error;
    }
  }

  /**
   * Get audit log statistics for a tenant
   * 
   * @param pool - Database connection pool
   * @param tenantId - Tenant ID
   * @param startDate - Start date for statistics
   * @param endDate - End date for statistics
   * @returns Audit log statistics
   */
  static async getAuditStatistics(
    pool: Pool,
    tenantId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    total_logs: number;
    by_report_type: Record<string, number>;
    by_action: Record<string, number>;
    by_user: Record<string, number>;
  }> {
    const conditions: string[] = ['tenant_id = $1'];
    const values: any[] = [tenantId];
    let paramIndex = 2;

    if (startDate) {
      conditions.push(`timestamp >= $${paramIndex}`);
      values.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`timestamp <= $${paramIndex}`);
      values.push(endDate);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const totalQuery = `
      SELECT COUNT(*) as total
      FROM balance_report_audit_logs
      WHERE ${whereClause}
    `;
    const totalResult = await pool.query(totalQuery, values);
    const total_logs = parseInt(totalResult.rows[0].total, 10);

    // Get counts by report type
    const reportTypeQuery = `
      SELECT report_type, COUNT(*) as count
      FROM balance_report_audit_logs
      WHERE ${whereClause}
      GROUP BY report_type
    `;
    const reportTypeResult = await pool.query(reportTypeQuery, values);
    const by_report_type = reportTypeResult.rows.reduce((acc, row) => {
      acc[row.report_type] = parseInt(row.count, 10);
      return acc;
    }, {} as Record<string, number>);

    // Get counts by action
    const actionQuery = `
      SELECT action, COUNT(*) as count
      FROM balance_report_audit_logs
      WHERE ${whereClause}
      GROUP BY action
    `;
    const actionResult = await pool.query(actionQuery, values);
    const by_action = actionResult.rows.reduce((acc, row) => {
      acc[row.action] = parseInt(row.count, 10);
      return acc;
    }, {} as Record<string, number>);

    // Get counts by user
    const userQuery = `
      SELECT user_id, COUNT(*) as count
      FROM balance_report_audit_logs
      WHERE ${whereClause}
      GROUP BY user_id
      ORDER BY count DESC
      LIMIT 10
    `;
    const userResult = await pool.query(userQuery, values);
    const by_user = userResult.rows.reduce((acc, row) => {
      acc[row.user_id] = parseInt(row.count, 10);
      return acc;
    }, {} as Record<string, number>);

    return {
      total_logs,
      by_report_type,
      by_action,
      by_user
    };
  }
}
