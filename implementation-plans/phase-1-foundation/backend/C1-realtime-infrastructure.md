# C1: Real-Time Infrastructure - Redis + WebSocket

**Agent:** Real-Time Infrastructure Agent C1  
**Track:** Real-Time Analytics  
**Dependencies:** None (can start immediately)  
**Estimated Time:** 4-5 days  
**Complexity:** Medium-High

## Objective
Set up Redis for event streaming and caching, plus WebSocket server for real-time updates to admin dashboard and hospital system.

## Current State Analysis
- ✅ Backend API operational
- ✅ Multi-tenant architecture working
- ❌ No Redis setup
- ❌ No WebSocket server
- ❌ No real-time event system

## Implementation Steps

### Step 1: Redis Setup (Day 1)
Install and configure Redis for the project.

**Install Redis:**
```bash
# Add Redis to docker-compose.yml
```

**File:** `docker-compose.yml` (add this service)
```yaml
services:
  # ... existing services ...
  
  redis:
    image: redis:7-alpine
    container_name: backend-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    networks:
      - backend-network
    restart: unless-stopped

volumes:
  # ... existing volumes ...
  redis-data:

networks:
  backend-network:
    driver: bridge
```

**Start Redis:**
```bash
docker-compose up -d redis
```

**Install Redis Client:**
```bash
cd backend
npm install redis
npm install @types/redis --save-dev
```

**Environment Variables:**
Add to `backend/.env`:
```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

**Validation:**
```bash
# Test Redis connection
docker exec -it backend-redis redis-cli ping
# Should return: PONG
```

### Step 2: Redis Client Setup (Day 1)
Create Redis client wrapper.

**File:** `backend/src/config/redis.ts`
```typescript
import { createClient } from 'redis';

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  },
  password: process.env.REDIS_PASSWORD || undefined
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  return redisClient;
}

export { redisClient };
```

**Update:** `backend/src/index.ts`
```typescript
import { connectRedis } from './config/redis';

