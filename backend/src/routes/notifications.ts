/**
 * Notification Routes
 * Team: Epsilon
 * Purpose: API endpoints for notification management
 */

import { Router, Request, Response } from 'express';
import { NotificationService } from '../services/notification';
import {
  CreateNotificationSchema,
  UpdateNotificationSchema,
  ListNotificationsQuerySchema,
  BulkOperationSchema,
  NotificationSettingsSchema,
  UpdateMultipleSettingsSchema,
} from '../types/notification';
import { ZodError } from 'zod';

const router = Router();

/**
 * Helper function to handle Zod validation errors
 */
function handleValidationError(error: ZodError, res: Response) {
  return res.status(400).json({
    error: 'Validation error',
    details: error.issues.map((err: any) => ({
      field: err.path.join('.'),
      message: err.message,
    })),
  });
}

/**
 * Helper function to get user ID from request
 */
function getUserId(req: Request): number {
  // Assuming auth middleware sets req.user
  return (req as any).user?.id || 0;
}

/**
 * Helper function to get tenant ID from request
 */
function getTenantId(req: Request): string {
  return req.headers['x-tenant-id'] as string;
}

// ============================================================================
// Notification Management Endpoints
// ============================================================================

/**
 * GET /api/notifications
 * List notifications with filters and pagination
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Validate query parameters
    const query = ListNotificationsQuerySchema.parse(req.query);

    // Get notifications
    const result = await NotificationService.listNotifications(tenantId, userId, query);

    res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(error, res);
    }
    console.error('Error listing notifications:', error);
    res.status(500).json({ error: 'Failed to list notifications' });
  }
});

/**
 * POST /api/notifications
 * Create a new notification
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Validate request body
    const data = CreateNotificationSchema.parse(req.body);

    // Set created_by to current user if not provided
    if (!data.created_by) {
      data.created_by = userId;
    }

    // Create notification
    const notification = await NotificationService.createNotification(tenantId, data);

    res.status(201).json({
      message: 'Notification created successfully',
      notification,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(error, res);
    }
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

/**
 * GET /api/notifications/stats
 * Get notification statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const stats = await NotificationService.getNotificationStats(tenantId, userId);

    res.json({ stats });
  } catch (error) {
    console.error('Error getting notification stats:', error);
    res.status(500).json({ error: 'Failed to get notification stats' });
  }
});

/**
 * GET /api/notifications/:id
 * Get notification by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const notificationId = parseInt(req.params.id);

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    const notification = await NotificationService.getNotificationById(
      tenantId,
      notificationId,
      userId
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ notification });
  } catch (error) {
    console.error('Error getting notification:', error);
    res.status(500).json({ error: 'Failed to get notification' });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const notificationId = parseInt(req.params.id);

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    const notification = await NotificationService.markAsRead(tenantId, notificationId, userId);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({
      message: 'Notification marked as read',
      notification,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

/**
 * PUT /api/notifications/:id/archive
 * Archive notification
 */
router.put('/:id/archive', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const notificationId = parseInt(req.params.id);

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    const notification = await NotificationService.archiveNotification(
      tenantId,
      notificationId,
      userId
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({
      message: 'Notification archived',
      notification,
    });
  } catch (error) {
    console.error('Error archiving notification:', error);
    res.status(500).json({ error: 'Failed to archive notification' });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete notification (soft delete)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const notificationId = parseInt(req.params.id);

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    const success = await NotificationService.deleteNotification(tenantId, notificationId, userId);

    if (!success) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

/**
 * POST /api/notifications/bulk-read
 * Mark multiple notifications as read
 */
router.post('/bulk-read', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const data = BulkOperationSchema.parse(req.body);

    const affectedCount = await NotificationService.bulkMarkAsRead(tenantId, userId, data);

    res.json({
      success: true,
      affected_count: affectedCount,
      message: `${affectedCount} notification(s) marked as read`,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(error, res);
    }
    console.error('Error bulk marking as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

/**
 * POST /api/notifications/bulk-archive
 * Archive multiple notifications
 */
router.post('/bulk-archive', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const data = BulkOperationSchema.parse(req.body);

    const affectedCount = await NotificationService.bulkArchive(tenantId, userId, data);

    res.json({
      success: true,
      affected_count: affectedCount,
      message: `${affectedCount} notification(s) archived`,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(error, res);
    }
    console.error('Error bulk archiving:', error);
    res.status(500).json({ error: 'Failed to archive notifications' });
  }
});

/**
 * POST /api/notifications/bulk-delete
 * Delete multiple notifications
 */
router.post('/bulk-delete', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const data = BulkOperationSchema.parse(req.body);

    const affectedCount = await NotificationService.bulkDelete(tenantId, userId, data);

    res.json({
      success: true,
      affected_count: affectedCount,
      message: `${affectedCount} notification(s) deleted`,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(error, res);
    }
    console.error('Error bulk deleting:', error);
    res.status(500).json({ error: 'Failed to delete notifications' });
  }
});

/**
 * GET /api/notifications/:id/history
 * Get notification delivery history
 */
router.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const notificationId = parseInt(req.params.id);

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    const history = await NotificationService.getNotificationHistory(
      tenantId,
      notificationId,
      userId
    );

    res.json({ history });
  } catch (error) {
    console.error('Error getting notification history:', error);
    res.status(500).json({ error: 'Failed to get notification history' });
  }
});

// ============================================================================
// Notification Settings Endpoints
// ============================================================================

/**
 * GET /api/notification-settings
 * Get user notification settings
 */
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const settings = await NotificationService.getUserSettings(tenantId, userId);

    res.json({ settings });
  } catch (error) {
    console.error('Error getting notification settings:', error);
    res.status(500).json({ error: 'Failed to get notification settings' });
  }
});

/**
 * PUT /api/notification-settings
 * Update notification settings
 */
router.put('/settings', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const data = NotificationSettingsSchema.parse(req.body);

    const settings = await NotificationService.upsertSettings(tenantId, userId, data);

    res.json({
      message: 'Notification settings updated',
      settings,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(error, res);
    }
    console.error('Error updating notification settings:', error);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

/**
 * POST /api/notification-settings/reset
 * Reset notification settings to defaults
 */
router.post('/settings/reset', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);

    if (!tenantId) {
      return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await NotificationService.resetSettings(tenantId, userId);

    res.json({ message: 'Notification settings reset to defaults' });
  } catch (error) {
    console.error('Error resetting notification settings:', error);
    res.status(500).json({ error: 'Failed to reset notification settings' });
  }
});

// ============================================================================
// Notification Templates Endpoints (Global)
// ============================================================================

/**
 * GET /api/notification-templates
 * Get all notification templates
 */
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const templates = await NotificationService.getAllTemplates();

    res.json({ templates });
  } catch (error) {
    console.error('Error getting notification templates:', error);
    res.status(500).json({ error: 'Failed to get notification templates' });
  }
});

/**
 * GET /api/notification-templates/:key
 * Get template by key
 */
router.get('/templates/:key', async (req: Request, res: Response) => {
  try {
    const templateKey = req.params.key;

    const template = await NotificationService.getTemplateByKey(templateKey);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ template });
  } catch (error) {
    console.error('Error getting notification template:', error);
    res.status(500).json({ error: 'Failed to get notification template' });
  }
});

export default router;
