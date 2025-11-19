# Team Epsilon: Status Analysis & Implementation Plan

**Date**: November 16, 2025  
**Team**: Epsilon (Communications & Admin)  
**Status**: Partially Complete - Backend Infrastructure Ready, Database & Frontend Integration Needed

---

## 📊 Current Status Summary

### ✅ What's Complete (40% Done)

#### Backend Infrastructure
- ✅ **Notification Routes**: Complete API endpoints in `backend/src/routes/notifications.ts`
  - GET /api/notifications (list with filters)
  - POST /api/notifications (create)
  - GET /api/notifications/:id (get by ID)
  - PUT /api/notifications/:id/read (mark as read)
  - PUT /api/notifications/:id/archive (archive)
  - DELETE /api/notifications/:id (delete)
  - POST /api/notifications/bulk-read (bulk mark as read)
  - POST /api/notifications/bulk-archive (bulk archive)
  - POST /api/notifications/bulk-delete (bulk delete)
  - GET /api/notifications/:id/history (delivery history)
  - GET /api/notifications/stream (SSE endpoint)
  - GET /api/notifications/stats (statistics)

#### Backend Services
- ✅ **NotificationService**: Core notification CRUD operations (`notification.ts`)
- ✅ **NotificationBroadcaster**: Real-time broadcasting (`notification-broadcaster.ts`)
- ✅ **NotificationDeliveryService**: Multi-channel delivery (`notification-delivery.ts`)
- ✅ **NotificationEmailService**: Email delivery via AWS SES (`notification-email.ts`)
- ✅ **NotificationSMSService**: SMS delivery via AWS SNS (`notification-sms.ts`)
- ✅ **NotificationSSEService**: Server-Sent Events for real-time (`notification-sse.ts`)

#### Frontend Pages (Using Mock Data)
- ✅ **Notification Center**: `/app/notifications/page.tsx` - Complete UI with filters
- ✅ **Critical Alerts**: `/app/notifications/critical/page.tsx` - Alert management UI
- ✅ **System Alerts**: `/app/notifications/system/page.tsx` - System notifications UI
- ✅ **Notification Settings**: `/app/notifications/settings/page.tsx` - User preferences UI

#### Frontend Hooks
- ✅ **useNotifications**: Custom hook for notification management
- ✅ **useNotificationStats**: Hook for notification statistics

#### Frontend Components
- ✅ **NotificationCard**: Individual notification display
- ✅ **NotificationFilters**: Filter controls
- ✅ **CriticalAlertCard**: Critical alert display
- ✅ **SystemAlertCard**: System alert display

### ❌ What's Missing (60% Remaining)

#### Database Schema (CRITICAL - Week 1)
- ❌ **notifications** table (tenant-specific) - NOT CREATED
- ❌ **notification_settings** table (tenant-specific) - NOT CREATED
- ❌ **notification_history** table (tenant-specific) - NOT CREATED
- ⚠️ **notification_templates** table (global) - EXISTS but may need updates
- ⚠️ **notification_channels** table (global) - EXISTS but may need updates

#### Real-Time Infrastructure (Week 2)
- ❌ **WebSocket Server**: Not implemented (SSE exists but WebSocket missing)
- ❌ **Redis Queue**: Not configured for notification queuing
- ❌ **Connection Management**: WebSocket connection handling missing
- ❌ **Reconnection Logic**: Auto-reconnect on disconnect missing

#### Frontend Integration (Week 3-4)
- ❌ **API Integration**: All pages using mock data, need real API calls
- ❌ **Real-Time Updates**: WebSocket/SSE integration in frontend
- ❌ **Notification Templates UI**: Admin template management missing
- ❌ **Notification Scheduling**: Scheduled notification UI missing
- ❌ **Notification Analytics**: Analytics dashboard missing

