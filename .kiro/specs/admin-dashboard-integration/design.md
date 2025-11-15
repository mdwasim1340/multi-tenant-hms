# Admin Dashboard Integration - Design

## Overview

This design document outlines the architecture and implementation approach for completing the Admin Dashboard integration with the backend API. While most pages already use real API data, the dashboard overview page uses mock data that needs to be replaced with real backend data. This design ensures consistent API patterns, proper error handling, and secure admin-level access across all pages.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│              Frontend (Admin Dashboard - Next.js)            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Admin Pages                                          │  │
│  │  - / (Dashboard Overview) ⚠️ NEEDS INTEGRATION       │  │
│  │  - /tenants (Tenant Management) ✅ INTEGRATED        │  │
│  │  - /users (User Management) ✅ INTEGRATED            │  │
│  │  - /analytics (Analytics Dashboard) ✅ INTEGRATED    │  │
│  │  - /tenants/:id (Tenant Details) ✅ INTEGRATED       │  │
│  │  - /storage (Storage Management) ⚠️ NEEDS WORK      │  │
│  │  - /settings (System Settings) ⚠️ NEEDS WORK        │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Client (lib/api.ts)                              │  │
│  │  - Axios instance with interceptors ✅ EXISTS        │  │
│  │  - Automatic admin auth header injection             │  │
│  │  - JWT token management                               │  │
│  │  - Error handling and retry logic                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Analytics API Client (lib/api/analytics.ts)          │  │
│  │  - getSystemStats() ✅ EXISTS                         │  │
│  │  - getTenantsUsage() ✅ EXISTS                        │  │
│  │  - getRecentEvents() ✅ EXISTS                        │  │
│  │  - getTrends() ⚠️ NEEDS CREATION                     │  │
│  │  - getStorageMetrics() ⚠️ NEEDS CREATION             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Express)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Middleware Chain                                     │  │
│  │  1. App Authentication (X-App-ID, X-API-Key)          │  │
│  │  2. JWT Validation (Authorization header)             │  │
│  │  3. Admin Role Check (admin permission required)      │  │
│  │  4. Tenant Context (X-Tenant-ID: "admin")             │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Admin Routes                                         │  │
│  │  - GET /api/tenants ✅ EXISTS                         │  │
│  │  - GET /api/users ✅ EXISTS                           │  │
│  │  - GET /api/analytics/stats ✅ EXISTS                 │  │
│  │  - GET /api/analytics/tenants-usage ✅ EXISTS         │  │
│  │  - GET /api/analytics/events ✅ EXISTS                │  │
│  │  - GET /api/analytics/trends ⚠️ NEEDS CREATION       │  │
│  │  - GET /api/analytics/storage ⚠️ NEEDS CREATION      │  │
│  │  - GET /api/subscriptions/tenant/:id ✅ EXISTS        │  │
│  │  - GET /api/usage/tenant/:id/current ✅ EXISTS        │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Analytics Service (services/analytics.ts)            │  │
│  │  - System-wide statistics aggregation                 │  │
│  │  - Tenant usage tracking                              │  │
│  │  - Event logging and retrieval                        │  │
│  │  - Trend analysis                                     │  │
│  │  - Storage metrics calculation                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database                                  │  │
│  │  - tenants table (all tenant data)                    │  │
│  │  - users table (all user data)                        │  │
│  │  - usage_tracking table (usage metrics)               │  │
│  │  - tenant_subscriptions (subscription data)           │  │
│  │  - analytics_events table (system events)             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              WebSocket Server (Optional)                     │
│  - Real-time event streaming                                 │
│  - Connection management                                     │
│  - Fallback to polling if unavailable                        │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Enhanced Analytics API Client

**File:** `admin-dashboard/lib/api/analytics.ts` (ENHANCE EXISTING)

