/**
 * Notification Filters Component
 * Team: Epsilon
 * Purpose: Filter controls for notifications
 */

'use client';

import { NotificationFilters, NotificationType, NotificationPriority } from '@/lib/types/notification';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';

interface NotificationFiltersProps {
  filters: NotificationFilters;
  onFiltersChange: (filters: NotificationFilters) => void;
  onReset: () => void;
}

export function NotificationFiltersComponent({
  filters,
  onFiltersChange,
  onReset,
}: NotificationFiltersProps) {
  const hasActiveFilters = Object.keys(filters).some(key => filters[key as keyof NotificationFilters]);

  return (
    <div className="bg-white p-4 rounded-lg border space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onReset}
            className="h-8 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search notifications..."
          value={filters.search || ''}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value || undefined })}
          className="pl-10"
        />
      </div>

      {/* Type filter */}
      <div>
        <label className="text-xs font-medium text-gray-700 mb-1 block">Type</label>
        <Select
          value={filters.type || 'all'}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, type: value === 'all' ? undefined : (value as any) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value={NotificationType.CRITICAL_ALERT}>Critical Alert</SelectItem>
            <SelectItem value={NotificationType.APPOINTMENT_REMINDER}>Appointment Reminder</SelectItem>
            <SelectItem value={NotificationType.LAB_RESULT}>Lab Result</SelectItem>
            <SelectItem value={NotificationType.BILLING_UPDATE}>Billing Update</SelectItem>
            <SelectItem value={NotificationType.STAFF_SCHEDULE}>Staff Schedule</SelectItem>
            <SelectItem value={NotificationType.INVENTORY_ALERT}>Inventory Alert</SelectItem>
            <SelectItem value={NotificationType.SYSTEM_MAINTENANCE}>System Maintenance</SelectItem>
            <SelectItem value={NotificationType.GENERAL_INFO}>General Info</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Priority filter */}
      <div>
        <label className="text-xs font-medium text-gray-700 mb-1 block">Priority</label>
        <Select
          value={filters.priority || 'all'}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, priority: value === 'all' ? undefined : (value as any) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value={NotificationPriority.CRITICAL}>Critical</SelectItem>
            <SelectItem value={NotificationPriority.HIGH}>High</SelectItem>
            <SelectItem value={NotificationPriority.MEDIUM}>Medium</SelectItem>
            <SelectItem value={NotificationPriority.LOW}>Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Read status filter */}
      <div>
        <label className="text-xs font-medium text-gray-700 mb-1 block">Status</label>
        <Select
          value={
            filters.read === undefined
              ? 'all'
              : filters.read
              ? 'read'
              : 'unread'
          }
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              read: value === 'all' ? undefined : value === 'read',
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unread">Unread only</SelectItem>
            <SelectItem value="read">Read only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Archived filter */}
      <div>
        <label className="text-xs font-medium text-gray-700 mb-1 block">Archive</label>
        <Select
          value={
            filters.archived === undefined
              ? 'active'
              : filters.archived
              ? 'archived'
              : 'active'
          }
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              archived: value === 'active' ? false : value === 'archived' ? true : undefined,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Active only" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active only</SelectItem>
            <SelectItem value="archived">Archived only</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort */}
      <div>
        <label className="text-xs font-medium text-gray-700 mb-1 block">Sort by</label>
        <div className="flex gap-2">
          <Select
            value={filters.sort_by || 'created_at'}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, sort_by: value as any })
            }
          >
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Date</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.sort_order || 'desc'}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, sort_order: value as any })
            }
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest</SelectItem>
              <SelectItem value="asc">Oldest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
