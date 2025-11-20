/**
 * Team Alpha - Appointments Calendar Page
 * Main page for viewing appointments in calendar format
 */

'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/top-bar';
import AppointmentCalendar from '@/components/appointments/AppointmentCalendar';
import { Appointment } from '@/lib/api/appointments';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function AppointmentsCalendarPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-6 space-y-6">
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Appointments Calendar
              </h1>
              <p className="text-muted-foreground">
                View and manage all appointments in calendar format
              </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label htmlFor="doctor-filter" className="text-sm font-medium text-foreground">
                  Filter by Doctor:
                </label>
                <select
                  id="doctor-filter"
                  value={selectedDoctorId || ''}
                  onChange={(e) => setSelectedDoctorId(e.target.value ? Number(e.target.value) : undefined)}
                  className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                >
                  <option value="">All Doctors</option>
                  {/* TODO: Load doctors from API */}
                  <option value="3">Dr. Smith</option>
                  <option value="4">Dr. Johnson</option>
                </select>
              </div>

              <Button
                onClick={() => router.push('/appointments/new')}
                className="ml-auto bg-primary hover:bg-primary/90"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Appointment
              </Button>
            </div>

            {/* Calendar */}
            <AppointmentCalendar
              doctorId={selectedDoctorId}
              onAppointmentClick={handleAppointmentClick}
              onDateSelect={handleDateSelect}
              height="calc(100vh - 350px)"
            />

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card
                className="border-border/50 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push('/appointments')}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">List View</h3>
                      <p className="text-sm text-muted-foreground">View appointments in list format</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="border-border/50 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push('/appointments/appointment-queue')}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-950 rounded-lg">
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Queue</h3>
                      <p className="text-sm text-muted-foreground">Manage appointment queue</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="border-border/50 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push('/appointments/waitlist')}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-950 rounded-lg">
                      <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Waitlist</h3>
                      <p className="text-sm text-muted-foreground">Manage appointment waitlist</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
