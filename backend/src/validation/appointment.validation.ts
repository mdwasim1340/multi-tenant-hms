import { z } from 'zod';

// Schema for creating appointment
export const CreateAppointmentSchema = z
  .object({
    patient_id: z.number().int().positive(),
    doctor_id: z.number().int().positive(),
    appointment_date: z.string().datetime(),
    duration_minutes: z.number().int().min(15).max(480).default(30),
    appointment_type: z
      .enum(['consultation', 'follow_up', 'emergency', 'procedure'])
      .optional(),
    chief_complaint: z.string().optional(),
    notes: z.string().optional(),
    special_instructions: z.string().optional(),
    estimated_cost: z.number().min(0).optional(),
  })
  .refine(
    (data) => {
      // Validate appointment is in the future
      const appointmentDate = new Date(data.appointment_date);
      const now = new Date();
      return appointmentDate > now;
    },
    {
      message: 'Appointment date must be in the future',
      path: ['appointment_date'],
    }
  );

// Schema for updating appointment
export const UpdateAppointmentSchema = z.object({
  appointment_date: z.string().datetime().optional(),
  duration_minutes: z.number().int().min(15).max(480).optional(),
  appointment_type: z
    .enum(['consultation', 'follow_up', 'emergency', 'procedure'])
    .optional(),
  status: z
    .enum([
      'scheduled',
      'confirmed',
      'checked_in',
      'in_progress',
      'completed',
      'cancelled',
      'no_show',
      'rescheduled',
    ])
    .optional(),
  chief_complaint: z.string().optional(),
  notes: z.string().optional(),
  special_instructions: z.string().optional(),
  estimated_cost: z.number().min(0).optional(),
  actual_cost: z.number().min(0).optional(),
  payment_status: z
    .enum(['pending', 'paid', 'cancelled', 'refunded'])
    .optional(),
  cancellation_reason: z.string().optional(),
});

// Schema for search query
export const AppointmentSearchSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).default(10).transform((n) => Math.min(n, 100)),
  patient_id: z.coerce.number().int().positive().optional(),
  doctor_id: z.coerce.number().int().positive().optional(),
  status: z
    .enum([
      'scheduled',
      'confirmed',
      'checked_in',
      'in_progress',
      'completed',
      'cancelled',
      'no_show',
      'rescheduled',
    ])
    .optional(),
  appointment_type: z
    .enum(['consultation', 'follow_up', 'emergency', 'procedure'])
    .optional(),
  date_from: z.string().date().optional(),
  date_to: z.string().date().optional(),
  sort_by: z
    .enum(['appointment_date', 'created_at', 'patient_id', 'doctor_id'])
    .default('appointment_date'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

// Schema for doctor schedule
export const DoctorScheduleSchema = z
  .object({
    doctor_id: z.number().int().positive(),
    day_of_week: z.number().int().min(0).max(6),
    start_time: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    end_time: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    slot_duration_minutes: z.number().int().min(15).max(240).default(30),
    break_duration_minutes: z.number().int().min(0).max(60).default(0),
    is_available: z.boolean().default(true),
    effective_from: z.string().date().optional(),
    effective_until: z.string().date().optional(),
  })
  .refine(
    (data) => {
      // Validate end_time is after start_time
      const [startHour, startMin] = data.start_time.split(':').map(Number);
      const [endHour, endMin] = data.end_time.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      return endMinutes > startMinutes;
    },
    {
      message: 'End time must be after start time',
      path: ['end_time'],
    }
  );

// Schema for doctor time off
export const DoctorTimeOffSchema = z
  .object({
    doctor_id: z.number().int().positive(),
    start_date: z.string().date(),
    end_date: z.string().date(),
    start_time: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .optional(),
    end_time: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .optional(),
    reason: z
      .enum(['vacation', 'sick_leave', 'conference', 'emergency', 'other'])
      .optional(),
    notes: z.string().optional(),
    status: z.enum(['pending', 'approved', 'rejected']).default('approved'),
  })
  .refine(
    (data) => {
      // Validate end_date is not before start_date
      return new Date(data.end_date) >= new Date(data.start_date);
    },
    {
      message: 'End date must be on or after start date',
      path: ['end_date'],
    }
  );

// Schema for checking availability
export const DoctorAvailabilitySchema = z.object({
  doctor_id: z.coerce.number().int().positive(),
  date: z.string().date(),
  duration_minutes: z.coerce.number().int().min(15).max(480).default(30),
});

// Export types
export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof UpdateAppointmentSchema>;
export type AppointmentSearchInput = z.infer<typeof AppointmentSearchSchema>;
export type DoctorScheduleInput = z.infer<typeof DoctorScheduleSchema>;
export type DoctorTimeOffInput = z.infer<typeof DoctorTimeOffSchema>;
export type DoctorAvailabilityInput = z.infer<typeof DoctorAvailabilitySchema>;
