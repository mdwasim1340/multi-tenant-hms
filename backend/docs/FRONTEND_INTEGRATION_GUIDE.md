# Frontend Integration Guide - Appointment Management

**Team:** Alpha  
**Target:** Week 3 Frontend Development  
**Status:** Ready for Integration

---

## Overview

This guide provides everything the frontend team needs to integrate the Appointment Management API into the Hospital Management System frontend.

**Prerequisites:**
- ✅ Backend API running on port 3000
- ✅ Patient Management API integrated
- ✅ Authentication system working
- ✅ Multi-tenant context established

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [API Client Setup](#api-client-setup)
3. [Calendar Integration](#calendar-integration)
4. [Time Slot Picker](#time-slot-picker)
5. [Appointment Forms](#appointment-forms)
6. [Status Management](#status-management)
7. [Error Handling](#error-handling)
8. [Testing](#testing)

---

## Quick Start

### 1. Install Dependencies

```bash
cd hospital-management-system
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction
npm install date-fns  # For date formatting
```

### 2. Create API Client

```typescript
// lib/api/appointments.ts
import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

// Add auth headers to all requests
api.interceptors.request.use((config) => {
  const token = Cookies.get('auth_token');
  const tenantId = Cookies.get('tenant_id');
  
  config.headers['Authorization'] = `Bearer ${token}`;
  config.headers['X-Tenant-ID'] = tenantId;
  config.headers['X-App-ID'] = 'hospital_system';
  config.headers['X-API-Key'] = process.env.NEXT_PUBLIC_API_KEY;
  
  return config;
});

export default api;
```

### 3. Create Custom Hook

```typescript
// hooks/useAppointments.ts
import { useState, useEffect } from 'react';
import api from '@/lib/api/appointments';

export function useAppointments(filters = {}) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, [filters]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/appointments', { params: filters });
      setAppointments(response.data.data.appointments);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { appointments, loading, error, refetch: fetchAppointments };
}
```

---

## API Client Setup

### Complete API Client

```typescript
// lib/api/appointments.ts
import api from './client';

export interface Appointment {
  id: number;
  appointment_number: string;
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  appointment_end_time: string;
  duration_minutes: number;
  appointment_type: string;
  chief_complaint?: string;
  notes?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  patient: {
    id: number;
    first_name: string;
    last_name: string;
    patient_number: string;
    phone?: string;
    email?: string;
  };
  doctor: {
    id: number;
    name: string;
    email: string;
  };
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  available: boolean;
  duration_minutes: number;
}

export const appointmentsApi = {
  // List appointments
  list: async (params?: any) => {
    const response = await api.get('/api/appointments', { params });
    return response.data.data;
  },

  // Get available slots
  getAvailableSlots: async (doctorId: number, date: string, duration = 30) => {
    const response = await api.get('/api/appointments/available-slots', {
      params: { doctor_id: doctorId, date, duration_minutes: duration }
    });
    return response.data.data.slots as TimeSlot[];
  },

  // Create appointment
  create: async (data: any) => {
    const response = await api.post('/api/appointments', data);
    return response.data.data.appointment;
  },

  // Get appointment details
  get: async (id: number) => {
    const response = await api.get(`/api/appointments/${id}`);
    return response.data.data.appointment;
  },

  // Update appointment
  update: async (id: number, data: any) => {
    const response = await api.put(`/api/appointments/${id}`, data);
    return response.data.data.appointment;
  },

  // Confirm appointment
  confirm: async (id: number) => {
    const response = await api.post(`/api/appointments/${id}/confirm`);
    return response.data.data.appointment;
  },

  // Complete appointment
  complete: async (id: number) => {
    const response = await api.post(`/api/appointments/${id}/complete`);
    return response.data.data.appointment;
  },

  // Mark no-show
  markNoShow: async (id: number) => {
    const response = await api.post(`/api/appointments/${id}/no-show`);
    return response.data.data.appointment;
  },

  // Cancel appointment
  cancel: async (id: number, reason: string) => {
    const response = await api.delete(`/api/appointments/${id}`, {
      data: { reason }
    });
    return response.data.data.appointment;
  },
};
```

---

## Calendar Integration

### FullCalendar Setup

```typescript
// components/appointments/AppointmentCalendar.tsx
'use client';

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { appointmentsApi } from '@/lib/api/appointments';
import { toast } from 'sonner';

export function AppointmentCalendar() {
  const [events, setEvents] = useState([]);

  const fetchAppointments = async (start: Date, end: Date) => {
    try {
      const data = await appointmentsApi.list({
        date_from: start.toISOString().split('T')[0],
        date_to: end.toISOString().split('T')[0],
        limit: 1000
      });

      const calendarEvents = data.appointments.map((apt: any) => ({
        id: apt.id,
        title: `${apt.patient.first_name} ${apt.patient.last_name}`,
        start: apt.appointment_date,
        end: apt.appointment_end_time,
        backgroundColor: getStatusColor(apt.status),
        extendedProps: {
          patientNumber: apt.patient.patient_number,
          doctorName: apt.doctor.name,
          type: apt.appointment_type,
          status: apt.status
        }
      }));

      setEvents(calendarEvents);
    } catch (error) {
      toast.error('Failed to load appointments');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: '#3b82f6',    // blue
      confirmed: '#10b981',    // green
      completed: '#6b7280',    // gray
      cancelled: '#ef4444',    // red
      no_show: '#f59e0b'       // amber
    };
    return colors[status] || '#3b82f6';
  };

  const handleEventClick = (info: any) => {
    // Open appointment details modal
    console.log('Appointment clicked:', info.event.id);
  };

  const handleDateSelect = (selectInfo: any) => {
    // Open create appointment modal with selected date/time
    console.log('Date selected:', selectInfo.start);
  };

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="timeGridWeek"
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      }}
      editable={true}
      selectable={true}
      selectMirror={true}
      dayMaxEvents={true}
      weekends={true}
      events={events}
      eventClick={handleEventClick}
      select={handleDateSelect}
      datesSet={(dateInfo) => {
        fetchAppointments(dateInfo.start, dateInfo.end);
      }}
      slotMinTime="08:00:00"
      slotMaxTime="18:00:00"
      height="auto"
    />
  );
}
```

---

## Time Slot Picker

### Available Slots Component

```typescript
// components/appointments/TimeSlotPicker.tsx
'use client';

import { useState, useEffect } from 'react';
import { appointmentsApi, TimeSlot } from '@/lib/api/appointments';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface TimeSlotPickerProps {
  doctorId: number;
  date: string;
  duration?: number;
  onSelect: (slot: TimeSlot) => void;
  selectedSlot?: TimeSlot;
}

export function TimeSlotPicker({
  doctorId,
  date,
  duration = 30,
  onSelect,
  selectedSlot
}: TimeSlotPickerProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSlots();
  }, [doctorId, date, duration]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const data = await appointmentsApi.getAvailableSlots(doctorId, date, duration);
      setSlots(data);
    } catch (error) {
      toast.error('Failed to load available slots');
    } finally {
      setLoading(false);
    }
  };

  const availableSlots = slots.filter(slot => slot.available);

  if (loading) {
    return <div>Loading available slots...</div>;
  }

  if (availableSlots.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No available slots for this date. Please select another date.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {availableSlots.map((slot, index) => {
        const startTime = new Date(slot.start_time);
        const isSelected = selectedSlot?.start_time === slot.start_time;

        return (
          <button
            key={index}
            onClick={() => onSelect(slot)}
            className={`
              px-4 py-2 rounded-lg border transition-colors
              ${isSelected
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
              }
            `}
          >
            {format(startTime, 'h:mm a')}
          </button>
        );
      })}
    </div>
  );
}
```

---

## Appointment Forms

### Create Appointment Form

```typescript
// components/appointments/CreateAppointmentForm.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { appointmentsApi } from '@/lib/api/appointments';
import { TimeSlotPicker } from './TimeSlotPicker';
import { toast } from 'sonner';

const appointmentSchema = z.object({
  patient_id: z.number(),
  doctor_id: z.number(),
  appointment_date: z.string(),
  duration_minutes: z.number().default(30),
  appointment_type: z.string(),
  chief_complaint: z.string().optional(),
  notes: z.string().optional(),
});

export function CreateAppointmentForm({ onSuccess }: { onSuccess?: () => void }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(appointmentSchema)
  });

  const doctorId = watch('doctor_id');

  const onSubmit = async (data: any) => {
    if (!selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }

    try {
      setLoading(true);
      await appointmentsApi.create({
        ...data,
        appointment_date: selectedSlot.start_time
      });
      toast.success('Appointment created successfully');
      onSuccess?.();
    } catch (error: any) {
      if (error.response?.data?.error?.includes('conflict')) {
        toast.error('Time slot no longer available. Please select another slot.');
      } else {
        toast.error('Failed to create appointment');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Patient Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">Patient</label>
        <select {...register('patient_id', { valueAsNumber: true })} className="w-full">
          <option value="">Select patient...</option>
          {/* Load patients from API */}
        </select>
        {errors.patient_id && (
          <p className="text-red-500 text-sm mt-1">{errors.patient_id.message}</p>
        )}
      </div>

      {/* Doctor Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">Doctor</label>
        <select {...register('doctor_id', { valueAsNumber: true })} className="w-full">
          <option value="">Select doctor...</option>
          {/* Load doctors from API */}
        </select>
      </div>

      {/* Date Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full"
        />
      </div>

      {/* Time Slot Picker */}
      {doctorId && selectedDate && (
        <div>
          <label className="block text-sm font-medium mb-2">Available Time Slots</label>
          <TimeSlotPicker
            doctorId={doctorId}
            date={selectedDate}
            onSelect={setSelectedSlot}
            selectedSlot={selectedSlot}
          />
        </div>
      )}

      {/* Appointment Type */}
      <div>
        <label className="block text-sm font-medium mb-2">Appointment Type</label>
        <select {...register('appointment_type')} className="w-full">
          <option value="consultation">Consultation</option>
          <option value="follow_up">Follow-up</option>
          <option value="procedure">Procedure</option>
          <option value="emergency">Emergency</option>
        </select>
      </div>

      {/* Chief Complaint */}
      <div>
        <label className="block text-sm font-medium mb-2">Chief Complaint</label>
        <textarea {...register('chief_complaint')} rows={3} className="w-full" />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-2">Notes</label>
        <textarea {...register('notes')} rows={3} className="w-full" />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !selectedSlot}
        className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Appointment'}
      </button>
    </form>
  );
}
```

---

## Status Management

### Status Management Component

```typescript
// components/appointments/AppointmentActions.tsx
'use client';

import { appointmentsApi } from '@/lib/api/appointments';
import { toast } from 'sonner';

interface AppointmentActionsProps {
  appointmentId: number;
  currentStatus: string;
  onUpdate: () => void;
}

export function AppointmentActions({
  appointmentId,
  currentStatus,
  onUpdate
}: AppointmentActionsProps) {
  const handleConfirm = async () => {
    try {
      await appointmentsApi.confirm(appointmentId);
      toast.success('Appointment confirmed');
      onUpdate();
    } catch (error) {
      toast.error('Failed to confirm appointment');
    }
  };

  const handleComplete = async () => {
    try {
      await appointmentsApi.complete(appointmentId);
      toast.success('Appointment marked as complete');
      onUpdate();
    } catch (error) {
      toast.error('Failed to complete appointment');
    }
  };

  const handleNoShow = async () => {
    try {
      await appointmentsApi.markNoShow(appointmentId);
      toast.warning('Appointment marked as no-show');
      onUpdate();
    } catch (error) {
      toast.error('Failed to mark as no-show');
    }
  };

  const handleCancel = async () => {
    const reason = prompt('Please enter cancellation reason:');
    if (!reason) return;

    try {
      await appointmentsApi.cancel(appointmentId, reason);
      toast.success('Appointment cancelled');
      onUpdate();
    } catch (error) {
      toast.error('Failed to cancel appointment');
    }
  };

  return (
    <div className="flex gap-2">
      {currentStatus === 'scheduled' && (
        <button onClick={handleConfirm} className="btn-primary">
          Confirm
        </button>
      )}
      
      {(currentStatus === 'scheduled' || currentStatus === 'confirmed') && (
        <>
          <button onClick={handleComplete} className="btn-success">
            Complete
          </button>
          <button onClick={handleNoShow} className="btn-warning">
            No-Show
          </button>
          <button onClick={handleCancel} className="btn-danger">
            Cancel
          </button>
        </>
      )}
    </div>
  );
}
```

---

## Error Handling

### Global Error Handler

```typescript
// lib/api/errorHandler.ts
import { toast } from 'sonner';

export function handleApiError(error: any) {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;

    switch (status) {
      case 400:
        toast.error(data.error || 'Invalid request');
        break;
      case 401:
        toast.error('Please sign in again');
        // Redirect to login
        break;
      case 403:
        toast.error('You don\'t have permission to perform this action');
        break;
      case 404:
        toast.error('Resource not found');
        break;
      case 409:
        toast.error(data.error || 'Conflict detected');
        break;
      default:
        toast.error('An error occurred. Please try again.');
    }
  } else if (error.request) {
    // Request made but no response
    toast.error('Network error. Please check your connection.');
  } else {
    // Something else happened
    toast.error('An unexpected error occurred');
  }
}
```

---

## Testing

### Component Testing

```typescript
// __tests__/appointments/TimeSlotPicker.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { TimeSlotPicker } from '@/components/appointments/TimeSlotPicker';
import { appointmentsApi } from '@/lib/api/appointments';

jest.mock('@/lib/api/appointments');

describe('TimeSlotPicker', () => {
  it('displays available slots', async () => {
    const mockSlots = [
      { start_time: '2025-11-18T09:00:00Z', end_time: '2025-11-18T09:30:00Z', available: true, duration_minutes: 30 },
      { start_time: '2025-11-18T09:30:00Z', end_time: '2025-11-18T10:00:00Z', available: false, duration_minutes: 30 },
    ];

    (appointmentsApi.getAvailableSlots as jest.Mock).mockResolvedValue(mockSlots);

    render(
      <TimeSlotPicker
        doctorId={1}
        date="2025-11-18"
        onSelect={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    });
  });
});
```

---

## Next Steps

1. **Week 3, Day 1-2**: Implement calendar component
2. **Week 3, Day 3-4**: Implement appointment forms
3. **Week 3, Day 5**: Implement status management
4. **Week 4**: Testing and polish

---

**Team Alpha** - Ready for frontend integration! 🚀
