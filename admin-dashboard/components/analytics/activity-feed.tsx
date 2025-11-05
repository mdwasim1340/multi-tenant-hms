'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RecentEvent } from '@/lib/api/analytics';
import { formatDistanceToNow } from 'date-fns';

interface ActivityFeedProps {
  events: RecentEvent[];
  maxHeight?: string;
}

export function ActivityFeed({ events, maxHeight = '400px' }: ActivityFeedProps) {
  const getEventIcon = (type: string) => {
    if (type.includes('patient')) return '👤';
    if (type.includes('appointment')) return '📅';
    if (type.includes('user')) return '👥';
    if (type.includes('backup')) return '💾';
    return '📊';
  };

  const getEventColor = (type: string) => {
    if (type.includes('created')) return 'text-green-600';
    if (type.includes('updated')) return 'text-blue-600';
    if (type.includes('deleted')) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ height: maxHeight }}>
          <div className="space-y-4">
            {events.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No recent activity
              </p>
            ) : (
              events.map((event, index) => (
                <div key={index} className="flex items-start space-x-3 pb-3 border-b last:border-0">
                  <span className="text-2xl">{getEventIcon(event.type)}</span>
                  <div className="flex-1 space-y-1">
                    <p className={`text-sm font-medium ${getEventColor(event.type)}`}>
                      {event.type.replace(/\./g, ' ').replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {event.tenant_id}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
