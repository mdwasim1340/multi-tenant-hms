/**
 * Team Alpha - New Appointment Page
 * Page for creating new appointments
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/top-bar';
import AppointmentForm from '@/components/appointments/AppointmentForm';
import { Appointment, getAppointmentById } from '@/lib/api/appointments';
import { Loader2 } from 'lucide-react';

export default function NewAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Get default values from URL params
  const defaultDate = searchParams.get('date') || undefined;
  const defaultDoctorId = searchParams.get('doctor_id') ? Number(searchParams.get('doctor_id')) : undefined;
  const rescheduleId = searchParams.get('reschedule') ? Number(searchParams.get('reschedule')) : undefined;

  // Load appointment to reschedule if reschedule parameter is present
  useEffect(() => {
    if (rescheduleId) {
      loadAppointmentToReschedule(rescheduleId);
    }
  }, [rescheduleId]);

  const loadAppointmentToReschedule = async (id: number) => {
    try {
      setLoading(true);
      const response = await getAppointmentById(id);
      setAppointmentToReschedule(response.data.appointment);
    } catch (error) {
      console.error('Error loading appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (appointment: Appointment) => {
    // Show success message (you can add toast notification here)
    console.log('Appointment created:', appointment);
    
    // Redirect back to appointments page to show the new appointment in both Calendar View and Appointment List
    router.push('/appointments?created=true');
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-3xl mx-auto px-6 space-y-6">
            {/* Page Header */}
            <div className="mb-6">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              
              <h1 className="text-3xl font-bold text-foreground">
                {rescheduleId ? 'Reschedule Appointment' : 'New Appointment'}
              </h1>
              <p className="text-muted-foreground mt-2">
                {rescheduleId 
                  ? 'Update the appointment date and time'
                  : 'Schedule a new appointment for a patient'
                }
              </p>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {/* Appointment Form */}
            {!loading && (
              <AppointmentForm
                appointment={appointmentToReschedule || undefined}
                defaultDate={defaultDate}
                defaultDoctorId={defaultDoctorId}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
