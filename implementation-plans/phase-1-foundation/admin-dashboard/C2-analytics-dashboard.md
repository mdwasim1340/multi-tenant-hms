# C2: Real-Time Analytics Dashboard

**Agent:** Admin Dashboard Agent C2  
**Track:** Real-Time Analytics  
**Dependencies:** C1 (Real-time Infrastructure), A2 (Usage Tracking)  
**Estimated Time:** 3-4 days  
**Complexity:** Medium

## Objective
Build a real-time analytics dashboard in the admin interface showing system-wide metrics, tenant usage, and live activity using WebSocket connections.

## Current State Analysis
- ✅ Real-time infrastructure ready (C1)
- ✅ Usage tracking implemented (A2)
- ✅ Admin dashboard application exists
- ❌ No analytics dashboard
- ❌ No real-time data visualization
- ❌ No WebSocket integration in frontend

## Implementation Steps

### Step 1: WebSocket Client Hook (Day 1)
Create React hook for WebSocket connection.

**File:** `admin-dashboard/hooks/use-websocket.ts`
```typescript
import { useEffect, useRef, useState, useCallback } from 'react';

interface UseWebSocketOptions {
  url: string;
  token: string;
  tenantId: string;
  onMessage?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  reconnectInterval?: number;
}

export function useWebSocket({
  url,
  token,
  tenantId,
  onMessage,
  onConnect,
  onDisconnect,
  reconnectInterval = 5000
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    try {
      const wsUrl = `${url}?token=${token}&tenantId=${tenantId}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        if (onConnect) onConnect();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          if (onMessage) onMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        if (onDisconnect) onDisconnect();
        
        // Attempt to reconnect
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, reconnectInterval);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Error creating WebSocket:', error);
    }
  }, [url, token, tenantId, onMessage, onConnect, onDisconnect, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    disconnect,
    reconnect: connect
  };
}
```

### Step 2: Analytics API Client (Day 1)
Create API functions for fetching analytics data.

**File:** `admin-dashboard/lib/api/analytics.ts`
```typescript
import { api } from '../api';

export interface SystemStats {
  total_tenants: number;
  active_tenants: number;
  total_users: number;
  total_patients: number;
  total_appointments: number;
  storage_used_gb: number;
  api_calls_today: number;
}

export interface TenantUsage {
  tenant_id: string;
  tenant_name: string;
  tier_id: string;
  patients_count: number;
  users_count: number;
  storage_used_gb: number;
  api_calls_count: number;
  last_active: string;
}

export interface RecentEvent {
  type: string;
  tenant_id: string;
  timestamp: string;
  data: any;
}

export const analyticsApi = {
  // Get system-wide statistics
  async getSystemStats(): Promise<SystemStats> {
    const response = await api.get('/api/analytics/system-stats');
    return response.data;
  },

  // Get all tenants usage
  async getTenantsUsage(): Promise<TenantUsage[]> {
    const response = await api.get('/api/analytics/tenants-usage');
    return response.data.tenants;
  },

  // Get recent events
  async getRecentEvents(limit: number = 50): Promise<RecentEvent[]> {
    const response = await api.get(`/api/realtime/events/admin?count=${limit}`);
    return response.data.events;
  },

  // Get WebSocket connection stats
  async getConnectionStats() {
    const response = await api.get('/api/realtime/stats');
    return response.data;
  }
};
```

### Step 3: Dashboard Components (Day 2)
Create reusable dashboard components.

**File:** `admin-dashboard/components/analytics/stat-card.tsx`
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
}

export function StatCard({ title, value, icon: Icon, trend, loading }: StatCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className={`text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '+' : ''}{trend.value}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

