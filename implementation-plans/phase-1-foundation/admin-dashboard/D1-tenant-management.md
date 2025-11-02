# D1: Tenant Management UI

**Agent:** Admin Dashboard Agent D1  
**Track:** Admin Dashboard  
**Dependencies:** A1 (Subscription Tier System)  
**Estimated Time:** 3-4 days  
**Complexity:** Medium

## Objective
Build a comprehensive tenant management interface in the admin dashboard for creating, viewing, updating, and managing hospital tenants with subscription tier assignment.

## Current State Analysis
- ✅ Subscription tier system implemented (A1)
- ✅ Backend tenant APIs exist
- ✅ Admin dashboard application ready
- ❌ No tenant management UI
- ❌ No tenant creation wizard
- ❌ No tenant details view

## Implementation Steps

### Step 1: Tenant List Component (Day 1)
Create component to display all tenants.

**File:** `admin-dashboard/components/tenants/tenant-list.tsx`
```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Plus, Search, Building2, Users, Calendar } from 'lucide-react';
import Link from 'next/link';

interface Tenant {
  id: string;
  name: string;
  status: string;
  subscription_tier: string;
  created_at: string;
  user_count?: number;
  patient_count?: number;
}

export function TenantList() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/tenants');
      setTenants(response.data.tenants || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.id.toLowerCase().includes(searchQuery.toLowerCase())
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
    switch (tier) {
      case 'premium': return 'bg-purple-500';
      case 'advanced': return 'bg-blue-500';
      case 'basic': return 'bg-gray-500';
      default: return 'bg-gray-500';
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
                <span className="text-gray-600">Subscription</span>
                <Badge className={getTierColor(tenant.subscription_tier)}>
                  {tenant.subscription_tier}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Users</span>
                </div>
                <span className="font-medium">{tenant.user_count || 0}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Created</span>
                </div>
                <span className="font-medium">
                  {new Date(tenant.created_at).toLocaleDateString()}
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

      {filteredTenants.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No tenants found</p>
        </div>
      )}
    </div>
  );
}
```

### Step 2: Tenant Creation Form (Day 1-2)
Create multi-step form for tenant creation.

**File:** `admin-dashboard/components/tenants/tenant-creation-form.tsx`
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface TenantFormData {
  name: string;
  subdomain: string;
  admin_email: string;
  admin_name: string;
  admin_password: string;
  subscription_tier: string;
  phone?: string;
  address?: string;
}

