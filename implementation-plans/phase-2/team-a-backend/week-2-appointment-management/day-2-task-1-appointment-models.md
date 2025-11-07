# Week 2, Day 2, Task 1: Appointment TypeScript Models

## 🎯 Task Objective
Create TypeScript interfaces and types for the Appointment data model.

## ⏱️ Estimated Time: 1.5 hours

## 📝 Step 1: Create Appointment Types File

Create file: `backend/src/types/appointment.ts`

```typescript
// Appointment data model interfaces
export interface Appointment {
  id: number;
  appointment_number: string;
  patient_id: number;
  doctor_id: number;
  appointment_date: string; // ISO datetime
  appointment_end_time: string; // ISO datetime
  duration_minutes: number;
  appointment_type?: 'consultation' | 'follow_up' | 'emergency' | 'procedure';
  status: 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
  cancellation_reason?: string;
  cancelled_at?: string;
  cancelled_by?: number;
  rescheduled_from?: number;
  rescheduled_to?: number;
  chief_complaint?: string;
  notes?: string;
  special_instructions?: string;
  reminder_sent: boolean;
  reminder_sent_at?: string;
  estimated_cost?: number;
  actual_cost?: number;
  payment_status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
  // Populated fields
  patient?: {
    id: number;
    first_name: string;
    last_name: string;
    patient_number: string;
    phone?: string;
    email?: string;
  };
  doctor?: {
    id: number;
    name: string;
    email?: string;
  };
}

export interface CreateAppointmentData {
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  duration_minutes?: number;
  appointment_type?: 'consultation' | 'follow_up' | 'emergency' | 'procedure';
  chief_complaint?: string;
  notes?: string;
  special_instructions?: string;
  estimated_cost?: number;
}

export interface UpdateAppointmentData {
  appointment_date?: string;
  duration_minutes?: number;
  appointment_type?: 'consultation' | 'follow_up' | 'emergency' | 'procedure';
  status?: 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
  chief_complaint?: string;
  notes?: string;
  special_instructions?: string;
  estimated_cost?: number;
  actual_cost?: number;
  payment_status?: 'pending' | 'paid' | 'cancelled' | 'refunded';
  cancellation_reason?: string;
}

export interface AppointmentSearchQuery {
  page?: number;
  limit?: number;
  patient_id?: number;
  doctor_id?: number;
  status?: 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
  appointment_type?: 'consultation' | 'follow_up' | 'emergency' | 'procedure';
  date_from?: string;
  date_to?: string;
  sort_by?: 'appointment_date' | 'created_at' | 'patient_id' | 'doctor_id';
  sort_order?: 'asc' | 'desc';
}

export interface DoctorSchedule {
  id: number;
  doctor_id: number;
  day_of_week: number; // 0=Sunday, 6=Saturday
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  slot_duration_minutes: number;
  break_duration_minutes: number;
  is_available: boolean;
  effective_from?: string; // Date
  effective_until?: string; // Date
  created_at: string;
  updated_at: string;
}

export interface DoctorTimeOff {
  id: number;
  doctor_id: number;
  start_date: string; // Date
  end_date: string; // Date
  start_time?: string; // HH:MM format
  end_time?: string; // HH:MM format
  reason?: 'vacation' | 'sick_leave' | 'conference' | 'emergency' | 'other';
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: number;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AvailabilitySlot {
  start_time: string; // ISO datetime
  end_time: string; // ISO datetime
  available: boolean;
  reason?: string; // If not available
}

export interface DoctorAvailabilityQuery {
  doctor_id: number;
  date: string; // Date YYYY-MM-DD
  duration_minutes?: number;
}

export interface AppointmentConflict {
  has_conflict: boolean;
  conflict_type?: 'overlap' | 'time_off' | 'outside_schedule';
  conflict_description?: string;
  conflicting_appointment_id?: number;
}

export interface AppointmentListResponse {
  appointments: Appointment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface AvailabilityResponse {
  date: string;
  doctor_id: number;
  available_slots: AvailabilitySlot[];
  total_slots: number;
  available_count: number;
}
```

## ✅ Verification

```bash
# Check TypeScript compilation
cd backend
npx tsc --noEmit

# Should show no errors
```

## 📄 Commit

```bash
git add src/types/appointment.ts
git commit -m "feat(appointment): Add TypeScript interfaces for Appointment model"
```