```typescript
import api from './api';

export interface SystemStats {
  total_tenants: number;
  total_users: number;
  total_patients: number;
  api_calls_today: number;
  storage_used_gb: number;
  storage_total_gb: number;
  active_tenants: number;
  system_health: number;
}

export interface TenantUsage {
  tenant_id: string;
  tenant_name: string;
  tier_id: string;
  users_count: number;
  patients_count: number;
  storage_used_gb: number;
  api_calls_count: number;
}

export interface RecentEvent {
  id: string;
  type: string;
  action: string;
  tenant_id?: string;
  tenant_name?: string;
  user_email?: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
  metadata?: Record<string, any>;
}

export interface TrendData {
  month: string;
  tenants: number;
  users: number;
  patients: number;
  storage_gb: number;
}

export interface StorageMetrics {
  total_storage_gb: number;
  used_storage_gb: number;
  available_storage_gb: number;
  usage_percentage: number;
  by_type: {
    documents: number;
    media: number;
    database: number;
    other: number;
  };
  by_tenant: {
    tenant_id: string;
    tenant_name: string;
    storage_used_gb: number;
    storage_limit_gb: number;
    usage_percentage: number;
  }[];
}

class AnalyticsAPI {
  // Existing methods (already implemented)
  async getSystemStats(): Promise<SystemStats> {
    const response = await api.get('/api/analytics/stats');
    return response.data;
  }

  async getTenantsUsage(): Promise<TenantUsage[]> {
    const response = await api.get('/api/analytics/tenants-usage');
    return response.data;
  }

  async getRecentEvents(limit = 50): Promise<RecentEvent[]> {
    const response = await api.get('/api/analytics/events', {
      params: { limit }
    });
    return response.data;
  }

  // NEW METHODS TO ADD
  async getTrends(months = 6): Promise<TrendData[]> {
    const response = await api.get('/api/analytics/trends', {
      params: { months }
    });
    return response.data;
  }

  async getStorageMetrics(): Promise<StorageMetrics> {
    const response = await api.get('/api/analytics/storage');
    return response.data;
  }
}

export const analyticsApi = new AnalyticsAPI();
```

### 2. Dashboard Overview Component (REPLACE MOCK DATA)

**File:** `admin-dashboard/components/dashboard-overview.tsx` (REFACTOR)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { analyticsApi, SystemStats, TrendData, StorageMetrics, RecentEvent } from '@/lib/api/analytics';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ArrowUp, ArrowDown, Users, Building2, HardDrive, AlertCircle } from 'lucide-react';

