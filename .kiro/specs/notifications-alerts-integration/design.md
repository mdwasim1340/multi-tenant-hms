# Design Document

## Overview

This design document outlines the architecture and implementation approach for integrating the Notification and Alert management system with the backend API. The solution replaces mock data with real-time notifications using AWS SNS (for SMS and push notifications), AWS SES (for email notifications), WebSocket (for real-time in-app delivery), and PostgreSQL (for notification storage) while maintaining multi-tenant isolation, security, and reliability.

### Key Design Principles

1. **Real-Time Delivery**: Use WebSocket for instant in-app notification delivery
2. **Multi-Channel Support**: Integrate AWS SNS for SMS, AWS SES for email, and Web Push API for browser notifications
3. **Multi-Tenant Isolation**: All notifications are tenant-specific with complete data isolation
4. **Reliability**: Implement retry mechanisms, message queues, and fallback strategies
5. **Scalability**: Design for high-volume notification delivery with horizontal scaling
6. **Security**: Enforce authentication, authorization, and encryption for all notification operations

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                   Hospital Management System                 │
│                     (Next.js Frontend)                       │
├─────────────────────────────────────────────────────────────┤
│  Notification Pages:                                         │
│  - Notification Center    - Critical Alerts                  │
│  - System Alerts          - Notification Settings            │
│                                                              │
│  Real-Time Connection:                                       │
│  - WebSocket Client       - Notification State Management    │
│  - Audio/Visual Alerts    - Browser Push Notifications       │
└────────────────┬────────────────────────────────────────────┘
                 │ WebSocket + HTTPS + JWT + X-Tenant-ID
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend API Server                      │
│                   (Node.js + Express)                        │
├─────────────────────────────────────────────────────────────┤
│  WebSocket Server:                                           │
│  - Real-time notification delivery                           │
│  - Connection management per tenant                          │
│  - Broadcast to tenant users                                 │
├─────────────────────────────────────────────────────────────┤
│  Notification Routes:                                        │
│  - /api/notifications (CRUD operations)                      │
│  - /api/notifications/settings (user preferences)            │
│  - /api/notifications/critical (critical alerts)             │
│  - /api/notifications/system (system alerts)                 │
├─────────────────────────────────────────────────────────────┤
│  Notification Services:                                      │
│  - Notification Service (core logic)                         │
│  - Email Service (AWS SES integration)                       │
│  - SMS Service (AWS SNS integration)                         │
│  - Push Service (Web Push API)                               │
│  - Template Service (notification templates)                 │
│  - Scheduler Service (scheduled notifications)               │
└────────────────┬────────────────────────────────────────────┘
                 │
    ┌────────────┴────────────┬──────────────┬────────────────┐
    ▼                         ▼              ▼                ▼
┌─────────┐            ┌──────────┐    ┌─────────┐    ┌──────────┐
│PostgreSQL│            │ AWS SES  │    │ AWS SNS │    │  Redis   │
│Database  │            │  Email   │    │   SMS   │    │  Queue   │
│(Tenant   │            │ Service  │    │ Service │    │ Message  │
│Schemas)  │            └──────────┘    └─────────┘    │  Broker  │
└──────────┘                                           └──────────┘
```

### Data Flow

#### 1. In-App Notification Flow
1. **Event Trigger**: System event occurs (patient admission, lab result, etc.)
2. **Notification Creation**: Backend creates notification in database
3. **WebSocket Broadcast**: Backend sends notification to connected users via WebSocket
4. **Frontend Display**: Frontend receives and displays notification with visual/audio alerts
5. **User Interaction**: User reads, archives, or dismisses notification
6. **State Update**: Frontend updates notification state in backend

#### 2. Email Notification Flow
1. **Notification Creation**: Backend creates notification with email channel enabled
2. **Template Rendering**: Backend renders email template with notification data
3. **AWS SES**: Backend sends email via AWS SES
4. **Delivery Tracking**: Backend tracks email delivery status
5. **Retry Logic**: Backend retries failed deliveries with exponential backoff

#### 3. SMS Notification Flow
1. **Notification Creation**: Backend creates notification with SMS channel enabled
2. **Template Rendering**: Backend renders SMS template (concise text)
3. **AWS SNS**: Backend sends SMS via AWS SNS
4. **Delivery Tracking**: Backend tracks SMS delivery status
5. **Retry Logic**: Backend retries failed deliveries

## Components and Interfaces

### Frontend Components

#### 1. Notification API Client (`lib/api/notifications.ts`)

```typescript
interface NotificationClient {
  // Notification CRUD
  getNotifications(params: NotificationQueryParams): Promise<PaginatedNotifications>
  getNotificationById(id: string): Promise<Notification>
  markAsRead(id: string): Promise<void>
  markAllAsRead(): Promise<void>
  archiveNotification(id: string): Promise<void>
  deleteNotification(id: string): Promise<void>
  
