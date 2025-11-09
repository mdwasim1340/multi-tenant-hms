'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';
import { 
  Building2, 
  Users, 
  Calendar, 
  Settings, 
  Activity,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  BarChart3,
  Globe,
  Edit2
} from 'lucide-react';
import Link from 'next/link';
import { SubdomainDisplay } from '@/components/subdomain/subdomain-display';

interface TenantDetails {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: string;
  joindate: string;
  phone?: string;
  address?: string;
  subdomain?: string;
  subscription?: {
    tier_id: string;
    tier_name: string;
    status: string;
    current_usage: {
      patients_count: number;
      users_count: number;
      storage_used_gb: number;
      api_calls_today: number;
    };
  };
  usage_stats?: {
    patients_count: number;
    users_count: number;
    storage_used_gb: number;
    api_calls_count: number;
  };
}

export default function TenantDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTenantDetails();
  }, [params.id]);

  const fetchTenantDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch basic tenant info
      const tenantResponse = await api.get(`/api/tenants`);
      const tenants = tenantResponse.data.tenants || tenantResponse.data || [];
      const tenantData = tenants.find((t: any) => t.id === params.id);
      
      if (!tenantData) {
        setError('Tenant not found');
        return;
      }

      // Try to fetch additional data (subscription, usage)
      try {
        const [subscriptionResponse, usageResponse] = await Promise.allSettled([
          api.get(`/api/subscriptions/tenant/${params.id}`),
          api.get(`/api/usage/tenant/${params.id}/current`)
        ]);

        let subscriptionData = null;
        let usageData = null;

        if (subscriptionResponse.status === 'fulfilled') {
          subscriptionData = subscriptionResponse.value.data.subscription;
        }

        if (usageResponse.status === 'fulfilled') {
          usageData = usageResponse.value.data.usage;
        }

        setTenant({
          ...tenantData,
          subscription: subscriptionData,
          usage_stats: usageData
        });
      } catch (additionalError) {
        // If additional data fails, just use basic tenant data
        setTenant(tenantData);
      }
    } catch (error: any) {
      console.error('Error fetching tenant details:', error);
      setError(error.response?.data?.error || 'Failed to fetch tenant details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-500 text-white';
      case 'suspended': return 'bg-yellow-500 text-white';
      case 'inactive': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'premium': return 'bg-purple-500 text-white';
      case 'advanced': return 'bg-blue-500 text-white';
      case 'basic': return 'bg-gray-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tenant details...</p>
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-600 mb-4">{error || 'Tenant not found'}</p>
          <Link href="/tenants">
            <Button>Back to Tenants</Button>
          </Link>
        </div>
      </div>
    );
  }

  const usage = tenant.subscription?.current_usage || tenant.usage_stats || {
    patients_count: 0,
    users_count: 0,
    storage_used_gb: 0,
    api_calls_today: 0
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/tenants">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tenants
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{tenant.name}</h1>
            <p className="text-gray-600">{tenant.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(tenant.status)}>
            {tenant.status}
          </Badge>
          <Badge className={getTierColor(tenant.subscription?.tier_name || tenant.plan)}>
            {tenant.subscription?.tier_name || tenant.plan}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage & Analytics</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="branding">
            <Link href={`/tenants/${tenant.id}/branding`} className="flex items-center">
              Branding
            </Link>
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Hospital Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{tenant.email}</p>
                  </div>
                </div>
                
                {tenant.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{tenant.phone}</p>
                    </div>
                  </div>
                )}
                
                {tenant.address && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-medium">{tenant.address}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-medium">
                      {new Date(tenant.joindate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-start space-x-3">
                    <Globe className="h-4 w-4 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-2">Subdomain URL</p>
                      {tenant.subdomain ? (
                        <SubdomainDisplay 
                          subdomain={tenant.subdomain}
                          variant="card"
                          showCopyButton={true}
                          showExternalLink={true}
                        />
                      ) : (
                        <div className="bg-muted/50 border rounded-lg p-3">
                          <p className="text-sm text-muted-foreground italic">
                            No subdomain configured
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Contact support to set up a subdomain for this hospital
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Quick Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-gray-600">Users</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{usage.users_count}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600">Patients</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">{usage.patients_count}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-purple-500" />
                    <span className="text-gray-600">Storage Used</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-600">
                    {usage.storage_used_gb?.toFixed(1) || 0} GB
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-orange-500" />
                    <span className="text-gray-600">API Calls Today</span>
                  </div>
                  <span className="text-2xl font-bold text-orange-600">
                    {(usage as any).api_calls_today || (usage as any).api_calls_count || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>Usage Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Users</p>
                      <p className="text-2xl font-bold text-blue-700">{usage.users_count}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Total Patients</p>
                      <p className="text-2xl font-bold text-green-700">{usage.patients_count}</p>
                    </div>
                    <Activity className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Storage Used</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {usage.storage_used_gb?.toFixed(1) || 0} GB
                      </p>
                    </div>
                    <CreditCard className="h-8 w-8 text-purple-500" />
                  </div>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-600 font-medium">API Calls</p>
                      <p className="text-2xl font-bold text-orange-700">
                        {(usage as any).api_calls_today || (usage as any).api_calls_count || 0}
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-orange-500" />
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <p className="text-gray-600">
                  Detailed usage analytics and trends will be available here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Current Plan</p>
                    <p className="text-sm text-gray-600">
                      {tenant.subscription?.tier_name || tenant.plan} Plan
                    </p>
                  </div>
                  <Badge className={getTierColor(tenant.subscription?.tier_name || tenant.plan)}>
                    {tenant.subscription?.tier_name || tenant.plan}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Status</p>
                    <p className="text-sm text-gray-600">
                      Subscription status
                    </p>
                  </div>
                  <Badge className={getStatusColor(tenant.subscription?.status || tenant.status)}>
                    {tenant.subscription?.status || tenant.status}
                  </Badge>
                </div>
                
                <div className="mt-6">
                  <p className="text-gray-600">
                    Subscription management features will be available here.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">General Settings</h4>
                  <p className="text-sm text-gray-600">
                    Configure general tenant settings and preferences.
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Security Settings</h4>
                  <p className="text-sm text-gray-600">
                    Manage security policies and access controls.
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Integration Settings</h4>
                  <p className="text-sm text-gray-600">
                    Configure third-party integrations and API access.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}