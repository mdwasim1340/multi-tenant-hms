/**
 * Notifications Hook
 * Team: Epsilon
 * Purpose: React hook for notification management
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api-client';
import {
  Notification,
  NotificationListResponse,
  NotificationStats,
  NotificationFilters,
  NotificationSettings,
  ConnectionStats,
} from '@/lib/types/notification';

interface UseNotificationsOptions {
  page?: number;
  limit?: number;
  filters?: NotificationFilters;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    page = 1,
    limit = 20,
    filters = {},
    autoRefresh = false,
    refreshInterval = 30000,
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters,
      });

      const response = await api.get<NotificationListResponse>(
        `/api/notifications?${params.toString()}`
      );

      setNotifications(response.data.notifications);
      setPagination(response.data.pagination);
      setUnreadCount(response.data.unread_count);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);

  // Mark as read
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await api.put(`/api/notifications/${notificationId}/read`);

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  }, []);

  // Archive notification
  const archiveNotification = useCallback(async (notificationId: number) => {
    try {
      await api.put(`/api/notifications/${notificationId}/archive`);

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, archived_at: new Date().toISOString() } : n
        )
      );
    } catch (err: any) {
      console.error('Error archiving notification:', err);
      throw err;
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      await api.delete(`/api/notifications/${notificationId}`);

      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      throw err;
    }
  }, []);

  // Bulk mark as read
  const bulkMarkAsRead = useCallback(async (notificationIds: number[]) => {
    try {
      await api.post('/api/notifications/bulk-read', { notification_ids: notificationIds });

      // Update local state
      const now = new Date().toISOString();
      setNotifications(prev =>
        prev.map(n => (notificationIds.includes(n.id) ? { ...n, read_at: now } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
    } catch (err: any) {
      console.error('Error bulk marking as read:', err);
      throw err;
    }
  }, []);

  // Bulk archive
  const bulkArchive = useCallback(async (notificationIds: number[]) => {
    try {
      await api.post('/api/notifications/bulk-archive', { notification_ids: notificationIds });

      // Update local state
      const now = new Date().toISOString();
      setNotifications(prev =>
        prev.map(n => (notificationIds.includes(n.id) ? { ...n, archived_at: now } : n))
      );
    } catch (err: any) {
      console.error('Error bulk archiving:', err);
      throw err;
    }
  }, []);

  // Bulk delete
  const bulkDelete = useCallback(async (notificationIds: number[]) => {
    try {
      await api.post('/api/notifications/bulk-delete', { notification_ids: notificationIds });

      // Remove from local state
      setNotifications(prev => prev.filter(n => !notificationIds.includes(n.id)));
    } catch (err: any) {
      console.error('Error bulk deleting:', err);
      throw err;
    }
  }, []);

  // Refresh notifications
  const refresh = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        fetchNotifications();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, fetchNotifications]);

  return {
    notifications,
    pagination,
    unreadCount,
    loading,
    error,
    markAsRead,
    archiveNotification,
    deleteNotification,
    bulkMarkAsRead,
    bulkArchive,
    bulkDelete,
    refresh,
  };
}

// Hook for notification statistics
export function useNotificationStats() {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get<{ stats: NotificationStats }>('/api/notifications/stats');
      setStats(response.data.stats);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch statistics');
      console.error('Error fetching notification stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refresh: fetchStats };
}

// Hook for notification settings
export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get<{ settings: NotificationSettings[] }>(
        '/api/notification-settings'
      );
      setSettings(response.data.settings);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch settings');
      console.error('Error fetching notification settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (settingsData: Partial<NotificationSettings>) => {
    try {
      const response = await api.put<{ settings: NotificationSettings }>(
        '/api/notification-settings',
        settingsData
      );

      // Update local state
      setSettings(prev => {
        const index = prev.findIndex(
          s => s.notification_type === response.data.settings.notification_type
        );
        if (index >= 0) {
          const newSettings = [...prev];
          newSettings[index] = response.data.settings;
          return newSettings;
        }
        return [...prev, response.data.settings];
      });

      return response.data.settings;
    } catch (err: any) {
      console.error('Error updating notification settings:', err);
      throw err;
    }
  }, []);

  const resetSettings = useCallback(async () => {
    try {
      await api.post('/api/notification-settings/reset');
      setSettings([]);
      await fetchSettings();
    } catch (err: any) {
      console.error('Error resetting notification settings:', err);
      throw err;
    }
  }, [fetchSettings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, error, updateSettings, resetSettings, refresh: fetchSettings };
}

// Hook for connection statistics
export function useConnectionStats() {
  const [stats, setStats] = useState<ConnectionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get<ConnectionStats>('/api/notifications/connections');
      setStats(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch connection stats');
      console.error('Error fetching connection stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refresh: fetchStats };
}
