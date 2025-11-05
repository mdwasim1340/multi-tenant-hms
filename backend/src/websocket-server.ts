import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { parse } from 'url';
import jwt from 'jsonwebtoken';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  tenantId?: string;
}

export class AnalyticsWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map();

  constructor(port: number = 8080) {
    this.wss = new WebSocketServer({ 
      port,
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    console.log(`WebSocket server running on port ${port}`);
  }

  private verifyClient(info: { origin: string; secure: boolean; req: IncomingMessage }): boolean {
    try {
      const url = parse(info.req.url || '', true);
      const token = url.query.token as string;
      const tenantId = url.query.tenantId as string;

      if (!token || !tenantId) {
        return false;
      }

      // Verify JWT token (you'll need to implement proper JWT verification)
      // const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret');
      
      return true;
    } catch (error) {
      console.error('WebSocket authentication failed:', error);
      return false;
    }
  }

  private handleConnection(ws: AuthenticatedWebSocket, req: IncomingMessage) {
    const url = parse(req.url || '', true);
    const tenantId = url.query.tenantId as string;
    
    ws.tenantId = tenantId;

    // Add client to tenant group
    if (!this.clients.has(tenantId)) {
      this.clients.set(tenantId, new Set());
    }
    this.clients.get(tenantId)!.add(ws);

    console.log(`WebSocket client connected for tenant: ${tenantId}`);

    ws.on('message', (data: any) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch (error) {
        console.error('Invalid WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      if (ws.tenantId) {
        const tenantClients = this.clients.get(ws.tenantId);
        if (tenantClients) {
          tenantClients.delete(ws);
          if (tenantClients.size === 0) {
            this.clients.delete(ws.tenantId);
          }
        }
      }
      console.log(`WebSocket client disconnected for tenant: ${ws.tenantId}`);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'WebSocket connection established'
    }));
  }

  private handleMessage(ws: AuthenticatedWebSocket, message: any) {
    // Handle incoming messages from clients
    console.log('Received message:', message);
  }

  // Broadcast event to all clients of a specific tenant
  public broadcastToTenant(tenantId: string, event: any) {
    const tenantClients = this.clients.get(tenantId);
    if (tenantClients) {
      const message = JSON.stringify({
        type: 'event',
        event: event
      });

      tenantClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  }

  // Broadcast event to all connected clients
  public broadcastToAll(event: any) {
    const message = JSON.stringify({
      type: 'event',
      event: event
    });

    this.clients.forEach(tenantClients => {
      tenantClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    });
  }

  public close() {
    this.wss.close();
  }
}

// Export singleton instance
let wsServer: AnalyticsWebSocketServer | null = null;

export function getWebSocketServer(): AnalyticsWebSocketServer {
  if (!wsServer) {
    wsServer = new AnalyticsWebSocketServer();
  }
  return wsServer;
}

export function closeWebSocketServer() {
  if (wsServer) {
    wsServer.close();
    wsServer = null;
  }
}