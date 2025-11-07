import { z } from 'zod';

export const CreateLabTestSchema = z.object({
  patient_id: z.number().int().positive(),
  medical_record_id: z.number().int().positive().optional(),
  appointment_id: z.number().int().positive().optional(),
  ordered_by: z.number().int().positive(),
  test_type: z.string().min(1).max(100),
  test_code: z.string().max(50).optional(),
  test_name: z.string().min(1).max(255),
  panel_id: z.number().int().positive().optional(),
  priority: z.enum(['routine', 'urgent', 'stat']).optional(),
  clinical_indication: z.string().optional(),
  specimen_type: z.string().max(100).optional(),
  expected_completion_date: z.string().datetime().optional(),
  notes: z.string().optional()
});

export const CreateLabResultSchema = z.object({
  lab_test_id: z.number().int().positive(),
  result_code: z.string().max(50).optional(),
  result_name: z.string().min(1).max(255),
  result_value: z.string().max(500).optional(),
  result_unit: z.string().max(50).optional(),
  reference_range_low: z.string().max(50).optional(),
  reference_range_high: z.string().max(50).optional(),
  reference_range_text: z.string().max(255).optional(),
  interpretation: z.string().optional(),
  notes: z.string().optional()
});

export const CreateImagingStudySchema = z.object({
  patient_id: z.number().int().positive(),
  medical_record_id: z.number().int().positive().optional(),
  appointment_id: z.number().int().positive().optional(),
  ordered_by: z.number().int().positive(),
  study_type: z.string().min(1).max(100),
  body_part: z.string().min(1).max(100),
  modality: z.string().max(50).optional(),
  clinical_indication: z.string().optional(),
  priority: z.enum(['routine', 'urgent', 'stat']).optional(),
  scheduled_date: z.string().datetime().optional(),
  performing_facility: z.string().max(255).optional()
});

export const LabTestSearchSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  patient_id: z.coerce.number().int().positive().optional(),
  status: z.enum(['ordered', 'collected', 'processing', 'completed', 'cancelled']).optional(),
  test_type: z.string().optional(),
  date_from: z.string().date().optional(),
  date_to: z.string().date().optional(),
  sort_by: z.enum(['ordered_date', 'completed_date', 'created_at']).default('ordered_date'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});