export function TenantCreationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<TenantFormData>({
    name: '',
    subdomain: '',
    admin_email: '',
    admin_name: '',
    admin_password: '',
    subscription_tier: 'basic',
    phone: '',
    address: ''
  });

  const updateField = (field: keyof TenantFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.name || !formData.subdomain) {
      toast.error('Please fill in all required fields');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.admin_email || !formData.admin_name || !formData.admin_password) {
      toast.error('Please fill in all admin details');
      return false;
    }
    if (formData.admin_password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const response = await api.post('/api/tenants', formData);
      
      toast.success('Tenant created successfully!');
      router.push(`/tenants/${response.data.tenant.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create tenant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Tenant</CardTitle>
        <div className="flex items-center space-x-2 mt-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded ${
                s <= step ? 'bg-blue-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Hospital Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Hospital Details</h3>
              
              <div>
                <Label>Hospital Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g., City General Hospital"
                  required
                />
              </div>

              <div>
                <Label>Subdomain *</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={formData.subdomain}
                    onChange={(e) => updateField('subdomain', e.target.value.toLowerCase())}
                    placeholder="e.g., cityhospital"
                    required
                  />
                  <span className="text-sm text-gray-500">.yourdomain.com</span>
                </div>
              </div>

              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+91 1234567890"
                />
              </div>

              <div>
                <Label>Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="Hospital address"
                />
              </div>
            </div>
          )}

          {/* Step 2: Admin User */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Admin User Details</h3>
              
              <div>
                <Label>Admin Name *</Label>
                <Input
                  value={formData.admin_name}
                  onChange={(e) => updateField('admin_name', e.target.value)}
                  placeholder="e.g., Dr. John Doe"
                  required
                />
              </div>

              <div>
                <Label>Admin Email *</Label>
                <Input
                  type="email"
                  value={formData.admin_email}
                  onChange={(e) => updateField('admin_email', e.target.value)}
                  placeholder="admin@hospital.com"
                  required
                />
              </div>

              <div>
                <Label>Admin Password *</Label>
                <Input
                  type="password"
                  value={formData.admin_password}
                  onChange={(e) => updateField('admin_password', e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                />
              </div>
            </div>
          )}

          {/* Step 3: Subscription */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Subscription Plan</h3>
              
              <div>
                <Label>Select Plan *</Label>
                <Select
                  value={formData.subscription_tier}
                  onValueChange={(value) => updateField('subscription_tier', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">
                      <div className="flex flex-col">
                        <span className="font-medium">Basic - ₹4,999/month</span>
                        <span className="text-xs text-gray-500">500 patients, 5 users</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="advanced">
                      <div className="flex flex-col">
                        <span className="font-medium">Advanced - ₹14,999/month</span>
                        <span className="text-xs text-gray-500">2,000 patients, 25 users</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="premium">
                      <div className="flex flex-col">
                        <span className="font-medium">Premium - ₹29,999/month</span>
                        <span className="text-xs text-gray-500">Unlimited patients & users</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Summary</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Hospital:</strong> {formData.name}</p>
                  <p><strong>Subdomain:</strong> {formData.subdomain}.yourdomain.com</p>
                  <p><strong>Admin:</strong> {formData.admin_name} ({formData.admin_email})</p>
                  <p><strong>Plan:</strong> {formData.subscription_tier}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button type="button" onClick={handleNext} className="ml-auto">
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={loading} className="ml-auto">
                {loading ? 'Creating...' : 'Create Tenant'}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

### Step 3: Tenant Details Page (Day 2)
Create detailed view for individual tenant.

**File:** `admin-dashboard/app/tenants/[id]/page.tsx`
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { 
  Building2, 
  Users, 
  Calendar, 
  Settings, 
  Activity,
  ArrowLeft 
} from 'lucide-react';
import Link from 'next/link';

interface TenantDetails {
  id: string;
  name: string;
  status: string;
  subscription_tier: string;
  created_at: string;
  subdomain?: string;
  phone?: string;
  address?: string;
  usage?: {
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

  useEffect(() => {
    fetchTenantDetails();
  }, [params.id]);

  const fetchTenantDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/tenants/${params.id}`);
      setTenant(response.data.tenant);
    } catch (error) {
      console.error('Error fetching tenant details:', error);
    } finally {
      setLoading(false);
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
        <Link href="/tenants">
          <Button className="mt-4">Back to Tenants</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/tenants">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{tenant.name}</h1>
            <p className="text-gray-600">{tenant.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={tenant.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
            {tenant.status}
          </Badge>
          <Badge className="bg-blue-500">{tenant.subscription_tier}</Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Tenant Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subdomain</span>
                  <span className="font-medium">{tenant.subdomain || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone</span>
                  <span className="font-medium">{tenant.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Address</span>
                  <span className="font-medium">{tenant.address || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created</span>
                  <span className="font-medium">
                    {new Date(tenant.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Users</span>
                  <span className="font-medium">{tenant.usage?.users_count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Patients</span>
                  <span className="font-medium">{tenant.usage?.patients_count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Storage Used</span>
                  <span className="font-medium">
                    {tenant.usage?.storage_used_gb?.toFixed(2) || 0} GB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">API Calls Today</span>
                  <span className="font-medium">{tenant.usage?.api_calls_count || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>Usage Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Usage details will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Settings options will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Step 4: Main Tenants Page (Day 3)
Create main page that uses the tenant list component.

**File:** `admin-dashboard/app/tenants/page.tsx`
```typescript
import { TenantList } from '@/components/tenants/tenant-list';

export default function TenantsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Tenant Management</h1>
        <p className="text-gray-600 mt-2">
          Manage all hospital tenants and their subscriptions
        </p>
      </div>
      <TenantList />
    </div>
  );
}
```

**File:** `admin-dashboard/app/tenants/new/page.tsx`
```typescript
import { TenantCreationForm } from '@/components/tenants/tenant-creation-form';

export default function NewTenantPage() {
  return (
    <div className="container mx-auto py-8">
      <TenantCreationForm />
    </div>
  );
}
```

### Step 5: Backend Tenant Creation Endpoint (Day 3)
Enhance backend endpoint for tenant creation.

**File:** `backend/src/routes/tenants.ts` (add this endpoint)
```typescript
import { subscriptionService } from '../services/subscription';
import { backupService } from '../services/backup';
import bcrypt from 'bcrypt';

// Create new tenant
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      subdomain,
      admin_email,
      admin_name,
      admin_password,
      subscription_tier,
      phone,
      address
    } = req.body;

    // Validate required fields
    if (!name || !subdomain || !admin_email || !admin_name || !admin_password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate tenant ID
    const tenantId = `tenant_${Date.now()}`;

    // Create tenant in database
    const tenantResult = await pool.query(`
      INSERT INTO tenants (id, name, subdomain, phone, address, status)
      VALUES ($1, $2, $3, $4, $5, 'active')
      RETURNING *
    `, [tenantId, name, subdomain, phone, address]);

    const tenant = tenantResult.rows[0];

    // Create tenant schema
    await pool.query(`CREATE SCHEMA IF NOT EXISTS "${tenantId}"`);

    // Assign subscription tier
    await subscriptionService.updateTenantSubscription(tenantId, subscription_tier);

    // Setup backup schedules
    await backupService.setupBackupSchedules(tenantId, subscription_tier);

    // Hash admin password
    const hashedPassword = await bcrypt.hash(admin_password, 10);

    // Create admin user
    const userResult = await pool.query(`
      INSERT INTO users (tenant_id, name, email, password, role)
      VALUES ($1, $2, $3, $4, 'admin')
      RETURNING id, name, email, role
    `, [tenantId, admin_name, admin_email, hashedPassword]);

    res.status(201).json({
      message: 'Tenant created successfully',
      tenant: tenant,
      admin_user: userResult.rows[0]
    });
  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});
```

### Step 6: Testing (Day 4)
Test the tenant management interface.

**Manual Testing:**
1. Navigate to `/tenants`
2. Click "Add Tenant"
3. Fill in all steps of the form
4. Submit and verify tenant creation
5. View tenant details
6. Test search functionality

## Validation Checklist

### Frontend
- [ ] Tenant list displays correctly
- [ ] Search functionality works
- [ ] Creation form validates input
- [ ] Multi-step form navigation works
- [ ] Tenant details page loads

### Backend
- [ ] Tenant creation endpoint works
- [ ] Schema created for new tenant
- [ ] Admin user created
- [ ] Subscription assigned
- [ ] Backup schedules setup

### Integration
- [ ] Can create new tenant
- [ ] Can view tenant list
- [ ] Can view tenant details
- [ ] Subscription tier assigned correctly

### Testing
- [ ] Form validation working
- [ ] Error handling proper
- [ ] Success messages shown
- [ ] Navigation working

## Success Criteria
- Complete tenant management UI
- Tenant creation wizard functional
- Tenant details view working
- Search and filter working
- Integration with backend complete

## Next Steps
After completion, this enables:
- Agent D2 to build billing interface
- Tenant onboarding workflow
- Subscription management

## Notes for AI Agent
- Test form validation thoroughly
- Ensure proper error handling
- Make UI intuitive and user-friendly
- Test with various subscription tiers
- Verify tenant schema creation
- Test subdomain uniqueness
