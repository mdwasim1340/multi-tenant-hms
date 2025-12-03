'use client';

/**
 * PrescriptionForm Component
 * 
 * Form for creating and editing prescriptions with:
 * - Medication details
 * - Dosage and frequency
 * - Duration and refills
 * - Instructions
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Pill,
  Save,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { usePrescriptions } from '@/hooks/usePrescriptions';
import { usePatientContext } from '@/hooks/usePatientContext';
import { Prescription } from '@/lib/api/prescriptions';
import { toast } from 'sonner';

// Form validation schema
const prescriptionSchema = z.object({
  medication_name: z.string().min(1, 'Medication name is required'),
  dosage: z.coerce.number().min(0.1, 'Dosage must be greater than 0'),
  dosage_unit: z.string().min(1, 'Dosage unit is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  refills_remaining: z.coerce.number().min(0).max(12).optional(),
  instructions: z.string().optional(),
  prescribing_doctor: z.string().min(1, 'Prescribing doctor is required'),
  status: z.enum(['active', 'expired', 'discontinued']).default('active')
});

type PrescriptionFormData = z.infer<typeof prescriptionSchema>;

interface PrescriptionFormProps {
  initialData?: Partial<Prescription>;
  onSuccess?: (prescription: Prescription) => void;
  onCancel?: () => void;
}

export function PrescriptionForm({
  initialData,
  onSuccess,
  onCancel
}: PrescriptionFormProps) {
  const { selectedPatient } = usePatientContext();
  const { createPrescription, updatePrescription, loading } = usePrescriptions();

  const form = useForm<PrescriptionFormData>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      medication_name: initialData?.medication_name || '',
      dosage: initialData?.dosage || 0,
      dosage_unit: initialData?.dosage_unit || 'mg',
      frequency: initialData?.frequency || '',
      start_date: initialData?.start_date 
        ? new Date(initialData.start_date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      end_date: initialData?.end_date 
        ? new Date(initialData.end_date).toISOString().split('T')[0]
        : '',
      refills_remaining: initialData?.refills_remaining || 0,
      instructions: initialData?.instructions || '',
      prescribing_doctor: initialData?.prescribing_doctor || '',
      status: initialData?.status || 'active'
    }
  });

  const onSubmit = async (data: PrescriptionFormData) => {
    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }

    try {
      const prescriptionData = {
        ...data,
        patient_id: selectedPatient.id,
        prescribed_date: initialData?.prescribed_date || new Date().toISOString(),
        end_date: data.end_date || null
      };

      let result;
      if (initialData?.id) {
        result = await updatePrescription(initialData.id, prescriptionData);
        toast.success('Prescription updated successfully');
      } else {
        result = await createPrescription(prescriptionData);
        toast.success('Prescription created successfully');
      }

      if (onSuccess && result) {
        onSuccess(result);
      }

      // Reset form for new entries
      if (!initialData?.id) {
        form.reset();
      }
    } catch (err: any) {
      console.error('Error saving prescription:', err);
      toast.error(err.message || 'Failed to save prescription');
    }
  };

  if (!selectedPatient) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Please select a patient before creating a prescription
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5" />
          {initialData?.id ? 'Edit' : 'New'} Prescription
        </CardTitle>
        <CardDescription>
          {initialData?.id ? 'Update' : 'Create'} prescription for {selectedPatient.first_name} {selectedPatient.last_name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Medication Name */}
            <FormField
              control={form.control}
              name="medication_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medication Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Lisinopril, Metformin"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Generic or brand name of the medication
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dosage and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dosage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dosage</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="10"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dosage_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="mg">mg (milligrams)</SelectItem>
                        <SelectItem value="g">g (grams)</SelectItem>
                        <SelectItem value="mcg">mcg (micrograms)</SelectItem>
                        <SelectItem value="ml">ml (milliliters)</SelectItem>
                        <SelectItem value="units">units</SelectItem>
                        <SelectItem value="tablets">tablets</SelectItem>
                        <SelectItem value="capsules">capsules</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Frequency */}
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Once daily">Once daily</SelectItem>
                      <SelectItem value="Twice daily">Twice daily</SelectItem>
                      <SelectItem value="Three times daily">Three times daily</SelectItem>
                      <SelectItem value="Four times daily">Four times daily</SelectItem>
                      <SelectItem value="Every 4 hours">Every 4 hours</SelectItem>
                      <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
                      <SelectItem value="Every 8 hours">Every 8 hours</SelectItem>
                      <SelectItem value="Every 12 hours">Every 12 hours</SelectItem>
                      <SelectItem value="As needed">As needed (PRN)</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How often the medication should be taken
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Start and End Dates */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Start Date
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      End Date (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      Leave empty for ongoing prescriptions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Refills */}
            <FormField
              control={form.control}
              name="refills_remaining"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Refills Remaining</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="12"
                      placeholder="0"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Number of refills authorized (0-12)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Instructions */}
            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Take with food, avoid alcohol, etc."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Special instructions for taking the medication
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Prescribing Doctor */}
            <FormField
              control={form.control}
              name="prescribing_doctor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prescribing Doctor</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Dr. Smith"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status (for editing) */}
            {initialData?.id && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="discontinued">Discontinued</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {initialData?.id ? 'Update' : 'Create'} Prescription
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
