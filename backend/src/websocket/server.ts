import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { parse } from 'url';
import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import fetch from 'node-fetch';

let pems: { [key: string]: string } = {};

interface JWK {
  kid: string;
  kty: 'RSA' | 'EC';
  n: string;
  e: string;
}

interface JWKS {
  keys: JWK[];
}

const fetchJWKS = async () => {
  const url = `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`;
  try {
    const response = await fetch(url);
    const jwks = await response.json() as JWKS;
    if (jwks && jwks.keys) {
      pems = jwks.keys.reduce((acc: { [key: string]: string }, key: JWK) => {
        if (key.kty === 'RSA') {
          acc[key.kid] = jwkToPem({ kty: key.kty, n: key.n, e: key.e });
        }
        return acc;
      }, {});
    }
  } catch (error) {
    console.error('Error fetching JWKS:', error);
  }
};

fetchJWKS();

const verifyToken = (token: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const decodedToken = jwt.decode(token, { complete: true }) as jwt.Jwt | null;

    if (!decodedToken || !decodedToken.header.kid) {
      try {
        const payload = jwt.verify(token, 'test-secret-key') as any;
        resolve(payload);
      } catch (err) {
        reject('Invalid local test token');
      }
      return;
    }

    const kid = decodedToken.header.kid;
    const pem = pems[kid];

    if (!pem) {
      reject('Invalid token');
      return;
    }

    jwt.verify(token, pem, { algorithms: ['RS256'] }, (err, payload) => {
      if (err) {
        reject('Invalid token');
      } else {
        resolve(payload);
      }
    });
  });
};

interface AuthenticatedWebSocket extends WebSocket {
  tenantId?: string;
  userId?: number;
  isAlive?: boolean;
}

export class RealtimeServer {
  private wss: WebSocketServer;
  private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({
      server,
      path: '/ws'
    });

    this.setupWebSocketServer();
    this.setupHeartbeat();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', async (ws: AuthenticatedWebSocket, req) => {
      console.log('New WebSocket connection');

      const { query } = parse(req.url || '', true);
      const token = query.token as string;
      const tenantId = query.tenantId as string;

      if (!token || !tenantId) {
        ws.close(1008, 'Authentication required');
        return;
      }

      try {
        const payload = await verifyToken(token);
        ws.tenantId = tenantId;
        ws.userId = payload.sub; // Assuming 'sub' is the user ID
        ws.isAlive = true;

        if (!this.clients.has(tenantId)) {
          this.clients.set(tenantId, new Set());
        }
        this.clients.get(tenantId)!.add(ws);

        ws.on('pong', () => {
          ws.isAlive = true;
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            this.handleClientMessage(ws, message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        });

        ws.on('close', () => {
          console.log('WebSocket connection closed');
          if (ws.tenantId) {
            const tenantClients = this.clients.get(ws.tenantId);
            if (tenantClients) {
              tenantClients.delete(ws);
              if (tenantClients.size === 0) {
                this.clients.delete(ws.tenantId);
              }
            }
          }
        });

        ws.send(JSON.stringify({
          type: 'connected',
          message: 'Connected to real-time server',
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        ws.close(1008, 'Authentication failed');
      }
    });
  }

  private setupHeartbeat() {
    setInterval(() => {
      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  private handleClientMessage(ws: AuthenticatedWebSocket, message: any) {
    console.log('Received message from client:', message);

    switch (message.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        break;
      case 'subscribe':
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  public broadcastToTenant(tenantId: string, data: any) {
    const tenantClients = this.clients.get(tenantId);
    if (!tenantClients) return;

    const message = JSON.stringify(data);
    tenantClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  public broadcastToAll(data: any) {
    const message = JSON.stringify(data);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  public getTenantConnectionCount(tenantId: string): number {
    return this.clients.get(tenantId)?.size || 0;
  }

  public getTotalConnectionCount(): number {
    return this.wss.clients.size;
  }
}

let realtimeServer: RealtimeServer;

export function initializeWebSocketServer(server: Server): RealtimeServer {
  realtimeServer = new RealtimeServer(server);
  console.log('✅ WebSocket server initialized');
  return realtimeServer;
}

export function getRealtimeServer(): RealtimeServer {
  if (!realtimeServer) {
    throw new Error('WebSocket server not initialized');
  }
  return realtimeServer;
}
