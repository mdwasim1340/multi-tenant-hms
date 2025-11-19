/**
 * Notification SSE (Server-Sent Events) Service
 * Team: Epsilon
 * Purpose: SSE fallback for real-time notifications when WebSocket is not available
 */

import { Response } from 'express';
import { Notification } from '../types/notification';

interface SSEClient {
  userId: number;
  tenantId: string;
  response: Response;
  lastEventId?: string;
}

export class NotificationSSEService {
  private clients: Map<string, Set<SSEClient>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startHeartbeat();
  }

  /**
   * Add SSE client
   */
  public addClient(userId: number, tenantId: string, res: Response): void {
    const clientKey = `${tenantId}:${userId}`;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Create client object
    const client: SSEClient = {
      userId,
      tenantId,
      response: res,
    };

    // Add to clients map
    if (!this.clients.has(clientKey)) {
      this.clients.set(clientKey, new Set());
    }
    this.clients.get(clientKey)!.add(client);

    console.log(`📡 SSE client connected: User ${userId} in tenant ${tenantId}`);
    console.log(`📊 Active SSE connections: ${this.getConnectionCount()}`);

    // Send initial connection message
    this.sendEvent(client, 'connected', {
      message: 'Connected to notification stream',
      timestamp: new Date().toISOString(),
    });

    // Handle client disconnect
    res.on('close', () => {
      this.removeClient(client);
    });
  }

  /**
   * Remove SSE client
   */
  private removeClient(client: SSEClient): void {
    const clientKey = `${client.tenantId}:${client.userId}`;
    const clientSet = this.clients.get(clientKey);

    if (clientSet) {
      clientSet.delete(client);
      if (clientSet.size === 0) {
        this.clients.delete(clientKey);
      }
    }

    console.log(`🔌 SSE client disconnected: User ${client.userId} in tenant ${client.tenantId}`);
    console.log(`📊 Active SSE connections: ${this.getConnectionCount()}`);
  }

  /**
   * Send event to specific client
   */
  private sendEvent(client: SSEClient, event: string, data: any): boolean {
    try {
      const eventId = Date.now().toString();
      const message = `id: ${eventId}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

      client.response.write(message);
      client.lastEventId = eventId;
      return true;
    } catch (error) {
      console.error('Error sending SSE event:', error);
      return false;
    }
  }

  /**
   * Send notification to specific user
   */
  public sendToUser(tenantId: string, userId: number, notification: Notification): boolean {
    const clientKey = `${tenantId}:${userId}`;
    const clientSet = this.clients.get(clientKey);

    if (clientSet && clientSet.size > 0) {
      let sentCount = 0;

      clientSet.forEach(client => {
        if (this.sendEvent(client, 'notification', notification)) {
          sentCount++;
        }
      });

      console.log(`📤 SSE notification sent to user ${userId} in tenant ${tenantId} (${sentCount}/${clientSet.size} clients)`);
      return sentCount > 0;
    }

    console.log(`📭 No active SSE connections for user ${userId} in tenant ${tenantId}`);
    return false;
  }

  /**
   * Send notification to all users in tenant
   */
  public sendToTenant(tenantId: string, notification: Notification): number {
    let sentCount = 0;

    this.clients.forEach((clientSet, clientKey) => {
      if (clientKey.startsWith(`${tenantId}:`)) {
        clientSet.forEach(client => {
          if (this.sendEvent(client, 'notification', notification)) {
            sentCount++;
          }
        });
      }
    });

    console.log(`📤 SSE notification broadcast to tenant ${tenantId} (${sentCount} clients)`);
    return sentCount;
  }

  /**
   * Send statistics update to user
   */
  public sendStatsUpdate(tenantId: string, userId: number, stats: any): boolean {
    const clientKey = `${tenantId}:${userId}`;
    const clientSet = this.clients.get(clientKey);

    if (clientSet && clientSet.size > 0) {
      let sentCount = 0;

      clientSet.forEach(client => {
        if (this.sendEvent(client, 'stats_update', stats)) {
          sentCount++;
        }
      });

      return sentCount > 0;
    }

    return false;
  }

  /**
   * Start heartbeat to keep connections alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date().toISOString();

      this.clients.forEach(clientSet => {
        clientSet.forEach(client => {
          try {
            this.sendEvent(client, 'heartbeat', { timestamp: now });
          } catch (error) {
            // Client disconnected, will be cleaned up by 'close' event
          }
        });
      });
    }, 30000); // Send heartbeat every 30 seconds
  }

  /**
   * Get total connection count
   */
  public getConnectionCount(): number {
    let count = 0;
    this.clients.forEach(clientSet => {
      count += clientSet.size;
    });
    return count;
  }

  /**
   * Get connection count for specific tenant
   */
  public getTenantConnectionCount(tenantId: string): number {
    let count = 0;
    this.clients.forEach((clientSet, clientKey) => {
      if (clientKey.startsWith(`${tenantId}:`)) {
        count += clientSet.size;
      }
    });
    return count;
  }

  /**
   * Get connection count for specific user
   */
  public getUserConnectionCount(tenantId: string, userId: number): number {
    const clientKey = `${tenantId}:${userId}`;
    const clientSet = this.clients.get(clientKey);
    return clientSet ? clientSet.size : 0;
  }

  /**
   * Shutdown service
   */
  public shutdown(): void {
    console.log('🛑 Shutting down Notification SSE Service');

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.clients.forEach(clientSet => {
      clientSet.forEach(client => {
        try {
          this.sendEvent(client, 'shutdown', { message: 'Server shutting down' });
          client.response.end();
        } catch (error) {
          // Ignore errors during shutdown
        }
      });
    });

    this.clients.clear();
  }
}

// Singleton instance
let sseService: NotificationSSEService | null = null;

export function getNotificationSSEService(): NotificationSSEService {
  if (!sseService) {
    sseService = new NotificationSSEService();
  }
  return sseService;
}
