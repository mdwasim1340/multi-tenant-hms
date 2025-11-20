/**
 * Notification Card Component
 * Team: Epsilon
 * Purpose: Display individual notification with actions
 */

'use client';

import { Notification, getNotificationTypeIcon, getNotificationPriorityColor, formatTimeAgo } from '@/lib/types/notification';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Check, Archive, Trash2, Eye } from 'lucide-react';

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead?: (id: number) => void;
  onArchive?: (id: number) => void;
  onDelete?: (id: number) => void;
  onSelect?: (id: number, selected: boolean) => void;
  selected?: boolean;
  showActions?: boolean;
}

export function NotificationCard({
  notification,
  onMarkAsRead,
  onArchive,
  onDelete,
  onSelect,
  selected = false,
  showActions = true,
}: NotificationCardProps) {
  const isUnread = !notification.read_at;
  const isArchived = !!notification.archived_at;

  const priorityColor = getNotificationPriorityColor(notification.priority);
  const typeIcon = getNotificationTypeIcon(notification.type);

  return (
    <Card
      className={`p-4 transition-all ${
        isUnread ? 'bg-blue-50 border-blue-200' : 'bg-white'
      } ${selected ? 'ring-2 ring-blue-500' : ''} ${
        isArchived ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox for selection */}
        {onSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(notification.id, e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        )}

        {/* Icon */}
        <div className="flex-shrink-0 text-2xl">{typeIcon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <h3 className={`text-sm font-semibold ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                {notification.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`text-xs ${priorityColor}`}>
                  {notification.priority}
                </Badge>
                <span className="text-xs text-gray-500">
                  {formatTimeAgo(notification.created_at)}
                </span>
              </div>
            </div>

            {/* Unread indicator */}
            {isUnread && (
              <div className="flex-shrink-0">
                <div className="h-2 w-2 rounded-full bg-blue-600"></div>
              </div>
            )}
          </div>

          {/* Message */}
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {notification.message}
          </p>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center gap-2">
              {isUnread && onMarkAsRead && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onMarkAsRead(notification.id)}
                  className="h-8 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark as read
                </Button>
              )}

              {!isArchived && onArchive && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onArchive(notification.id)}
                  className="h-8 text-xs"
                >
                  <Archive className="h-3 w-3 mr-1" />
                  Archive
                </Button>
              )}

              {onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(notification.id)}
                  className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              )}

              {isUnread && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs ml-auto"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View details
                </Button>
              )}
            </div>
          )}

          {/* Archived badge */}
          {isArchived && (
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                Archived
              </Badge>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
