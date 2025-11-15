/**
 * Team Alpha - Appointments Calendar Page
 * Main page for viewing appointments in calendar format
 */

'use client';

import { useState } from 'react';
import AppointmentCalendar from '@/components/appointments/AppointmentCalendar';
import { Appointment } from '@/lib/api/appointments';
import { useRouter } from 'next/navigation';

export default function AppointmentsCalendarPage() {
  const router = useRouter();
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | undefined>();

  // Handle appointment click - navigate to details
  const handleAppointmentClick = (appointment: Appointment) => {
    router.push(`/appointments/${appointment.id}`);
  };

  // Handle date select - navigate to create appointment
  const handleDateSelect = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    router.push(`/appointments/new?date=${dateStr}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Appointments Calendar
        </h1>
        <p className="text-gray-600">
          View and manage all appointments in calendar format
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="doctor-filter" className="text-sm font-medium text-gray-700">
            Filter by Doctor:
          </label>
          <select
            id="doctor-filter"
            value={selectedDoctorId || ''}
            onChange={(e) => setSelectedDoctorId(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Doctors</option>
            {/* TODO: Load doctors from API */}
            <option value="3">Dr. Smith</option>
            <option value="4">Dr. Johnson</option>
          </select>
        </div>

        <button
          onClick={() => router.push('/appointments/new')}
          className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Appointment
        </button>
      </div>

      {/* Calendar */}
      <AppointmentCalendar
        doctorId={selectedDoctorId}
        onAppointmentClick={handleAppointmentClick}
        onDateSelect={handleDateSelect}
        height="calc(100vh - 300px)"
      />

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => router.push('/appointments')}
          className="p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">List View</h3>
              <p className="text-sm text-gray-600">View appointments in list format</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push('/appointments/recurring')}
          className="p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Recurring</h3>
              <p className="text-sm text-gray-600">Manage recurring appointments</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push('/appointments/waitlist')}
          className="p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Waitlist</h3>
              <p className="text-sm text-gray-600">Manage appointment waitlist</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
