# Team B Week 2, Day 1: Setup & Calendar Architecture

## 🎯 Task Objective
Setup appointment types, API functions, calendar library, and date/time utilities.

## ⏱️ Estimated Time: 6-8 hours

## 📝 Step 1: Install Dependencies

```bash
cd hospital-management-system
npm install react-big-calendar date-fns
npm install -D @types/react-big-calendar
```

## 📝 Step 2: Create Appointment Types

Create file: `hospital-management-system/types/appointment.ts`

```typescript
export interface Appointment {
  id: number;
  appointment_number: string;
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  appointment_end_time: string;
  duration_minutes: number;
  status: AppointmentStatus;
  appointment_type: string;
  chief_complaint?: string;
  notes?: string;
  patient?: {
    id: number;
    first_name: string;
    last_name: string;
    patient_number: string;
    phone?: string;
  };
  doctor?: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface CreateAppointmentData {
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  duration_minutes: number;
  appointment_type: string;
  chief_complaint?: string;
  notes?: string;
}

export interface AvailabilitySlot {
  start_time: string;
  end_time: string;
  available: boolean;
  reason?: string;
}

export interface DailyAvailability {
  date: string;
  doctor_id: number;
  available_slots: AvailabilitySlot[];
  total_slots: number;
  available_count: number;
}

export interface AppointmentSearchParams {
  page?: number;
  limit?: number;
  patient_id?: number;
  doctor_id?: number;
  status?: AppointmentStatus;
  appointment_type?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}
```

## 📝 Step 3: Create Appointment API Functions

Create file: `hospital-management-system/lib/api/appointments.ts`

```typescript
import apiClient from './client';
import { Appointment, CreateAppointmentData, AppointmentSearchParams, DailyAvailability } from '@/types/appointment';

export const appointmentApi = {
  list: async (params: AppointmentSearchParams = {}) => {
    const response = await apiClient.get('/api/appointments', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/api/appointments/${id}`);
    return response.data;
  },

  create: async (data: CreateAppointmentData) => {
    const response = await apiClient.post('/api/appointments', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateAppointmentData>) => {
    const response = await apiClient.put(`/api/appointments/${id}`, data);
    return response.data;
  },

  cancel: async (id: number, reason: string) => {
    const response = await apiClient.delete(`/api/appointments/${id}`, {
      data: { reason },
    });
    return response.data;
  },

  checkDailyAvailability: async (doctorId: number, date: string, durationMinutes: number = 30) => {
    const response = await apiClient.get('/api/appointments/availability/daily', {
      params: { doctor_id: doctorId, date, duration_minutes: durationMinutes },
    });
    return response.data;
  },

  checkWeeklyAvailability: async (doctorId: number, startDate: string) => {
    const response = await apiClient.get('/api/appointments/availability/weekly', {
      params: { doctor_id: doctorId, start_date: startDate },
    });
    return response.data;
  },
};
```

## 📝 Step 4: Create Date/Time Utilities

Create file: `hospital-management-system/lib/utils/date-time.ts`

```typescript
import { format, parse, addMinutes, isBefore, isAfter, isSameDay } from 'date-fns';

