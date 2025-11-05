'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
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
import Cookies from "js-cookie"

export default function AnalyticsPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [tenants, setTenants] = useState<TenantUsage[]>([]);
  const [events, setEvents] = useState<RecentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);

  // WebSocket connection for real-time updates (optional - fallback to polling if not available)
  const wsEnabled = process.env.NEXT_PUBLIC_WS_ENABLED === 'true';
  const { isConnected } = wsEnabled ? useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000/ws',
    token: Cookies.get("token") || 'admin_token',
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
  }) : { isConnected: false };

  useEffect(() => {
    fetchData();
    
    // Set up polling for real-time updates if WebSocket is not available
    if (!wsEnabled) {
      const interval = setInterval(() => {
        fetchStats();
        fetchEvents();
      }, 30000); // Poll every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [wsEnabled]);

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
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Real-time system analytics and tenant usage statistics
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${
              wsEnabled && wsConnected ? 'bg-green-500' : 
              wsEnabled ? 'bg-red-500' : 'bg-yellow-500'
            }`} />
            <span className="text-sm text-gray-600">
              {wsEnabled ? (wsConnected ? 'Live' : 'Connecting...') : 'Polling Mode'}
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
                        {tenant.patients_count || 0} patients • {tenant.users_count || 0} users
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{tenant.tier_id}</p>
                      <p className="text-xs text-gray-500">
                        {typeof tenant.storage_used_gb === 'number' 
                          ? tenant.storage_used_gb.toFixed(2) 
                          : '0.00'} GB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