// Add after database connection
connectRedis().catch(err => {
  console.error('Failed to connect to Redis:', err);
  process.exit(1);
});
```

### Step 3: WebSocket Server Setup (Day 2)
Set up WebSocket server for real-time communication.

**Install Dependencies:**
```bash
npm install ws
npm install @types/ws --save-dev
```

**File:** `backend/src/websocket/server.ts`
```typescript
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { parse } from 'url';

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
    this.wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
      console.log('New WebSocket connection');

      // Parse query parameters for authentication
      const { query } = parse(req.url || '', true);
      const token = query.token as string;
      const tenantId = query.tenantId as string;

      if (!token || !tenantId) {
        ws.close(1008, 'Authentication required');
        return;
      }

      // TODO: Verify JWT token here
      // For now, just accept the connection
      ws.tenantId = tenantId;
      ws.isAlive = true;

      // Add client to tenant group
      if (!this.clients.has(tenantId)) {
        this.clients.set(tenantId, new Set());
      }
      this.clients.get(tenantId)!.add(ws);

      // Handle pong responses
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Handle messages from client
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(ws, message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      // Handle disconnection
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

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to real-time server',
        timestamp: new Date().toISOString()
      }));
    });
  }

  private setupHeartbeat() {
    // Ping clients every 30 seconds to keep connection alive
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
    
    // Handle different message types
    switch (message.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        break;
      case 'subscribe':
        // Handle subscription to specific events
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  // Broadcast to all clients of a tenant
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

  // Broadcast to all connected clients
  public broadcastToAll(data: any) {
    const message = JSON.stringify(data);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Get connection count for tenant
  public getTenantConnectionCount(tenantId: string): number {
    return this.clients.get(tenantId)?.size || 0;
  }

  // Get total connection count
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
```

**Update:** `backend/src/index.ts`
```typescript
import { initializeWebSocketServer } from './websocket/server';

// After app.listen
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Initialize WebSocket server
initializeWebSocketServer(server);
```

### Step 4: Event Service (Day 2-3)
Create service for publishing events to Redis and WebSocket.

**File:** `backend/src/services/events.ts`
```typescript
import { redisClient } from '../config/redis';
import { getRealtimeServer } from '../websocket/server';

export type EventType = 
  | 'patient.created'
  | 'patient.updated'
  | 'appointment.created'
  | 'appointment.updated'
  | 'appointment.cancelled'
  | 'user.login'
  | 'usage.updated'
  | 'backup.completed'
  | 'system.alert';

export interface Event {
  type: EventType;
  tenantId: string;
  userId?: number;
  data: any;
  timestamp: Date;
}

export class EventService {
  // Publish event to Redis stream
  async publishEvent(event: Event): Promise<void> {
    try {
      const streamKey = `events:${event.tenantId}`;
      
      await redisClient.xAdd(streamKey, '*', {
        type: event.type,
        tenantId: event.tenantId,
        userId: event.userId?.toString() || '',
        data: JSON.stringify(event.data),
        timestamp: event.timestamp.toISOString()
      });

      // Also broadcast via WebSocket for immediate delivery
      this.broadcastEvent(event);

      // Store in global events stream for analytics
      await redisClient.xAdd('events:global', '*', {
        type: event.type,
        tenantId: event.tenantId,
        timestamp: event.timestamp.toISOString()
      });

    } catch (error) {
      console.error('Error publishing event:', error);
    }
  }

  // Broadcast event via WebSocket
  private broadcastEvent(event: Event): void {
    try {
      const realtimeServer = getRealtimeServer();
      realtimeServer.broadcastToTenant(event.tenantId, {
        type: 'event',
        event: event
      });
    } catch (error) {
      console.error('Error broadcasting event:', error);
    }
  }

  // Get recent events for tenant
  async getRecentEvents(tenantId: string, count: number = 50): Promise<Event[]> {
    try {
      const streamKey = `events:${tenantId}`;
      const events = await redisClient.xRevRange(streamKey, '+', '-', { COUNT: count });
      
      return events.map(event => ({
        type: event.message.type as EventType,
        tenantId: event.message.tenantId,
        userId: event.message.userId ? parseInt(event.message.userId) : undefined,
        data: JSON.parse(event.message.data),
        timestamp: new Date(event.message.timestamp)
      }));
    } catch (error) {
      console.error('Error getting recent events:', error);
      return [];
    }
  }

  // Cache data in Redis
  async cacheSet(key: string, value: any, expirySeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (expirySeconds) {
        await redisClient.setEx(key, expirySeconds, serialized);
      } else {
        await redisClient.set(key, serialized);
      }
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  }

  // Get cached data from Redis
  async cacheGet<T>(key: string): Promise<T | null> {
    try {
      const data = await redisClient.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      console.error('Error getting cache:', error);
      return null;
    }
  }

  // Delete cached data
  async cacheDelete(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error('Error deleting cache:', error);
    }
  }

  // Increment counter in Redis
  async incrementCounter(key: string, amount: number = 1): Promise<number> {
    try {
      return await redisClient.incrBy(key, amount);
    } catch (error) {
      console.error('Error incrementing counter:', error);
      return 0;
    }
  }

  // Get counter value
  async getCounter(key: string): Promise<number> {
    try {
      const value = await redisClient.get(key);
      return value ? parseInt(value) : 0;
    } catch (error) {
      console.error('Error getting counter:', error);
      return 0;
    }
  }
}

export const eventService = new EventService();
```

### Step 5: API Routes (Day 3)
Create API endpoints for real-time features.

**File:** `backend/src/routes/realtime.ts`
```typescript
import express from 'express';
import { eventService } from '../services/events';
import { getRealtimeServer } from '../websocket/server';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Get recent events for tenant
router.get('/events/:tenantId', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const count = parseInt(req.query.count as string) || 50;
    
    const events = await eventService.getRecentEvents(tenantId, count);
    res.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get WebSocket connection stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const realtimeServer = getRealtimeServer();
    const totalConnections = realtimeServer.getTotalConnectionCount();
    
    res.json({
      total_connections: totalConnections,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Test endpoint to publish event
router.post('/test-event', authMiddleware, async (req, res) => {
  try {
    const { tenant_id, event_type, data } = req.body;
    
    await eventService.publishEvent({
      type: event_type,
      tenantId: tenant_id,
      data: data,
      timestamp: new Date()
    });
    
    res.json({ message: 'Event published successfully' });
  } catch (error) {
    console.error('Error publishing test event:', error);
    res.status(500).json({ error: 'Failed to publish event' });
  }
});

export default router;
```

**Update:** `backend/src/index.ts`
```typescript
import realtimeRoutes from './routes/realtime';

app.use('/api/realtime', realtimeRoutes);
```

### Step 6: Integration with Existing Features (Day 4)
Integrate event publishing into existing services.

**Example: Update User Login to Publish Event**

**File:** `backend/src/routes/auth.ts` (add to signin handler)
```typescript
import { eventService } from '../services/events';

// After successful login
await eventService.publishEvent({
  type: 'user.login',
  tenantId: user.tenant_id,
  userId: user.id,
  data: {
    email: user.email,
    name: user.name
  },
  timestamp: new Date()
});
```

### Step 7: Testing (Day 4-5)
Create comprehensive tests.

**File:** `backend/tests/test-realtime-infrastructure.js`
```javascript
const axios = require('axios');
const WebSocket = require('ws');

const API_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000/ws';
const TENANT_ID = 'tenant_1762083064503';

async function testRealtimeInfrastructure() {
  console.log('🧪 Testing Real-Time Infrastructure\n');

  try {
    // Test 1: WebSocket connection
    console.log('Test 1: Connecting to WebSocket...');
    const ws = new WebSocket(`${WS_URL}?token=test_token&tenantId=${TENANT_ID}`);
    
    await new Promise((resolve, reject) => {
      ws.on('open', () => {
        console.log('✅ WebSocket connected');
        resolve();
      });
      ws.on('error', reject);
      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });

    // Test 2: Receive messages
    console.log('\nTest 2: Testing message reception...');
    const messagePromise = new Promise((resolve) => {
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        console.log('✅ Received message:', message.type);
        resolve(message);
      });
    });

    // Test 3: Publish test event
    console.log('\nTest 3: Publishing test event...');
    await axios.post(
      `${API_URL}/api/realtime/test-event`,
      {
        tenant_id: TENANT_ID,
        event_type: 'system.alert',
        data: { message: 'Test alert' }
      },
      {
        headers: { 'Authorization': 'Bearer test_token' }
      }
    );
    console.log('✅ Event published');

    // Wait for message
    await messagePromise;

    // Test 4: Get recent events
    console.log('\nTest 4: Fetching recent events...');
    const eventsResponse = await axios.get(
      `${API_URL}/api/realtime/events/${TENANT_ID}`,
      {
        headers: { 'Authorization': 'Bearer test_token' }
      }
    );
    console.log('✅ Events fetched:', eventsResponse.data.events.length);

    // Test 5: Get connection stats
    console.log('\nTest 5: Fetching connection stats...');
    const statsResponse = await axios.get(
      `${API_URL}/api/realtime/stats`,
      {
        headers: { 'Authorization': 'Bearer test_token' }
      }
    );
    console.log('✅ Stats:', statsResponse.data);

    // Cleanup
    ws.close();
    console.log('\n✅ All real-time infrastructure tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRealtimeInfrastructure();
```

## Validation Checklist

### Infrastructure
- [ ] Redis running in Docker
- [ ] Redis client connected
- [ ] WebSocket server initialized
- [ ] Heartbeat mechanism working

### Backend
- [ ] Event service implemented
- [ ] Events published to Redis streams
- [ ] WebSocket broadcasts working
- [ ] Caching functions operational

### Integration
- [ ] Routes added to main app
- [ ] Events published from existing features
- [ ] WebSocket authentication working

### Testing
- [ ] Can connect via WebSocket
- [ ] Can receive real-time messages
- [ ] Can publish and retrieve events
- [ ] Connection stats accurate
- [ ] Multiple clients can connect

## Success Criteria
- Redis operational and connected
- WebSocket server handling connections
- Events flowing through system
- Real-time broadcasts working
- Caching functional
- Multi-tenant isolation maintained

## Next Steps
After completion, this enables:
- Agent C2 to build real-time analytics dashboard
- Agent A2 to use Redis for usage tracking
- Real-time notifications across all features

## Notes for AI Agent
- Test WebSocket connections thoroughly
- Ensure proper cleanup on disconnection
- Monitor Redis memory usage
- Implement proper error handling
- Consider rate limiting for events
- Test with multiple simultaneous connections
