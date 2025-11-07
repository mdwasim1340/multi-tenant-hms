import { z } from 'zod';

// Vital Signs Schema
export const VitalSignsSchema = z.object({
  temperature: z.string().optional(),
  temperature_unit: z.enum(['F', 'C']).optional(),
  blood_pressure_systolic: z.string().optional(),
  blood_pressure_diastolic: z.string().optional(),
  heart_rate: z.string().optional(),
  respiratory_rate: z.string().optional(),
  oxygen_saturation: z.string().optional(),
  weight: z.string().optional(),
  weight_unit: z.enum(['kg', 'lbs']).optional(),
  height: z.string().optional(),
  height_unit: z.enum(['cm', 'in']).optional(),
  bmi: z.string().optional()
});

// Review of Systems Schema
export const ReviewOfSystemsSchema = z.object({
  constitutional: z.string().optional(),
  eyes: z.string().optional(),
  ears_nose_throat: z.string().optional(),
  cardiovascular: z.string().optional(),
  respiratory: z.string().optional(),
  gastrointestinal: z.string().optional(),
  genitourinary: z.string().optional(),
  musculoskeletal: z.string().optional(),
  skin: z.string().optional(),
  neurological: z.string().optional(),
  psychiatric: z.string().optional(),
  endocrine: z.string().optional(),
  hematologic: z.string().optional(),
  allergic_immunologic: z.string().optional()
});

// Create Medical Record Schema
export const CreateMedicalRecordSchema = z.object({
  patient_id: z.number().int().positive(),
  appointment_id: z.number().int().positive().optional(),
  doctor_id: z.number().int().positive(),
  visit_date: z.string().datetime().or(z.date()),
  chief_complaint: z.string().max(1000).optional(),
  history_of_present_illness: z.string().optional(),
  review_of_systems: ReviewOfSystemsSchema.optional(),
  vital_signs: VitalSignsSchema.optional(),
  physical_examination: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  notes: z.string().optional(),
  follow_up_required: z.boolean().optional(),
  follow_up_date: z.string().date().optional(),
  follow_up_instructions: z.string().optional()
});

// Update Medical Record Schema
export const UpdateMedicalRecordSchema = z.object({
  chief_complaint: z.string().max(1000).optional(),
  history_of_present_illness: z.string().optional(),
  review_of_systems: ReviewOfSystemsSchema.optional(),
  vital_signs: VitalSignsSchema.optional(),
  physical_examination: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  notes: z.string().optional(),
  follow_up_required: z.boolean().optional(),
  follow_up_date: z.string().date().optional(),
  follow_up_instructions: z.string().optional(),
  status: z.enum(['draft', 'finalized', 'amended']).optional()
});

// Create Diagnosis Schema
export const CreateDiagnosisSchema = z.object({
  medical_record_id: z.number().int().positive(),
  diagnosis_code: z.string().max(20).optional(),
  diagnosis_name: z.string().min(1).max(500),
  diagnosis_type: z.enum(['primary', 'secondary', 'differential']).optional(),
  severity: z.enum(['mild', 'moderate', 'severe', 'critical']).optional(),
  status: z.enum(['active', 'resolved', 'chronic']).optional(),
  onset_date: z.string().date().optional(),
  notes: z.string().optional()
});

// Create Treatment Schema
export const CreateTreatmentSchema = z.object({
  medical_record_id: z.number().int().positive(),
  treatment_type: z.string().min(1).max(100),
  treatment_name: z.string().min(1).max(500),
  description: z.string().optional(),
  start_date: z.string().date(),
  end_date: z.string().date().optional(),
  frequency: z.string().max(100).optional(),
  dosage: z.string().max(200).optional(),
  route: z.string().max(100).optional(),
  duration: z.string().max(100).optional(),
  instructions: z.string().optional()
});

// Create Prescription Schema
export const CreatePrescriptionSchema = z.object({
  medical_record_id: z.number().int().positive(),
  patient_id: z.number().int().positive(),
  doctor_id: z.number().int().positive(),
  medication_name: z.string().min(1).max(500),
  medication_code: z.string().max(50).optional(),
  dosage: z.string().min(1).max(200),
  frequency: z.string().min(1).max(100),
  route: z.string().min(1).max(100),
  duration: z.string().max(100).optional(),
  quantity: z.number().int().positive().optional(),
  refills: z.number().int().min(0).max(12).optional(),
  instructions: z.string().optional(),
  indication: z.string().optional(),
  prescribed_date: z.string().date().optional(),
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional()
});

// Search Schema
export const MedicalRecordSearchSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  patient_id: z.coerce.number().int().positive().optional(),
  doctor_id: z.coerce.number().int().positive().optional(),
  status: z.enum(['draft', 'finalized', 'amended']).optional(),
  date_from: z.string().date().optional(),
  date_to: z.string().date().optional(),
  search: z.string().optional(),
  sort_by: z.enum(['visit_date', 'created_at', 'updated_at']).default('visit_date'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});
