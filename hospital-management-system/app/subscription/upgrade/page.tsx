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
    price: 99,
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
    price: 299,
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
    price: 599,
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
    // This would typically redirect to a billing provider like Stripe
    // For now, it will link to a placeholder page or just log to console.
    console.log(`Redirecting to external billing for tier: ${tierId}`);
    window.location.href = '/billing/placeholder'; // Placeholder URL
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
                <span className="text-4xl font-bold">${tier.price.toLocaleString('en-US')}</span>
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
