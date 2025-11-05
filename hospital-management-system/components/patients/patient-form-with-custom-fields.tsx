'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CustomFieldsForm } from '@/components/custom-fields/custom-fields-form';
import { CustomFieldValue } from '@/lib/types/customFields';
import { toast } from 'sonner';

interface PatientFormData {
  patient_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  medical_history: string;
  allergies: string;
  current_medications: string;
}

interface PatientFormWithCustomFieldsProps {
  onSubmit?: (patientData: PatientFormData, customFields: CustomFieldValue) => void;
  initialData?: Partial<PatientFormData>;
  initialCustomFields?: CustomFieldValue;
}

export function PatientFormWithCustomFields({
  onSubmit,
  initialData = {},
  initialCustomFields = {}
}: PatientFormWithCustomFieldsProps) {
  const [formData, setFormData] = useState<PatientFormData>({
    patient_number: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_history: '',
    allergies: '',
    current_medications: '',
    ...initialData
  });

  const [customFieldValues, setCustomFieldValues] = useState<CustomFieldValue>(initialCustomFields);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof PatientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name || !formData.date_of_birth) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      if (onSubmit) {
        await onSubmit(formData, customFieldValues);
      }
      toast.success('Patient information saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save patient information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Patient Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Enter the patient's basic demographic information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Patient Number *</Label>
              <Input
                value={formData.patient_number}
                onChange={(e) => handleInputChange('patient_number', e.target.value)}
                placeholder="e.g., P001"
                required
              />
            </div>

            <div>
              <Label>Gender</Label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>First Name *</Label>
              <Input
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Last Name *</Label>
              <Input
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>

            <div>
              <Label>Phone</Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>

            <div>
              <Label>Date of Birth *</Label>
              <Input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label>Address</Label>
            <Textarea
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Contact</CardTitle>
          <CardDescription>
            Contact information for emergencies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Emergency Contact Name</Label>
              <Input
                value={formData.emergency_contact_name}
                onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
              />
            </div>

            <div>
              <Label>Emergency Contact Phone</Label>
              <Input
                type="tel"
                value={formData.emergency_contact_phone}
                onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical Information */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Information</CardTitle>
          <CardDescription>
            Patient's medical history and current conditions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Medical History</Label>
            <Textarea
              value={formData.medical_history}
              onChange={(e) => handleInputChange('medical_history', e.target.value)}
              rows={3}
              placeholder="Previous medical conditions, surgeries, etc."
            />
          </div>

          <div>
            <Label>Allergies</Label>
            <Textarea
              value={formData.allergies}
              onChange={(e) => handleInputChange('allergies', e.target.value)}
              rows={2}
              placeholder="Known allergies to medications, foods, etc."
            />
          </div>

          <div>
            <Label>Current Medications</Label>
            <Textarea
              value={formData.current_medications}
              onChange={(e) => handleInputChange('current_medications', e.target.value)}
              rows={2}
              placeholder="Current medications and dosages"
            />
          </div>
        </CardContent>
      </Card>

      {/* Custom Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
          <CardDescription>
            Custom fields configured for patient records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomFieldsForm
            entityType="patients"
            onValuesChange={setCustomFieldValues}
            initialValues={initialCustomFields}
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Patient'}
        </Button>
      </div>
    </form>
  );
}