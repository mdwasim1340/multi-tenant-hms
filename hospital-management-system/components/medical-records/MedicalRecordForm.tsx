'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { createMedicalRecord, updateMedicalRecord, type CreateRecordData, type VitalSigns } from '@/lib/api/medical-records';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, X, Activity } from 'lucide-react';

interface MedicalRecordFormProps {
  patientId: number;
  recordId?: number;
  initialData?: any;
  onSuccess?: (record: any) => void;
  onCancel?: () => void;
}

interface FormData {
  visit_date: string;
  chief_complaint: string;
  diagnosis: string;
  treatment_plan: string;
  notes: string;
  follow_up_required: boolean;
  follow_up_date: string;
  // Vital signs
  blood_pressure: string;
  temperature: string;
  pulse: string;
  respiratory_rate: string;
  weight: string;
  height: string;
  oxygen_saturation: string;
}

export function MedicalRecordForm({ 
  patientId, 
  recordId, 
  initialData, 
  onSuccess, 
  onCancel 
}: MedicalRecordFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<FormData>({
    defaultValues: {
      visit_date: initialData?.visit_date?.split('T')[0] || new Date().toISOString().split('T')[0],
      chief_complaint: initialData?.chief_complaint || '',
      diagnosis: initialData?.diagnosis || '',
      treatment_plan: initialData?.treatment_plan || '',
      notes: initialData?.notes || '',
      follow_up_required: initialData?.follow_up_required || false,
      follow_up_date: initialData?.follow_up_date || '',
      blood_pressure: initialData?.vital_signs?.blood_pressure || '',
      temperature: initialData?.vital_signs?.temperature || '',
      pulse: initialData?.vital_signs?.pulse || '',
      respiratory_rate: initialData?.vital_signs?.respiratory_rate || '',
      weight: initialData?.vital_signs?.weight || '',
      height: initialData?.vital_signs?.height || '',
      oxygen_saturation: initialData?.vital_signs?.oxygen_saturation || ''
    }
  });

  const followUpRequired = watch('follow_up_required');

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Build vital signs object
      const vitalSigns: VitalSigns = {};
      if (data.blood_pressure) vitalSigns.blood_pressure = data.blood_pressure;
      if (data.temperature) vitalSigns.temperature = data.temperature;
      if (data.pulse) vitalSigns.pulse = data.pulse;
      if (data.respiratory_rate) vitalSigns.respiratory_rate = data.respiratory_rate;
      if (data.weight) vitalSigns.weight = data.weight;
      if (data.height) vitalSigns.height = data.height;
      if (data.oxygen_saturation) vitalSigns.oxygen_saturation = data.oxygen_saturation;

      const recordData: CreateRecordData = {
        patient_id: patientId,
        visit_date: new Date(data.visit_date).toISOString(),
        chief_complaint: data.chief_complaint || undefined,
        diagnosis: data.diagnosis || undefined,
        treatment_plan: data.treatment_plan || undefined,
        notes: data.notes || undefined,
        follow_up_required: data.follow_up_required,
        follow_up_date: data.follow_up_required && data.follow_up_date ? data.follow_up_date : undefined,
        vital_signs: Object.keys(vitalSigns).length > 0 ? vitalSigns : undefined
      };

      let result;
      if (recordId) {
        result = await updateMedicalRecord(recordId, recordData);
      } else {
        result = await createMedicalRecord(recordData);
      }

      setSuccess(true);
      
      if (onSuccess) {
        onSuccess(result.data.record);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save medical record');
      console.error('Error saving record:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Success Message */}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            Medical record saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Visit Information */}
      <Card>
        <CardHeader>
          <CardTitle>Visit Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="visit_date">Visit Date *</Label>
            <Input
              id="visit_date"
              type="date"
              {...register('visit_date', { required: 'Visit date is required' })}
            />
            {errors.visit_date && (
              <p className="text-sm text-red-600 mt-1">{errors.visit_date.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="chief_complaint">Chief Complaint</Label>
            <Textarea
              id="chief_complaint"
              placeholder="Patient's main concern or reason for visit..."
              rows={3}
              {...register('chief_complaint')}
            />
          </div>

          <div>
            <Label htmlFor="diagnosis">Diagnosis</Label>
            <Textarea
              id="diagnosis"
              placeholder="Medical diagnosis..."
              rows={3}
              {...register('diagnosis')}
            />
          </div>

          <div>
            <Label htmlFor="treatment_plan">Treatment Plan</Label>
            <Textarea
              id="treatment_plan"
              placeholder="Recommended treatment and medications..."
              rows={3}
              {...register('treatment_plan')}
            />
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional observations or notes..."
              rows={3}
              {...register('notes')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Vital Signs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Vital Signs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="blood_pressure">Blood Pressure</Label>
              <Input
                id="blood_pressure"
                placeholder="120/80"
                {...register('blood_pressure')}
              />
            </div>

            <div>
              <Label htmlFor="temperature">Temperature (°F)</Label>
              <Input
                id="temperature"
                placeholder="98.6"
                {...register('temperature')}
              />
            </div>

            <div>
              <Label htmlFor="pulse">Pulse (bpm)</Label>
              <Input
                id="pulse"
                placeholder="72"
                {...register('pulse')}
              />
            </div>

            <div>
              <Label htmlFor="respiratory_rate">Respiratory Rate</Label>
              <Input
                id="respiratory_rate"
                placeholder="16"
                {...register('respiratory_rate')}
              />
            </div>

            <div>
              <Label htmlFor="weight">Weight (lbs)</Label>
              <Input
                id="weight"
                placeholder="150"
                {...register('weight')}
              />
            </div>

            <div>
              <Label htmlFor="height">Height (inches)</Label>
              <Input
                id="height"
                placeholder="68"
                {...register('height')}
              />
            </div>

            <div>
              <Label htmlFor="oxygen_saturation">O2 Saturation (%)</Label>
              <Input
                id="oxygen_saturation"
                placeholder="98"
                {...register('oxygen_saturation')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Follow-up */}
      <Card>
        <CardHeader>
          <CardTitle>Follow-up</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="follow_up_required"
              {...register('follow_up_required')}
              className="w-4 h-4"
            />
            <Label htmlFor="follow_up_required" className="cursor-pointer">
              Follow-up appointment required
            </Label>
          </div>

          {followUpRequired && (
            <div>
              <Label htmlFor="follow_up_date">Follow-up Date</Label>
              <Input
                id="follow_up_date"
                type="date"
                {...register('follow_up_date')}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        )}
        
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {recordId ? 'Update Record' : 'Create Record'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
