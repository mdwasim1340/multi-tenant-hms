'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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

            {/* Subscription Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Subscription</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Current Plan</Label>
                  <div className="flex items-center space-x-2">
                    <Badge className={getTierColor(tenant.subscription?.tier_name || 'basic')}>
                      {tenant.subscription?.tier_name || 'Basic'}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => setActiveTab('billing')}>
                      Upgrade
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge className={getStatusColor(tenant.subscription?.status || 'active')}>
                    {tenant.subscription?.status || 'Active'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Billing Cycle</Label>
                  <p className="text-sm capitalize">{tenant.subscription?.billing_cycle || 'Monthly'}</p>
                </div>
                {tenant.subscription?.next_billing_date && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Next Billing</Label>
                    <p className="text-sm">{new Date(tenant.subscription.next_billing_date).toLocaleDateString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Usage Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Usage Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tenant.subscription?.current_usage && (
                  <>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Patients</span>
                        <span className={getUsageColor(tenant.subscription.usage_percentage?.patients || 0)}>
                          {tenant.subscription.current_usage.patients_count} / {tenant.subscription.limits?.max_patients === -1 ? '∞' : tenant.subscription.limits?.max_patients}
                        </span>
                      </div>
                      <Progress value={tenant.subscription.usage_percentage?.patients || 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Users</span>
                        <span className={getUsageColor(tenant.subscription.usage_percentage?.users || 0)}>
                          {tenant.subscription.current_usage.users_count} / {tenant.subscription.limits?.max_users === -1 ? '∞' : tenant.subscription.limits?.max_users}
                        </span>
                      </div>
                      <Progress value={tenant.subscription.usage_percentage?.users || 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Storage</span>
                        <span className={getUsageColor(tenant.subscription.usage_percentage?.storage || 0)}>
                          {tenant.subscription.current_usage.storage_used_gb}GB / {tenant.subscription.limits?.storage_gb === -1 ? '∞' : tenant.subscription.limits?.storage_gb + 'GB'}
                        </span>
                      </div>
                      <Progress value={tenant.subscription.usage_percentage?.storage || 0} className="h-2" />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Warnings & Alerts */}
            {tenant.subscription?.warnings && tenant.subscription.warnings.length > 0 && (
              <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <span>Alerts & Warnings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {tenant.subscription.warnings.map((warning, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-yellow-800">{warning}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Usage Trends */}
            {tenant.usage_trends && tenant.usage_trends.length > 0 && (
              <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Usage Trends</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {tenant.usage_trends.map((trend, index) => (
                      <div key={index} className="text-center p-4 border rounded-lg">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          {getTrendIcon(trend.trend)}
                          <span className="text-sm font-medium capitalize">{trend.metric_type.replace('_', ' ')}</span>
                        </div>
                        <p className="text-2xl font-bold">{trend.current_value}</p>
                        <p className={`text-sm ${trend.change_percentage > 0 ? 'text-green-600' : trend.change_percentage < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {trend.change_percentage > 0 ? '+' : ''}{trend.change_percentage}% from last period
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <p>User management content will be implemented here.</p>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-6">
            {/* Subscription Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Subscription Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Basic Plan */}
                  <div className={`p-4 border rounded-lg ${tenant.subscription?.tier_name === 'Basic' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                    <h3 className="font-semibold">Basic</h3>
                    <p className="text-2xl font-bold">₹4,999<span className="text-sm font-normal">/month</span></p>
                    <ul className="text-sm space-y-1 mt-2">
                      <li>• Up to 500 patients</li>
                      <li>• 5 users</li>
                      <li>• Basic features</li>
                    </ul>
                    <Button 
                      className="w-full mt-3" 
                      variant={tenant.subscription?.tier_name === 'Basic' ? 'default' : 'outline'}
                      disabled={tenant.subscription?.tier_name === 'Basic'}
                    >
                      {tenant.subscription?.tier_name === 'Basic' ? 'Current Plan' : 'Downgrade'}
                    </Button>
                  </div>

                  {/* Advanced Plan */}
                  <div className={`p-4 border rounded-lg ${tenant.subscription?.tier_name === 'Advanced' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                    <h3 className="font-semibold">Advanced</h3>
                    <p className="text-2xl font-bold">₹14,999<span className="text-sm font-normal">/month</span></p>
                    <ul className="text-sm space-y-1 mt-2">
                      <li>• Up to 2,000 patients</li>
                      <li>• 25 users</li>
                      <li>• Advanced features</li>
                      <li>• 10GB storage</li>
                    </ul>
                    <Button 
                      className="w-full mt-3" 
                      variant={tenant.subscription?.tier_name === 'Advanced' ? 'default' : 'outline'}
                      disabled={tenant.subscription?.tier_name === 'Advanced'}
                    >
                      {tenant.subscription?.tier_name === 'Advanced' ? 'Current Plan' : 'Select Plan'}
                    </Button>
                  </div>

                  {/* Premium Plan */}
                  <div className={`p-4 border rounded-lg ${tenant.subscription?.tier_name === 'Premium' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                    <h3 className="font-semibold">Premium</h3>
                    <p className="text-2xl font-bold">₹29,999<span className="text-sm font-normal">/month</span></p>
                    <ul className="text-sm space-y-1 mt-2">
                      <li>• Unlimited patients</li>
                      <li>• Unlimited users</li>
                      <li>• All features</li>
                      <li>• Unlimited storage</li>
                    </ul>
                    <Button 
                      className="w-full mt-3" 
                      variant={tenant.subscription?.tier_name === 'Premium' ? 'default' : 'outline'}
                      disabled={tenant.subscription?.tier_name === 'Premium'}
                    >
                      {tenant.subscription?.tier_name === 'Premium' ? 'Current Plan' : 'Upgrade'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Billing Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(tenant.billing?.total_revenue || 0)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">All time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pending Amount</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-yellow-600">
                    {formatCurrency(tenant.billing?.pending_amount || 0)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Awaiting payment</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Overdue Amount</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-600">
                    {formatCurrency(tenant.billing?.overdue_amount || 0)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Past due</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Invoices */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                {tenant.billing?.recent_invoices && tenant.billing.recent_invoices.length > 0 ? (
                  <div className="space-y-2">
                    {tenant.billing.recent_invoices.map((invoice: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">Invoice #{invoice.id}</p>
                          <p className="text-sm text-gray-600">{new Date(invoice.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(invoice.amount)}</p>
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No invoices found</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Backup Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Backup Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Automatic Backups</h3>
                    <p className="text-sm text-gray-600">Based on your subscription tier</p>
                  </div>
                  <Button 
                    onClick={async () => {
                      try {
                        await api.post(`/api/backups/create`, {
                          tenant_id: tenantId,
                          backup_type: 'full',
                          storage_tier: 's3_standard'
                        });
                        alert('Backup created successfully!');
                      } catch (error) {
                        alert('Failed to create backup');
                      }
                    }}
                  >
                    Create Backup Now
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">0</p>
                    <p className="text-sm text-gray-600">Total Backups</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">0</p>
                    <p className="text-sm text-gray-600">Successful</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-600">Never</p>
                    <p className="text-sm text-gray-600">Last Backup</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tenant Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Tenant Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Status</h3>
                    <p className="text-sm text-gray-600">Current tenant status</p>
                  </div>
                  <Badge className={getStatusColor(tenant.status)}>
                    {tenant.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <h3 className="font-medium text-red-600">Danger Zone</h3>
                    <p className="text-sm text-gray-600">Irreversible actions</p>
                  </div>
                  <div className="space-x-2">
                    <Button variant="outline" className="text-yellow-600 border-yellow-600">
                      Suspend Tenant
                    </Button>
                    <Button variant="outline" className="text-red-600 border-red-600">
                      Delete Tenant
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API Access */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>API Access</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">API Calls Today</h3>
                    <p className="text-sm text-gray-600">Current usage</p>
                  </div>
                  <p className="text-2xl font-bold">{tenant.subscription?.current_usage?.api_calls_count || 0}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Daily Limit</h3>
                    <p className="text-sm text-gray-600">Based on subscription</p>
                  </div>
                  <p className="text-lg font-medium">
                    {tenant.subscription?.limits?.api_calls_per_day === -1 ? 'Unlimited' : tenant.subscription?.limits?.api_calls_per_day || 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}