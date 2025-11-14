'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { api } from '@/lib/api';

// --- Mock Data ---
const mockTiers = {
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 99,
    currency: 'USD',
    features: {
      patients: true,
      appointments: true,
      medical_records: false,
      custom_fields: false,
      file_storage: false,
      mobile_app: false,
      api_access: false,
      custom_branding: false,
    },
    limits: {
      max_patients: 500,
      max_users: 5,
      storage_gb: 0,
      api_calls_per_day: 0,
    },
  },
  advanced: {
    id: 'advanced',
    name: 'Advanced',
    price: 299,
    currency: 'USD',
    features: {
      patients: true,
      appointments: true,
      medical_records: true,
      custom_fields: true,
      file_storage: true,
      mobile_app: true,
      api_access: false,
      custom_branding: false,
    },
    limits: {
      max_patients: 2000,
      max_users: 25,
      storage_gb: 10,
      api_calls_per_day: 1000,
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 599,
    currency: 'USD',
    features: {
        patients: true,
        appointments: true,
        medical_records: true,
        custom_fields: true,
        file_storage: true,
        mobile_app: true,
        api_access: true,
        custom_branding: true,
    },
    limits: {
      max_patients: -1, // Unlimited
      max_users: -1, // Unlimited
      storage_gb: -1, // Unlimited
      api_calls_per_day: -1, // Unlimited
    },
  },
};

const mockUsage = {
    patients_count: 450,
    users_count: 4,
    storage_used_gb: 0,
    api_calls_today: 0,
};

const mockWarnings = ['Approaching patient limit'];


// --- Interfaces ---
export interface SubscriptionTier {
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

// --- Provider ---
export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    setLoading(true);
    
    try {
      const response = await api.get('/api/subscriptions/current');
      setSubscription(response.data);
    } catch (error) {
      console.warn('⚠️  Subscription API error, using default basic tier');
      const currentTier = 'basic';
      const mockData: SubscriptionData = {
        tier: mockTiers[currentTier],
        usage: mockUsage,
        warnings: mockUsage.patients_count > mockTiers[currentTier].limits.max_patients * 0.8 ? mockWarnings : [],
      };
      setSubscription(mockData);
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

    if (maxLimit === 0) return 100; // If limit is 0, any usage is 100%
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

// --- Hook ---
export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
}
