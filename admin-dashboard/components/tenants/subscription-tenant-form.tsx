'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { 
  ArrowLeft, 
  Building2, 
  User, 
  CreditCard, 
  Settings,
  Check,
  X
} from 'lucide-react';

interface FormData {
  // Hospital Details
  hospital_name: string;
  hospital_email: string;
  hospital_description: string;
  
  // Admin User
  admin_name: string;
  admin_email: string;
  admin_password: string;
  
  // Subscription
  subscription_tier: string;
  billing_cycle: string;
  
  // Additional
  notes: string;
  send_welcome_email: boolean;
}

interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  limits: {
    max_patients: number;
    max_users: number;
    storage_gb: number;
    api_calls_per_day: number;
  };
  features: string[];
}

export function SubscriptionTenantForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [subscriptionTiers, setSubscriptionTiers] = useState<SubscriptionTier[]>([]);
  const [formData, setFormData] = useState<FormData>({
    hospital_name: '',
    hospital_email: '',
    hospital_description: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
    subscription_tier: '',
    billing_cycle: 'monthly',
    notes: '',
    send_welcome_email: true
  });

  useEffect(() => {
    fetchSubscriptionTiers();
  }, []);

  const fetchSubscriptionTiers = async () => {
    try {
      const response = await api.get('/api/subscriptions/tiers');
      setSubscriptionTiers(response.data.tiers || []);
    } catch (error) {
      console.error('Error fetching subscription tiers:', error);
    }
  };

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const response = await api.post('/api/tenants/create-with-subscription', {
        ...formData
      });
      
      if (response.data.success) {
        router.push('/tenants');
      }
    } catch (error) {
      console.error('Error creating tenant:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedTier = subscriptionTiers.find(tier => tier.id === formData.subscription_tier);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const steps = [
    { id: 1, title: 'Hospital Details', icon: Building2 },
    { id: 2, title: 'Admin User', icon: User },
    { id: 3, title: 'Subscription', icon: CreditCard },
    { id: 4, title: 'Review', icon: Settings }
  ];

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tenants
        </Button>
        <h1 className="text-3xl font-bold">Create New Tenant</h1>
        <p className="text-gray-600 mt-2">Set up a new hospital with subscription and admin user</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((stepItem, index) => (
            <div key={stepItem.id} className="flex items-center flex-1">
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                  step >= stepItem.id 
                    ? 'bg-blue-500 border-blue-500 text-white' 
                    : 'border-gray-300 text-gray-500'
                }`}>
                  <stepItem.icon className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    step >= stepItem.id ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {stepItem.title}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  step > stepItem.id ? 'bg-blue-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Step {step}: {steps[step - 1]?.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Hospital Details */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="hospital_name">Hospital Name *</Label>
                  <Input
                    id="hospital_name"
                    value={formData.hospital_name}
                    onChange={(e) => updateField('hospital_name', e.target.value)}
                    placeholder="Enter hospital name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="hospital_email">Hospital Email *</Label>
                  <Input
                    id="hospital_email"
                    type="email"
                    value={formData.hospital_email}
                    onChange={(e) => updateField('hospital_email', e.target.value)}
                    placeholder="contact@hospital.com"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="hospital_description">Description</Label>
                  <Textarea
                    id="hospital_description"
                    value={formData.hospital_description}
                    onChange={(e) => updateField('hospital_description', e.target.value)}
                    placeholder="Brief description of the hospital"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Admin User */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-medium mb-2">Administrator Account</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    This user will have full administrative access to the hospital system.
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="admin_name">Admin Name *</Label>
                  <Input
                    id="admin_name"
                    value={formData.admin_name}
                    onChange={(e) => updateField('admin_name', e.target.value)}
                    placeholder="Administrator full name"
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
                  <Label htmlFor="admin_password">Password *</Label>
                  <Input
                    id="admin_password"
                    type="password"
                    value={formData.admin_password}
                    onChange={(e) => updateField('admin_password', e.target.value)}
                    placeholder="Secure password"
                    required
                    minLength={8}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Password must be at least 8 characters long
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Subscription */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <Label>Select Subscription Tier *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                    {subscriptionTiers.map((tier) => (
                      <Card 
                        key={tier.id} 
                        className={`cursor-pointer transition-all ${
                          formData.subscription_tier === tier.id 
                            ? 'ring-2 ring-blue-500 bg-blue-50' 
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => updateField('subscription_tier', tier.id)}
                      >
                        <CardContent className="p-4">
                          <div className="text-center">
                            <h3 className="font-semibold text-lg">{tier.name}</h3>
                            <p className="text-2xl font-bold text-blue-600 mt-2">
                              {formatCurrency(tier.price)}
                            </p>
                            <p className="text-sm text-gray-500">/month</p>
                          </div>
                          
                          <div className="mt-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Patients</span>
                              <span className="font-medium">
                                {tier.limits.max_patients === -1 ? 'Unlimited' : tier.limits.max_patients}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Users</span>
                              <span className="font-medium">
                                {tier.limits.max_users === -1 ? 'Unlimited' : tier.limits.max_users}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Storage</span>
                              <span className="font-medium">
                                {tier.limits.storage_gb === -1 ? 'Unlimited' : `${tier.limits.storage_gb} GB`}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <div className="text-xs text-gray-600">
                              {tier.features.map((feature, index) => (
                                <div key={index} className="flex items-center space-x-1">
                                  <Check className="h-3 w-3 text-green-500" />
                                  <span>{feature}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label>Billing Cycle</Label>
                  <Select 
                    value={formData.billing_cycle} 
                    onValueChange={(value) => updateField('billing_cycle', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select billing cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly (10% discount)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    placeholder="Any additional notes or requirements"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Review & Confirm</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Hospital Details</h4>
                      <div className="space-y-1 text-sm">
                        <div><strong>Name:</strong> {formData.hospital_name}</div>
                        <div><strong>Email:</strong> {formData.hospital_email}</div>
                        <div><strong>Description:</strong> {formData.hospital_description || 'None'}</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Administrator</h4>
                      <div className="space-y-1 text-sm">
                        <div><strong>Name:</strong> {formData.admin_name}</div>
                        <div><strong>Email:</strong> {formData.admin_email}</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Subscription</h4>
                      <div className="space-y-1 text-sm">
                        <div><strong>Tier:</strong> {selectedTier?.name}</div>
                        <div><strong>Price:</strong> {selectedTier ? formatCurrency(selectedTier.price) : ''}</div>
                        <div><strong>Billing:</strong> {formData.billing_cycle}</div>
                        <div><strong>Notes:</strong> {formData.notes || 'None'}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="send_welcome_email"
                    checked={formData.send_welcome_email}
                    onCheckedChange={(checked) => updateField('send_welcome_email', checked)}
                  />
                  <Label htmlFor="send_welcome_email">
                    Send welcome email to admin user
                  </Label>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={handleBack}>
                  Back
                </Button>
              )}
              {step < 4 ? (
                <Button type="button" onClick={handleNext} className="ml-auto">
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={loading} className="ml-auto">
                  {loading ? 'Creating Tenant...' : 'Create Tenant'}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}