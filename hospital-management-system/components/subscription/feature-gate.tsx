'use client';

import { useSubscription } from '@/hooks/use-subscription';
import type { SubscriptionTier } from '@/hooks/use-subscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, ArrowUpCircle } from 'lucide-react';
import Link from 'next/link';

interface FeatureGateProps {
  feature: keyof SubscriptionTier['features'];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { hasFeature, subscription, loading } = useSubscription();

  if (loading) {
    return <div>Loading...</div>; // Or a proper skeleton loader
  }

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Card className="border-2 border-dashed border-gray-300">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Lock className="h-5 w-5 text-gray-400" />
          <CardTitle className="text-gray-600">Feature Locked</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600">
          This feature is not available in your current plan ({subscription?.tier.name}).
        </p>
        <Link href="/subscription/upgrade">
          <Button>
            <ArrowUpCircle className="h-4 w-4 mr-2" />
            Upgrade Plan
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
