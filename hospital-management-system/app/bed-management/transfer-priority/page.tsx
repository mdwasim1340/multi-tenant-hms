'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

export default function TransferPriorityPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Transfer Priority Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage and prioritize patient transfer requests
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Transfer Priority Queue
          </CardTitle>
          <CardDescription>
            View and manage patient transfer requests by priority level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Transfer priority management system coming soon
            </p>
            <Badge variant="outline" className="mt-4">
              Under Development
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