  // Critical Alerts
  getCriticalAlerts(): Promise<CriticalAlert[]>
  acknowledgeCriticalAlert(id: string, notes: string): Promise<void>
  dismissCriticalAlert(id: string, reason: string): Promise<void>
  
  // System Alerts
  getSystemAlerts(): Promise<SystemAlert[]>
  clearSystemAlert(id: string): Promise<void>
  
  // Notification Settings
  getNotificationSettings(): Promise<NotificationSettings>
  updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings>
  resetNotificationSettings(): Promise<NotificationSettings>
  
  // Real-time subscription
  subscribeToNotifications(callback: (notification: Notification) => void): () => void
}
```

#### 2. WebSocket Client (`lib/websocket/notificationSocket.ts`)

```typescript
class NotificationWebSocket {
  private socket: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private listeners: Map<string, Set<NotificationCallback>> = new Map()
  
  connect(token: string, tenantId: string): void {
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}?token=${token}&tenantId=${tenantId}`
    this.socket = new WebSocket(wsUrl)
    
    this.socket.onopen = () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
    }
    
    this.socket.onmessage = (event) => {
      const notification = JSON.parse(event.data)
      this.handleNotification(notification)
    }
    
    this.socket.onclose = () => {
      console.log('WebSocket disconnected')
      this.attemptReconnect(token, tenantId)
    }
    
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }
  
  disconnect(): void {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }
  
  subscribe(event: string, callback: NotificationCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback)
    }
  }
  
  private handleNotification(notification: Notification): void {
    // Trigger callbacks for this notification type
    const callbacks = this.listeners.get(notification.type) || new Set()
    callbacks.forEach(callback => callback(notification))
    
    // Trigger global callbacks
    const globalCallbacks = this.listeners.get('*') || new Set()
    globalCallbacks.forEach(callback => callback(notification))
  }
  
  private attemptReconnect(token: string, tenantId: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
      setTimeout(() => this.connect(token, tenantId), delay)
    }
  }
}

export const notificationSocket = new NotificationWebSocket()
```


#### 3. Notification Hooks (`hooks/useNotifications.ts`)

```typescript
// Main notifications hook
export function useNotifications(params?: NotificationQueryParams) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const data = await notificationClient.getNotifications(params)
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  // Subscribe to real-time notifications
  useEffect(() => {
    const unsubscribe = notificationSocket.subscribe('*', (notification) => {
      setNotifications(prev => [notification, ...prev])
      if (!notification.read) {
        setUnreadCount(prev => prev + 1)
      }
    })
    
    return unsubscribe
  }, [])
  
  useEffect(() => {
    fetchNotifications()
  }, [params])
  
  const markAsRead = async (id: string) => {
    await notificationClient.markAsRead(id)
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }
  
  const archiveNotification = async (id: string) => {
    await notificationClient.archiveNotification(id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }
  
  const deleteNotification = async (id: string) => {
    await notificationClient.deleteNotification(id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }
  
  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    archiveNotification,
    deleteNotification,
    refetch: fetchNotifications
  }
}

// Critical alerts hook
export function useCriticalAlerts() {
  const [alerts, setAlerts] = useState<CriticalAlert[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchAlerts = async () => {
      const data = await notificationClient.getCriticalAlerts()
      setAlerts(data)
      setLoading(false)
    }
    
    fetchAlerts()
    
    // Subscribe to new critical alerts
    const unsubscribe = notificationSocket.subscribe('critical_alert', (alert) => {
      setAlerts(prev => [alert, ...prev])
      // Play audio alert
      playAlertSound()
      // Show browser notification
      showBrowserNotification(alert)
    })
    
    return unsubscribe
  }, [])
  
  return { alerts, loading }
}

// Notification settings hook
export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchSettings = async () => {
      const data = await notificationClient.getNotificationSettings()
      setSettings(data)
      setLoading(false)
    }
    
    fetchSettings()
  }, [])
  
  const updateSettings = async (updates: Partial<NotificationSettings>) => {
    const updated = await notificationClient.updateNotificationSettings(updates)
    setSettings(updated)
  }
  
  return { settings, loading, updateSettings }
}
```

### Backend Components

#### 1. Notification Routes (`backend/src/routes/notifications.ts`)

```typescript
import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { notificationService } from '../services/notifications';

const router = express.Router();

// Get notifications for current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = (req.user as any).sub;
    const tenantId = req.headers['x-tenant-id'] as string;
    const { page = 1, limit = 20, type, read, search } = req.query;
    
    const result = await notificationService.getUserNotifications(
      userId,
      tenantId,
      {
        page: Number(page),
        limit: Number(limit),
        type: type as string,
        read: read === 'true' ? true : read === 'false' ? false : undefined,
        search: search as string
      }
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get notification by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = (req.user as any).sub;
    const tenantId = req.headers['x-tenant-id'] as string;
    const { id } = req.params;
    
    const notification = await notificationService.getNotificationById(id, userId, tenantId);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({ error: 'Failed to fetch notification' });
  }
});

// Mark notification as read
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const userId = (req.user as any).sub;
    const tenantId = req.headers['x-tenant-id'] as string;
    const { id } = req.params;
    
    await notificationService.markAsRead(id, userId, tenantId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    const userId = (req.user as any).sub;
    const tenantId = req.headers['x-tenant-id'] as string;
    
    await notificationService.markAllAsRead(userId, tenantId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Archive notification
router.put('/:id/archive', authMiddleware, async (req, res) => {
  try {
    const userId = (req.user as any).sub;
    const tenantId = req.headers['x-tenant-id'] as string;
    const { id } = req.params;
    
    await notificationService.archiveNotification(id, userId, tenantId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error archiving notification:', error);
    res.status(500).json({ error: 'Failed to archive notification' });
  }
});

// Delete notification
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = (req.user as any).sub;
    const tenantId = req.headers['x-tenant-id'] as string;
    const { id } = req.params;
    
    await notificationService.deleteNotification(id, userId, tenantId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Get critical alerts
router.get('/critical/alerts', authMiddleware, async (req, res) => {
  try {
    const userId = (req.user as any).sub;
    const tenantId = req.headers['x-tenant-id'] as string;
    
    const alerts = await notificationService.getCriticalAlerts(userId, tenantId);
    
    res.json({ alerts });
  } catch (error) {
    console.error('Error fetching critical alerts:', error);
    res.status(500).json({ error: 'Failed to fetch critical alerts' });
  }
});

// Acknowledge critical alert
router.post('/critical/:id/acknowledge', authMiddleware, async (req, res) => {
  try {
    const userId = (req.user as any).sub;
    const tenantId = req.headers['x-tenant-id'] as string;
    const { id } = req.params;
    const { notes } = req.body;
    
    await notificationService.acknowledgeCriticalAlert(id, userId, tenantId, notes);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error acknowledging critical alert:', error);
    res.status(500).json({ error: 'Failed to acknowledge critical alert' });
  }
});

// Get system alerts
router.get('/system/alerts', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    
    const alerts = await notificationService.getSystemAlerts(tenantId);
    
    res.json({ alerts });
  } catch (error) {
    console.error('Error fetching system alerts:', error);
    res.status(500).json({ error: 'Failed to fetch system alerts' });
  }
});

// Get notification settings
router.get('/settings/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = (req.user as any).sub;
    const tenantId = req.headers['x-tenant-id'] as string;
    
    const settings = await notificationService.getNotificationSettings(userId, tenantId);
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ error: 'Failed to fetch notification settings' });
  }
});

// Update notification settings
router.put('/settings/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = (req.user as any).sub;
    const tenantId = req.headers['x-tenant-id'] as string;
    const updates = req.body;
    
    const settings = await notificationService.updateNotificationSettings(
      userId,
      tenantId,
      updates
    );
    
    res.json(settings);
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

export default router;
```


#### 2. Notification Service (`backend/src/services/notifications/notificationService.ts`)

```typescript
import pool from '../../database';
import { emailService } from './emailService';
import { smsService } from './smsService';
import { pushService } from './pushService';
import { webSocketService } from '../websocket';
import { Notification, NotificationSettings, CriticalAlert } from '../../types/notification';

export class NotificationService {
  // Create notification
  async createNotification(
    tenantId: string,
    notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Notification> {
    const client = await pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const result = await client.query(`
        INSERT INTO notifications (
          user_id, type, title, description, severity, 
          metadata, read, archived, channels
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        notification.user_id,
        notification.type,
        notification.title,
        notification.description,
        notification.severity || 'medium',
        JSON.stringify(notification.metadata || {}),
        false,
        false,
        JSON.stringify(notification.channels || ['in_app'])
      ]);
      
      const created = result.rows[0];
      
      // Send via configured channels
      await this.deliverNotification(tenantId, created);
      
      return created;
    } finally {
      client.release();
    }
  }
  
  // Deliver notification via all configured channels
  private async deliverNotification(tenantId: string, notification: Notification): Promise<void> {
    const channels = notification.channels || ['in_app'];
    
    // Get user settings
    const settings = await this.getNotificationSettings(notification.user_id, tenantId);
    
    // Check quiet hours
    if (this.isQuietHours(settings) && notification.severity !== 'critical') {
      // Queue for later delivery
      await this.queueNotification(tenantId, notification);
      return;
    }
    
    // Deliver via each channel
    const deliveryPromises = [];
    
    // In-app (WebSocket)
    if (channels.includes('in_app')) {
      deliveryPromises.push(
        webSocketService.sendToUser(tenantId, notification.user_id, {
          type: 'notification',
          data: notification
        })
      );
    }
    
    // Email
    if (channels.includes('email') && settings.email_notifications) {
      deliveryPromises.push(
        emailService.sendNotificationEmail(tenantId, notification)
      );
    }
    
    // SMS
    if (channels.includes('sms') && settings.sms_notifications) {
      deliveryPromises.push(
        smsService.sendNotificationSMS(tenantId, notification)
      );
    }
    
    // Push
    if (channels.includes('push') && settings.push_notifications) {
      deliveryPromises.push(
        pushService.sendPushNotification(tenantId, notification)
      );
    }
    
    // Wait for all deliveries
    await Promise.allSettled(deliveryPromises);
    
    // Log delivery status
    await this.logDeliveryStatus(tenantId, notification.id, deliveryPromises);
  }
  
  // Get user notifications
  async getUserNotifications(
    userId: string,
    tenantId: string,
    params: {
      page: number;
      limit: number;
      type?: string;
      read?: boolean;
      search?: string;
    }
  ): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    const client = await pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const offset = (params.page - 1) * params.limit;
      let whereConditions = ['user_id = $1', 'archived = false'];
      const queryParams: any[] = [userId];
      let paramIndex = 2;
      
      if (params.type) {
        whereConditions.push(`type = $${paramIndex}`);
        queryParams.push(params.type);
        paramIndex++;
      }
      
      if (params.read !== undefined) {
        whereConditions.push(`read = $${paramIndex}`);
        queryParams.push(params.read);
        paramIndex++;
      }
      
      if (params.search) {
        whereConditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
        queryParams.push(`%${params.search}%`);
        paramIndex++;
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      // Get notifications
      const notificationsResult = await client.query(`
        SELECT * FROM notifications
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...queryParams, params.limit, offset]);
      
      // Get total count
      const countResult = await client.query(`
        SELECT COUNT(*) as total FROM notifications
        WHERE ${whereClause}
      `, queryParams);
      
      // Get unread count
      const unreadResult = await client.query(`
        SELECT COUNT(*) as unread FROM notifications
        WHERE user_id = $1 AND read = false AND archived = false
      `, [userId]);
      
      return {
        notifications: notificationsResult.rows,
        total: parseInt(countResult.rows[0].total),
        unreadCount: parseInt(unreadResult.rows[0].unread)
      };
    } finally {
      client.release();
    }
  }
  
  // Mark notification as read
  async markAsRead(notificationId: string, userId: string, tenantId: string): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      await client.query(`
        UPDATE notifications
        SET read = true, read_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND user_id = $2
      `, [notificationId, userId]);
    } finally {
      client.release();
    }
  }
  
  // Get notification settings
  async getNotificationSettings(userId: string, tenantId: string): Promise<NotificationSettings> {
    const client = await pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const result = await client.query(`
        SELECT * FROM notification_settings
        WHERE user_id = $1
      `, [userId]);
      
      if (result.rows.length === 0) {
        // Create default settings
        return await this.createDefaultSettings(userId, tenantId);
      }
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }
  
  // Update notification settings
  async updateNotificationSettings(
    userId: string,
    tenantId: string,
    updates: Partial<NotificationSettings>
  ): Promise<NotificationSettings> {
    const client = await pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      
      const values = [userId, ...Object.values(updates)];
      
      const result = await client.query(`
        UPDATE notification_settings
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING *
      `, values);
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }
  
  // Create critical alert
  async createCriticalAlert(
    tenantId: string,
    alert: Omit<CriticalAlert, 'id' | 'created_at'>
  ): Promise<CriticalAlert> {
    const notification = await this.createNotification(tenantId, {
      user_id: alert.user_id,
      type: 'critical_alert',
      title: alert.title,
      description: alert.description,
      severity: 'critical',
      metadata: alert.metadata,
      channels: ['in_app', 'email', 'sms', 'push'] // All channels for critical alerts
    });
    
    // Broadcast to all users in the department/role
    await webSocketService.broadcastToTenant(tenantId, {
      type: 'critical_alert',
      data: notification
    });
    
    return notification as CriticalAlert;
  }
  
  // Check if current time is within quiet hours
  private isQuietHours(settings: NotificationSettings): boolean {
    if (!settings.quiet_hours_enabled) {
      return false;
    }
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = settings.quiet_hours_start.split(':').map(Number);
    const [endHour, endMin] = settings.quiet_hours_end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    if (startTime < endTime) {
      return currentTime >= startTime && currentTime < endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime < endTime;
    }
  }
}

export const notificationService = new NotificationService();
```


#### 3. Email Service with AWS SES (`backend/src/services/notifications/emailService.ts`)

```typescript
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Notification } from '../../types/notification';
import { templateService } from './templateService';
import pool from '../../database';

export class EmailService {
  private sesClient: SESClient;
  
  constructor() {
    this.sesClient = new SESClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });
  }
  
  async sendNotificationEmail(tenantId: string, notification: Notification): Promise<void> {
    try {
      // Get user email
      const userEmail = await this.getUserEmail(tenantId, notification.user_id);
      
      if (!userEmail) {
        console.warn(`No email found for user ${notification.user_id}`);
        return;
      }
      
      // Get tenant info for branding
      const tenantInfo = await this.getTenantInfo(tenantId);
      
      // Render email template
      const emailHtml = await templateService.renderEmailTemplate(
        notification.type,
        {
          ...notification,
          tenantName: tenantInfo.name,
          tenantLogo: tenantInfo.logo_url
        }
      );
      
      // Send email via AWS SES
      const command = new SendEmailCommand({
        Source: process.env.SES_FROM_EMAIL || 'notifications@hospital.com',
        Destination: {
          ToAddresses: [userEmail]
        },
        Message: {
          Subject: {
            Data: notification.title,
            Charset: 'UTF-8'
          },
          Body: {
            Html: {
              Data: emailHtml,
              Charset: 'UTF-8'
            },
            Text: {
              Data: notification.description,
              Charset: 'UTF-8'
            }
          }
        },
        ConfigurationSetName: process.env.SES_CONFIGURATION_SET
      });
      
      const response = await this.sesClient.send(command);
      
      // Log delivery
      await this.logEmailDelivery(tenantId, notification.id, userEmail, response.MessageId);
      
      console.log(`Email sent successfully: ${response.MessageId}`);
    } catch (error) {
      console.error('Error sending email:', error);
      
      // Log failure
      await this.logEmailFailure(tenantId, notification.id, error.message);
      
      // Retry logic
      await this.retryEmailDelivery(tenantId, notification);
    }
  }
  
  private async getUserEmail(tenantId: string, userId: string): Promise<string | null> {
    const result = await pool.query(
      'SELECT email FROM users WHERE id = $1',
      [userId]
    );
    
    return result.rows[0]?.email || null;
  }
  
  private async getTenantInfo(tenantId: string): Promise<any> {
    const result = await pool.query(
      'SELECT name, logo_url FROM tenants WHERE id = $1',
      [tenantId]
    );
    
    return result.rows[0];
  }
  
  private async logEmailDelivery(
    tenantId: string,
    notificationId: string,
    email: string,
    messageId: string
  ): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      await client.query(`
        INSERT INTO notification_delivery_log (
          notification_id, channel, recipient, status, message_id, delivered_at
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      `, [notificationId, 'email', email, 'delivered', messageId]);
    } finally {
      client.release();
    }
  }
  
  private async logEmailFailure(
    tenantId: string,
    notificationId: string,
    errorMessage: string
  ): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      await client.query(`
        INSERT INTO notification_delivery_log (
          notification_id, channel, status, error_message, attempted_at
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      `, [notificationId, 'email', 'failed', errorMessage]);
    } finally {
      client.release();
    }
  }
  
  private async retryEmailDelivery(tenantId: string, notification: Notification): Promise<void> {
    // Implement exponential backoff retry logic
    // This would typically use a message queue (Redis/RabbitMQ)
    // For now, we'll just log the retry attempt
    console.log(`Scheduling email retry for notification ${notification.id}`);
  }
}

export const emailService = new EmailService();
```

#### 4. SMS Service with AWS SNS (`backend/src/services/notifications/smsService.ts`)

```typescript
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { Notification } from '../../types/notification';
import { templateService } from './templateService';
import pool from '../../database';

export class SMSService {
  private snsClient: SNSClient;
  
  constructor() {
    this.snsClient = new SNSClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });
  }
  
  async sendNotificationSMS(tenantId: string, notification: Notification): Promise<void> {
    try {
      // Get user phone number
      const phoneNumber = await this.getUserPhoneNumber(tenantId, notification.user_id);
      
      if (!phoneNumber) {
        console.warn(`No phone number found for user ${notification.user_id}`);
        return;
      }
      
      // Render SMS template (concise text)
      const smsText = await templateService.renderSMSTemplate(
        notification.type,
        notification
      );
      
      // Send SMS via AWS SNS
      const command = new PublishCommand({
        PhoneNumber: phoneNumber,
        Message: smsText,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: notification.severity === 'critical' ? 'Transactional' : 'Promotional'
          }
        }
      });
      
      const response = await this.snsClient.send(command);
      
      // Log delivery
      await this.logSMSDelivery(tenantId, notification.id, phoneNumber, response.MessageId);
      
      console.log(`SMS sent successfully: ${response.MessageId}`);
    } catch (error) {
      console.error('Error sending SMS:', error);
      
      // Log failure
      await this.logSMSFailure(tenantId, notification.id, error.message);
      
      // Retry logic
      await this.retrySMSDelivery(tenantId, notification);
    }
  }
  
  private async getUserPhoneNumber(tenantId: string, userId: string): Promise<string | null> {
    const result = await pool.query(
      'SELECT phone FROM users WHERE id = $1',
      [userId]
    );
    
    return result.rows[0]?.phone || null;
  }
  
  private async logSMSDelivery(
    tenantId: string,
    notificationId: string,
    phoneNumber: string,
    messageId: string
  ): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      await client.query(`
        INSERT INTO notification_delivery_log (
          notification_id, channel, recipient, status, message_id, delivered_at
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      `, [notificationId, 'sms', phoneNumber, 'delivered', messageId]);
    } finally {
      client.release();
    }
  }
  
  private async logSMSFailure(
    tenantId: string,
    notificationId: string,
    errorMessage: string
  ): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      
      await client.query(`
        INSERT INTO notification_delivery_log (
          notification_id, channel, status, error_message, attempted_at
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      `, [notificationId, 'sms', 'failed', errorMessage]);
    } finally {
      client.release();
    }
  }
  
  private async retrySMSDelivery(tenantId: string, notification: Notification): Promise<void> {
    console.log(`Scheduling SMS retry for notification ${notification.id}`);
  }
}

export const smsService = new SMSService();
```

#### 5. WebSocket Service (`backend/src/services/websocket.ts`)

```typescript
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { verifyJWT } from '../middleware/auth';

interface AuthenticatedWebSocket extends WebSocket {
  userId: string;
  tenantId: string;
  isAlive: boolean;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<string, Map<string, Set<AuthenticatedWebSocket>>> = new Map();
  
  constructor() {
    this.wss = new WebSocketServer({ noServer: true });
    this.setupWebSocketServer();
    this.startHeartbeat();
  }
  
  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: AuthenticatedWebSocket, request: IncomingMessage) => {
      console.log('New WebSocket connection');
      
      ws.isAlive = true;
      
      ws.on('pong', () => {
        ws.isAlive = true;
      });
      
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
      
      ws.on('close', () => {
        this.removeClient(ws);
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.removeClient(ws);
      });
    });
  }
  
  async handleUpgrade(request: IncomingMessage, socket: any, head: Buffer): Promise<void> {
    try {
      // Extract token and tenantId from query params
      const url = new URL(request.url!, `http://${request.headers.host}`);
      const token = url.searchParams.get('token');
      const tenantId = url.searchParams.get('tenantId');
      
      if (!token || !tenantId) {
        socket.destroy();
        return;
      }
      
      // Verify JWT token
      const decoded = await verifyJWT(token);
      const userId = decoded.sub;
      
      // Upgrade connection
      this.wss.handleUpgrade(request, socket, head, (ws: AuthenticatedWebSocket) => {
        ws.userId = userId;
        ws.tenantId = tenantId;
        
        this.addClient(ws);
        this.wss.emit('connection', ws, request);
      });
    } catch (error) {
      console.error('WebSocket upgrade error:', error);
      socket.destroy();
    }
  }
  
  private addClient(ws: AuthenticatedWebSocket): void {
    if (!this.clients.has(ws.tenantId)) {
      this.clients.set(ws.tenantId, new Map());
    }
    
    const tenantClients = this.clients.get(ws.tenantId)!;
    
    if (!tenantClients.has(ws.userId)) {
      tenantClients.set(ws.userId, new Set());
    }
    
    tenantClients.get(ws.userId)!.add(ws);
  }
  
  private removeClient(ws: AuthenticatedWebSocket): void {
    const tenantClients = this.clients.get(ws.tenantId);
    if (tenantClients) {
      const userClients = tenantClients.get(ws.userId);
      if (userClients) {
        userClients.delete(ws);
        if (userClients.size === 0) {
          tenantClients.delete(ws.userId);
        }
      }
      if (tenantClients.size === 0) {
        this.clients.delete(ws.tenantId);
      }
    }
  }
  
  async sendToUser(tenantId: string, userId: string, message: any): Promise<void> {
    const tenantClients = this.clients.get(tenantId);
    if (!tenantClients) return;
    
    const userClients = tenantClients.get(userId);
    if (!userClients) return;
    
    const messageStr = JSON.stringify(message);
    
    userClients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }
  
  async broadcastToTenant(tenantId: string, message: any): Promise<void> {
    const tenantClients = this.clients.get(tenantId);
    if (!tenantClients) return;
    
    const messageStr = JSON.stringify(message);
    
    tenantClients.forEach(userClients => {
      userClients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
        }
      });
    });
  }
  
  private startHeartbeat(): void {
    setInterval(() => {
      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (!ws.isAlive) {
          this.removeClient(ws);
          return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds
  }
  
  private handleMessage(ws: AuthenticatedWebSocket, data: any): void {
    // Handle client messages (e.g., mark as read, subscribe to specific notifications)
    console.log('Received message from client:', data);
  }
}

export const webSocketService = new WebSocketService();
```


## Data Models

### Notification Models

```typescript
interface Notification {
  id: string
  tenant_id: string
  user_id: string
  type: NotificationType
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  metadata: Record<string, any>
  channels: NotificationChannel[]
  read: boolean
  read_at?: string
  archived: boolean
  archived_at?: string
  created_at: string
  updated_at: string
}

type NotificationType = 
  | 'critical_alert'
  | 'appointment_reminder'
  | 'lab_result'
  | 'billing_update'
  | 'staff_schedule'
  | 'inventory_alert'
  | 'system_maintenance'
  | 'general_info'

type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push'

interface CriticalAlert extends Notification {
  patient_id?: string
  patient_name?: string
  department: string
  contact_person: string
  contact_phone: string
  action_required: string
  acknowledged: boolean
  acknowledged_by?: string
  acknowledged_at?: string
  acknowledgment_notes?: string
}

interface SystemAlert extends Notification {
  system_component: string
  alert_type: 'maintenance' | 'warning' | 'info' | 'error'
  affected_services: string[]
  resolution_status: 'pending' | 'in_progress' | 'resolved'
  resolved_at?: string
}

interface NotificationSettings {
  user_id: string
  tenant_id: string
  email_notifications: boolean
  sms_notifications: boolean
  push_notifications: boolean
  notification_types: {
    critical_alerts: boolean
    appointment_reminders: boolean
    lab_results: boolean
    staff_schedule: boolean
    billing_updates: boolean
    system_maintenance: boolean
  }
  quiet_hours_enabled: boolean
  quiet_hours_start: string  // HH:MM format
  quiet_hours_end: string    // HH:MM format
  digest_mode: boolean
  digest_frequency: 'hourly' | 'daily' | 'weekly'
  created_at: string
  updated_at: string
}

interface NotificationDeliveryLog {
  id: string
  notification_id: string
  channel: NotificationChannel
  recipient: string  // email, phone, or user_id
  status: 'delivered' | 'failed' | 'pending'
  message_id?: string  // AWS SES/SNS message ID
  error_message?: string
  delivered_at?: string
  attempted_at: string
  retry_count: number
}
```

## Database Schema

### Notifications Table (Tenant Schema)

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  severity VARCHAR(20) DEFAULT 'medium',
  metadata JSONB DEFAULT '{}',
  channels JSONB DEFAULT '["in_app"]',
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_severity ON notifications(severity);
```

### Notification Settings Table (Tenant Schema)

```sql
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) UNIQUE NOT NULL,
  tenant_id VARCHAR(255) NOT NULL,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  push_notifications BOOLEAN DEFAULT TRUE,
  notification_types JSONB DEFAULT '{}',
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start VARCHAR(5) DEFAULT '22:00',
  quiet_hours_end VARCHAR(5) DEFAULT '08:00',
  digest_mode BOOLEAN DEFAULT FALSE,
  digest_frequency VARCHAR(20) DEFAULT 'daily',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_settings_user_id ON notification_settings(user_id);
```

### Notification Delivery Log Table (Tenant Schema)

```sql
CREATE TABLE notification_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  channel VARCHAR(20) NOT NULL,
  recipient VARCHAR(255),
  status VARCHAR(20) NOT NULL,
  message_id VARCHAR(255),
  error_message TEXT,
  delivered_at TIMESTAMP,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  retry_count INTEGER DEFAULT 0
);

CREATE INDEX idx_delivery_log_notification_id ON notification_delivery_log(notification_id);
CREATE INDEX idx_delivery_log_status ON notification_delivery_log(status);
CREATE INDEX idx_delivery_log_attempted_at ON notification_delivery_log(attempted_at DESC);
```

## AWS Configuration

### AWS SES Setup

```typescript
// Environment variables
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
SES_FROM_EMAIL=notifications@yourhospital.com
SES_CONFIGURATION_SET=hospital-notifications

// SES Configuration Set (for tracking)
// - Create configuration set in AWS SES console
// - Enable open tracking, click tracking, and bounce/complaint notifications
// - Set up SNS topics for bounce and complaint notifications
```

### AWS SNS Setup

```typescript
// Environment variables
AWS_SNS_REGION=us-east-1

// SNS Configuration
// - Ensure SMS spending limit is set appropriately
// - Configure SMS attributes (sender ID, message type)
// - Set up CloudWatch alarms for SMS delivery failures
```

## Performance Optimization

### Caching Strategy

```typescript
// Redis caching for notification counts
const cacheKey = `notifications:unread:${tenantId}:${userId}`
const cachedCount = await redis.get(cacheKey)

if (cachedCount) {
  return parseInt(cachedCount)
}

const count = await getUnreadCountFromDB(tenantId, userId)
await redis.setex(cacheKey, 300, count) // Cache for 5 minutes

return count
```

### Message Queue for Reliability

```typescript
// Use Redis or RabbitMQ for notification queue
import Bull from 'bull'

const notificationQueue = new Bull('notifications', {
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
})

// Add notification to queue
await notificationQueue.add('send-notification', {
  tenantId,
  notification
}, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000
  }
})

// Process queue
notificationQueue.process('send-notification', async (job) => {
  const { tenantId, notification } = job.data
  await notificationService.deliverNotification(tenantId, notification)
})
```

## Security Considerations

### Authentication and Authorization

1. **WebSocket Authentication**: Verify JWT token during WebSocket upgrade
2. **Tenant Isolation**: Ensure users can only access notifications from their tenant
3. **Permission Checks**: Verify user has permission to create/delete notifications
4. **Rate Limiting**: Implement rate limits on notification creation to prevent abuse

### Data Protection

1. **Encryption**: Encrypt sensitive notification data at rest
2. **PHI Handling**: Ensure HIPAA compliance for notifications containing patient data
3. **Audit Logging**: Log all notification access and modifications
4. **Secure Channels**: Use TLS for all communication (WebSocket, HTTP, AWS services)

## Testing Strategy

### Unit Tests
- Test notification service methods
- Test email/SMS template rendering
- Test WebSocket connection management
- Test notification filtering and search

### Integration Tests
- Test end-to-end notification delivery
- Test multi-channel delivery
- Test WebSocket real-time delivery
- Test AWS SES/SNS integration
- Test multi-tenant isolation

### Performance Tests
- Test WebSocket scalability (1000+ concurrent connections)
- Test notification delivery latency
- Test database query performance
- Test message queue throughput

## Deployment Considerations

### Environment Variables

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# AWS SES
SES_FROM_EMAIL=notifications@hospital.com
SES_CONFIGURATION_SET=hospital-notifications

# WebSocket
WS_PORT=8080
WS_PATH=/notifications

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Notification Settings
NOTIFICATION_RETRY_ATTEMPTS=3
NOTIFICATION_RETRY_DELAY=2000
MAX_NOTIFICATIONS_PER_USER=1000
```

### Monitoring and Alerting

1. **WebSocket Metrics**: Monitor connection count, message throughput
2. **Delivery Metrics**: Track email/SMS delivery success rates
3. **Error Rates**: Alert on high notification delivery failure rates
4. **Latency**: Monitor notification delivery latency
5. **Queue Depth**: Alert on growing message queue backlog

## Migration Plan

### Phase 1: Backend Infrastructure (Week 1)
1. Create database tables for notifications
2. Implement notification service
3. Integrate AWS SES for email
4. Integrate AWS SNS for SMS
5. Set up WebSocket server

### Phase 2: Frontend Integration (Week 2)
1. Create notification API client
2. Implement WebSocket client
3. Create notification hooks
4. Update Notification Center page
5. Update Critical Alerts page

### Phase 3: Real-Time Features (Week 3)
1. Implement WebSocket real-time delivery
2. Add browser push notifications
3. Add audio/visual alerts
4. Implement notification settings
5. Test multi-channel delivery

### Phase 4: Testing and Optimization (Week 4)
1. Conduct integration testing
2. Perform load testing
3. Optimize database queries
4. Implement caching
5. Fix bugs and issues

### Phase 5: Deployment (Week 5)
1. Deploy to staging
2. Conduct UAT
3. Deploy to production
4. Monitor performance
5. Gather user feedback

## Success Metrics

1. **Delivery Success Rate**: > 99% for all channels
2. **Real-Time Latency**: < 500ms for WebSocket delivery
3. **Email Delivery**: < 5 seconds average
4. **SMS Delivery**: < 10 seconds average
5. **WebSocket Connections**: Support 1000+ concurrent connections
6. **Uptime**: 99.9% availability
7. **User Satisfaction**: Positive feedback on notification system
