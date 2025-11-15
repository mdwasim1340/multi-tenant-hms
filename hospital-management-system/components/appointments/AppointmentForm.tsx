/**
 * Team Alpha - Appointment Form Component
 * Create/Edit appointment form with validation and conflict checking
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Appointment,
  createAppointment,
  updateAppointment,
  getAvailableSlots,
} from '@/lib/api/appointments';

// Form validation schema
const AppointmentFormSchema = z.object({
  patient_id: z.number().positive('Please select a patient'),
  doctor_id: z.number().positive('Please select a doctor'),
  appointment_date: z.string().min(1, 'Please select a date'),
  appointment_time: z.string().min(1, 'Please select a time'),
  duration_minutes: z.number().positive().default(30),
  appointment_type: z.enum(['consultation', 'follow_up', 'emergency', 'procedure']),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof AppointmentFormSchema>;

interface AppointmentFormProps {
  appointment?: Appointment;
  onSuccess?: (appointment: Appointment) => void;
  onCancel?: () => void;
  defaultDate?: string;
  defaultDoctorId?: number;
}

export default function AppointmentForm({
  appointment,
  onSuccess,
  onCancel,
  defaultDate,
  defaultDoctorId,
}: AppointmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const isEditMode = !!appointment;

  // Initialize form
  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(AppointmentFormSchema),
    defaultValues: {
      patient_id: appointment?.patient_id || 0,
      doctor_id: appointment?.doctor_id || defaultDoctorId || 0,
      appointment_date: appointment?.appointment_date?.split('T')[0] || defaultDate || '',
      appointment_time: appointment?.appointment_date?.split('T')[1]?.substring(0, 5) || '',
      duration_minutes: appointment?.duration_minutes || 30,
      appointment_type: (appointment?.appointment_type as any) || 'consultation',
      notes: appointment?.notes || '',
    },
  });

  const watchDoctorId = form.watch('doctor_id');
  const watchDate = form.watch('appointment_date');
  const watchDuration = form.watch('duration_minutes');

  // Fetch available slots when doctor/date changes
  useEffect(() => {
    if (watchDoctorId && watchDate) {
      fetchAvailableSlots();
    }
  }, [watchDoctorId, watchDate, watchDuration]);

  const fetchAvailableSlots = async () => {
    try {
      setLoadingSlots(true);
      const response = await getAvailableSlots({
        doctor_id: watchDoctorId,
        date: watchDate,
        duration_minutes: watchDuration,
      });
      setAvailableSlots(response.data.slots || []);
    } catch (err) {
      console.error('Error fetching available slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const onSubmit = async (data: AppointmentFormData) => {
    try {
      setLoading(true);
      setError(null);

      // Combine date and time
      const datetime = `${data.appointment_date}T${data.appointment_time}:00.000Z`;

      const appointmentData = {
        patient_id: data.patient_id,
        doctor_id: data.doctor_id,
        appointment_date: datetime,
        duration_minutes: data.duration_minutes,
        appointment_type: data.appointment_type,
        notes: data.notes,
      };

      let result;
      if (isEditMode && appointment) {
        result = await updateAppointment(appointment.id, appointmentData);
      } else {
        result = await createAppointment(appointmentData);
      }

      if (result.success && onSuccess) {
        onSuccess(result.data.appointment);
      }
    } catch (err: any) {
      console.error('Error saving appointment:', err);
      setError(err.response?.data?.error || err.message || 'Failed to save appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = (slot: any) => {
    if (slot.available) {
      const time = new Date(slot.start_time).toTimeString().substring(0, 5);
      form.setValue('appointment_time', time);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditMode ? 'Edit Appointment' : 'Create Appointment'}
      </h2>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Patient Selection */}
        <div>
          <label htmlFor="patient_id" className="block text-sm font-medium text-gray-700 mb-2">
            Patient *
          </label>
          <select
            id="patient_id"
            {...form.register('patient_id', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={0}>Select a patient...</option>
            {/* TODO: Load patients from API */}
            <option value={5}>John Doe (P001)</option>
            <option value={6}>Jane Smith (P002)</option>
          </select>
          {form.formState.errors.patient_id && (
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.patient_id.message}</p>
          )}
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
            {/* TODO: Load doctors from API */}
            <option value={3}>Dr. Smith</option>
            <option value={4}>Dr. Johnson</option>
          </select>
          {form.formState.errors.doctor_id && (
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.doctor_id.message}</p>
          )}
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="appointment_date" className="block text-sm font-medium text-gray-700 mb-2">
              Date *
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
              Time *
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

        {/* Available Slots */}
        {watchDoctorId > 0 && watchDate && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Time Slots
            </label>
            {loadingSlots ? (
              <div className="text-sm text-gray-600">Loading available slots...</div>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {availableSlots.map((slot, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSlotClick(slot)}
                    disabled={!slot.available}
                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                      slot.available
                        ? 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {new Date(slot.start_time).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-600">No available slots for this date</div>
            )}
          </div>
        )}

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
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {loading ? 'Saving...' : isEditMode ? 'Update Appointment' : 'Create Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
}
