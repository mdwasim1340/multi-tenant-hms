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
} from '@/lib/api/appointments';
import { getPatients, Patient } from '@/lib/api/patients';
import { getDoctors, Doctor } from '@/lib/api/doctors';
import { parseToLocalDateTime, combineLocalDateTime } from '@/lib/utils/datetime';

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
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const isEditMode = !!appointment;

  // Initialize form
  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(AppointmentFormSchema),
    defaultValues: {
      patient_id: 0,
      doctor_id: defaultDoctorId || 0,
      appointment_date: defaultDate || '',
      appointment_time: '',
      duration_minutes: 30,
      appointment_type: 'consultation',
      notes: '',
    },
  });

  // Load patients and doctors on component mount
  useEffect(() => {
    loadPatients();
    loadDoctors();
  }, []);

  // Update form when appointment prop changes (for reschedule)
  useEffect(() => {
    if (appointment) {
      // Parse the appointment date to local date and time
      const { date, time } = parseToLocalDateTime(appointment.appointment_date);

      form.reset({
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        appointment_date: date,
        appointment_time: time,
        duration_minutes: appointment.duration_minutes,
        appointment_type: appointment.appointment_type as any,
        notes: appointment.notes || '',
      });
    }
  }, [appointment, form]);

  const loadPatients = async () => {
    try {
      setLoadingPatients(true);
      const response = await getPatients({ limit: 100 });
      setPatients(response.data.patients);
    } catch (err) {
      console.error('Error loading patients:', err);
      setError('Failed to load patients. Please try again.');
      // Use mock data if API fails
      const mockPatients = [
        { id: 1, first_name: "John", last_name: "Doe", patient_number: "P001", email: "john.doe@email.com", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 2, first_name: "Jane", last_name: "Smith", patient_number: "P002", email: "jane.smith@email.com", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 3, first_name: "sonu", last_name: "", patient_number: "P003", email: "sonu@email.com", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ];
      setPatients(mockPatients);
    } finally {
      setLoadingPatients(false);
    }
  };

  const loadDoctors = async () => {
    try {
      setLoadingDoctors(true);
      // Use mock doctors since the API doesn't exist yet
      const mockDoctors = [
        { id: 1, name: "Dr. James Smith", specialty: "Cardiology", email: "james.smith@hospital.com", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 2, name: "Dr. Emily Johnson", specialty: "Internal Medicine", email: "emily.johnson@hospital.com", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 3, name: "Dr. Robert Williams", specialty: "Cardiology", email: "robert.williams@hospital.com", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ];
      setDoctors(mockDoctors);
    } catch (err) {
      console.error('Error loading doctors:', err);
      setError('Failed to load doctors. Please try again.');
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Slot fetching removed from form

  const onSubmit = async (data: AppointmentFormData) => {
    try {
      setLoading(true);
      setError(null);

      // Combine date and time preserving local timezone
      const datetime = combineLocalDateTime(data.appointment_date, data.appointment_time);

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
        // For update, only send the fields that can be updated
        result = await updateAppointment(appointment.id, {
          appointment_date: datetime,
          duration_minutes: data.duration_minutes,
          appointment_type: data.appointment_type,
          notes: data.notes,
        });
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

  // Slot selection UI removed

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditMode ? 'Edit Appointment' : 'Create Appointment'}
      </h2>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Patient Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="patient_id" className="block text-sm font-medium text-gray-700">
              Patient *
            </label>
            <button
              type="button"
              onClick={() => window.open('/patient-registration', '_blank')}
              className="text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Register New Patient
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder={loadingPatients ? 'Loading patients...' : 'Type patient name to search...'}
              value={patientSearch}
              onChange={(e) => {
                setPatientSearch(e.target.value);
                setShowPatientDropdown(true);
              }}
              onFocus={() => setShowPatientDropdown(true)}
              disabled={loadingPatients}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {showPatientDropdown && patientSearch && !loadingPatients && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {patients
                  .filter(p => {
                    const searchLower = patientSearch.toLowerCase();
                    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
                    const patientNum = (p.patient_number || '').toLowerCase();
                    return fullName.includes(searchLower) || patientNum.includes(searchLower);
                  })
                  .map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        form.setValue('patient_id', p.id);
                        setPatientSearch(`${p.first_name} ${p.last_name}`);
                        setShowPatientDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                    >
                      <div className="font-medium text-gray-900">
                        {p.first_name} {p.last_name}
                      </div>
                      {p.patient_number && (
                        <div className="text-sm text-gray-600">
                          {p.patient_number}
                        </div>
                      )}
                    </button>
                  ))}
                {patients.filter(p => {
                  const searchLower = patientSearch.toLowerCase();
                  const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
                  const patientNum = (p.patient_number || '').toLowerCase();
                  return fullName.includes(searchLower) || patientNum.includes(searchLower);
                }).length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-600 text-center">
                    No patients found. Try a different search or register a new patient.
                  </div>
                )}
              </div>
            )}
          </div>
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
            disabled={loadingDoctors}
          >
            <option value={0}>
              {loadingDoctors ? 'Loading doctors...' : 'Select a doctor...'}
            </option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name} {doctor.specialty ? `(${doctor.specialty})` : ''}
              </option>
            ))}
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

        {/* Calendar slots are available in Calendar View only */}

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
