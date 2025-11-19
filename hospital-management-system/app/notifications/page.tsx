/**
 * Notification Center Page
 * Team: Epsilon
 * Purpose: Main notification center with list, filters, and actions
 */

'use client';

import { useState } from 'react';
import { useNotifications, useNotificationStats } from '@/hooks/use-notifications';
import { NotificationCard } from '@/components/notifications/notification-card';
import { NotificationFiltersComponent } from '@/components/notifications/notification-filters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotificationFilters } from '@/lib/types/notification';
import { Bell, Check, Archive, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<NotificationFilters>({
    archived: false, // Show active only by default
  });
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const {
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
  } = useNotifications({ page, limit: 20, filters, autoRefresh: true, refreshInterval: 30000 });

  const { stats } = useNotificationStats();

  // Handle selection
  const handleSelect = (id: number, selected: boolean) => {
    const newSelected = new Set(selectedIds);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map(n => n.id)));
    }
  };

  // Handle actions
  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id);
      toast.success('Notification marked as read');
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleArchive = async (id: number) => {
    try {
      await archiveNotification(id);
      toast.success('Notification archived');
    } catch (error) {
      toast.error('Failed to archive notification');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id);
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  // Handle bulk actions
  const handleBulkMarkAsRead = async () => {
    try {
      await bulkMarkAsRead(Array.from(selectedIds));
      setSelectedIds(new Set());
      toast.success(`${selectedIds.size} notifications marked as read`);
    } catch (error) {
      toast.error('Failed to mark notifications as read');
    }
  };

  const handleBulkArchive = async () => {
    try {
      await bulkArchive(Array.from(selectedIds));
      setSelectedIds(new Set());
      toast.success(`${selectedIds.size} notifications archived`);
    } catch (error) {
      toast.error('Failed to archive notifications');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} notifications?`)) {
      return;
    }

    try {
      await bulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
      toast.success(`${selectedIds.size} notifications deleted`);
    } catch (error) {
      toast.error('Failed to delete notifications');
    }
  };

  const handleResetFilters = () => {
    setFilters({ archived: false });
    setPage(1);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Bell className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-sm text-gray-600">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
          </div>

          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="flex gap-4 mt-4">
            <div className="bg-white p-3 rounded-lg border">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{stats.unread}</div>
              <div className="text-xs text-blue-600">Unread</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
              <div className="text-xs text-red-600">Critical</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <NotificationFiltersComponent
            filters={filters}
            onFiltersChange={setFilters}
            onReset={handleResetFilters}
          />
        </div>

        {/* Notifications List */}
        <div className="lg:col-span-3">
          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  {selectedIds.size} selected
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleBulkMarkAsRead}>
                    <Check className="h-4 w-4 mr-1" />
                    Mark as read
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleBulkArchive}>
                    <Archive className="h-4 w-4 mr-1" />
                    Archive
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkDelete}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Select All */}
          {notifications.length > 0 && (
            <div className="mb-4">
              <Button size="sm" variant="ghost" onClick={handleSelectAll}>
                {selectedIds.size === notifications.length ? 'Deselect all' : 'Select all'}
              </Button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading notifications...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-600">{error}</p>
              <Button onClick={refresh} variant="outline" size="sm" className="mt-2">
                Try again
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && notifications.length === 0 && (
            <div className="text-center py-12">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-600">
                {Object.keys(filters).length > 1
                  ? 'No notifications match your filters'
                  : "You're all caught up!"}
              </p>
            </div>
          )}

          {/* Notifications List */}
          {!loading && !error && notifications.length > 0 && (
            <div className="space-y-3">
              {notifications.map(notification => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                  onSelect={handleSelect}
                  selected={selectedIds.has(notification.id)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
