/**
 * Team Alpha - Recurring Appointment Types
 * TypeScript interfaces for recurring appointments
 */

export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'custom';
export type RecurringStatus = 'active' | 'paused' | 'cancelled' | 'completed';

export interface RecurringAppointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  
  // Recurrence configuration
  recurrence_pattern: RecurrencePattern;
  recurrence_interval: number;
  recurrence_days?: string; // For weekly: 'MON,WED,FRI' or '1,3,5'
  recurrence_day_of_month?: number; // For monthly: 1-31
  
  // Date range
  start_date: string;
  end_date?: string;
  max_occurrences?: number;
  occurrences_created: number;
  
  // Appointment details
  start_time: string;
  duration_minutes: number;
  appointment_type: string;
  chief_complaint?: string;
  notes?: string;
  special_instructions?: string;
  estimated_cost?: number;
  
  // Status
  status: RecurringStatus;
  cancellation_reason?: string;
  cancelled_at?: string;
  cancelled_by?: number;
  
  // Audit
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
  
  // Joined data (when fetched with details)
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
    email: string;
  };
}

export interface CreateRecurringAppointmentData {
  patient_id: number;
  doctor_id: number;
  recurrence_pattern: RecurrencePattern;
  recurrence_interval?: number;
  recurrence_days?: string;
  recurrence_day_of_month?: number;
  start_date: string;
  end_date?: string;
  max_occurrences?: number;
  start_time: string;
  duration_minutes?: number;
  appointment_type: string;
  chief_complaint?: string;
  notes?: string;
  special_instructions?: string;
  estimated_cost?: number;
}

export interface UpdateRecurringAppointmentData {
  recurrence_pattern?: RecurrencePattern;
  recurrence_interval?: number;
  recurrence_days?: string;
  recurrence_day_of_month?: number;
  end_date?: string;
  max_occurrences?: number;
  start_time?: string;
  duration_minutes?: number;
  appointment_type?: string;
  chief_complaint?: string;
  notes?: string;
  special_instructions?: string;
  estimated_cost?: number;
  status?: RecurringStatus;
}

export interface RecurringAppointmentInstance {
  recurring_appointment_id: number;
  occurrence_number: number;
  appointment_date: Date;
  appointment_end_time: Date;
}

export interface GenerateInstancesOptions {
  from_date?: Date;
  to_date?: Date;
  max_instances?: number;
  skip_conflicts?: boolean;
}
