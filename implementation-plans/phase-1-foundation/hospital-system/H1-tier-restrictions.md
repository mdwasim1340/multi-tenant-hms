# H1: Subscription Tier Restrictions

**Agent:** Hospital System Agent H1  
**Track:** Hospital System  
**Dependencies:** A1 (Subscription Tier System)  
**Estimated Time:** 2-3 days  
**Complexity:** Low-Medium

## Objective
Implement feature restrictions in the hospital management system based on subscription tiers, with user-friendly upgrade prompts and usage limit warnings.

## Current State Analysis
- ✅ Subscription tier system implemented (A1)
- ✅ Feature flag middleware exists
- ✅ Hospital management system ready
- ❌ No tier restrictions in UI
- ❌ No upgrade prompts
- ❌ No usage limit warnings

## Implementation Steps

### Step 1: Subscription Context Hook (Day 1)
Create React hook to access subscription information.

**File:** `hospital-management-system/hooks/use-subscription.ts`
```typescript
import { useState, useEffect, createContext, useContext } from 'react';
import { api } from '@/lib/api';

interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: {
    patients: boolean;
    appointments: boolean;
    medical_records: boolean;
    custom_fields: boolean;
    file_storage: boolean;
    mobile_app: boolean;
    api_access: boolean;
    custom_branding: boolean;
  };
  limits: {
    max_patients: number;
    max_users: number;
    storage_gb: number;
    api_calls_per_day: number;
  };
}

interface SubscriptionData {
  tier: SubscriptionTier;
  usage: {
    patients_count: number;
    users_count: number;
    storage_used_gb: number;
    api_calls_today: number;
  };
  warnings: string[];
}

interface SubscriptionContextType {
  subscription: SubscriptionData | null;
  loading: boolean;
  hasFeature: (feature: keyof SubscriptionTier['features']) => boolean;
  isWithinLimit: (limit: keyof SubscriptionTier['limits'], current: number) => boolean;
  getUsagePercentage: (limit: keyof SubscriptionTier['limits']) => number;
  refetch: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/subscriptions/current');
      setSubscription(response.data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const hasFeature = (feature: keyof SubscriptionTier['features']): boolean => {
    return subscription?.tier.features[feature] || false;
  };

  const isWithinLimit = (limit: keyof SubscriptionTier['limits'], current: number): boolean => {
    if (!subscription) return false;
    const maxLimit = subscription.tier.limits[limit];
    if (maxLimit === -1) return true; // Unlimited
    return current < maxLimit;
  };

  const getUsagePercentage = (limit: keyof SubscriptionTier['limits']): number => {
    if (!subscription) return 0;
    const maxLimit = subscription.tier.limits[limit];
    if (maxLimit === -1) return 0; // Unlimited
    
    let current = 0;
    switch (limit) {
      case 'max_patients':
        current = subscription.usage.patients_count;
        break;
      case 'max_users':
        current = subscription.usage.users_count;
        break;
      case 'storage_gb':
        current = subscription.usage.storage_used_gb;
        break;
      case 'api_calls_per_day':
        current = subscription.usage.api_calls_today;
        break;
    }
    
    return (current / maxLimit) * 100;
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        hasFeature,
        isWithinLimit,
        getUsagePercentage,
        refetch: fetchSubscription
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
}
```

### Step 2: Feature Gate Component (Day 1)
Create component to restrict features based on subscription.

**File:** `hospital-management-system/components/subscription/feature-gate.tsx`
```typescript
'use client';

import { useSubscription } from '@/hooks/use-subscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, ArrowUpCircle } from 'lucide-react';
import Link from 'next/link';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { hasFeature, subscription } = useSubscription();

  if (hasFeature(feature as any)) {
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
```

### Step 3: Usage Limit Warning Component (Day 1)
Create component to show usage warnings.

**File:** `hospital-management-system/components/subscription/usage-warning.tsx`
```typescript
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
  const { getUsagePercentage, subscription } = useSubscription();
  
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
```

### Step 4: Upgrade Page (Day 2)
Create subscription upgrade page.

