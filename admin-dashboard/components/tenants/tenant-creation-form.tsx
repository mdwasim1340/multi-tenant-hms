'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

interface TenantFormData {
  name: string;
  email: string;
  plan: string;
  admin_name: string;
  admin_email: string;
  admin_password: string;
  phone?: string;
  address?: string;
}

interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: Record<string, boolean>;
  limits: Record<string, number>;
}

export function TenantCreationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [subscriptionTiers, setSubscriptionTiers] = useState<SubscriptionTier[]>([]);
  const [formData, setFormData] = useState<TenantFormData>({
    name: '',
    email: '',
    plan: 'basic',
    admin_name: '',
    admin_email: '',
    admin_password: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    fetchSubscriptionTiers();
  }, []);

  const fetchSubscriptionTiers = async () => {
    try {
      const response = await api.get('/api/subscriptions/tiers');
      if (response.data.success) {
        setSubscriptionTiers(response.data.tiers);
      }
    } catch (error) {
      console.error('Error fetching subscription tiers:', error);
      // Use default tiers if API fails
      setSubscriptionTiers([
        {
          id: 'basic',
          name: 'Basic',
          price: 4999,
          currency: 'INR',
          features: {},
          limits: { max_patients: 500, max_users: 5 }
        },
        {
          id: 'advanced',
          name: 'Advanced',
          price: 14999,
          currency: 'INR',
          features: {},
          limits: { max_patients: 2000, max_users: 25 }
        },
        {
          id: 'premium',
          name: 'Premium',
          price: 29999,
          currency: 'INR',
          features: {},
          limits: { max_patients: -1, max_users: -1 }
        }
      ]);
    }
  };

  const updateField = (field: keyof TenantFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.name || !formData.email) {
      toast.error('Please fill in all required fields');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const validateStep2 = () => {
    if (!formData.admin_name || !formData.admin_email || !formData.admin_password) {
      toast.error('Please fill in all admin details');
      return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.admin_email)) {
      toast.error('Please enter a valid admin email address');
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
      
      // Create tenant using existing backend endpoint
      const response = await api.post('/api/tenants', {
        id: `tenant_${Date.now()}`,
        name: formData.name,
        email: formData.email,
        plan: formData.plan,
        status: 'active'
      });
      
      toast.success('Tenant created successfully!');
      router.push('/tenants');
    } catch (error: any) {
      console.error('Error creating tenant:', error);
      
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in and try again.');
        router.push('/auth/signin');
      } else if (error.response?.status === 403) {
        toast.error('Access denied. Admin privileges required.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to create tenant. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedTier = subscriptionTiers.find(tier => tier.id === formData.plan);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/tenants')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tenants
        </Button>
        <h1 className="text-3xl font-bold">Create New Tenant</h1>
        <p className="text-muted-foreground mt-2">Set up a new hospital tenant with admin user and subscription</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Step {step} of 3</CardTitle>
          <div className="flex items-center space-x-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded ${
                  s <= step ? 'bg-primary' : 'bg-muted'
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
                  <Label htmlFor="name">Hospital Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="e.g., City General Hospital"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Hospital Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="contact@hospital.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="+91 1234567890"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="Hospital address"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Admin User */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Admin User Details</h3>
                <p className="text-sm text-muted-foreground">
                  Create the primary administrator account for this hospital
                </p>
                
                <div>
                  <Label htmlFor="admin_name">Admin Name *</Label>
                  <Input
                    id="admin_name"
                    value={formData.admin_name}
                    onChange={(e) => updateField('admin_name', e.target.value)}
                    placeholder="e.g., Dr. John Doe"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="admin_email">Admin Email *</Label>
                  <Input
                    id="admin_email"
                    type="email"
                    value={formData.admin_email}
                    onChange={(e) => updateField('admin_email', e.target.value)}
                    placeholder="admin@hospital.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="admin_password">Admin Password *</Label>
                  <Input
                    id="admin_password"
                    type="password"
                    value={formData.admin_password}
                    onChange={(e) => updateField('admin_password', e.target.value)}
                    placeholder="Minimum 8 characters"
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Password should be at least 8 characters long
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Subscription */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Subscription Plan</h3>
                <p className="text-sm text-muted-foreground">
                  Choose the subscription tier for this hospital
                </p>
                
                <div>
                  <Label>Select Plan *</Label>
                  <Select
                    value={formData.plan}
                    onValueChange={(value) => updateField('plan', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {subscriptionTiers.map((tier) => (
                        <SelectItem key={tier.id} value={tier.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {tier.name} - {formatCurrency(tier.price, tier.currency)}/month
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {tier.limits.max_patients === -1 ? 'Unlimited' : tier.limits.max_patients} patients, {' '}
                              {tier.limits.max_users === -1 ? 'Unlimited' : tier.limits.max_users} users
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTier && (
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium mb-3">Plan Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Monthly Cost:</span>
                        <span className="font-medium">
                          {formatCurrency(selectedTier.price, selectedTier.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max Patients:</span>
                        <span className="font-medium">
                          {selectedTier.limits.max_patients === -1 ? 'Unlimited' : selectedTier.limits.max_patients}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max Users:</span>
                        <span className="font-medium">
                          {selectedTier.limits.max_users === -1 ? 'Unlimited' : selectedTier.limits.max_users}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-muted p-4 rounded-lg border">
                  <h4 className="font-medium mb-2">Summary</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Hospital:</strong> {formData.name}</p>
                    <p><strong>Email:</strong> {formData.email}</p>
                    <p><strong>Admin:</strong> {formData.admin_name} ({formData.admin_email})</p>
                    <p><strong>Plan:</strong> {selectedTier?.name}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              {step < 3 ? (
                <Button type="button" onClick={handleNext} className="ml-auto">
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={loading} className="ml-auto">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Create Tenant
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}