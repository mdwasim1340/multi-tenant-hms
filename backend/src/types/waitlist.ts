/**
 * Team Alpha - Waitlist Types
 * TypeScript interfaces for appointment waitlist
 */

export type WaitlistPriority = 'urgent' | 'high' | 'normal' | 'low';
export type WaitlistStatus = 'waiting' | 'notified' | 'converted' | 'expired' | 'cancelled';
export type TimeSlotPreference = 'morning' | 'afternoon' | 'evening' | 'any';

export interface WaitlistEntry {
  id: number;
  patient_id: number;
  doctor_id: number;
  
  // Preferences
  preferred_dates?: string[]; // Array of date strings
  preferred_times?: string[]; // Array of time strings
  preferred_time_slots?: TimeSlotPreference[];
  duration_minutes: number;
  appointment_type: string;
  
  // Priority
  priority: WaitlistPriority;
  urgency_notes?: string;
  
  // Details
  chief_complaint?: string;
  notes?: string;
  special_instructions?: string;
  
  // Status
  status: WaitlistStatus;
  notified_at?: string;
  notification_count: number;
  expires_at?: string;
  
  // Conversion
  converted_to_appointment_id?: number;
  converted_at?: string;
  converted_by?: number;
  
  // Cancellation
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
  appointment?: any; // If converted
}

export interface CreateWaitlistData {
  patient_id: number;
  doctor_id: number;
  preferred_dates?: string[];
  preferred_times?: string[];
  preferred_time_slots?: TimeSlotPreference[];
  duration_minutes?: number;
  appointment_type: string;
  priority?: WaitlistPriority;
  urgency_notes?: string;
  chief_complaint?: string;
  notes?: string;
  special_instructions?: string;
  expires_at?: string;
}

export interface UpdateWaitlistData {
  preferred_dates?: string[];
  preferred_times?: string[];
  preferred_time_slots?: TimeSlotPreference[];
  duration_minutes?: number;
  appointment_type?: string;
  priority?: WaitlistPriority;
  urgency_notes?: string;
  chief_complaint?: string;
  notes?: string;
  special_instructions?: string;
  status?: WaitlistStatus;
  expires_at?: string;
}

export interface WaitlistNotification {
  waitlist_entry_id: number;
  patient_id: number;
  available_slots: any[];
  notification_method: 'email' | 'sms' | 'both';
  sent_at: string;
}

export interface ConvertWaitlistOptions {
  appointment_date: string;
  duration_minutes?: number;
  notes?: string;
}
