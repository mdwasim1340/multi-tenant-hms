/**
 * Team Alpha - Appointment Calendar Component
 * Interactive calendar for viewing and managing appointments
 */

'use client';

import { useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Appointment } from '@/lib/api/appointments';
import { useAppointmentsCalendar } from '@/hooks/useAppointments';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';

interface AppointmentCalendarProps {
  doctorId?: number;
  onAppointmentClick?: (appointment: Appointment) => void;
  onDateSelect?: (date: Date) => void;
  height?: string | number;
}

// Status colors for appointments
const statusColors = {
  scheduled: { bg: '#3B82F6', border: '#2563EB', text: '#FFFFFF' },    // Blue
  confirmed: { bg: '#10B981', border: '#059669', text: '#FFFFFF' },    // Green
  completed: { bg: '#6B7280', border: '#4B5563', text: '#FFFFFF' },    // Gray
  cancelled: { bg: '#EF4444', border: '#DC2626', text: '#FFFFFF' },    // Red
  no_show: { bg: '#F59E0B', border: '#D97706', text: '#FFFFFF' },      // Orange
};

export default function AppointmentCalendar({
  doctorId,
  onAppointmentClick,
  onDateSelect,
  height = '700px',
}: AppointmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('dayGridMonth');

  // Calculate date range for API call
  const dateFrom = useMemo(() => {
    const start = startOfMonth(subMonths(currentDate, 1));
    return format(start, 'yyyy-MM-dd');
  }, [currentDate]);

  const dateTo = useMemo(() => {
    const end = endOfMonth(addMonths(currentDate, 1));
    return format(end, 'yyyy-MM-dd');
  }, [currentDate]);

  // Fetch appointments
  const { appointments, loading, error, refetch } = useAppointmentsCalendar(
    dateFrom,
    dateTo,
    doctorId
  );

  // Transform appointments to calendar events
  const calendarEvents = useMemo(() => {
    return appointments.map((apt) => {
      const startDate = new Date(apt.appointment_date);
      const endDate = new Date(startDate.getTime() + apt.duration_minutes * 60000);
      const colors = statusColors[apt.status] || statusColors.scheduled;

      return {
        id: apt.id.toString(),
        title: `${apt.patient.first_name} ${apt.patient.last_name}`,
        start: apt.appointment_date,
        end: endDate.toISOString(),
        backgroundColor: colors.bg,
        borderColor: colors.border,
        textColor: colors.text,
        extendedProps: {
          appointment: apt,
          patientName: `${apt.patient.first_name} ${apt.patient.last_name}`,
          doctorName: apt.doctor.name,
          type: apt.appointment_type,
          status: apt.status,
          duration: apt.duration_minutes,
        },
      };
    });
  }, [appointments]);

  // Handle event click
  const handleEventClick = (info: any) => {
    const appointment = info.event.extendedProps.appointment as Appointment;
    if (onAppointmentClick) {
      onAppointmentClick(appointment);
    }
  };

  // Handle date select
  const handleDateSelect = (selectInfo: any) => {
    const selectedDate = new Date(selectInfo.start);
    if (onDateSelect) {
      onDateSelect(selectedDate);
    }
  };

  // Handle date change (navigation)
  const handleDatesSet = (dateInfo: any) => {
    setCurrentDate(new Date(dateInfo.start));
  };

  // Loading state
  if (loading && appointments.length === 0) {
    return (
      <div className="flex items-center justify-center h-[700px] bg-white rounded-lg border border-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  // In case of error, continue to render the calendar with an empty state

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 relative">
      {/* Calendar Header Info */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Appointments Calendar</h3>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Updating...</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">{appointments.length}</span>
          <span>appointments</span>
        </div>
      </div>

      {/* Status Legend */}
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        {Object.entries(statusColors).map(([status, colors]) => (
          <div key={status} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: colors.bg }}
            />
            <span className="text-gray-700 capitalize">{status.replace('_', ' ')}</span>
          </div>
        ))}
      </div>

      {/* FullCalendar */}
      <div style={{ height }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={view}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          events={calendarEvents}
          eventClick={handleEventClick}
          select={handleDateSelect}
          datesSet={handleDatesSet}
          editable={false}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          height="100%"
          slotMinTime="07:00:00"
          slotMaxTime="20:00:00"
          slotDuration="00:30:00"
          allDaySlot={false}
          nowIndicator={true}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: 'short',
          }}
          eventContent={(eventInfo: any) => {
            const { patientName, type, duration, status } = eventInfo.event.extendedProps;
            return (
              <div className="p-1 overflow-hidden">
                <div className="font-medium text-xs truncate">{patientName}</div>
                <div className="text-xs opacity-90 truncate">{type}</div>
                <div className="text-xs opacity-75">{duration} min</div>
              </div>
            );
          }}
        />
      </div>

      {/* Empty State */}
      {appointments.length === 0 && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-600 font-medium mb-2">No appointments scheduled</p>
            <p className="text-gray-500 text-sm">Appointments will appear here once scheduled</p>
          </div>
        </div>
      )}
    </div>
  );
}
