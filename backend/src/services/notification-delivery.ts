/**
 * Notification Delivery Orchestrator
 * Team: Epsilon
 * Purpose: Coordinate delivery across all channels (in-app, email, SMS, push)
 */

import { Notification } from '../types/notification';
import { NotificationBroadcaster } from './notification-broadcaster';
import { NotificationEmailService } from './notification-email';
import { NotificationSMSService } from './notification-sms';
import pool from '../database';

interface DeliveryResult {
  channel: string;
  success: boolean;
  messageId?: string;
  error?: string;
}

interface DeliveryReport {
  notificationId: number;
  results: DeliveryResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export class NotificationDeliveryService {
  /**
   * Get user notification preferences
   */
  private static async getUserPreferences(
    tenantId: string,
    userId: number,
    notificationType: string
  ): Promise<{
    email_enabled: boolean;
    sms_enabled: boolean;
    push_enabled: boolean;
    in_app_enabled: boolean;
  }> {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const result = await client.query(
        `SELECT email_enabled, sms_enabled, push_enabled, in_app_enabled
         FROM notification_settings 
         WHERE user_id = $1 AND notification_type = $2`,
        [userId, notificationType]
      );
      
      // Default preferences if not found
      return result.rows[0] || {
        email_enabled: true,
        sms_enabled: false,
        push_enabled: true,
        in_app_enabled: true,
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      // Return defaults on error
      return {
        email_enabled: true,
        sms_enabled: false,
        push_enabled: true,
        in_app_enabled: true,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Deliver notification via in-app channels (WebSocket/SSE)
   */
  private static async deliverInApp(
    tenantId: string,
    notification: Notification
  ): Promise<DeliveryResult> {
    try {
      const result = await NotificationBroadcaster.broadcastToUser(
        tenantId,
        notification.user_id,
        notification
      );
      
      const success = result.websocket || result.sse;
      
      return {
        channel: 'in_app',
        success,
        error: success ? undefined : 'No active connections',
      };
    } catch (error: any) {
      return {
        channel: 'in_app',
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Deliver notification via email
   */
  private static async deliverEmail(
    tenantId: string,
    notification: Notification
  ): Promise<DeliveryResult> {
    try {
      const result = await NotificationEmailService.sendEmailWithRetry(
        tenantId,
        notification,
        3 // Max 3 retries
      );
      
      return {
        channel: 'email',
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      };
    } catch (error: any) {
      return {
        channel: 'email',
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Deliver notification via SMS
   */
  private static async deliverSMS(
    tenantId: string,
    notification: Notification
  ): Promise<DeliveryResult> {
    try {
      const result = await NotificationSMSService.sendSMSWithRetry(
        tenantId,
        notification,
        3 // Max 3 retries
      );
      
      return {
        channel: 'sms',
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      };
    } catch (error: any) {
      return {
        channel: 'sms',
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Deliver notification via push (placeholder for future implementation)
   */
  private static async deliverPush(
    tenantId: string,
    notification: Notification
  ): Promise<DeliveryResult> {
    // TODO: Implement Web Push API integration
    return {
      channel: 'push',
      success: false,
      error: 'Push notifications not yet implemented',
    };
  }

  /**
   * Deliver notification to all enabled channels
   */
  static async deliverNotification(
    tenantId: string,
    notification: Notification
  ): Promise<DeliveryReport> {
    console.log(`📤 Starting delivery for notification ${notification.id} to user ${notification.user_id}`);
    
    // Get user preferences
    const preferences = await this.getUserPreferences(
      tenantId,
      notification.user_id,
      notification.type
    );
    
    const results: DeliveryResult[] = [];
    
    // Deliver via in-app (WebSocket/SSE) if enabled
    if (preferences.in_app_enabled) {
      const result = await this.deliverInApp(tenantId, notification);
      results.push(result);
    }
    
    // Deliver via email if enabled
    if (preferences.email_enabled) {
      const result = await this.deliverEmail(tenantId, notification);
      results.push(result);
    }
    
    // Deliver via SMS if enabled
    if (preferences.sms_enabled) {
      const result = await this.deliverSMS(tenantId, notification);
      results.push(result);
    }
    
    // Deliver via push if enabled
    if (preferences.push_enabled) {
      const result = await this.deliverPush(tenantId, notification);
      results.push(result);
    }
    
    // Calculate summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    const report: DeliveryReport = {
      notificationId: notification.id,
      results,
      summary: {
        total: results.length,
        successful,
        failed,
      },
    };
    
    console.log(`📊 Delivery complete for notification ${notification.id}: ${successful}/${results.length} successful`);
    
    return report;
  }

  /**
   * Deliver notification to multiple users
   */
  static async deliverToMultipleUsers(
    tenantId: string,
    userIds: number[],
    notificationData: any
  ): Promise<DeliveryReport[]> {
    const reports: DeliveryReport[] = [];
    
    for (const userId of userIds) {
      // Create notification for each user
      const notification = await pool.query(
        `INSERT INTO "${tenantId}".notifications (
          user_id, type, priority, title, message, data, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          userId,
          notificationData.type,
          notificationData.priority || 'medium',
          notificationData.title,
          notificationData.message,
          notificationData.data ? JSON.stringify(notificationData.data) : null,
          notificationData.created_by || null,
        ]
      );
      
      // Deliver notification
      const report = await this.deliverNotification(tenantId, notification.rows[0]);
      reports.push(report);
    }
    
    return reports;
  }

  /**
   * Deliver notification to all users in tenant
   */
  static async deliverToTenant(
    tenantId: string,
    notificationData: any
  ): Promise<DeliveryReport[]> {
    // Get all active users in tenant
    const result = await pool.query(
      `SELECT id FROM users WHERE tenant_id = $1 AND status = 'active'`,
      [tenantId]
    );
    
    const userIds = result.rows.map(row => row.id);
    
    return this.deliverToMultipleUsers(tenantId, userIds, notificationData);
  }

  /**
   * Get delivery statistics for notification
   */
  static async getDeliveryStats(
    tenantId: string,
    notificationId: number
  ): Promise<{
    total: number;
    by_channel: Record<string, { total: number; successful: number; failed: number }>;
  }> {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const result = await client.query(
        `SELECT 
          channel,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'delivered') as successful,
          COUNT(*) FILTER (WHERE status = 'failed') as failed
         FROM notification_history
         WHERE notification_id = $1
         GROUP BY channel`,
        [notificationId]
      );
      
      const by_channel: Record<string, any> = {};
      let total = 0;
      
      result.rows.forEach(row => {
        by_channel[row.channel] = {
          total: parseInt(row.total),
          successful: parseInt(row.successful),
          failed: parseInt(row.failed),
        };
        total += parseInt(row.total);
      });
      
      return { total, by_channel };
    } finally {
      client.release();
    }
  }
}
