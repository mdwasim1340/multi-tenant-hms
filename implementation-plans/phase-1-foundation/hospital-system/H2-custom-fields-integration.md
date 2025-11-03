# H2: Custom Fields Integration in Hospital System

**Agent:** Hospital System Agent H2  
**Track:** Hospital System  
**Dependencies:** B1 (Custom Fields Engine), B2 (Custom Fields UI)  
**Estimated Time:** 3-4 days  
**Complexity:** Medium

## Objective
Integrate custom fields functionality into hospital workflows (patients, appointments, medical records) with proper data persistence and retrieval.

## Current State Analysis
- ✅ Custom fields engine implemented (B1)
- ✅ Custom fields UI components ready (B2)
- ✅ Hospital management system exists
- ❌ No custom fields in patient forms
- ❌ No custom fields in appointment forms
- ❌ No custom fields data persistence

## Implementation Steps

### Step 1: Patient Form Integration (Day 1)
Add custom fields to patient registration and editing.

**File:** `hospital-management-system/components/patients/patient-form.tsx`
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomFieldsForm } from '@/components/custom-fields/custom-fields-form';
import { useCustomFields } from '@/hooks/use-custom-fields';
import { CustomFieldValue } from '@/lib/types/customFields';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface PatientFormProps {
  patientId?: number;
  initialData?: any;
}

export function PatientForm({ patientId, initialData }: PatientFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { saveFieldValue, getFieldValues } = useCustomFields('patients');
  const [customFieldValues, setCustomFieldValues] = useState<CustomFieldValue>({});
  
  // Standard patient fields
  const [formData, setFormData] = useState({
    patient_number: initialData?.patient_number || '',
    first_name: initialData?.first_name || '',
    last_name: initialData?.last_name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    date_of_birth: initialData?.date_of_birth || '',
    gender: initialData?.gender || '',
    address: initialData?.address || ''
  });

  useEffect(() => {
    if (patientId) {
      loadCustomFieldValues();
    }
  }, [patientId]);

  const loadCustomFieldValues = async () => {
    if (!patientId) return;
    const values = await getFieldValues(patientId);
    setCustomFieldValues(values);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      // Save standard patient data
      const response = patientId
        ? await api.put(`/api/patients/${patientId}`, formData)
        : await api.post('/api/patients', formData);

      const savedPatientId = response.data.patient.id;

      // Save custom field values
      const fields = Object.keys(customFieldValues);
      for (const fieldName of fields) {
        // Get field ID from field name
        const fieldResponse = await api.get(`/api/custom-fields/patients`);
        const field = fieldResponse.data.fields.find((f: any) => f.name === fieldName);
        
        if (field) {
          await saveFieldValue(savedPatientId, field.id, customFieldValues[fieldName]);
        }
      }

      toast.success(patientId ? 'Patient updated successfully' : 'Patient created successfully');
      router.push('/patients');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Patient Number</Label>
              <Input
                value={formData.patient_number}
                onChange={(e) => setFormData({ ...formData, patient_number: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>First Name</Label>
              <Input
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Fields Section */}
      <Card>
        <CardContent className="pt-6">
          <CustomFieldsForm
            entityType="patients"
            entityId={patientId}
            initialValues={customFieldValues}
            onValuesChange={setCustomFieldValues}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : patientId ? 'Update Patient' : 'Create Patient'}
        </Button>
      </div>
    </form>
  );
}
```

### Step 2: Display Custom Fields in Patient Details (Day 1-2)
Show custom field values in patient detail view.

**File:** `hospital-management-system/components/patients/patient-details.tsx`
```typescript
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCustomFields } from '@/hooks/use-custom-fields';
import { CustomFieldValue } from '@/lib/types/customFields';

interface PatientDetailsProps {
  patientId: number;
  patientData: any;
}

