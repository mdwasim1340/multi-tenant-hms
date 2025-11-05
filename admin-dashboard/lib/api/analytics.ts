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
