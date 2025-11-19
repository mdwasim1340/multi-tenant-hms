/**
 * Notification SMS Service
 * Team: Epsilon
 * Purpose: SMS delivery via AWS SNS
 */

import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { Notification, NotificationTemplate } from '../types/notification';
import pool from '../database';

const snsClient = new SNSClient({
  region: process.env.SNS_REGION || process.env.AWS_REGION || 'us-west-2',
  credentials: {
    accessKeyId: process.env.SNS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.SNS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export class NotificationSMSService {
  /**
   * Render template with variables
   */
  private static renderTemplate(template: string, variables: Record<string, any>): string {
    let rendered = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    });
    
    return rendered;
  }

  /**
   * Get user phone number
   */
  private static async getUserPhone(userId: number): Promise<string | null> {
    try {
      const result = await pool.query(
        'SELECT phone FROM users WHERE id = $1',
        [userId]
      );
      
      return result.rows[0]?.phone || null;
    } catch (error) {
      console.error('Error getting user phone:', error);
      return null;
    }
  }

  /**
   * Get notification template
   */
  private static async getTemplate(notificationType: string): Promise<NotificationTemplate | null> {
    try {
      const result = await pool.query<NotificationTemplate>(
        'SELECT * FROM notification_templates WHERE template_key = $1',
        [notificationType]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting template:', error);
      return null;
    }
  }

  /**
   * Check if user has SMS notifications enabled
   */
  private static async isSMSEnabled(
    tenantId: string,
    userId: number,
    notificationType: string
  ): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const result = await client.query(
        `SELECT sms_enabled FROM notification_settings 
         WHERE user_id = $1 AND notification_type = $2`,
        [userId, notificationType]
      );
      
      // Default to false if no settings found (SMS is opt-in)
      return result.rows[0]?.sms_enabled === true;
    } catch (error) {
      console.error('Error checking SMS settings:', error);
      return false; // Default to disabled
    } finally {
      client.release();
    }
  }

  /**
   * Check if within quiet hours
   */
  private static async isWithinQuietHours(
    tenantId: string,
    userId: number,
    notificationType: string
  ): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const result = await client.query(
        `SELECT quiet_hours_start, quiet_hours_end FROM notification_settings 
         WHERE user_id = $1 AND notification_type = $2`,
        [userId, notificationType]
      );
      
      if (!result.rows[0] || !result.rows[0].quiet_hours_start || !result.rows[0].quiet_hours_end) {
        return false;
      }
      
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const { quiet_hours_start, quiet_hours_end } = result.rows[0];
      
      return currentTime >= quiet_hours_start && currentTime <= quiet_hours_end;
    } catch (error) {
      console.error('Error checking quiet hours:', error);
      return false;
    } finally {
      client.release();
    }
  }

  /**
   * Log delivery attempt
   */
  private static async logDelivery(
    tenantId: string,
    notificationId: number,
    status: 'sent' | 'delivered' | 'failed' | 'pending',
    errorMessage?: string
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      await client.query(
        `INSERT INTO notification_history (
          notification_id, channel, status, error_message, delivered_at
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          notificationId,
          'sms',
          status,
          errorMessage || null,
          status === 'delivered' ? new Date() : null,
        ]
      );
    } catch (error) {
      console.error('Error logging delivery:', error);
    } finally {
      client.release();
    }
  }

  /**
   * Format phone number for E.164 format
   */
  private static formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Add + prefix if not present
    if (!cleaned.startsWith('+')) {
      // Assume US number if no country code
      if (cleaned.length === 10) {
        cleaned = '+1' + cleaned;
      } else {
        cleaned = '+' + cleaned;
      }
    }
    
    return cleaned;
  }

  /**
   * Truncate message to SMS length limit
   */
  private static truncateMessage(message: string, maxLength: number = 160): string {
    if (message.length <= maxLength) {
      return message;
    }
    
    return message.substring(0, maxLength - 3) + '...';
  }

  /**
   * Send SMS notification
   */
  static async sendSMS(
    tenantId: string,
    notification: Notification
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Check if SMS is enabled
      if (!process.env.ENABLE_SNS || process.env.ENABLE_SNS !== 'true') {
        console.log('📱 SMS service is disabled');
        return { success: false, error: 'SMS service disabled' };
      }

      // Check if SMS is enabled for this notification type
      const smsEnabled = await this.isSMSEnabled(
        tenantId,
        notification.user_id,
        notification.type
      );
      
      if (!smsEnabled) {
        console.log(`📱 SMS disabled for user ${notification.user_id}, type ${notification.type}`);
        return { success: false, error: 'SMS notifications disabled' };
      }

      // Check quiet hours (skip for critical notifications)
      if (notification.priority.toLowerCase() !== 'critical') {
        const inQuietHours = await this.isWithinQuietHours(
          tenantId,
          notification.user_id,
          notification.type
        );
        
        if (inQuietHours) {
          console.log(`🔕 Within quiet hours for user ${notification.user_id}`);
          await this.logDelivery(tenantId, notification.id, 'pending', 'Within quiet hours');
          return { success: false, error: 'Within quiet hours' };
        }
      }

      // Get user phone
      const userPhone = await this.getUserPhone(notification.user_id);
      if (!userPhone) {
        console.error(`❌ No phone found for user ${notification.user_id}`);
        await this.logDelivery(tenantId, notification.id, 'failed', 'No phone number');
        return { success: false, error: 'No phone number' };
      }

      // Format phone number
      const formattedPhone = this.formatPhoneNumber(userPhone);

      // Get template
      const template = await this.getTemplate(notification.type);
      
      // Prepare SMS content
      let message = notification.message;
      
      if (template && template.sms_template) {
        const variables = notification.data || {};
        message = this.renderTemplate(template.sms_template, variables);
      }

      // Truncate message to SMS length
      message = this.truncateMessage(message);

      // Send SMS via AWS SNS
      const command = new PublishCommand({
        PhoneNumber: formattedPhone,
        Message: message,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: notification.priority.toLowerCase() === 'critical' ? 'Transactional' : 'Promotional',
          },
        },
      });

      const response = await snsClient.send(command);
      
      console.log(`✅ SMS sent to ${formattedPhone} (MessageId: ${response.MessageId})`);
      await this.logDelivery(tenantId, notification.id, 'delivered');
      
      return { success: true, messageId: response.MessageId };
    } catch (error: any) {
      console.error('❌ Error sending SMS:', error);
      await this.logDelivery(tenantId, notification.id, 'failed', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send SMS with retry logic
   */
  static async sendSMSWithRetry(
    tenantId: string,
    notification: Notification,
    maxRetries: number = 3
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    let lastError: string = '';
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`📱 SMS delivery attempt ${attempt}/${maxRetries} for notification ${notification.id}`);
      
      const result = await this.sendSMS(tenantId, notification);
      
      if (result.success) {
        return result;
      }
      
      lastError = result.error || 'Unknown error';
      
      // Don't retry if SMS is disabled or within quiet hours
      if (
        lastError === 'SMS notifications disabled' ||
        lastError === 'Within quiet hours' ||
        lastError === 'SMS service disabled'
      ) {
        return result;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return { success: false, error: `Failed after ${maxRetries} attempts: ${lastError}` };
  }
}