#### Hospital Admin Functions (Week 5)
- ❌ **Hospital Dashboard**: Hospital-level admin dashboard
- ❌ **Department Management**: Department CRUD operations
- ❌ **Resource Management**: Hospital resource management
- ❌ **Hospital Settings**: Hospital-specific configuration
- ❌ **Branding Customization**: Hospital branding UI
- ❌ **Hospital Analytics**: Hospital-level analytics
- ❌ **Billing Overview**: Hospital billing summary

#### Testing & Integration (Week 6)
- ❌ **Unit Tests**: Service layer tests
- ❌ **Integration Tests**: API endpoint tests
- ❌ **E2E Tests**: Full workflow tests
- ❌ **Performance Tests**: Load and stress tests

---

## 🎯 Implementation Plan

### Phase 1: Database Schema (Week 1 - Days 1-2)

#### Task 1.1: Create Tenant-Specific Notification Tables
**Priority**: CRITICAL  
**Estimated Time**: 4 hours

```sql
-- Create migration file: backend/migrations/YYYYMMDDHHMMSS_create_notification_tables.sql

-- notifications table (tenant-specific)
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  user_id INTEGER NOT NULL REFERENCES public.users(id),
  type VARCHAR(50) NOT NULL, -- critical_alert, appointment_reminder, lab_result, etc.
  priority VARCHAR(20) DEFAULT 'medium', -- critical, high, medium, low
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Additional structured data
  read_at TIMESTAMP,
  archived_at TIMESTAMP,
  deleted_at TIMESTAMP,
  created_by INTEGER REFERENCES public.users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- notification_settings table (tenant-specific)
CREATE TABLE IF NOT EXISTS notification_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id),
  notification_type VARCHAR(50) NOT NULL,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  digest_mode BOOLEAN DEFAULT false,
  digest_frequency VARCHAR(20), -- hourly, daily, weekly
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, notification_type)
);

-- notification_history table (tenant-specific)
CREATE TABLE IF NOT EXISTS notification_history (
  id SERIAL PRIMARY KEY,
  notification_id INTEGER NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  channel VARCHAR(20) NOT NULL, -- email, sms, push, in_app
  status VARCHAR(20) NOT NULL, -- sent, delivered, failed, pending
  delivery_attempt INTEGER DEFAULT 1,
  error_message TEXT,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_notification_id ON notification_history(notification_id);
```

**Verification**:
```bash
# Run migration
npm run migrate up

# Verify tables exist in tenant schema
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "
SET search_path TO tenant_aajmin_polyclinic;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'tenant_aajmin_polyclinic' 
AND table_name LIKE '%notification%';
"
```

#### Task 1.2: Update Global Notification Tables
**Priority**: HIGH  
**Estimated Time**: 2 hours

```sql
-- Update notification_templates table
ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update notification_channels table
ALTER TABLE notification_channels ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
ALTER TABLE notification_channels ADD COLUMN IF NOT EXISTS retry_attempts INTEGER DEFAULT 3;
```

### Phase 2: Real-Time Infrastructure (Week 2 - Days 1-3)

#### Task 2.1: Implement WebSocket Server
**Priority**: HIGH  
**Estimated Time**: 6 hours