**File:** `admin-dashboard/components/analytics/activity-feed.tsx`
```typescript
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RecentEvent } from '@/lib/api/analytics';
import { formatDistanceToNow } from 'date-fns';

interface ActivityFeedProps {
  events: RecentEvent[];
  maxHeight?: string;
}

export function ActivityFeed({ events, maxHeight = '400px' }: ActivityFeedProps) {
  const getEventIcon = (type: string) => {
    if (type.includes('patient')) return '👤';
    if (type.includes('appointment')) return '📅';
    if (type.includes('user')) return '👥';
    if (type.includes('backup')) return '💾';
    return '📊';
  };

  const getEventColor = (type: string) => {
    if (type.includes('created')) return 'text-green-600';
    if (type.includes('updated')) return 'text-blue-600';
    if (type.includes('deleted')) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ height: maxHeight }}>
          <div className="space-y-4">
            {events.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No recent activity
              </p>
            ) : (
              events.map((event, index) => (
                <div key={index} className="flex items-start space-x-3 pb-3 border-b last:border-0">
                  <span className="text-2xl">{getEventIcon(event.type)}</span>
                  <div className="flex-1 space-y-1">
                    <p className={`text-sm font-medium ${getEventColor(event.type)}`}>
                      {event.type.replace(/\./g, ' ').replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {event.tenant_id}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
```

### Step 4: Main Analytics Dashboard Page (Day 2-3)
Create the main analytics dashboard page.