export function PatientDetails({ patientId, patientData }: PatientDetailsProps) {
  const { fields, getFieldValues } = useCustomFields('patients');
  const [customValues, setCustomValues] = useState<CustomFieldValue>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomFields();
  }, [patientId]);

  const loadCustomFields = async () => {
    try {
      const values = await getFieldValues(patientId);
      setCustomValues(values);
    } catch (error) {
      console.error('Error loading custom fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (fieldType: string, value: any) => {
    if (value === null || value === undefined) return '-';
    
    switch (fieldType) {
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'multi_select':
        return Array.isArray(value) ? value.join(', ') : value;
      default:
        return value;
    }
  };

  return (
    <div className="space-y-6">
      {/* Standard Patient Information */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Patient Number</dt>
              <dd className="mt-1 text-sm text-gray-900">{patientData.patient_number}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {patientData.first_name} {patientData.last_name}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{patientData.email || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900">{patientData.phone || '-'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Custom Fields */}
      {fields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : (
              <dl className="grid grid-cols-2 gap-4">
                {fields.map((field) => (
                  <div key={field.id}>
                    <dt className="text-sm font-medium text-gray-500">{field.label}</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatValue(field.field_type, customValues[field.name])}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

### Step 3: Appointment Form Integration (Day 2)
Add custom fields to appointment booking.

**File:** `hospital-management-system/components/appointments/appointment-form.tsx`
```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CustomFieldsForm } from '@/components/custom-fields/custom-fields-form';
import { useCustomFields } from '@/hooks/use-custom-fields';
import { CustomFieldValue } from '@/lib/types/customFields';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface AppointmentFormProps {
  appointmentId?: number;
  patientId?: number;
}

export function AppointmentForm({ appointmentId, patientId }: AppointmentFormProps) {
  const [loading, setLoading] = useState(false);
  const { saveFieldValue } = useCustomFields('appointments');
  const [customFieldValues, setCustomFieldValues] = useState<CustomFieldValue>({});
  
  const [formData, setFormData] = useState({
    patient_id: patientId || '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    appointment_type: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      // Save appointment
      const response = appointmentId
        ? await api.put(`/api/appointments/${appointmentId}`, formData)
        : await api.post('/api/appointments', formData);

      const savedAppointmentId = response.data.appointment.id;

      // Save custom field values
      const fields = Object.keys(customFieldValues);
      for (const fieldName of fields) {
        const fieldResponse = await api.get(`/api/custom-fields/appointments`);
        const field = fieldResponse.data.fields.find((f: any) => f.name === fieldName);
        
        if (field) {
          await saveFieldValue(savedAppointmentId, field.id, customFieldValues[fieldName]);
        }
      }

      toast.success('Appointment saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Appointment Details</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Standard appointment fields */}
          {/* ... */}
        </CardContent>
      </Card>

      {/* Custom Fields */}
      <Card>
        <CardContent className="pt-6">
          <CustomFieldsForm
            entityType="appointments"
            entityId={appointmentId}
            initialValues={customFieldValues}
            onValuesChange={setCustomFieldValues}
          />
        </CardContent>
      </Card>

      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save Appointment'}
      </Button>
    </form>
  );
}
```

### Step 4: Testing (Day 3-4)
Test custom fields integration thoroughly.

**Test Scenarios:**
1. Create patient with custom fields
2. Edit patient and update custom fields
3. View patient details with custom fields
4. Create appointment with custom fields
5. Test conditional logic in forms
6. Test validation rules
7. Test with different field types

**File:** `hospital-management-system/app/test-integration/page.tsx`
```typescript
'use client';

import { PatientForm } from '@/components/patients/patient-form';

export default function TestIntegrationPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Test Custom Fields Integration</h1>
      <PatientForm />
    </div>
  );
}
```

## Validation Checklist

### Patient Integration
- [ ] Custom fields appear in patient form
- [ ] Custom field values save correctly
- [ ] Custom fields display in patient details
- [ ] Conditional logic works in patient form
- [ ] Validation prevents invalid data

### Appointment Integration
- [ ] Custom fields appear in appointment form
- [ ] Custom field values save correctly
- [ ] Custom fields display in appointment details

### Data Persistence
- [ ] Values persist after page refresh
- [ ] Values update correctly on edit
- [ ] Values display correctly in all views

### Testing
- [ ] All field types work correctly
- [ ] Conditional logic functions properly
- [ ] Validation rules enforced
- [ ] No data loss on form submission
- [ ] Performance acceptable with many fields

## Success Criteria
- Custom fields fully integrated in patient workflow
- Custom fields fully integrated in appointment workflow
- Data persists correctly
- User experience is smooth
- No performance issues
- All field types supported

## Next Steps
After completion, this enables:
- Hospital staff to use custom fields in daily workflows
- Flexible data collection per hospital needs
- Better patient and appointment management

## Notes for AI Agent
- Test with real-world scenarios
- Ensure data integrity
- Handle errors gracefully
- Make UI intuitive
- Test with multiple custom fields
- Verify conditional logic thoroughly
- Check performance with many fields