'use client';

import { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { CriticalAlertCard } from '@/components/notifications/critical-alert-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CriticalAlertsPage() {
  const {
    notifications,
    loading,
    error,
    stats,
    markAsRead,
    archiveNotification,
    fetchNotifications,
  } = useNotifications();

  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<number>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Filter for critical alerts only
  const criticalAlerts = notifications.filter(
    (n) => n.priority === 'critical' && !n.archived_at
  );

  const unacknowledgedAlerts = criticalAlerts.filter(
    (n) => !acknowledgedAlerts.has(n.id) && !n.read_at
  );

  // Auto-refresh every 15 seconds for critical alerts
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchNotifications({
        priority: 'critical',
        archived: false,
      });
    }, 15000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchNotifications]);

  // Play alert sound for new critical alerts (optional)
  useEffect(() => {
    if (unacknowledgedAlerts.length > 0) {
      // You can add audio alert here
      // const audio = new Audio('/alert-sound.mp3');
      // audio.play();
    }
  }, [unacknowledgedAlerts.length]);

  const handleAcknowledge = async (id: number) => {
    try {
      await markAsRead(id);
      setAcknowledgedAlerts((prev) => new Set([...prev, id]));
      toast.success('Alert acknowledged');
    } catch (error) {
      toast.error('Failed to acknowledge alert');
    }
  };

  const handleDismiss = async (id: number) => {
    try {
      await archiveNotification(id);
      toast.success('Alert dismissed');
    } catch (error) {
      toast.error('Failed to dismiss alert');
    }
  };

  const handleAcknowledgeAll = async () => {
    try {
      const unacknowledgedIds = unacknowledgedAlerts.map((n) => n.id);
      await Promise.all(unacknowledgedIds.map((id) => markAsRead(id)));
      setAcknowledgedAlerts(
        (prev) => new Set([...prev, ...unacknowledgedIds])
      );
      toast.success(`Acknowledged ${unacknowledgedIds.length} alerts`);
    } catch (error) {
      toast.error('Failed to acknowledge all alerts');
    }
  };

  const handleRefresh = () => {
    fetchNotifications({
      priority: 'critical',
      archived: false,
    });
    toast.success('Refreshed critical alerts');
  };

  if (loading && criticalAlerts.length === 0) {
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
            <AlertTriangle className="h-8 w-8 text-red-600" />
            Critical Alerts
          </h1>
          <p className="text-gray-600 mt-1">
            Urgent notifications requiring immediate attention
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
          >
            {autoRefresh ? '🔄 Auto-refresh ON' : '⏸️ Auto-refresh OFF'}
          </Button>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Critical</p>
              <p className="text-2xl font-bold">{criticalAlerts.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </Card>

        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unacknowledged</p>
              <p className="text-2xl font-bold text-red-600">
                {unacknowledgedAlerts.length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600 animate-pulse" />
          </div>
        </Card>

        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Acknowledged</p>
              <p className="text-2xl font-bold text-green-600">
                {criticalAlerts.length - unacknowledgedAlerts.length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Bulk Actions */}
      {unacknowledgedAlerts.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              ⚠️ {unacknowledgedAlerts.length} unacknowledged critical alert
              {unacknowledgedAlerts.length !== 1 ? 's' : ''} requiring attention
            </p>
            <Button
              onClick={handleAcknowledgeAll}
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Acknowledge All
            </Button>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-4 mb-4 bg-red-50 border-red-200">
          <p className="text-red-600">Error loading critical alerts: {error}</p>
        </Card>
      )}

      {/* Alerts List */}
      {criticalAlerts.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Critical Alerts</h3>
          <p className="text-gray-600">
            All systems operating normally. No critical alerts at this time.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Unacknowledged Alerts First */}
          {unacknowledgedAlerts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-red-600">
                ⚠️ Requires Acknowledgment ({unacknowledgedAlerts.length})
              </h2>
              <div className="space-y-3">
                {unacknowledgedAlerts.map((notification) => (
                  <CriticalAlertCard
                    key={notification.id}
                    notification={notification}
                    onAcknowledge={handleAcknowledge}
                    onDismiss={handleDismiss}
                    acknowledged={false}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Acknowledged Alerts */}
          {criticalAlerts.length > unacknowledgedAlerts.length && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-3 text-green-600">
                ✅ Acknowledged ({criticalAlerts.length - unacknowledgedAlerts.length})
              </h2>
              <div className="space-y-3">
                {criticalAlerts
                  .filter((n) => acknowledgedAlerts.has(n.id) || n.read_at)
                  .map((notification) => (
                    <CriticalAlertCard
                      key={notification.id}
                      notification={notification}
                      onDismiss={handleDismiss}
                      acknowledged={true}
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