**File:** `admin-dashboard/app/analytics/page.tsx`
```typescript
'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/analytics/stat-card';
import { ActivityFeed } from '@/components/analytics/activity-feed';
import { analyticsApi, SystemStats, TenantUsage, RecentEvent } from '@/lib/api/analytics';
import { useWebSocket } from '@/hooks/use-websocket';
import { 
  Users, 
  Building2, 
  Calendar, 
  Database, 
  Activity,
  TrendingUp 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [tenants, setTenants] = useState<TenantUsage[]>([]);
  const [events, setEvents] = useState<RecentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);

  // WebSocket connection for real-time updates
  const { isConnected, lastMessage } = useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000/ws',
    token: 'admin_token', // TODO: Get from auth context
    tenantId: 'admin',
    onMessage: (data) => {
      if (data.type === 'event') {
        // Add new event to the top of the list
        setEvents(prev => [data.event, ...prev].slice(0, 50));
        
        // Refresh stats
        fetchStats();
      }
    },
    onConnect: () => setWsConnected(true),
    onDisconnect: () => setWsConnected(false)
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchTenants(),
        fetchEvents()
      ]);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const data = await analyticsApi.getSystemStats();
    setStats(data);
  };

  const fetchTenants = async () => {
    const data = await analyticsApi.getTenantsUsage();
    setTenants(data);
  };

  const fetchEvents = async () => {
    const data = await analyticsApi.getRecentEvents();
    setEvents(data);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="flex items-center space-x-2">
          <div className={`h-2 w-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-600">
            {wsConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tenants"
          value={stats?.total_tenants || 0}
          icon={Building2}
          loading={loading}
        />
        <StatCard
          title="Active Users"
          value={stats?.total_users || 0}
          icon={Users}
          loading={loading}
        />
        <StatCard
          title="Total Patients"
          value={stats?.total_patients || 0}
          icon={Activity}
          loading={loading}
        />
        <StatCard
          title="API Calls Today"
          value={stats?.api_calls_today || 0}
          icon={TrendingUp}
          loading={loading}
        />
      </div>

      {/* Activity Feed and Tenant Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed events={events} />
        
        <Card>
          <CardHeader>
            <CardTitle>Top Tenants by Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tenants.slice(0, 5).map((tenant) => (
                <div key={tenant.tenant_id} className="flex items-center justify-between pb-3 border-b last:border-0">
                  <div>
                    <p className="font-medium">{tenant.tenant_name}</p>
                    <p className="text-sm text-gray-500">
                      {tenant.patients_count} patients • {tenant.users_count} users
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{tenant.tier_id}</p>
                    <p className="text-xs text-gray-500">
                      {tenant.storage_used_gb.toFixed(2)} GB
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### Step 5: Backend Analytics Endpoints (Day 3)
Create backend endpoints for analytics data.

**File:** `backend/src/routes/analytics.ts`
```typescript
import express from 'express';
import { pool } from '../database';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Get system-wide statistics
router.get('/system-stats', authMiddleware, async (req, res) => {
  try {
    // Get total tenants
    const tenantsResult = await pool.query(
      'SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = $1) as active FROM tenants',
      ['active']
    );

    // Get total users
    const usersResult = await pool.query('SELECT COUNT(*) FROM users');

    // Get total patients (sum across all tenant schemas)
    // Note: This is a simplified version
    const patientsResult = await pool.query(`
      SELECT SUM(patients_count) as total 
      FROM usage_summary 
      WHERE period_start = CURRENT_DATE
    `);

    // Get API calls today
    const apiCallsResult = await pool.query(`
      SELECT SUM(api_calls_count) as total 
      FROM usage_summary 
      WHERE period_start = CURRENT_DATE
    `);

    res.json({
      total_tenants: parseInt(tenantsResult.rows[0].total),
      active_tenants: parseInt(tenantsResult.rows[0].active),
      total_users: parseInt(usersResult.rows[0].count),
      total_patients: parseInt(patientsResult.rows[0]?.total || 0),
      total_appointments: 0, // TODO: Implement
      storage_used_gb: 0, // TODO: Implement
      api_calls_today: parseInt(apiCallsResult.rows[0]?.total || 0)
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ error: 'Failed to fetch system stats' });
  }
});

// Get all tenants usage
router.get('/tenants-usage', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.id as tenant_id,
        t.name as tenant_name,
        ts.tier_id,
        us.patients_count,
        us.users_count,
        us.storage_used_gb,
        us.api_calls_count,
        us.updated_at as last_active
      FROM tenants t
      LEFT JOIN tenant_subscriptions ts ON t.id = ts.tenant_id
      LEFT JOIN usage_summary us ON t.id = us.tenant_id AND us.period_start = CURRENT_DATE
      WHERE t.status = 'active'
      ORDER BY us.patients_count DESC NULLS LAST
    `);

    res.json({ tenants: result.rows });
  } catch (error) {
    console.error('Error fetching tenants usage:', error);
    res.status(500).json({ error: 'Failed to fetch tenants usage' });
  }
});

export default router;
```

**Update:** `backend/src/index.ts`
```typescript
import analyticsRoutes from './routes/analytics';

app.use('/api/analytics', analyticsRoutes);
```

### Step 6: Testing (Day 4)
Test the analytics dashboard.

**Manual Testing Steps:**
1. Open admin dashboard at `/analytics`
2. Verify WebSocket connection (green dot)
3. Check that stats load correctly
4. Trigger some events (create patient, login, etc.)
5. Verify events appear in real-time
6. Check tenant usage list
7. Test with multiple browser tabs

**File:** `backend/tests/test-analytics-dashboard.js`
```javascript
const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function testAnalyticsDashboard() {
  console.log('🧪 Testing Analytics Dashboard\n');

  try {
    // Test 1: Get system stats
    console.log('Test 1: Fetching system stats...');
    const statsResponse = await axios.get(
      `${API_URL}/api/analytics/system-stats`,
      { headers: { 'Authorization': 'Bearer test_token' } }
    );
    console.log('✅ Stats:', statsResponse.data);

    // Test 2: Get tenants usage
    console.log('\nTest 2: Fetching tenants usage...');
    const tenantsResponse = await axios.get(
      `${API_URL}/api/analytics/tenants-usage`,
      { headers: { 'Authorization': 'Bearer test_token' } }
    );
    console.log('✅ Tenants:', tenantsResponse.data.tenants.length);

    console.log('\n✅ All analytics dashboard tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAnalyticsDashboard();
```

## Validation Checklist

### Frontend
- [ ] WebSocket hook working
- [ ] Dashboard components render
- [ ] Real-time updates working
- [ ] Stats display correctly
- [ ] Activity feed updates live

### Backend
- [ ] Analytics endpoints functional
- [ ] Stats calculations correct
- [ ] Events tracked properly

### Integration
- [ ] WebSocket connection stable
- [ ] Real-time events delivered
- [ ] Dashboard responsive
- [ ] No performance issues

### Testing
- [ ] Can view system stats
- [ ] Can see tenant usage
- [ ] Real-time updates work
- [ ] Multiple connections supported

## Success Criteria
- Dashboard displays accurate data
- Real-time updates working
- WebSocket connection stable
- User-friendly interface
- Performance acceptable
- Mobile responsive

## Next Steps
After completion, this enables:
- Real-time monitoring of system health
- Proactive issue detection
- Usage-based billing insights
- Tenant behavior analysis

## Notes for AI Agent
- Test WebSocket reconnection
- Handle connection failures gracefully
- Optimize for performance
- Consider data refresh intervals
- Make dashboard visually appealing
- Test with real data volume
