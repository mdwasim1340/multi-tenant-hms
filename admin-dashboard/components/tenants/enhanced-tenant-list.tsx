'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import api from '@/lib/api';
import { 
  Plus, 
  Search, 
  Building2, 
  Users, 
  Calendar, 
  CreditCard,
  Activity,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { SubdomainDisplay } from '@/components/subdomain/subdomain-display';

interface Tenant {
  id: string;
  name: string;
  email: string;
  status: string;
  joindate: string;
  subdomain?: string;
  subscription?: {
    tier_id: string;
    tier_name: string;
    status: string;
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
  };
  billing?: {
    pending_amount: number;
    overdue_invoices: number;
    last_payment_date?: string;
  };
}

export function EnhancedTenantList() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      
      // Fetch basic tenant data
      const tenantsResponse = await api.get('/api/tenants');
      const tenantsData = tenantsResponse.data;
      
      // Enhance with subscription and usage data
      const enhancedTenants = await Promise.all(
        tenantsData.map(async (tenant: any) => {
          try {
            // Get subscription with usage data
            const subscriptionResponse = await api.get(`/api/usage/tenant/${tenant.id}/report`);
            const subscription = subscriptionResponse.data.report;
            
            // Get billing data
            const billingResponse = await api.get(`/api/billing/invoices/${tenant.id}`);
            const invoices = billingResponse.data.invoices || [];
            
            const pendingInvoices = invoices.filter((inv: any) => inv.status === 'pending');
            const overdueInvoices = invoices.filter((inv: any) => inv.status === 'overdue');
            const paidInvoices = invoices.filter((inv: any) => inv.status === 'paid');
            
            return {
              ...tenant,
              subscription,
              billing: {
                pending_amount: pendingInvoices.reduce((sum: number, inv: any) => sum + inv.amount, 0),
                overdue_invoices: overdueInvoices.length,
                last_payment_date: paidInvoices[0]?.paid_at
              }
            };
          } catch (error) {
            console.error(`Error fetching data for tenant ${tenant.id}:`, error);
            return tenant;
          }
        })
      );
      
      setTenants(enhancedTenants);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tenant.subdomain && tenant.subdomain.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tenants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tenants (name, email, subdomain)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchTenants}>
            Refresh
          </Button>
          <Link href="/tenants/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Tenant
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredTenants.map((tenant) => (
          <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-gray-500" />
                  <div>
                    <CardTitle className="text-lg">{tenant.name}</CardTitle>
                    <p className="text-sm text-gray-600">{tenant.email}</p>
                    {tenant.subdomain && (
                      <div className="mt-1">
                        <SubdomainDisplay 
                          subdomain={tenant.subdomain}
                          variant="badge"
                          showCopyButton={false}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <Badge className={getStatusColor(tenant.status)}>
                    {tenant.status}
                  </Badge>
                  {tenant.subscription && (
                    <Badge className={getTierColor(tenant.subscription.tier_id)}>
                      {tenant.subscription.tier_name}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Usage Overview */}
              {tenant.subscription && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Usage Overview</span>
                    <span className="text-xs text-gray-500">This Month</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Patients</span>
                        <span className={getUsageColor(tenant.subscription.usage_percentage.patients)}>
                          {tenant.subscription.usage_percentage.patients.toFixed(0)}%
                        </span>
                      </div>
                      <Progress 
                        value={tenant.subscription.usage_percentage.patients} 
                        className="h-1"
                      />
                      <div className="text-gray-500 mt-1">
                        {tenant.subscription.current_usage.patients_count}/
                        {tenant.subscription.limits.max_patients === -1 ? '∞' : tenant.subscription.limits.max_patients}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Users</span>
                        <span className={getUsageColor(tenant.subscription.usage_percentage.users)}>
                          {tenant.subscription.usage_percentage.users.toFixed(0)}%
                        </span>
                      </div>
                      <Progress 
                        value={tenant.subscription.usage_percentage.users} 
                        className="h-1"
                      />
                      <div className="text-gray-500 mt-1">
                        {tenant.subscription.current_usage.users_count}/
                        {tenant.subscription.limits.max_users === -1 ? '∞' : tenant.subscription.limits.max_users}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Billing Status */}
              {tenant.billing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Billing Status</span>
                    {tenant.billing.overdue_invoices > 0 ? (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Pending</span>
                      <p className="font-medium">
                        {formatCurrency(tenant.billing.pending_amount)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Overdue</span>
                      <p className="font-medium text-red-600">
                        {tenant.billing.overdue_invoices} invoices
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2 text-xs border-t pt-3">
                <div className="text-center">
                  <Users className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                  <p className="font-medium">{tenant.subscription?.current_usage.users_count || 0}</p>
                  <p className="text-gray-500">Users</p>
                </div>
                <div className="text-center">
                  <Activity className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                  <p className="font-medium">{tenant.subscription?.current_usage.api_calls_count || 0}</p>
                  <p className="text-gray-500">API Calls</p>
                </div>
                <div className="text-center">
                  <Calendar className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                  <p className="font-medium">
                    {new Date(tenant.joindate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-gray-500">Joined</p>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t flex space-x-2">
                <Link href={`/tenants/${tenant.id}`} className="flex-1">
                  <Button variant="outline" className="w-full" size="sm">
                    View Details
                  </Button>
                </Link>
                <Link href={`/billing/tenant/${tenant.id}`}>
                  <Button variant="outline" size="sm">
                    <CreditCard className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTenants.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No tenants found</p>
          <p className="text-sm text-gray-500 mt-2">
            {searchQuery ? 'Try adjusting your search terms' : 'Get started by adding your first tenant'}
          </p>
        </div>
      )}
    </div>
  );
}