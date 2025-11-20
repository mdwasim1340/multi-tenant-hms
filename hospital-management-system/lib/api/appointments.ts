/**
 * Team Alpha - Appointments API Client
 * Frontend API integration for appointment management
 */

import { api } from './client';

// ============================================================================
// Types
// ============================================================================

export interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  duration_minutes: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  appointment_type: string;
  notes?: string;
  cancellation_reason?: string;
  patient: {
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    patient_number?: string;
  };
  doctor: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export interface AppointmentFilters {
  page?: number;
  limit?: number;
  patient_id?: number;
  doctor_id?: number;
  status?: string;
  appointment_type?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface AppointmentListResponse {
  success: boolean;
  data: {
    appointments: Appointment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      has_next: boolean;
      has_prev: boolean;
    };
  };
}

export interface CreateAppointmentData {
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  duration_minutes: number;
  appointment_type: string;
  notes?: string;
}

export interface UpdateAppointmentData {
  appointment_date?: string;
  duration_minutes?: number;
  appointment_type?: string;
  notes?: string;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  available: boolean;
}

export interface AvailableSlotsParams {
  doctor_id: number;
  date: string;
  duration_minutes?: number;
}

// ============================================================================
// Regular Appointments API
// ============================================================================

/**
 * Get list of appointments with filters and pagination
 */
export async function getAppointments(params?: AppointmentFilters): Promise<AppointmentListResponse> {
  const response = await api.get('/api/appointments', { params });
  return response.data;
}

/**
 * Get appointment by ID
 */
export async function getAppointmentById(id: number): Promise<{ success: boolean; data: { appointment: Appointment } }> {
  const response = await api.get(`/api/appointments/${id}`);
  return response.data;
}

/**
 * Create new appointment
 */
export async function createAppointment(data: CreateAppointmentData): Promise<{ success: boolean; data: { appointment: Appointment }; message: string }> {
  const response = await api.post('/api/appointments', data);
  return response.data;
}

/**
 * Update appointment
 */
export async function updateAppointment(id: number, data: UpdateAppointmentData): Promise<{ success: boolean; data: { appointment: Appointment }; message: string }> {
  const response = await api.put(`/api/appointments/${id}`, data);
  return response.data;
}

/**
 * Cancel appointment
 */
export async function cancelAppointment(id: number, reason: string): Promise<{ success: boolean; data: { appointment: Appointment }; message: string }> {
  const response = await api.delete(`/api/appointments/${id}`, {
    data: { reason }
  });
  return response.data;
}

/**
 * Confirm appointment
 */
export async function confirmAppointment(id: number): Promise<{ success: boolean; data: { appointment: Appointment }; message: string }> {
  const response = await api.post(`/api/appointments/${id}/confirm`);
  return response.data;
}

/**
 * Mark appointment as complete
 */
export async function completeAppointment(id: number): Promise<{ success: boolean; data: { appointment: Appointment }; message: string }> {
  const response = await api.post(`/api/appointments/${id}/complete`);
  return response.data;
}

/**
 * Mark appointment as no-show
 */
export async function markNoShow(id: number): Promise<{ success: boolean; data: { appointment: Appointment }; message: string }> {
  const response = await api.post(`/api/appointments/${id}/no-show`);
  return response.data;
}

/**
 * Get available time slots for a doctor on a specific date
 */
export async function getAvailableSlots(params: AvailableSlotsParams): Promise<{ success: boolean; data: { slots: TimeSlot[] } }> {
  const response = await api.get('/api/appointments/available-slots', { params });
  return response.data;
}

/**
 * Reschedule appointment to a new date and time
 */
export async function rescheduleAppointment(id: number, newDate: string, newTime: string): Promise<{ success: boolean; data: { appointment: Appointment }; message: string }> {
  const response = await api.post(`/api/appointments/${id}/reschedule`, {
    new_date: newDate,
    new_time: newTime,
  });
  return response.data;
}

/**
 * Adjust appointment wait time
 */
export async function adjustWaitTime(id: number, adjustmentMinutes: number): Promise<{ success: boolean; data: { appointment: Appointment }; message: string }> {
  const response = await api.post(`/api/appointments/${id}/adjust-wait-time`, {
    adjustment_minutes: adjustmentMinutes,
  });
  return response.data;
}

// ============================================================================
// Recurring Appointments API
// ============================================================================