Create `backend/src/services/notification-websocket.ts`:
```typescript
import { Server as WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { verifyToken } from './auth';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: number;
  tenantId?: string;
  isAlive?: boolean;
}

class NotificationWebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<number, Set<AuthenticatedWebSocket>> = new Map();

  initialize(server: any) {
    this.wss = new WebSocketServer({ server, path: '/ws/notifications' });

    this.wss.on('connection', async (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
      try {
        // Authenticate WebSocket connection
        const token = this.extractToken(req);
        if (!token) {
          ws.close(1008, 'Authentication required');
          return;
        }

        const decoded = await verifyToken(token);
        ws.userId = decoded.userId;
        ws.tenantId = decoded.tenantId;
        ws.isAlive = true;

        // Add client to tracking
        if (!this.clients.has(ws.userId)) {
          this.clients.set(ws.userId, new Set());
        }
        this.clients.get(ws.userId)!.add(ws);

        // Setup ping/pong for connection health
        ws.on('pong', () => {
          ws.isAlive = true;
        });

        ws.on('close', () => {
          this.removeClient(ws);
        });

        ws.send(JSON.stringify({ type: 'connected', userId: ws.userId }));
      } catch (error) {
        ws.close(1008, 'Authentication failed');
      }
    });

    // Heartbeat to detect dead connections
    setInterval(() => {
      this.wss?.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.isAlive === false) {
          this.removeClient(ws);
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  private extractToken(req: IncomingMessage): string | null {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    return url.searchParams.get('token');
  }

  private removeClient(ws: AuthenticatedWebSocket) {
    if (ws.userId && this.clients.has(ws.userId)) {
      this.clients.get(ws.userId)!.delete(ws);
      if (this.clients.get(ws.userId)!.size === 0) {
        this.clients.delete(ws.userId);
      }
    }
  }

  sendToUser(userId: number, tenantId: string, data: any) {
    const userClients = this.clients.get(userId);
    if (!userClients) return;

    const message = JSON.stringify(data);
    userClients.forEach(ws => {
      if (ws.tenantId === tenantId && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  getConnectionCount(): number {
    return this.wss?.clients.size || 0;
  }

  getUserConnectionCount(userId: number): number {
    return this.clients.get(userId)?.size || 0;
  }
}

export const notificationWebSocketService = new NotificationWebSocketService();
```

#### Task 2.2: Setup Redis Queue
**Priority**: HIGH  
**Estimated Time**: 4 hours

Create `backend/src/services/notification-queue.ts`:
```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
});

export class NotificationQueue {
  private static QUEUE_KEY = 'notifications:queue';
  private static PROCESSING_KEY = 'notifications:processing';

  static async enqueue(notification: any): Promise<void> {
    await redis.lpush(this.QUEUE_KEY, JSON.stringify(notification));
  }

  static async dequeue(): Promise<any | null> {
    const item = await redis.rpoplpush(this.QUEUE_KEY, this.PROCESSING_KEY);
    return item ? JSON.parse(item) : null;
  }

  static async markComplete(notification: any): Promise<void> {
    await redis.lrem(this.PROCESSING_KEY, 1, JSON.stringify(notification));
  }

  static async markFailed(notification: any): Promise<void> {
    await redis.lrem(this.PROCESSING_KEY, 1, JSON.stringify(notification));
    // Re-queue with retry count
    notification.retryCount = (notification.retryCount || 0) + 1;
    if (notification.retryCount < 3) {
      await this.enqueue(notification);
    }
  }

  static async getQueueSize(): Promise<number> {
    return await redis.llen(this.QUEUE_KEY);
  }

  static async getProcessingSize(): Promise<number> {
    return await redis.llen(this.PROCESSING_KEY);
  }
}
```

### Phase 3: Frontend Integration (Week 3-4)

#### Task 3.1: Replace Mock Data with Real API
**Priority**: CRITICAL  
**Estimated Time**: 8 hours

Update `hospital-management-system/hooks/use-notifications.ts`:
```typescript
// Already implemented - just needs database tables to work
// Current implementation uses real API calls
```

#### Task 3.2: Implement WebSocket Connection
**Priority**: HIGH  
**Estimated Time**: 4 hours

