/**
 * Notification WebSocket Service
 * Team: Epsilon
 * Purpose: Real-time notification delivery via WebSocket
 */

import { Server as WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { verifyToken } from './auth';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: number;
  tenantId?: string;
  isAlive?: boolean;
  connectionId?: string;
}

interface ConnectionInfo {
  userId: number;
  tenantId: string;
  connectedAt: Date;
  lastPing: Date;
}

class NotificationWebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<number, Set<AuthenticatedWebSocket>> = new Map();
  private connectionInfo: Map<string, ConnectionInfo> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize WebSocket server
   */
  initialize(server: any) {
    this.wss = new WebSocketServer({
      server,
      path: '/ws/notifications',
      verifyClient: (info, callback) => {
        // Allow connection, authentication happens in connection handler
        callback(true);
      },
    });

    this.wss.on('connection', async (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
      try {
        // Extract token from query string or headers
        const token = this.extractToken(req);
        if (!token) {
          ws.close(1008, 'Authentication required');
          return;
        }

        // Verify JWT token
        const decoded = await verifyToken(token);
        if (!decoded || !decoded.userId || !decoded.tenantId) {
          ws.close(1008, 'Invalid token');
          return;
        }

        // Setup authenticated connection
        ws.userId = decoded.userId;
        ws.tenantId = decoded.tenantId;
        ws.isAlive = true;
        ws.connectionId = this.generateConnectionId();

        // Store connection info
        this.connectionInfo.set(ws.connectionId, {
          userId: ws.userId,
          tenantId: ws.tenantId,
          connectedAt: new Date(),
          lastPing: new Date(),
        });

        // Add client to tracking
        if (!this.clients.has(ws.userId)) {
          this.clients.set(ws.userId, new Set());
        }
        this.clients.get(ws.userId)!.add(ws);

        console.log(
          `[WebSocket] User ${ws.userId} (tenant: ${ws.tenantId}) connected. Total connections: ${this.getConnectionCount()}`
        );

        // Setup event handlers
        this.setupEventHandlers(ws);

        // Send connection confirmation
        this.sendToClient(ws, {
          type: 'connected',
          userId: ws.userId,
          tenantId: ws.tenantId,
          connectionId: ws.connectionId,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('[WebSocket] Connection error:', error);
        ws.close(1008, 'Authentication failed');
      }
    });

    // Start heartbeat monitoring
    this.startHeartbeat();

    console.log('[WebSocket] Server initialized on path /ws/notifications');
  }

  /**
   * Setup event handlers for WebSocket connection
   */
  private setupEventHandlers(ws: AuthenticatedWebSocket) {
    // Handle pong responses (heartbeat)
    ws.on('pong', () => {
      ws.isAlive = true;
      if (ws.connectionId) {
        const info = this.connectionInfo.get(ws.connectionId);
        if (info) {
          info.lastPing = new Date();
        }
      }
    });

    // Handle incoming messages
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleClientMessage(ws, message);
      } catch (error) {
        console.error('[WebSocket] Error parsing message:', error);
      }
    });

    // Handle connection close
    ws.on('close', () => {
      this.removeClient(ws);
      console.log(
        `[WebSocket] User ${ws.userId} disconnected. Total connections: ${this.getConnectionCount()}`
      );
    });

    // Handle errors
    ws.on('error', error => {
      console.error(`[WebSocket] Error for user ${ws.userId}:`, error);
      this.removeClient(ws);
    });
  }

  /**
   * Handle messages from client
   */
  private handleClientMessage(ws: AuthenticatedWebSocket, message: any) {
    switch (message.type) {
      case 'ping':
        this.sendToClient(ws, { type: 'pong', timestamp: new Date().toISOString() });
        break;

      case 'subscribe':
        // Client can subscribe to specific notification types
        console.log(`[WebSocket] User ${ws.userId} subscribed to ${message.channels}`);
        break;

      case 'unsubscribe':
        console.log(`[WebSocket] User ${ws.userId} unsubscribed from ${message.channels}`);
        break;

      default:
        console.log(`[WebSocket] Unknown message type: ${message.type}`);
    }
  }

  /**
   * Extract authentication token from request
   */
  private extractToken(req: IncomingMessage): string | null {
    // Try query parameter first
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const tokenFromQuery = url.searchParams.get('token');
    if (tokenFromQuery) return tokenFromQuery;

    // Try Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Remove client from tracking
   */
  private removeClient(ws: AuthenticatedWebSocket) {
    if (ws.userId && this.clients.has(ws.userId)) {
      this.clients.get(ws.userId)!.delete(ws);
      if (this.clients.get(ws.userId)!.size === 0) {
        this.clients.delete(ws.userId);
      }
    }

    if (ws.connectionId) {
      this.connectionInfo.delete(ws.connectionId);
    }
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (!this.wss) return;

      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.isAlive === false) {
          console.log(`[WebSocket] Terminating dead connection for user ${ws.userId}`);
          this.removeClient(ws);
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds
  }

  /**
   * Stop heartbeat monitoring
   */
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Send notification to specific user
   */
  sendToUser(userId: number, tenantId: string, notification: any) {
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.size === 0) {
      console.log(`[WebSocket] No active connections for user ${userId}`);
      return false;
    }

    let sentCount = 0;
    const message = JSON.stringify({
      type: 'notification',
      notification,
      timestamp: new Date().toISOString(),
    });

    userClients.forEach(ws => {
      if (ws.tenantId === tenantId && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
        sentCount++;
      }
    });

    console.log(`[WebSocket] Sent notification to ${sentCount} connections for user ${userId}`);
    return sentCount > 0;
  }

  /**
   * Send notification to all users in a tenant
   */
  broadcastToTenant(tenantId: string, notification: any) {
    let sentCount = 0;
    const message = JSON.stringify({
      type: 'notification',
      notification,
      timestamp: new Date().toISOString(),
    });

    this.clients.forEach((userClients, userId) => {
      userClients.forEach(ws => {
        if (ws.tenantId === tenantId && ws.readyState === WebSocket.OPEN) {
          ws.send(message);
          sentCount++;
        }
      });
    });

    console.log(`[WebSocket] Broadcast notification to ${sentCount} connections in tenant ${tenantId}`);
    return sentCount;
  }

  /**
   * Send stats update to user
   */
  sendStatsUpdate(userId: number, tenantId: string, stats: any) {
    const userClients = this.clients.get(userId);
    if (!userClients) return false;

    const message = JSON.stringify({
      type: 'stats_update',
      stats,
      timestamp: new Date().toISOString(),
    });

    userClients.forEach(ws => {
      if (ws.tenantId === tenantId && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });

    return true;
  }

  /**
   * Send message to specific client
   */
  private sendToClient(ws: AuthenticatedWebSocket, data: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  /**
   * Get total connection count
   */
  getConnectionCount(): number {
    return this.wss?.clients.size || 0;
  }

  /**
   * Get connection count for specific user
   */
  getUserConnectionCount(userId: number): number {
    return this.clients.get(userId)?.size || 0;
  }

  /**
   * Get connection count for specific tenant
   */
  getTenantConnectionCount(tenantId: string): number {
    let count = 0;
    this.clients.forEach(userClients => {
      userClients.forEach(ws => {
        if (ws.tenantId === tenantId) count++;
      });
    });
    return count;
  }

  /**
   * Get all active connections info
   */
  getConnectionsInfo(): Array<{
    userId: number;
    tenantId: string;
    connectionId: string;
    connectedAt: Date;
    lastPing: Date;
  }> {
    const connections: Array<any> = [];
    this.connectionInfo.forEach((info, connectionId) => {
      connections.push({
        ...info,
        connectionId,
      });
    });
    return connections;
  }

  /**
   * Close all connections and cleanup
   */
  shutdown() {
    console.log('[WebSocket] Shutting down...');
    this.stopHeartbeat();

    if (this.wss) {
      this.wss.clients.forEach(ws => {
        ws.close(1001, 'Server shutting down');
      });
      this.wss.close();
    }

    this.clients.clear();
    this.connectionInfo.clear();
    console.log('[WebSocket] Shutdown complete');
  }
}

// Export singleton instance
export const notificationWebSocketService = new NotificationWebSocketService();
