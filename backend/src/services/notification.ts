/**
 * Notification Service
 * Team: Epsilon
 * Purpose: Business logic for notification management
 */

import pool from '../database';
import {
  Notification,
  NotificationSettings,
  NotificationTemplate,
  NotificationHistory,
  CreateNotificationInput,
  UpdateNotificationInput,
  ListNotificationsQuery,
  NotificationSettingsInput,
  NotificationListResponse,
  NotificationStats,
  BulkOperationInput,
} from '../types/notification';

export class NotificationService {
  /**
   * Create a new notification
   */
  static async createNotification(
    tenantId: string,
    data: CreateNotificationInput
  ): Promise<Notification> {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const result = await client.query<Notification>(
        `INSERT INTO notifications (
          user_id, type, priority, title, message, data, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          data.user_id,
          data.type,
          data.priority || 'medium',
          data.title,
          data.message,
          data.data ? JSON.stringify(data.data) : null,
          data.created_by || null,
        ]
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Get notification by ID
   */
  static async getNotificationById(
    tenantId: string,
    notificationId: number,
    userId: number
  ): Promise<Notification | null> {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const result = await client.query<Notification>(
        `SELECT * FROM notifications 
         WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
        [notificationId, userId]
      );

      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  /**
   * List notifications with filters and pagination
   */
  static async listNotifications(
    tenantId: string,
    userId: number,
    query: ListNotificationsQuery
  ): Promise<NotificationListResponse> {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const { page, limit, type, priority, read, archived, search, sort_by, sort_order } = query;
      const offset = (page - 1) * limit;

      // Build WHERE clause
      const conditions: string[] = ['user_id = $1', 'deleted_at IS NULL'];
      const params: any[] = [userId];
      let paramIndex = 2;

      if (type) {
        conditions.push(`type = $${paramIndex}`);
        params.push(type);
        paramIndex++;
      }

      if (priority) {
        conditions.push(`priority = $${paramIndex}`);
        params.push(priority);
        paramIndex++;
      }

      if (read === 'true') {
        conditions.push('read_at IS NOT NULL');
      } else if (read === 'false') {
        conditions.push('read_at IS NULL');
      }

      if (archived === 'true') {
        conditions.push('archived_at IS NOT NULL');
      } else if (archived === 'false') {
        conditions.push('archived_at IS NULL');
      }

      if (search) {
        conditions.push(`(title ILIKE $${paramIndex} OR message ILIKE $${paramIndex})`);
        params.push(`%${search}%`);
        paramIndex++;
      }

      const whereClause = conditions.join(' AND ');

      // Get notifications
      const notificationsQuery = `
        SELECT * FROM notifications
        WHERE ${whereClause}
        ORDER BY ${sort_by} ${sort_order}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(limit, offset);

      const notificationsResult = await client.query<Notification>(notificationsQuery, params);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as count FROM notifications
        WHERE ${whereClause}
      `;
      const countResult = await client.query(countQuery, params.slice(0, paramIndex - 1));
      const total = parseInt(countResult.rows[0].count);

      // Get unread count
      const unreadQuery = `
        SELECT COUNT(*) as count FROM notifications
        WHERE user_id = $1 AND read_at IS NULL AND deleted_at IS NULL
      `;
      const unreadResult = await client.query(unreadQuery, [userId]);
      const unread_count = parseInt(unreadResult.rows[0].count);

      return {
        notifications: notificationsResult.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        unread_count,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(
    tenantId: string,
    notificationId: number,
    userId: number
  ): Promise<Notification | null> {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const result = await client.query<Notification>(
        `UPDATE notifications 
         SET read_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
         RETURNING *`,
        [notificationId, userId]
      );

      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  /**
   * Archive notification
   */
  static async archiveNotification(
    tenantId: string,
    notificationId: number,
    userId: number
  ): Promise<Notification | null> {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const result = await client.query<Notification>(
        `UPDATE notifications 
         SET archived_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
         RETURNING *`,
        [notificationId, userId]
      );

      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  /**
   * Delete notification (soft delete)
   */
  static async deleteNotification(
    tenantId: string,
    notificationId: number,
    userId: number
  ): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const result = await client.query(
        `UPDATE notifications 
         SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
        [notificationId, userId]
      );

      return (result.rowCount || 0) > 0;
    } finally {
      client.release();
    }
  }

  /**
   * Bulk mark as read
   */
  static async bulkMarkAsRead(
    tenantId: string,
    userId: number,
    data: BulkOperationInput
  ): Promise<number> {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const result = await client.query(
        `UPDATE notifications 
         SET read_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = ANY($1) AND user_id = $2 AND deleted_at IS NULL`,
        [data.notification_ids, userId]
      );

      return result.rowCount || 0;
    } finally {
      client.release();
    }
  }

  /**
   * Bulk archive
   */
  static async bulkArchive(
    tenantId: string,
    userId: number,
    data: BulkOperationInput
  ): Promise<number> {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const result = await client.query(
        `UPDATE notifications 
         SET archived_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = ANY($1) AND user_id = $2 AND deleted_at IS NULL`,
        [data.notification_ids, userId]
      );

      return result.rowCount || 0;
    } finally {
      client.release();
    }
  }

  /**
   * Bulk delete
   */
  static async bulkDelete(
    tenantId: string,
    userId: number,
    data: BulkOperationInput
  ): Promise<number> {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const result = await client.query(
        `UPDATE notifications 
         SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = ANY($1) AND user_id = $2 AND deleted_at IS NULL`,
        [data.notification_ids, userId]
      );

      return result.rowCount || 0;
    } finally {
      client.release();
    }
  }

  /**
   * Get notification statistics
   */
  static async getNotificationStats(
    tenantId: string,
    userId: number
  ): Promise<NotificationStats> {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Get total and unread counts
      const countsResult = await client.query(
        `SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE read_at IS NULL) as unread,
          COUNT(*) FILTER (WHERE priority = 'critical') as critical
         FROM notifications
         WHERE user_id = $1 AND deleted_at IS NULL`,
        [userId]
      );

      // Get counts by type
      const typeResult = await client.query(
        `SELECT type, COUNT(*) as count
         FROM notifications
         WHERE user_id = $1 AND deleted_at IS NULL
         GROUP BY type`,
        [userId]
      );

      // Get counts by priority
      const priorityResult = await client.query(
        `SELECT priority, COUNT(*) as count
         FROM notifications
         WHERE user_id = $1 AND deleted_at IS NULL
         GROUP BY priority`,
        [userId]
      );

      const by_type: Record<string, number> = {};
      typeResult.rows.forEach(row => {
        by_type[row.type] = parseInt(row.count);
      });

      const by_priority: Record<string, number> = {};
      priorityResult.rows.forEach(row => {
        by_priority[row.priority] = parseInt(row.count);
      });

      return {
        total: parseInt(countsResult.rows[0].total),
        unread: parseInt(countsResult.rows[0].unread),
        critical: parseInt(countsResult.rows[0].critical),
        by_type,
        by_priority,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get user notification settings
   */
  static async getUserSettings(
    tenantId: string,
    userId: number
  ): Promise<NotificationSettings[]> {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const result = await client.query<NotificationSettings>(
        `SELECT * FROM notification_settings WHERE user_id = $1 ORDER BY notification_type`,
        [userId]
      );

      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Update or create notification settings
   */
  static async upsertSettings(
    tenantId: string,
    userId: number,
    data: NotificationSettingsInput
  ): Promise<NotificationSettings> {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const result = await client.query<NotificationSettings>(
        `INSERT INTO notification_settings (
          user_id, notification_type, email_enabled, sms_enabled, 
          push_enabled, in_app_enabled, quiet_hours_start, quiet_hours_end,
          digest_mode, digest_frequency
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (user_id, notification_type) 
        DO UPDATE SET
          email_enabled = EXCLUDED.email_enabled,
          sms_enabled = EXCLUDED.sms_enabled,
          push_enabled = EXCLUDED.push_enabled,
          in_app_enabled = EXCLUDED.in_app_enabled,
          quiet_hours_start = EXCLUDED.quiet_hours_start,
          quiet_hours_end = EXCLUDED.quiet_hours_end,
          digest_mode = EXCLUDED.digest_mode,
          digest_frequency = EXCLUDED.digest_frequency,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *`,
        [
          userId,
          data.notification_type,
          data.email_enabled,
          data.sms_enabled,
          data.push_enabled,
          data.in_app_enabled,
          data.quiet_hours_start || null,
          data.quiet_hours_end || null,
          data.digest_mode,
          data.digest_frequency || null,
        ]
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Reset settings to defaults
   */
  static async resetSettings(tenantId: string, userId: number): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      await client.query(
        `DELETE FROM notification_settings WHERE user_id = $1`,
        [userId]
      );

      return true;
    } finally {
      client.release();
    }
  }

  /**
   * Get notification history
   */
  static async getNotificationHistory(
    tenantId: string,
    notificationId: number,
    userId: number
  ): Promise<NotificationHistory[]> {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Verify notification belongs to user
      const notificationCheck = await client.query(
        `SELECT id FROM notifications WHERE id = $1 AND user_id = $2`,
        [notificationId, userId]
      );

      if (notificationCheck.rows.length === 0) {
        return [];
      }

      const result = await client.query<NotificationHistory>(
        `SELECT * FROM notification_history 
         WHERE notification_id = $1 
         ORDER BY created_at DESC`,
        [notificationId]
      );

      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get all notification templates (global)
   */
  static async getAllTemplates(): Promise<NotificationTemplate[]> {
    const result = await pool.query<NotificationTemplate>(
      `SELECT * FROM notification_templates ORDER BY name`
    );

    return result.rows;
  }

  /**
   * Get template by key (global)
   */
  static async getTemplateByKey(templateKey: string): Promise<NotificationTemplate | null> {
    const result = await pool.query<NotificationTemplate>(
      `SELECT * FROM notification_templates WHERE template_key = $1`,
      [templateKey]
    );

    return result.rows[0] || null;
  }
}
