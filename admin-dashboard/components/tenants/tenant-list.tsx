'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { Plus, Search, Building2, Users, Calendar, Activity } from 'lucide-react';
import Link from 'next/link';
import { SubdomainDisplay } from '@/components/subdomain/subdomain-display';

interface Tenant {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: string;
  joindate: string;
  user_count?: number;
  patient_count?: number;
  subscription_tier?: string;
  subdomain?: string;
}

export function TenantList() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/tenants');
      
      // Handle different response structures
      const tenantsData = response.data.tenants || response.data || [];
      setTenants(Array.isArray(tenantsData) ? tenantsData : []);
    } catch (error: any) {
      console.error('Error fetching tenants:', error);
      setError(error.response?.data?.error || 'Failed to fetch tenants');
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <p className="mt-4 text-gray-600">Loading tenants...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchTenants} variant="outline">
            Try Again
          </Button>
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
            placeholder="Search tenants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Link href="/tenants/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Tenant
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTenants.map((tenant) => (
          <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-gray-500" />
                  <CardTitle className="text-lg">{tenant.name}</CardTitle>
                </div>
                <Badge className={getStatusColor(tenant.status)}>
                  {tenant.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Plan</span>
                <Badge className={getTierColor(tenant.subscription_tier || tenant.plan)}>
                  {tenant.subscription_tier || tenant.plan}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Email</span>
                <span className="font-medium text-xs truncate max-w-[150px]" title={tenant.email}>
                  {tenant.email}
                </span>
              </div>

              {tenant.subdomain && (
                <div className="text-sm border-t pt-2">
                  <span className="text-gray-600 text-xs block mb-1">Subdomain</span>
                  <SubdomainDisplay 
                    subdomain={tenant.subdomain} 
                    variant="badge"
                    showCopyButton={true}
                  />
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Users</span>
                </div>
                <span className="font-medium">{tenant.user_count || 0}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-1">
                  <Activity className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Patients</span>
                </div>
                <span className="font-medium">{tenant.patient_count || 0}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Created</span>
                </div>
                <span className="font-medium">
                  {new Date(tenant.joindate).toLocaleDateString()}
                </span>
              </div>

              <div className="pt-2 border-t">
                <Link href={`/tenants/${tenant.id}`}>
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTenants.length === 0 && !loading && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">
            {searchQuery ? 'No tenants found matching your search' : 'No tenants found'}
          </p>
          {!searchQuery && (
            <Link href="/tenants/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create First Tenant
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Summary Stats */}
      {tenants.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{tenants.length}</p>
                <p className="text-sm text-gray-600">Total Tenants</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {tenants.filter(t => t.status === 'active').length}
                </p>
                <p className="text-sm text-gray-600">Active</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {tenants.filter(t => (t.subscription_tier || t.plan) === 'premium').length}
                </p>
                <p className="text-sm text-gray-600">Premium</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {tenants.reduce((sum, t) => sum + (t.user_count || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}