export function DashboardOverview() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [storage, setStorage] = useState<StorageMetrics | null>(null);
  const [events, setEvents] = useState<RecentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up polling for real-time updates
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 60000); // Poll every 60 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsData, trendsData, storageData, eventsData] = await Promise.all([
        analyticsApi.getSystemStats(),
        analyticsApi.getTrends(6),
        analyticsApi.getStorageMetrics(),
        analyticsApi.getRecentEvents(5)
      ]);
      
      setStats(statsData);
      setTrends(trendsData);
      setStorage(storageData);
      setEvents(eventsData);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.error || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchDashboardData} className="btn btn-outline">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const statsData = [
    {
      label: 'Total Tenants',
      value: stats?.total_tenants || 0,
      change: '+12.5%', // Calculate from trends
      icon: Building2,
      trend: 'up'
    },
    {
      label: 'Active Users',
      value: stats?.total_users || 0,
      change: '+8.2%', // Calculate from trends
      icon: Users,
      trend: 'up'
    },
    {
      label: 'Storage Used',
      value: `${(stats?.storage_used_gb || 0).toFixed(1)} GB`,
      change: '+5.1%', // Calculate from trends
      icon: HardDrive,
      trend: 'up'
    },
    {
      label: 'System Health',
      value: `${(stats?.system_health || 99.8).toFixed(1)}%`,
      change: '-0.2%',
      icon: AlertCircle,
      trend: 'down'
    },
  ];

  const storageChartData = storage ? [
    { name: 'Documents', value: storage.by_type.documents, fill: '#8b5cf6' },
    { name: 'Media', value: storage.by_type.media, fill: '#06b6d4' },
    { name: 'Database', value: storage.by_type.database, fill: '#10b981' },
    { name: 'Other', value: storage.by_type.other, fill: '#f59e0b' },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat) => {
          const Icon = stat.icon;
          const isPositive = stat.trend === 'up';
          return (
            <Card key={stat.label} className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
                <div
                  className={`flex items-center gap-1 text-xs mt-2 ${
                    isPositive
                      ? 'text-green-500 dark:text-green-400'
                      : 'text-red-500 dark:text-red-400'
                  }`}
                >
                  {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  <span>{stat.change}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Chart */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Tenant & User Growth</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--color-border))" />
                <XAxis dataKey="month" stroke="hsl(var(--color-foreground))" />
                <YAxis stroke="hsl(var(--color-foreground))" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="tenants"
                  stroke="#a78bfa"
                  strokeWidth={2.5}
                  name="Tenants"
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#60a5fa"
                  strokeWidth={2.5}
                  name="Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Storage Distribution */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Storage Distribution</CardTitle>
            <CardDescription>
              {storage ? `${storage.used_storage_gb.toFixed(1)} GB total` : 'Loading...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={storageChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {storageChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Recent Activity</CardTitle>
          <CardDescription>Latest system events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between py-3 border-b border-border last:border-0"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-card-foreground">{event.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.tenant_name || event.user_email || 'System'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      event.status === 'success'
                        ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                        : event.status === 'warning'
                          ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                          : event.status === 'error'
                            ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                            : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {event.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card border-border">
          <CardContent className="pt-6">
            <div className="animate-pulse h-[300px] bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="animate-pulse h-[300px] bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### 3. Backend Analytics Routes (NEW ENDPOINTS)

**File:** `backend/src/routes/analytics.ts` (ENHANCE EXISTING)

```typescript
import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/authorization';
import { analyticsService } from '../services/analytics';

const router = express.Router();

// Existing endpoints (already implemented)
router.get('/stats', authMiddleware, requireRole('Admin'), async (req, res) => {
  // ... existing implementation
});

router.get('/tenants-usage', authMiddleware, requireRole('Admin'), async (req, res) => {
  // ... existing implementation
});

router.get('/events', authMiddleware, requireRole('Admin'), async (req, res) => {
  // ... existing implementation
});

// NEW ENDPOINTS TO ADD
router.get('/trends', authMiddleware, requireRole('Admin'), async (req, res) => {
  try {
    const months = parseInt(req.query.months as string) || 6;
    const trends = await analyticsService.getTrends(months);
    res.json(trends);
  } catch (error: any) {
    console.error('Error fetching trends:', error);
    res.status(500).json({
      error: 'Failed to fetch trends',
      code: 'FETCH_TRENDS_ERROR'
    });
  }
});

router.get('/storage', authMiddleware, requireRole('Admin'), async (req, res) => {
  try {
    const storage = await analyticsService.getStorageMetrics();
    res.json(storage);
  } catch (error: any) {
    console.error('Error fetching storage metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch storage metrics',
      code: 'FETCH_STORAGE_ERROR'
    });
  }
});

export default router;
```

### 4. Backend Analytics Service (NEW METHODS)

**File:** `backend/src/services/analytics.ts` (ENHANCE EXISTING)

```typescript
import pool from '../database';

class AnalyticsService {
  // Existing methods...

  // NEW METHOD: Get historical trends
  async getTrends(months: number = 6): Promise<any[]> {
    const result = await pool.query(`
      WITH monthly_data AS (
        SELECT 
          TO_CHAR(created_at, 'Mon') as month,
          EXTRACT(MONTH FROM created_at) as month_num,
          COUNT(DISTINCT CASE WHEN table_name = 'tenants' THEN id END) as tenants,
          COUNT(DISTINCT CASE WHEN table_name = 'users' THEN id END) as users,
          COUNT(DISTINCT CASE WHEN table_name = 'patients' THEN id END) as patients
        FROM (
          SELECT id, created_at, 'tenants' as table_name FROM tenants
          WHERE created_at >= CURRENT_DATE - INTERVAL '${months} months'
          UNION ALL
          SELECT id, created_at, 'users' as table_name FROM users
          WHERE created_at >= CURRENT_DATE - INTERVAL '${months} months'
        ) combined
        GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
        ORDER BY month_num DESC
        LIMIT $1
      )
      SELECT 
        month,
        SUM(tenants) OVER (ORDER BY month_num DESC) as tenants,
        SUM(users) OVER (ORDER BY month_num DESC) as users,
        SUM(patients) OVER (ORDER BY month_num DESC) as patients
      FROM monthly_data
      ORDER BY month_num ASC
    `, [months]);

    return result.rows;
  }

  // NEW METHOD: Get storage metrics
  async getStorageMetrics(): Promise<any> {
    const totalResult = await pool.query(`
      SELECT 
        SUM(storage_used_gb) as used_storage_gb,
        SUM(storage_limit_gb) as total_storage_gb
      FROM usage_tracking
      WHERE metric_type = 'storage'
    `);

    const byTenantResult = await pool.query(`
      SELECT 
        t.id as tenant_id,
        t.name as tenant_name,
        COALESCE(u.storage_used_gb, 0) as storage_used_gb,
        COALESCE(st.limits->>'storage_gb', '0')::numeric as storage_limit_gb,
        CASE 
          WHEN COALESCE(st.limits->>'storage_gb', '0')::numeric > 0 
          THEN (COALESCE(u.storage_used_gb, 0) / COALESCE(st.limits->>'storage_gb', '1')::numeric * 100)
          ELSE 0
        END as usage_percentage
      FROM tenants t
      LEFT JOIN (
        SELECT tenant_id, MAX(metric_value) as storage_used_gb
        FROM usage_tracking
        WHERE metric_type = 'storage'
        GROUP BY tenant_id
      ) u ON t.id = u.tenant_id
      LEFT JOIN tenant_subscriptions ts ON t.id = ts.tenant_id
      LEFT JOIN subscription_tiers st ON ts.tier_id = st.id
      ORDER BY storage_used_gb DESC
      LIMIT 10
    `);

    const total = totalResult.rows[0];
    const used = parseFloat(total.used_storage_gb) || 0;
    const totalStorage = parseFloat(total.total_storage_gb) || 1000;

    return {
      total_storage_gb: totalStorage,
      used_storage_gb: used,
      available_storage_gb: totalStorage - used,
      usage_percentage: (used / totalStorage) * 100,
      by_type: {
        documents: used * 0.45, // Estimate based on typical distribution
        media: used * 0.30,
        database: used * 0.15,
        other: used * 0.10
      },
      by_tenant: byTenantResult.rows
    };
  }
}

export const analyticsService = new AnalyticsService();
```

## Data Models

### Frontend TypeScript Interfaces

All interfaces are defined in the Analytics API Client section above.

## Error Handling

### Error Response Format

Consistent with existing backend error format:

```typescript
{
  error: string;        // Human-readable error message
  code: string;         // Machine-readable error code
}
```

### Frontend Error Handling

```typescript
try {
  const data = await analyticsApi.getSystemStats();
  setStats(data);
} catch (error: any) {
  if (error.response?.status === 401) {
    // Redirect to login
    router.push('/auth/signin');
  } else if (error.response?.status === 403) {
    // Redirect to unauthorized
    router.push('/unauthorized');
  } else {
    // Show error message
    setError(error.response?.data?.error || 'Failed to fetch data');
  }
}
```

## Testing Strategy

### Unit Tests

1. **Analytics API Client Tests**
   - Test getTrends returns correct data structure
   - Test getStorageMetrics handles empty data
   - Test error handling for failed requests

2. **Dashboard Component Tests**
   - Test component renders with real data
   - Test loading state displays correctly
   - Test error state shows retry button

### Integration Tests

1. **Dashboard Data Flow**
   - Fetch stats → Display in cards
   - Fetch trends → Display in chart
   - Fetch storage → Display in pie chart

2. **Admin Authentication**
   - Verify admin role required for all endpoints
   - Test non-admin users redirected to unauthorized

### End-to-End Tests

1. **Complete Dashboard Workflow**
   - Login as admin
   - View dashboard with real data
   - Verify all metrics display correctly
   - Test real-time updates (if WebSocket enabled)

## Security Considerations

### Admin-Only Access

- All analytics endpoints require admin role
- Frontend checks admin permission before rendering
- Backend enforces admin role via middleware

### Data Privacy

- Admin can view all tenant data (by design)
- Sensitive data (passwords, tokens) never exposed
- Audit logging for all admin actions

## Performance Optimization

### Caching Strategy

- Cache dashboard stats for 1 minute
- Cache trends for 5 minutes
- Cache storage metrics for 5 minutes
- Invalidate cache on data changes

### Database Optimization

- Indexes on created_at for trend queries
- Materialized views for complex aggregations (future)
- Query optimization for large datasets

## Deployment Considerations

### Environment Variables

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_KEY=admin-dev-key-456
NEXT_PUBLIC_WS_ENABLED=true
NEXT_PUBLIC_WS_URL=ws://localhost:3000/ws
```

**Backend (.env):**
```
ADMIN_API_KEY=admin-dev-key-456
```

### Monitoring

- Log all admin actions
- Monitor API response times
- Alert on high error rates
- Track dashboard load times

## Future Enhancements

1. **Advanced Analytics**
   - Predictive analytics for tenant growth
   - Anomaly detection for unusual patterns
   - Custom report generation

2. **Real-Time Dashboards**
   - WebSocket for all metrics
   - Live event streaming
   - Real-time alerts

3. **Export Capabilities**
   - Export reports to PDF/Excel
   - Scheduled report generation
   - Email report delivery