**File:** `hospital-management-system/app/subscription/upgrade/page.tsx`
```typescript
'use client';

import { useSubscription } from '@/hooks/use-subscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';

const tiers = [
  {
    id: 'basic',
    name: 'Basic',
    price: 4999,
    features: [
      { name: 'Up to 500 patients', included: true },
      { name: 'Up to 5 users', included: true },
      { name: 'Basic appointments', included: true },
      { name: 'Medical records', included: false },
      { name: 'Custom fields', included: false },
      { name: 'File storage', included: false },
      { name: 'Mobile app', included: false },
    ]
  },
  {
    id: 'advanced',
    name: 'Advanced',
    price: 14999,
    popular: true,
    features: [
      { name: 'Up to 2,000 patients', included: true },
      { name: 'Up to 25 users', included: true },
      { name: 'Advanced appointments', included: true },
      { name: 'Medical records', included: true },
      { name: 'Custom fields', included: true },
      { name: '10GB file storage', included: true },
      { name: 'Mobile app access', included: true },
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 29999,
    features: [
      { name: 'Unlimited patients', included: true },
      { name: 'Unlimited users', included: true },
      { name: 'All features', included: true },
      { name: 'Medical records', included: true },
      { name: 'Custom fields', included: true },
      { name: 'Unlimited storage', included: true },
      { name: 'White-label mobile app', included: true },
      { name: 'API access', included: true },
      { name: 'Custom branding', included: true },
    ]
  }
];

export default function UpgradePage() {
  const { subscription } = useSubscription();

  const handleUpgrade = (tierId: string) => {
    // TODO: Implement upgrade flow
    console.log('Upgrade to:', tierId);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Upgrade Your Plan</h1>
        <p className="text-gray-600">
          Choose the plan that best fits your hospital's needs
        </p>
        {subscription && (
          <Badge className="mt-2">
            Current Plan: {subscription.tier.name}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <Card
            key={tier.id}
            className={`relative ${
              tier.popular ? 'border-2 border-blue-500 shadow-lg' : ''
            }`}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500">Most Popular</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">{tier.name}</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">₹{tier.price.toLocaleString('en-IN')}</span>
                <span className="text-gray-600">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    {feature.included ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-gray-300" />
                    )}
                    <span className={feature.included ? '' : 'text-gray-400'}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={tier.popular ? 'default' : 'outline'}
                onClick={() => handleUpgrade(tier.id)}
                disabled={subscription?.tier.id === tier.id}
              >
                {subscription?.tier.id === tier.id ? 'Current Plan' : 'Upgrade'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### Step 5: Integration in Main Layout (Day 2)
Integrate subscription provider and usage warnings.

**File:** `hospital-management-system/app/layout.tsx` (update)
```typescript
import { SubscriptionProvider } from '@/hooks/use-subscription';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SubscriptionProvider>
          {children}
        </SubscriptionProvider>
      </body>
    </html>
  );
}
```

**Example Usage in Patient Page:**
```typescript
import { FeatureGate } from '@/components/subscription/feature-gate';
import { UsageWarning } from '@/components/subscription/usage-warning';

export default function PatientsPage() {
  return (
    <div>
      <UsageWarning limit="max_patients" />
      
      <FeatureGate feature="medical_records">
        <MedicalRecordsSection />
      </FeatureGate>
    </div>
  );
}
```

### Step 6: Backend Subscription Endpoint (Day 3)
Create endpoint to get current subscription with usage.

**File:** `backend/src/routes/subscriptions.ts` (add)
```typescript
// Get current subscription with usage
router.get('/current', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    
    // Get subscription
    const subscription = await subscriptionService.getTenantSubscription(tenantId);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Get tier details
    const tierResult = await pool.query(
      'SELECT * FROM subscription_tiers WHERE id = $1',
      [subscription.tier_id]
    );
    const tier = tierResult.rows[0];

    // Get current usage
    const usage = await usageService.getCurrentUsage(tenantId);

    // Generate warnings
    const warnings: string[] = [];
    if (usage) {
      const limits = subscription.usage_limits;
      
      if (limits.max_patients > 0 && usage.patients_count >= limits.max_patients * 0.8) {
        warnings.push('Approaching patient limit');
      }
      if (limits.max_users > 0 && usage.users_count >= limits.max_users * 0.8) {
        warnings.push('Approaching user limit');
      }
      if (limits.storage_gb > 0 && usage.storage_used_gb >= limits.storage_gb * 0.8) {
        warnings.push('Approaching storage limit');
      }
    }

    res.json({
      tier,
      usage: usage || {
        patients_count: 0,
        users_count: 0,
        storage_used_gb: 0,
        api_calls_today: 0
      },
      warnings
    });
  } catch (error) {
    console.error('Error fetching current subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});
```

### Step 7: Testing (Day 3)
Test tier restrictions and upgrade flow.

**Manual Testing:**
1. Login with different tier accounts
2. Verify feature gates work
3. Check usage warnings appear
4. Test upgrade page display
5. Verify limits enforced

## Validation Checklist

### Frontend
- [ ] Subscription context working
- [ ] Feature gates functional
- [ ] Usage warnings display
- [ ] Upgrade page renders
- [ ] Current tier shown correctly

### Backend
- [ ] Subscription endpoint returns data
- [ ] Usage calculations correct
- [ ] Warnings generated properly

### Integration
- [ ] Features locked correctly
- [ ] Warnings appear at thresholds
- [ ] Upgrade prompts shown
- [ ] Limits enforced

### Testing
- [ ] Can access allowed features
- [ ] Cannot access locked features
- [ ] Warnings show at 80% usage
- [ ] Upgrade page accessible

## Success Criteria
- Tier restrictions working
- Feature gates functional
- Usage warnings helpful
- Upgrade flow clear
- User experience smooth

## Next Steps
After completion, this enables:
- Proper feature monetization
- Usage-based upgrades
- Clear value proposition
- Revenue growth

## Notes for AI Agent
- Make restrictions user-friendly
- Provide clear upgrade paths
- Don't frustrate users
- Test with all tiers
- Ensure graceful degradation
- Make warnings helpful, not annoying
