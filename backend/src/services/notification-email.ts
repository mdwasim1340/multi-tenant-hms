/**
 * Notification Email Service
 * Team: Epsilon
 * Purpose: Email delivery via AWS SES with template rendering
 */

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Notification, NotificationTemplate } from '../types/notification';
import pool from '../database';

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export class NotificationEmailService {
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
   * Get user email address
   */
  private static async getUserEmail(userId: number): Promise<string | null> {
    try {
      const result = await pool.query(
        'SELECT email FROM users WHERE id = $1',
        [userId]
      );
      
      return result.rows[0]?.email || null;
    } catch (error) {
      console.error('Error getting user email:', error);
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
   * Check if user has email notifications enabled
   */
  private static async isEmailEnabled(
    tenantId: string,
    userId: number,
    notificationType: string
  ): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const result = await client.query(
        `SELECT email_enabled FROM notification_settings 
         WHERE user_id = $1 AND notification_type = $2`,
        [userId, notificationType]
      );
      
      // Default to true if no settings found
      return result.rows[0]?.email_enabled !== false;
    } catch (error) {
      console.error('Error checking email settings:', error);
      return true; // Default to enabled
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
        return false; // No quiet hours configured
      }
      
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const { quiet_hours_start, quiet_hours_end } = result.rows[0];
      
      // Simple time comparison (doesn't handle overnight ranges)
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
          'email',
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
   * Send email notification
   */
  static async sendEmail(
    tenantId: string,
    notification: Notification
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Check if email is enabled for this notification type
      const emailEnabled = await this.isEmailEnabled(
        tenantId,
        notification.user_id,
        notification.type
      );
      
      if (!emailEnabled) {
        console.log(`📧 Email disabled for user ${notification.user_id}, type ${notification.type}`);
        return { success: false, error: 'Email notifications disabled' };
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

      // Get user email
      const userEmail = await this.getUserEmail(notification.user_id);
      if (!userEmail) {
        console.error(`❌ No email found for user ${notification.user_id}`);
        await this.logDelivery(tenantId, notification.id, 'failed', 'No email address');
        return { success: false, error: 'No email address' };
      }

      // Get template
      const template = await this.getTemplate(notification.type);
      
      // Prepare email content
      let subject = notification.title;
      let body = notification.message;
      
      if (template && template.subject_template && template.body_template) {
        const variables = notification.data || {};
        subject = this.renderTemplate(template.subject_template, variables);
        body = this.renderTemplate(template.body_template, variables);
      }

      // Send email via AWS SES
      const command = new SendEmailCommand({
        Source: process.env.EMAIL_SENDER || 'noreply@hospital.com',
        Destination: {
          ToAddresses: [userEmail],
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Text: {
              Data: body,
              Charset: 'UTF-8',
            },
            Html: {
              Data: `
                <html>
                  <body>
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <h2 style="color: #333;">${subject}</h2>
                      <p style="color: #666; line-height: 1.6;">${body.replace(/\n/g, '<br>')}</p>
                      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                      <p style="color: #999; font-size: 12px;">
                        This is an automated notification from your hospital management system.
                      </p>
                    </div>
                  </body>
                </html>
              `,
              Charset: 'UTF-8',
            },
          },
        },
      });

      const response = await sesClient.send(command);
      
      console.log(`✅ Email sent to ${userEmail} (MessageId: ${response.MessageId})`);
      await this.logDelivery(tenantId, notification.id, 'delivered');
      
      return { success: true, messageId: response.MessageId };
    } catch (error: any) {
      console.error('❌ Error sending email:', error);
      await this.logDelivery(tenantId, notification.id, 'failed', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send email with retry logic
   */
  static async sendEmailWithRetry(
    tenantId: string,
    notification: Notification,
    maxRetries: number = 3
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    let lastError: string = '';
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`📧 Email delivery attempt ${attempt}/${maxRetries} for notification ${notification.id}`);
      
      const result = await this.sendEmail(tenantId, notification);
      
      if (result.success) {
        return result;
      }
      
      lastError = result.error || 'Unknown error';
      
      // Don't retry if email is disabled or within quiet hours
      if (lastError === 'Email notifications disabled' || lastError === 'Within quiet hours') {
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
