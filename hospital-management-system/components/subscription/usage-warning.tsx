'use client';

import { useSubscription } from '@/hooks/use-subscription';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface UsageWarningProps {
  limit: 'max_patients' | 'max_users' | 'storage_gb' | 'api_calls_per_day';
  threshold?: number; // Show warning at this percentage (default 80%)
}

export function UsageWarning({ limit, threshold = 80 }: UsageWarningProps) {
  const { getUsagePercentage, subscription, loading } = useSubscription();

  if (loading) {
    return null; // Don't show anything while loading
  }

  const percentage = getUsagePercentage(limit);

  if (percentage < threshold) {
    return null;
  }

  const getLimitLabel = () => {
    switch (limit) {
      case 'max_patients': return 'Patient';
      case 'max_users': return 'User';
      case 'storage_gb': return 'Storage';
      case 'api_calls_per_day': return 'API Call';
    }
  };

  const isNearLimit = percentage >= 90;

  return (
    <Alert variant={isNearLimit ? 'destructive' : 'default'} className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        {isNearLimit ? 'Limit Almost Reached' : 'Approaching Limit'}
      </AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>
          You've used {percentage.toFixed(0)}% of your {getLimitLabel()} limit.
          {isNearLimit && ' Please upgrade your plan to continue.'}
        </span>
        <Link href="/subscription/upgrade">
          <Button size="sm" variant={isNearLimit ? 'default' : 'outline'}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Upgrade
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
}
