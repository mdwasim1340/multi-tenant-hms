'use client';

import { Notification } from '@/lib/types/notification';
import { formatTimeAgo, getPriorityColor, getTypeIcon } from '@/lib/types/notification';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface CriticalAlertCardProps {
  notification: Notification;
  onAcknowledge?: (id: number) => void;
  onDismiss?: (id: number) => void;
  acknowledged?: boolean;
}

export function CriticalAlertCard({
  notification,
  onAcknowledge,
  onDismiss,
  acknowledged = false,
}: CriticalAlertCardProps) {
  const priorityColor = getPriorityColor(notification.priority);
  const typeIcon = getTypeIcon(notification.type);

  return (
    <Card
      className={`p-4 border-l-4 ${
        acknowledged
          ? 'border-l-green-500 bg-green-50'
          : 'border-l-red-500 bg-red-50 animate-pulse'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Alert Icon & Content */}
        <div className="flex items-start gap-3 flex-1">
          {/* Priority Icon */}
          <div className={`p-2 rounded-full ${acknowledged ? 'bg-green-100' : 'bg-red-100'}`}>
            {acknowledged ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-red-600" />
            )}
          </div>

          {/* Alert Details */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{typeIcon}</span>
              <Badge variant={acknowledged ? 'secondary' : 'destructive'}>
                {notification.priority.toUpperCase()}
              </Badge>
              {acknowledged && (
                <Badge variant="outline" className="bg-green-100 text-green-700">
                  Acknowledged
                </Badge>
              )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-lg mb-1">{notification.title}</h3>

            {/* Message */}
            <p className="text-gray-700 mb-3">{notification.message}</p>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formatTimeAgo(notification.created_at)}</span>
              </div>
              {notification.data?.location && (
                <span>📍 {notification.data.location}</span>
              )}
              {notification.data?.patient_name && (
                <span>👤 {notification.data.patient_name}</span>
              )}
            </div>

            {/* Additional Data */}
            {notification.data && Object.keys(notification.data).length > 0 && (
              <div className="mt-3 p-3 bg-white rounded border">
                <p className="text-sm font-medium mb-2">Alert Details:</p>
                <div className="space-y-1 text-sm">
                  {notification.data.vital_signs && (
                    <div>
                      <span className="font-medium">Vital Signs:</span>{' '}
                      {notification.data.vital_signs}
                    </div>
                  )}
                  {notification.data.medication && (
                    <div>
                      <span className="font-medium">Medication:</span>{' '}
                      {notification.data.medication}
                    </div>
                  )}
                  {notification.data.reason && (
                    <div>
                      <span className="font-medium">Reason:</span> {notification.data.reason}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {!acknowledged && onAcknowledge && (
            <Button
              onClick={() => onAcknowledge(notification.id)}
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Acknowledge
            </Button>
          )}
          {onDismiss && (
            <Button
              onClick={() => onDismiss(notification.id)}
              variant="outline"
              size="sm"
            >
              Dismiss
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
