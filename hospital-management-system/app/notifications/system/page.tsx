'use client';

import { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { SystemAlertCard } from '@/components/notifications/system-alert-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Server, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SystemAlertsPage() {
  const {
    notifications,
    loading,
    error,
    archiveNotification,
    fetchNotifications,
  } = useNotifications();

  const [dismissedAlerts, setDismissedAlerts] = useState<Set<number>>(new Set());
  const [filterType, setFilterType] = useState<string>('all');

  // Filter for system alerts only
  const systemAlerts = notifications.filter(
    (n) =>
      (n.type === 'system_alert' ||
        n.type === 'system_error' ||
        n.type === 'system_warning') &&
      !n.archived_at
  );

  // Apply type filter
  const filteredAlerts =
    filterType === 'all'
      ? systemAlerts
      : systemAlerts.filter((n) => n.type === filterType);

  const activeAlerts = filteredAlerts.filter((n) => !dismissedAlerts.has(n.id));
  const dismissedCount = filteredAlerts.filter((n) => dismissedAlerts.has(n.id)).length;

  // Count by type
  const errorCount = systemAlerts.filter((n) => n.type === 'system_error').length;
  const warningCount = systemAlerts.filter((n) => n.type === 'system_warning').length;
  const infoCount = systemAlerts.filter((n) => n.type === 'system_alert').length;

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications({
        type: ['system_alert', 'system_error', 'system_warning'],
        archived: false,
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleDismiss = async (id: number) => {
    try {
      await archiveNotification(id);
      setDismissedAlerts((prev) => new Set([...prev, id]));
      toast.success('System alert dismissed');
    } catch (error) {
      toast.error('Failed to dismiss alert');
    }
  };

  const handleDismissAll = async () => {
    try {
      const activeIds = activeAlerts.map((n) => n.id);
      await Promise.all(activeIds.map((id) => archiveNotification(id)));
      setDismissedAlerts((prev) => new Set([...prev, ...activeIds]));
      toast.success(`Dismissed ${activeIds.length} alerts`);
    } catch (error) {
      toast.error('Failed to dismiss all alerts');
    }
  };

  const handleRefresh = () => {
    fetchNotifications({
      type: ['system_alert', 'system_error', 'system_warning'],
      archived: false,
    });
    toast.success('Refreshed system alerts');
  };

  if (loading && systemAlerts.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Server className="h-8 w-8 text-blue-600" />
            System Alerts
          </h1>
          <p className="text-gray-600 mt-1">
            System status, maintenance, and operational notifications
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Alerts</p>
              <p className="text-2xl font-bold">{systemAlerts.length}</p>
            </div>
            <Server className="h-8 w-8 text-gray-600" />
          </div>
        </Card>

        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Errors</p>
              <p className="text-2xl font-bold text-red-600">{errorCount}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </Card>

        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Warnings</p>
              <p className="text-2xl font-bold text-yellow-600">{warningCount}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Info</p>
              <p className="text-2xl font-bold text-blue-600">{infoCount}</p>
            </div>
            <Info className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-medium">Filter by type:</span>
        <Button
          onClick={() => setFilterType('all')}
          variant={filterType === 'all' ? 'default' : 'outline'}
          size="sm"
        >
          All ({systemAlerts.length})
        </Button>
        <Button
          onClick={() => setFilterType('system_error')}
          variant={filterType === 'system_error' ? 'default' : 'outline'}
          size="sm"
        >
          Errors ({errorCount})
        </Button>
        <Button
          onClick={() => setFilterType('system_warning')}
          variant={filterType === 'system_warning' ? 'default' : 'outline'}
          size="sm"
        >
          Warnings ({warningCount})
        </Button>
        <Button
          onClick={() => setFilterType('system_alert')}
          variant={filterType === 'system_alert' ? 'default' : 'outline'}
          size="sm"
        >
          Info ({infoCount})
        </Button>
      </div>

      {/* Bulk Actions */}
      {activeAlerts.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {activeAlerts.length} active system alert
              {activeAlerts.length !== 1 ? 's' : ''}
            </p>
            <Button onClick={handleDismissAll} variant="outline" size="sm">
              Dismiss All
            </Button>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-4 mb-4 bg-red-50 border-red-200">
          <p className="text-red-600">Error loading system alerts: {error}</p>
        </Card>
      )}

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No System Alerts</h3>
          <p className="text-gray-600">
            All systems operating normally. No alerts at this time.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Active Alerts */}
          {activeAlerts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">
                Active Alerts ({activeAlerts.length})
              </h2>
              <div className="space-y-3">
                {activeAlerts.map((notification) => (
                  <SystemAlertCard
                    key={notification.id}
                    notification={notification}
                    onDismiss={handleDismiss}
                    dismissed={false}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Dismissed Alerts */}
          {dismissedCount > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-3 text-gray-600">
                Dismissed ({dismissedCount})
              </h2>
              <div className="space-y-3">
                {filteredAlerts
                  .filter((n) => dismissedAlerts.has(n.id))
                  .map((notification) => (
                    <SystemAlertCard
                      key={notification.id}
                      notification={notification}
                      dismissed={true}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