export const dateTimeUtils = {
  formatDate: (date: string | Date) => {
    return format(new Date(date), 'MMM dd, yyyy');
  },

  formatTime: (date: string | Date) => {
    return format(new Date(date), 'h:mm a');
  },

  formatDateTime: (date: string | Date) => {
    return format(new Date(date), 'MMM dd, yyyy h:mm a');
  },

  toISOString: (date: Date) => {
    return date.toISOString();
  },

  addMinutes: (date: Date, minutes: number) => {
    return addMinutes(date, minutes);
  },

  isTimeSlotAvailable: (
    slotStart: Date,
    slotEnd: Date,
    existingAppointments: Array<{ start: Date; end: Date }>
  ) => {
    return !existingAppointments.some((apt) => {
      return (
        (slotStart >= apt.start && slotStart < apt.end) ||
        (slotEnd > apt.start && slotEnd <= apt.end) ||
        (slotStart <= apt.start && slotEnd >= apt.end)
      );
    });
  },

  generateTimeSlots: (startTime: string, endTime: string, slotDuration: number) => {
    const slots: Array<{ start: Date; end: Date; label: string }> = [];
    const start = parse(startTime, 'HH:mm', new Date());
    const end = parse(endTime, 'HH:mm', new Date());

    let current = start;
    while (isBefore(current, end)) {
      const slotEnd = addMinutes(current, slotDuration);
      if (isBefore(slotEnd, end) || slotEnd.getTime() === end.getTime()) {
        slots.push({
          start: current,
          end: slotEnd,
          label: `${format(current, 'h:mm a')} - ${format(slotEnd, 'h:mm a')}`,
        });
      }
      current = slotEnd;
    }

    return slots;
  },
};
```

## 📝 Step 5: Create Calendar Configuration

Create file: `hospital-management-system/lib/config/calendar.ts`

```typescript
import { format } from 'date-fns';

export const calendarConfig = {
  views: ['month', 'week', 'day', 'agenda'],
  defaultView: 'week',
  step: 30,
  timeslots: 2,
  min: new Date(2024, 0, 1, 8, 0, 0), // 8:00 AM
  max: new Date(2024, 0, 1, 18, 0, 0), // 6:00 PM
  
  formats: {
    dayFormat: (date: Date) => format(date, 'EEE dd'),
    dayHeaderFormat: (date: Date) => format(date, 'EEEE, MMMM dd'),
    timeGutterFormat: (date: Date) => format(date, 'h:mm a'),
    eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
      `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`,
  },

  statusColors: {
    scheduled: 'bg-blue-100 text-blue-800 border-blue-300',
    confirmed: 'bg-green-100 text-green-800 border-green-300',
    completed: 'bg-gray-100 text-gray-800 border-gray-300',
    cancelled: 'bg-red-100 text-red-800 border-red-300',
    no_show: 'bg-orange-100 text-orange-800 border-orange-300',
  },

  appointmentTypes: [
    { value: 'consultation', label: 'Consultation' },
    { value: 'follow_up', label: 'Follow-up' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'routine_checkup', label: 'Routine Checkup' },
    { value: 'procedure', label: 'Procedure' },
    { value: 'lab_test', label: 'Lab Test' },
    { value: 'vaccination', label: 'Vaccination' },
  ],
};
```

## 📝 Step 6: Create Custom Hooks

Create file: `hospital-management-system/hooks/use-appointments.ts`

```typescript
import { useState, useEffect } from 'react';
import { appointmentApi } from '@/lib/api/appointments';
import { Appointment, AppointmentSearchParams } from '@/types/appointment';

export function useAppointments(params: AppointmentSearchParams = {}) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    fetchAppointments();
  }, [JSON.stringify(params)]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await appointmentApi.list(params);
      setAppointments(response.data.appointments);
      setPagination(response.data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  return { appointments, loading, error, pagination, refetch: fetchAppointments };
}

export function useAvailability(doctorId: number, date: string) {
  const [availability, setAvailability] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (doctorId && date) {
      checkAvailability();
    }
  }, [doctorId, date]);

  const checkAvailability = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await appointmentApi.checkDailyAvailability(doctorId, date);
      setAvailability(response.data.availability);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to check availability');
    } finally {
      setLoading(false);
    }
  };

  return { availability, loading, error, refetch: checkAvailability };
}
```

## ✅ Verification

```bash
# Check TypeScript compilation
npx tsc --noEmit

# Test imports
npm run dev
# Navigate to appointments page and check console
```

## 📄 Commit

```bash
git add hospital-management-system/
git commit -m "feat(frontend): Setup appointment scheduling architecture

- Add appointment types and interfaces
- Implement appointment API functions
- Create date/time utilities
- Configure calendar settings
- Add custom hooks for appointments and availability"
```

## 🎯 Success Criteria
- ✅ Appointment types defined
- ✅ API functions implemented
- ✅ Calendar library configured
- ✅ Date/time utilities created
- ✅ Custom hooks ready