export interface RecurringAppointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  start_date: string;
  end_date?: string;
  start_time: string;
  duration_minutes: number;
  recurrence_pattern: 'daily' | 'weekly' | 'monthly';
  recurrence_interval: number;
  days_of_week?: number[];
  day_of_month?: number;
  week_of_month?: number;
  appointment_type: string;
  notes?: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  occurrence_count: number;
  patient: {
    first_name: string;
    last_name: string;
  };
  doctor: {
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateRecurringData {
  patient_id: number;
  doctor_id: number;
  start_date: string;
  end_date?: string;
  occurrence_count?: number;
  start_time: string;
  duration_minutes: number;
  recurrence_pattern: 'daily' | 'weekly' | 'monthly';
  recurrence_interval: number;
  days_of_week?: number[];
  day_of_month?: number;
  week_of_month?: number;
  appointment_type: string;
  notes?: string;
}

export interface RecurringFilters {
  page?: number;
  limit?: number;
  patient_id?: number;
  doctor_id?: number;
  status?: string;
  recurrence_pattern?: string;
}

/**
 * Get list of recurring appointments
 */
export async function getRecurringAppointments(params?: RecurringFilters) {
  const response = await api.get('/api/appointments/recurring', { params });
  return response.data;
}

/**
 * Get recurring appointment by ID
 */
export async function getRecurringAppointmentById(id: number) {
  const response = await api.get(`/api/appointments/recurring/${id}`);
  return response.data;
}

/**
 * Create recurring appointment
 */
export async function createRecurringAppointment(data: CreateRecurringData) {
  const response = await api.post('/api/appointments/recurring', data);
  return response.data;
}

/**
 * Update recurring appointment
 */
export async function updateRecurringAppointment(id: number, data: Partial<CreateRecurringData> & { update_future_occurrences?: boolean }) {
  const response = await api.put(`/api/appointments/recurring/${id}`, data);
  return response.data;
}

/**
 * Cancel recurring appointment
 */
export async function cancelRecurringAppointment(id: number, options: { cancel_future_occurrences?: boolean; cancellation_reason?: string }) {
  const response = await api.delete(`/api/appointments/recurring/${id}`, { data: options });
  return response.data;
}

// ============================================================================
// Waitlist API
// ============================================================================

export interface WaitlistEntry {
  id: number;
  patient_id: number;
  doctor_id: number;
  preferred_dates?: string[];
  preferred_times?: string[];
  preferred_time_slots?: ('morning' | 'afternoon' | 'evening' | 'any')[];
  duration_minutes: number;
  appointment_type: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  status: 'waiting' | 'notified' | 'converted' | 'expired' | 'cancelled';
  urgency_notes?: string;
  chief_complaint?: string;
  notes?: string;
  notification_count: number;
  notified_at?: string;
  converted_to_appointment_id?: number;
  converted_at?: string;
  cancellation_reason?: string;
  patient: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
  doctor: {
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateWaitlistData {
  patient_id: number;
  doctor_id: number;
  preferred_dates?: string[];
  preferred_times?: string[];
  preferred_time_slots?: ('morning' | 'afternoon' | 'evening' | 'any')[];
  duration_minutes: number;
  appointment_type: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  urgency_notes?: string;
  chief_complaint?: string;
  notes?: string;
}

export interface WaitlistFilters {
  page?: number;
  limit?: number;
  patient_id?: number;
  doctor_id?: number;
  status?: string;
  priority?: string;
}

/**
 * Get waitlist entries
 */
export async function getWaitlist(params?: WaitlistFilters) {
  const response = await api.get('/api/appointments/waitlist', { params });
  return response.data;
}

/**
 * Get waitlist entry by ID
 */
export async function getWaitlistEntryById(id: number) {
  const response = await api.get(`/api/appointments/waitlist/${id}`);
  return response.data;
}

/**
 * Add to waitlist
 */
export async function addToWaitlist(data: CreateWaitlistData) {
  const response = await api.post('/api/appointments/waitlist', data);
  return response.data;
}

/**
 * Update waitlist entry
 */
export async function updateWaitlistEntry(id: number, data: Partial<CreateWaitlistData>) {
  const response = await api.put(`/api/appointments/waitlist/${id}`, data);
  return response.data;
}

/**
 * Notify waitlist entry
 */
export async function notifyWaitlistEntry(id: number) {
  const response = await api.post(`/api/appointments/waitlist/${id}/notify`);
  return response.data;
}

/**
 * Convert waitlist entry to appointment
 */
export async function convertWaitlistToAppointment(id: number, data: { appointment_date: string; duration_minutes: number; notes?: string }) {
  const response = await api.post(`/api/appointments/waitlist/${id}/convert`, data);
  return response.data;
}

/**
 * Remove from waitlist
 */
export async function removeFromWaitlist(id: number, reason: string) {
  const response = await api.delete(`/api/appointments/waitlist/${id}`, {
    data: { reason }
  });
  return response.data;
}

// ============================================================================
// Exported API Objects
// ============================================================================

/**
 * Waitlist API object for easier imports
 */
export const waitlistApi = {
  getWaitlist,
  getWaitlistEntryById,
  addToWaitlist,
  updateWaitlistEntry,
  notifyWaitlistEntry,
  convertToAppointment: convertWaitlistToAppointment,
  removeFromWaitlist,
};