Create `hospital-management-system/lib/websocket.ts`:
```typescript
import { useEffect, useRef, useState } from 'react';

export function useNotificationWebSocket(onNotification: (notification: any) => void) {
  const ws = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const connect = () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      ws.current = new WebSocket(`ws://localhost:3000/ws/notifications?token=${token}`);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
      };

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'notification') {
          onNotification(data.notification);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        // Reconnect after 5 seconds
        reconnectTimeout.current = setTimeout(connect, 5000);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    connect();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      ws.current?.close();
    };
  }, [onNotification]);

  return { connected };
}
```

### Phase 4: Hospital Admin Functions (Week 5)

#### Task 4.1: Hospital Dashboard
**Priority**: MEDIUM  
**Estimated Time**: 6 hours

Create `hospital-management-system/app/admin/page.tsx`:
```typescript
// Hospital-level admin dashboard
// - Hospital metrics (patients, appointments, staff)
// - Department overview
// - Resource utilization
// - Quick actions
```

#### Task 4.2: Department Management
**Priority**: MEDIUM  
**Estimated Time**: 4 hours

Create `hospital-management-system/app/admin/departments/page.tsx`:
```typescript
// Department CRUD operations
// - List departments
// - Create/edit departments
// - Assign staff to departments
// - Department metrics
```

### Phase 5: Testing & Integration (Week 6)

#### Task 5.1: Integration Tests
**Priority**: HIGH  
**Estimated Time**: 8 hours

Create `backend/tests/test-notifications-complete.js`:
```javascript
// Test notification creation
// Test real-time delivery
// Test multi-channel delivery
// Test tenant isolation
// Test bulk operations
```

---

## 🚀 Quick Start: Next Steps

### Immediate Actions (Today)

1. **Create Database Migration**
   ```bash
   cd backend
   npm run migrate create create-notification-tables
   # Edit the migration file with SQL from Task 1.1
   npm run migrate up
   ```

2. **Verify Tables Created**
   ```bash
   docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "
   SET search_path TO tenant_aajmin_polyclinic;
   \dt notification*
   "
   ```

3. **Test Notification API**
   ```bash
   # Create a test notification
   curl -X POST http://localhost:3000/api/notifications \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "X-Tenant-ID: tenant_aajmin_polyclinic" \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": 1,
       "type": "info",
       "priority": "medium",
       "title": "Test Notification",
       "message": "This is a test notification"
     }'
   ```

4. **Verify Frontend Displays Real Data**
   ```bash
   cd hospital-management-system
   npm run dev
   # Navigate to http://localhost:3001/notifications
   # Should see the test notification
   ```

### This Week's Goals

- ✅ Complete database schema (Tasks 1.1, 1.2)
- ✅ Test notification CRUD operations
- ✅ Verify frontend displays real data
- ✅ Begin WebSocket implementation (Task 2.1)

### Next Week's Goals

- ✅ Complete real-time infrastructure (Tasks 2.1, 2.2)
- ✅ Implement WebSocket in frontend (Task 3.2)
- ✅ Test real-time notification delivery
- ✅ Begin hospital admin functions (Task 4.1)

---

## 📊 Progress Tracking

### Overall Completion: 40%

- ✅ Backend Routes: 100%
- ✅ Backend Services: 100%
- ✅ Frontend UI: 100%
- ❌ Database Schema: 0%
- ❌ Real-Time Infrastructure: 20% (SSE only)
- ❌ Frontend Integration: 50% (hooks ready, needs DB)
- ❌ Hospital Admin: 0%
- ❌ Testing: 0%

### Estimated Time to Complete: 3-4 weeks

- Week 1: Database + API Testing (16 hours)
- Week 2: Real-Time Infrastructure (20 hours)
- Week 3: Frontend Integration (16 hours)
- Week 4: Hospital Admin (16 hours)
- Week 5: Testing & Polish (16 hours)

**Total**: ~84 hours remaining

---

## 🎯 Success Criteria

### Notifications System Complete When:
- [x] Backend API endpoints functional
- [x] Backend services implemented
- [x] Frontend UI components built
- [ ] Database tables created in all tenant schemas
- [ ] Real-time delivery working (WebSocket/SSE)
- [ ] Multi-channel delivery operational (email, SMS, push, in-app)
- [ ] Frontend displays real notifications
- [ ] Notification settings functional
- [ ] Multi-tenant isolation verified
- [ ] Performance metrics met (<100ms creation, <500ms delivery)

### Hospital Admin Complete When:
- [ ] Hospital dashboard operational
- [ ] Department management functional
- [ ] Resource management working
- [ ] Hospital settings configurable
- [ ] Hospital analytics displaying
- [ ] Multi-tenant isolation verified

---

**Status**: Ready to implement database schema and complete integration  
**Next Action**: Create notification tables migration and test API  
**Blocker**: None - all prerequisites met

