/**
 * Team Alpha - Convert to Appointment Modal
 * Modal for converting waitlist entry to appointment
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { waitlistApi } from '@/lib/api/appointments';

// Types
interface WaitlistEntry {
  id: number;
  patient_id: number;
  patient_name?: string;
  preferred_date?: string;
  preferred_time?: string;
  reason?: string;
  notes?: string;
}

interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  duration_minutes: number;
  appointment_type: string;
  status: string;
  notes?: string;
}

interface ConvertToAppointmentModalProps {
  waitlistEntry: WaitlistEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (appointment: Appointment) => void;
}

// Form validation schema
const ConvertFormSchema = z.object({
  appointment_date: z.string().min(1, 'Please select a date'),
  appointment_time: z.string().min(1, 'Please select a time'),
  doctor_id: z.number().positive('Please select a doctor'),
  duration_minutes: z.number().positive().default(30),
  appointment_type: z.enum(['consultation', 'follow_up', 'emergency', 'procedure']),
  notes: z.string().optional(),
});

type ConvertFormData = z.infer<typeof ConvertFormSchema>;

export default function ConvertToAppointmentModal({
  waitlistEntry,
  isOpen,
  onClose,
  onSuccess,
}: ConvertToAppointmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form
  const form = useForm<ConvertFormData>({
    resolver: zodResolver(ConvertFormSchema),
    defaultValues: {
      appointment_date: '',
      appointment_time: '',
      doctor_id: 0,
      duration_minutes: 30,
      appointment_type: 'consultation',
      notes: '',
    },
  });

  // Reset form when waitlist entry changes
  useEffect(() => {
    if (waitlistEntry) {
      form.reset({
        appointment_date: waitlistEntry.preferred_date?.split('T')[0] || '',
        appointment_time: waitlistEntry.preferred_time || '',
        doctor_id: 0,
        duration_minutes: 30,
        appointment_type: 'consultation',
        notes: waitlistEntry.reason || waitlistEntry.notes || '',
      });
    }
  }, [waitlistEntry, form]);

  const onSubmit = async (data: ConvertFormData) => {
    if (!waitlistEntry) return;

    try {
      setLoading(true);
      setError(null);

      // Combine date and time
      const appointmentDateTime = `${data.appointment_date}T${data.appointment_time}:00.000Z`;

      const appointmentData = {
        patient_id: waitlistEntry.patient_id,
        doctor_id: data.doctor_id,
        appointment_date: appointmentDateTime,
        duration_minutes: data.duration_minutes,
        appointment_type: data.appointment_type,
        status: 'scheduled',
        notes: data.notes,
      };

      // Convert waitlist entry to appointment
      const result = await waitlistApi.convertToAppointment(waitlistEntry.id, appointmentData);

      if (onSuccess) {
        onSuccess(result.appointment);
      }

      // Close modal
      onClose();
    } catch (err: any) {
      console.error('Error converting to appointment:', err);
      setError(err.response?.data?.error || err.message || 'Failed to convert to appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      form.reset();
      setError(null);
      onClose();
    }
  };

  if (!isOpen || !waitlistEntry) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Convert to Appointment</h2>
            <p className="text-sm text-gray-600 mt-1">
              Create an appointment from waitlist entry
            </p>
          </div>

          {/* Patient Info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Patient Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Patient:</span>{' '}
                <span className="text-blue-900">{waitlistEntry.patient_name || `Patient #${waitlistEntry.patient_id}`}</span>
              </div>
              {waitlistEntry.preferred_date && (
                <div>
                  <span className="text-blue-700 font-medium">Preferred Date:</span>{' '}
                  <span className="text-blue-900">
                    {new Date(waitlistEntry.preferred_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              )}
              {waitlistEntry.preferred_time && (
                <div>
                  <span className="text-blue-700 font-medium">Preferred Time:</span>{' '}
                  <span className="text-blue-900">{waitlistEntry.preferred_time}</span>
                </div>
              )}
              {waitlistEntry.reason && (
                <div className="md:col-span-2">
                  <span className="text-blue-700 font-medium">Reason:</span>{' '}
                  <span className="text-blue-900">{waitlistEntry.reason}</span>
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="appointment_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Appointment Date *
                </label>
                <input
                  type="date"
                  id="appointment_date"
                  {...form.register('appointment_date')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {form.formState.errors.appointment_date && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.appointment_date.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="appointment_time" className="block text-sm font-medium text-gray-700 mb-2">
                  Appointment Time *
                </label>
                <input
                  type="time"
                  id="appointment_time"
                  {...form.register('appointment_time')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {form.formState.errors.appointment_time && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.appointment_time.message}</p>
                )}
              </div>
            </div>

            {/* Doctor Selection */}
            <div>
              <label htmlFor="doctor_id" className="block text-sm font-medium text-gray-700 mb-2">
                Doctor *
              </label>
              <select
                id="doctor_id"
                {...form.register('doctor_id', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Select a doctor...</option>
                <option value={3}>Dr. Smith</option>
                <option value={4}>Dr. Johnson</option>
              </select>
              {form.formState.errors.doctor_id && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.doctor_id.message}</p>
              )}
            </div>

            {/* Duration and Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700 mb-2">
                  Duration *
                </label>
                <select
                  id="duration_minutes"
                  {...form.register('duration_minutes', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>

              <div>
                <label htmlFor="appointment_type" className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  id="appointment_type"
                  {...form.register('appointment_type')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="consultation">Consultation</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="emergency">Emergency</option>
                  <option value="procedure">Procedure</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                {...form.register('notes')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes or instructions..."
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {loading ? 'Converting...' : 'Convert to Appointment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
