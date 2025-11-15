/**
 * Team Alpha - New Appointment Page
 * Page for creating new appointments
 */

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import AppointmentForm from '@/components/appointments/AppointmentForm';
import { Appointment } from '@/lib/api/appointments';

export default function NewAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get default values from URL params
  const defaultDate = searchParams.get('date') || undefined;
  const defaultDoctorId = searchParams.get('doctor_id') ? Number(searchParams.get('doctor_id')) : undefined;

  const handleSuccess = (appointment: Appointment) => {
    // Show success message (you can add toast notification here)
    console.log('Appointment created:', appointment);
    
    // Redirect to appointment details or calendar
    router.push(`/appointments/${appointment.id}`);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900">
          New Appointment
        </h1>
        <p className="text-gray-600 mt-2">
          Schedule a new appointment for a patient
        </p>
      </div>

      {/* Appointment Form */}
      <div className="max-w-3xl">
        <AppointmentForm
          defaultDate={defaultDate}
          defaultDoctorId={defaultDoctorId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
