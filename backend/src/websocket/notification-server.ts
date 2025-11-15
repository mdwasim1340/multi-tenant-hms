/**
 * Notification WebSocket Server
 * Team: Epsilon
 * Purpose: Real-time notification delivery via WebSocket
 */

import { Server as HTTPServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { Notification } from '../types/notification';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: number;
  tenantId?: string;
  isAlive?: boolean;
}

interface NotificationMessage {
  type: 'notification' | 'ping' | 'pong' | 'stats_update';
  data?: any;
}

export class NotificationWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(server: HTTPServer) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/notifications'
    });

    this.initialize();
  }

  private initialize() {
    console.log('🔔 Notification WebSocket Server initialized');

    this.wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
      this.handleConnection(ws, req);
    });

    // Start heartbeat to detect dead connections
    this.startHeartbeat();
  }

  private async handleConnection(ws: AuthenticatedWebSocket, req: any) {
    console.log('📡 New WebSocket connection attempt');

    try {
      // Extract token from query string or headers
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token') || req.headers.authorization?.replace('Bearer ', '');
      const tenantId = url.searchParams.get('tenant_id') || req.headers['x-tenant-id'];

      if (!token || !tenantId) {
        console.log('❌ WebSocket connection rejected: Missing token or tenant_id');
        ws.close(1008, 'Missing authentication credentials');
        return;
      }

      // Verify JWT token
      const decoded = await this.verifyToken(token);
      if (!decoded || !decoded.userId) {
        console.log('❌ WebSocket connection rejected: Invalid token');
        ws.close(1008, 'Invalid authentication token');
        return;
      }

      // Set client properties
      ws.userId = decoded.userId;
      ws.tenantId = tenantId;
      ws.isAlive = true;

      // Add client to tenant group
      const clientKey = `${tenantId}:${decoded.userId}`;
      if (!this.clients.has(clientKey)) {
        this.clients.set(clientKey, new Set());
      }
      this.clients.get(clientKey)!.add(ws);

      console.log(`✅ WebSocket connected: User ${decoded.userId} in tenant ${tenantId}`);
      console.log(`📊 Active connections: ${this.getConnectionCount()}`);

      // Send connection success message
      this.sendMessage(ws, {
        type: 'ping',
        data: { message: 'Connected to notification server', timestamp: new Date().toISOString() }
      });

      // Handle incoming messages
      ws.on('message', (message: string) => {
        this.handleMessage(ws, message);
      });

      // Handle pong responses
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Handle disconnection
      ws.on('close', () => {
        this.handleDisconnection(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        this.handleDisconnection(ws);
      });

    } catch (error) {
      console.error('❌ WebSocket connection error:', error);
      ws.close(1011, 'Internal server error');
    }
  }

  private async verifyToken(token: string): Promise<{ userId: number } | null> {
    try {
      // For now, we'll use a simple JWT verification
      // In production, this should verify against Cognito JWKS
      const decoded = jwt.decode(token) as any;
      
      if (!decoded || !decoded.sub) {
        return null;
      }

      // Extract user ID from token
      // Assuming the token has a 'sub' claim with user ID
      const userId = parseInt(decoded.sub) || decoded.userId;
      
      return { userId };
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  private handleMessage(ws: AuthenticatedWebSocket, message: string) {
    try {
      const parsed = JSON.parse(message);
      
      switch (parsed.type) {
        case 'ping':
          this.sendMessage(ws, { type: 'pong', data: { timestamp: new Date().toISOString() } });
          break;
        
        case 'subscribe':
          // Handle subscription to specific notification types
          console.log(`📬 User ${ws.userId} subscribed to notifications`);
          break;
        
        default:
          console.log('Unknown message type:', parsed.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  private handleDisconnection(ws: AuthenticatedWebSocket) {
    if (ws.userId && ws.tenantId) {
      const clientKey = `${ws.tenantId}:${ws.userId}`;
      const clientSet = this.clients.get(clientKey);
      
      if (clientSet) {
        clientSet.delete(ws);
        if (clientSet.size === 0) {
          this.clients.delete(clientKey);
        }
      }

      console.log(`🔌 WebSocket disconnected: User ${ws.userId} in tenant ${ws.tenantId}`);
      console.log(`📊 Active connections: ${this.getConnectionCount()}`);
    }
  }

  private sendMessage(ws: AuthenticatedWebSocket, message: NotificationMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast notification to specific user
   */
  public broadcastToUser(tenantId: string, userId: number, notification: Notification) {
    const clientKey = `${tenantId}:${userId}`;
    const clientSet = this.clients.get(clientKey);

    if (clientSet && clientSet.size > 0) {
      const message: NotificationMessage = {
        type: 'notification',
        data: notification
      };

      clientSet.forEach(ws => {
        this.sendMessage(ws, message);
      });

      console.log(`📤 Notification sent to user ${userId} in tenant ${tenantId} (${clientSet.size} connections)`);
      return true;
    }

    console.log(`📭 No active connections for user ${userId} in tenant ${tenantId}`);
    return false;
  }

  /**
   * Broadcast notification to all users in a tenant
   */
  public broadcastToTenant(tenantId: string, notification: Notification) {
    let sentCount = 0;

    this.clients.forEach((clientSet, clientKey) => {
      if (clientKey.startsWith(`${tenantId}:`)) {
        const message: NotificationMessage = {
          type: 'notification',
          data: notification
        };

        clientSet.forEach(ws => {
          this.sendMessage(ws, message);
          sentCount++;
        });
      }
    });

    console.log(`📤 Notification broadcast to tenant ${tenantId} (${sentCount} connections)`);
    return sentCount;
  }

  /**
   * Send statistics update to user
   */
  public sendStatsUpdate(tenantId: string, userId: number, stats: any) {
    const clientKey = `${tenantId}:${userId}`;
    const clientSet = this.clients.get(clientKey);

    if (clientSet && clientSet.size > 0) {
      const message: NotificationMessage = {
        type: 'stats_update',
        data: stats
      };

      clientSet.forEach(ws => {
        this.sendMessage(ws, message);
      });

      return true;
    }

    return false;
  }

  /**
   * Start heartbeat to detect dead connections
   */
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.isAlive === false) {
          console.log('💀 Terminating dead connection');
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // Check every 30 seconds
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
   * Shutdown server
   */
  public shutdown() {
    console.log('🛑 Shutting down Notification WebSocket Server');
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.wss.clients.forEach(ws => {
      ws.close(1001, 'Server shutting down');
    });

    this.wss.close();
    this.clients.clear();
  }
}

// Singleton instance
let notificationWSServer: NotificationWebSocketServer | null = null;

export function initializeNotificationWebSocket(server: HTTPServer): NotificationWebSocketServer {
  if (!notificationWSServer) {
    notificationWSServer = new NotificationWebSocketServer(server);
  }
  return notificationWSServer;
}

export function getNotificationWebSocket(): NotificationWebSocketServer | null {
  return notificationWSServer;
}
