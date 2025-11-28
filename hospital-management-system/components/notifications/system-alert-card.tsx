'use client';

import { Notification } from '@/lib/types/notification';
import { formatTimeAgo, getNotificationTypeIcon } from '@/lib/types/notification';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, AlertCircle, Server, X } from 'lucide-react';

interface SystemAlertCardProps {
  notification: Notification;
  onDismiss?: (id: number) => void;
  dismissed?: boolean;
}

export function SystemAlertCard({
  notification,
  onDismiss,
  dismissed = false,
}: SystemAlertCardProps) {
  const typeIcon = getNotificationTypeIcon(notification.type);

  // Determine alert severity based on type
  const getSeverityColor = () => {
    if (notification.type === 'system_error') return 'border-l-red-500 bg-red-50';
    if (notification.type === 'system_warning') return 'border-l-yellow-500 bg-yellow-50';
    return 'border-l-blue-500 bg-blue-50';
  };

  const getSeverityIcon = () => {
    if (notification.type === 'system_error')
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    if (notification.type === 'system_warning')
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    return <Info className="h-5 w-5 text-blue-600" />;
  };

  return (
    <Card
      className={`p-4 border-l-4 ${
        dismissed ? 'opacity-50 bg-gray-50' : getSeverityColor()
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Alert Icon & Content */}
        <div className="flex items-start gap-3 flex-1">
          {/* System Icon */}
          <div
            className={`p-2 rounded-full ${
              dismissed
                ? 'bg-gray-100'
                : notification.type === 'system_error'
                ? 'bg-red-100'
                : notification.type === 'system_warning'
                ? 'bg-yellow-100'
                : 'bg-blue-100'
            }`}
          >
            {dismissed ? <X className="h-5 w-5 text-gray-600" /> : getSeverityIcon()}
          </div>

          {/* Alert Details */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{typeIcon}</span>
              <Badge
                variant={
                  notification.type === 'system_error'
                    ? 'destructive'
                    : notification.type === 'system_warning'
                    ? 'default'
                    : 'secondary'
                }
              >
                {notification.type.replace('_', ' ').toUpperCase()}
              </Badge>
              {dismissed && (
                <Badge variant="outline" className="bg-gray-100 text-gray-700">
                  Dismissed
                </Badge>
              )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-base mb-1">{notification.title}</h3>

            {/* Message */}
            <p className="text-gray-700 text-sm mb-2">{notification.message}</p>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Server className="h-3 w-3" />
                <span>{formatTimeAgo(notification.created_at)}</span>
              </div>
              {notification.data?.component && (
                <span>🔧 {notification.data.component}</span>
              )}
              {notification.data?.affected_users && (
                <span>👥 {notification.data.affected_users} users affected</span>
              )}
            </div>

            {/* System Details */}
            {notification.data && Object.keys(notification.data).length > 0 && (
              <div className="mt-3 p-2 bg-white rounded border text-xs">
                <p className="font-medium mb-1">System Details:</p>
                <div className="space-y-1">
                  {notification.data.error_code && (
                    <div>
                      <span className="font-medium">Error Code:</span>{' '}
                      <code className="bg-gray-100 px-1 rounded">
                        {notification.data.error_code}
                      </code>
                    </div>
                  )}
                  {notification.data.service && (
                    <div>
                      <span className="font-medium">Service:</span> {notification.data.service}
                    </div>
                  )}
                  {notification.data.resolution && (
                    <div>
                      <span className="font-medium">Resolution:</span>{' '}
                      {notification.data.resolution}
                    </div>
                  )}
                  {notification.data.eta && (
                    <div>
                      <span className="font-medium">ETA:</span> {notification.data.eta}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {!dismissed && onDismiss && (
          <Button onClick={() => onDismiss(notification.id)} variant="ghost" size="sm">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}
