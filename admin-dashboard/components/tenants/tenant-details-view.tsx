'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { 
  Building2, 
  Users, 
  Calendar, 
  Settings, 
  Activity,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Database,
  Zap
} from 'lucide-react';

interface TenantDetailsProps {
  tenantId: string;
}

interface TenantDetails {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  status: string;
  joindate: string;
  subscription?: {
    tier_id: string;
    tier_name: string;
    status: string;
    billing_cycle: string;
    trial_ends_at?: string;
    next_billing_date?: string;
    usage_percentage: {
      patients: number;
      users: number;
      storage: number;
      api_calls: number;
    };
    current_usage: {
      patients_count: number;
      users_count: number;
      storage_used_gb: number;
      api_calls_count: number;
    };
    limits: {
      max_patients: number;
      max_users: number;
      storage_gb: number;
      api_calls_per_day: number;
    };
    warnings: string[];
    recommendations: string[];
  };
  billing?: {
    total_revenue: number;
    pending_amount: number;
    overdue_amount: number;
    recent_invoices: any[];
    recent_payments: any[];
  };
  usage_trends?: {
    metric_type: string;
    current_value: number;
    previous_value: number;
    change_percentage: number;
    trend: 'up' | 'down' | 'stable';
  }[];
}

export function TenantDetailsView({ tenantId }: TenantDetailsProps) {
  const [tenant, setTenant] = useState<TenantDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchTenantDetails();
  }, [tenantId]);

  const fetchTenantDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch basic tenant data
      const tenantResponse = await api.get(`/api/tenants/${tenantId}`);
      const tenantData = tenantResponse.data;
      
      // Fetch subscription and usage data
      const subscriptionResponse = await api.get(`/api/usage/tenant/${tenantId}/report`);
      const subscription = subscriptionResponse.data.report;
      
      // Fetch usage trends
      const trendsResponse = await api.get(`/api/usage/tenant/${tenantId}/trends`);
      const usage_trends = trendsResponse.data.trends;
      
      // Fetch billing data
      const billingResponse = await api.get(`/api/billing/invoices/${tenantId}`);
      const invoices = billingResponse.data.invoices || [];
      
      const paymentsResponse = await api.get(`/api/billing/payments`);
      const allPayments = paymentsResponse.data.payments || [];
      const tenantPayments = allPayments.filter((p: any) => p.tenant_id === tenantId);
      
      const billing = {
        total_revenue: tenantPayments.reduce((sum: number, p: any) => sum + (p.status === 'success' ? p.amount : 0), 0),
        pending_amount: invoices.filter((inv: any) => inv.status === 'pending').reduce((sum: number, inv: any) => sum + inv.amount, 0),
        overdue_amount: invoices.filter((inv: any) => inv.status === 'overdue').reduce((sum: number, inv: any) => sum + inv.amount, 0),
        recent_invoices: invoices.slice(0, 5),
        recent_payments: tenantPayments.slice(0, 5)
      };
      
      setTenant({
        ...tenantData,
        subscription,
        billing,
        usage_trends
      });
    } catch (error) {
      console.error('Error fetching tenant details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'trial': return 'bg-blue-500';
      case 'suspended': return 'bg-yellow-500';
      case 'inactive': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'premium': return 'bg-purple-500';
      case 'advanced': return 'bg-blue-500';
      case 'basic': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default: return <div className="h-4 w-4 bg-gray-300 rounded-full" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Tenant not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}     
 <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{tenant.name}</h1>
          <p className="text-gray-600 mt-1">{tenant.email}</p>
        </div>
        <Badge className={getStatusColor(tenant.status)}>
          {tenant.status}
        </Badge>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'users', 'billing', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Hospital Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Hospital Name</Label>
                  <p className="text-sm">{tenant.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <p className="text-sm">{tenant.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge className={getStatusColor(tenant.status)}>
                    {tenant.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Join Date</Label>
                  <p className="text-sm">{new Date(tenant.joindate).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Additional cards can be added here */}
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <p>User management content will be implemented here.</p>
          </div>
        )}

        {activeTab === 'billing' && (
          <div>
            <p>Billing information will be implemented here.</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <p>Settings content will be implemented here.</p>
          </div>
        )}
      </div>
    </div>
  );
}