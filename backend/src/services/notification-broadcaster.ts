/**
 * Notification Broadcaster Service
 * Team: Epsilon
 * Purpose: Coordinate real-time notification delivery across WebSocket and SSE
 */

import { Notification } from '../types/notification';
import { getNotificationWebSocket } from '../websocket/notification-server';
import { getNotificationSSEService } from './notification-sse';
import { NotificationService } from './notification';

export class NotificationBroadcaster {
  /**
   * Broadcast notification to user via all available channels
   */
  static async broadcastToUser(
    tenantId: string,
    userId: number,
    notification: Notification
  ): Promise<{ websocket: boolean; sse: boolean }> {
    const results = {
      websocket: false,
      sse: false,
    };

    // Try WebSocket first
    const wsServer = getNotificationWebSocket();
    if (wsServer) {
      results.websocket = wsServer.broadcastToUser(tenantId, userId, notification);
    }

    // Try SSE as fallback or additional channel
    const sseService = getNotificationSSEService();
    if (sseService) {
      results.sse = sseService.sendToUser(tenantId, userId, notification);
    }

    // Log delivery status
    if (results.websocket || results.sse) {
      console.log(`✅ Notification ${notification.id} delivered to user ${userId} (WS: ${results.websocket}, SSE: ${results.sse})`);
    } else {
      console.log(`📭 Notification ${notification.id} queued for user ${userId} (no active connections)`);
    }

    return results;
  }

  /**
   * Broadcast notification to all users in tenant
   */
  static async broadcastToTenant(
    tenantId: string,
    notification: Notification
  ): Promise<{ websocket: number; sse: number }> {
    const results = {
      websocket: 0,
      sse: 0,
    };

    // Broadcast via WebSocket
    const wsServer = getNotificationWebSocket();
    if (wsServer) {
      results.websocket = wsServer.broadcastToTenant(tenantId, notification);
    }

    // Broadcast via SSE
    const sseService = getNotificationSSEService();
    if (sseService) {
      results.sse = sseService.sendToTenant(tenantId, notification);
    }

    console.log(`📢 Notification ${notification.id} broadcast to tenant ${tenantId} (WS: ${results.websocket}, SSE: ${results.sse})`);

    return results;
  }

  /**
   * Send statistics update to user
   */
  static async sendStatsUpdate(
    tenantId: string,
    userId: number,
    stats: any
  ): Promise<{ websocket: boolean; sse: boolean }> {
    const results = {
      websocket: false,
      sse: false,
    };

    // Send via WebSocket
    const wsServer = getNotificationWebSocket();
    if (wsServer) {
      results.websocket = wsServer.sendStatsUpdate(tenantId, userId, stats);
    }

    // Send via SSE
    const sseService = getNotificationSSEService();
    if (sseService) {
      results.sse = sseService.sendStatsUpdate(tenantId, userId, stats);
    }

    return results;
  }

  /**
   * Create notification and broadcast immediately (in-app only)
   * For multi-channel delivery, use NotificationDeliveryService
   */
  static async createAndBroadcast(
    tenantId: string,
    notificationData: any
  ): Promise<Notification> {
    // Create notification in database
    const notification = await NotificationService.createNotification(tenantId, notificationData);

    // Broadcast to user via in-app channels (WebSocket/SSE)
    await this.broadcastToUser(tenantId, notification.user_id, notification);

    // Update user statistics
    const stats = await NotificationService.getNotificationStats(tenantId, notification.user_id);
    await this.sendStatsUpdate(tenantId, notification.user_id, stats);

    return notification;
  }

  /**
   * Get connection statistics
   */
  static getConnectionStats(): {
    websocket: { total: number };
    sse: { total: number };
  } {
    const wsServer = getNotificationWebSocket();
    const sseService = getNotificationSSEService();

    return {
      websocket: {
        total: wsServer ? wsServer.getConnectionCount() : 0,
      },
      sse: {
        total: sseService ? sseService.getConnectionCount() : 0,
      },
    };
  }

  /**
   * Get tenant connection statistics
   */
  static getTenantConnectionStats(tenantId: string): {
    websocket: number;
    sse: number;
  } {
    const wsServer = getNotificationWebSocket();
    const sseService = getNotificationSSEService();

    return {
      websocket: wsServer ? wsServer.getTenantConnectionCount(tenantId) : 0,
      sse: sseService ? sseService.getTenantConnectionCount(tenantId) : 0,
    };
  }

  /**
   * Get user connection statistics
   */
  static getUserConnectionStats(tenantId: string, userId: number): {
    websocket: number;
    sse: number;
  } {
    const wsServer = getNotificationWebSocket();
    const sseService = getNotificationSSEService();

    return {
      websocket: wsServer ? wsServer.getUserConnectionCount(tenantId, userId) : 0,
      sse: sseService ? sseService.getUserConnectionCount(tenantId, userId) : 0,
    };
  }
}
