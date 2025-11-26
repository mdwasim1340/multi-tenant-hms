/**
 * Bed Management Validation Schemas
 * Zod schemas for request validation
 */

import { z } from 'zod';

// ==================
// Enum Schemas
// ==================

export const BedTypeSchema = z.enum(['standard', 'icu', 'isolation', 'pediatric', 'maternity']);
export const BedStatusSchema = z.enum(['available', 'occupied', 'maintenance', 'cleaning', 'reserved']);
export const AdmissionTypeSchema = z.enum(['emergency', 'scheduled', 'transfer']);
export const PatientConditionSchema = z.enum(['stable', 'critical', 'moderate', 'serious']);
export const AssignmentStatusSchema = z.enum(['active', 'discharged', 'transferred']);
export const TransferTypeSchema = z.enum(['routine', 'emergency', 'medical_necessity', 'patient_request']);
export const TransferStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);
export const DepartmentStatusSchema = z.enum(['active', 'inactive']);

// ==================
// Department Schemas
// ==================

export const CreateDepartmentSchema = z.object({
  department_code: z.string().min(2).max(50).toUpperCase(),
  name: z.string().min(3).max(255),
  description: z.string().max(1000).optional(),
  floor_number: z.number().int().min(0).max(50).optional(),
  building: z.string().max(100).optional(),
  total_bed_capacity: z.number().int().min(0).max(1000),
});

export const UpdateDepartmentSchema = z.object({
  name: z.string().min(3).max(255).optional(),
  description: z.string().max(1000).optional(),
  floor_number: z.number().int().min(0).max(50).optional(),
  building: z.string().max(100).optional(),
  total_bed_capacity: z.number().int().min(0).max(1000).optional(),
  status: DepartmentStatusSchema.optional(),
});

export const DepartmentSearchSchema = z.object({
  status: DepartmentStatusSchema.optional(),
  floor_number: z.coerce.number().int().optional(),
  building: z.string().optional(),
  search: z.string().optional(),
});

// ==================
// Bed Schemas
// ==================

export const CreateBedSchema = z.object({
  bed_number: z.string().min(1).max(50),
  department_id: z.number().int().positive().optional(),
  category_id: z.number().int().positive().optional(),
  bed_type: z.string().min(1).max(50), // Allow any string, will be validated/mapped in service
  floor_number: z.number().int().min(0).max(50).optional(),
  room_number: z.string().max(50).optional(),
  wing: z.string().max(50).optional(),
  status: BedStatusSchema.optional(), // Allow status to be set on creation
  features: z.record(z.string(), z.any()).optional(),
  notes: z.string().max(1000).optional(),
}).refine(data => data.department_id || data.category_id, {
  message: 'Either department_id or category_id must be provided',
  path: ['department_id'],
});

export const UpdateBedSchema = z.object({
  bed_number: z.string().min(1).max(50).optional(),
  department_id: z.number().int().positive().optional(),
  category_id: z.number().int().positive().optional(),
  bed_type: z.string().max(50).optional(), // Allow any string for flexibility
  floor_number: z.union([z.number(), z.string()]).transform(val => 
    typeof val === 'string' ? (val ? parseInt(val, 10) : undefined) : val
  ).optional(),
  room_number: z.string().max(50).optional(),
  wing: z.string().max(50).optional(),
  status: z.string().max(50).optional(), // Allow any string for flexibility
  features: z.any().optional(), // Allow any format for features
  last_cleaned_at: z.string().optional(),
  last_maintenance_at: z.string().optional(),
  notes: z.string().max(1000).optional(),
  is_active: z.boolean().optional(),
});

export const BedSearchSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(1000),
  department_id: z.coerce.number().int().positive().optional(),
  status: BedStatusSchema.optional(),
  bed_type: BedTypeSchema.optional(),
  floor_number: z.coerce.number().int().optional(),
  room_number: z.string().optional(),
  search: z.string().optional(),
  sort_by: z.string().default('bed_number'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
  is_active: z.coerce.boolean().optional(),
});

// ==================
// Bed Assignment Schemas
// ==================

export const CreateBedAssignmentSchema = z.object({
  bed_id: z.number().int().positive(),
  patient_id: z.number().int().positive(),
  admission_type: AdmissionTypeSchema,
  admission_reason: z.string().max(1000).optional(),
  patient_condition: PatientConditionSchema.optional(),
  assigned_nurse_id: z.number().int().positive().optional(),
  assigned_doctor_id: z.number().int().positive().optional(),
  expected_discharge_date: z.string().date().optional(),
  notes: z.string().max(1000).optional(),
});

export const UpdateBedAssignmentSchema = z.object({
  expected_discharge_date: z.string().date().optional(),
  patient_condition: PatientConditionSchema.optional(),
  assigned_nurse_id: z.number().int().positive().optional(),
  assigned_doctor_id: z.number().int().positive().optional(),
  notes: z.string().max(1000).optional(),
});

export const DischargeBedAssignmentSchema = z.object({
  discharge_reason: z.string().min(1).max(1000),
  notes: z.string().max(1000).optional(),
});

export const BedAssignmentSearchSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  bed_id: z.coerce.number().int().positive().optional(),
  patient_id: z.coerce.number().int().positive().optional(),
  status: AssignmentStatusSchema.optional(),
  admission_type: AdmissionTypeSchema.optional(),
  patient_condition: PatientConditionSchema.optional(),
  assigned_nurse_id: z.coerce.number().int().positive().optional(),
  assigned_doctor_id: z.coerce.number().int().positive().optional(),
  admission_date_from: z.string().date().optional(),
  admission_date_to: z.string().date().optional(),
  sort_by: z.string().default('admission_date'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// ==================
// Bed Transfer Schemas
// ==================

export const CreateBedTransferSchema = z.object({
  patient_id: z.number().int().positive(),
  from_bed_id: z.number().int().positive(),
  to_bed_id: z.number().int().positive(),
  transfer_reason: z.string().min(1).max(1000),
  transfer_type: TransferTypeSchema.optional(),
  notes: z.string().max(1000).optional(),
}).refine(data => data.from_bed_id !== data.to_bed_id, {
  message: 'Source and destination beds must be different',
  path: ['to_bed_id'],
});

export const UpdateBedTransferSchema = z.object({
  transfer_reason: z.string().min(1).max(1000).optional(),
  transfer_type: TransferTypeSchema.optional(),
  notes: z.string().max(1000).optional(),
});

export const CompleteBedTransferSchema = z.object({
  notes: z.string().max(1000).optional(),
});

export const CancelBedTransferSchema = z.object({
  cancellation_reason: z.string().min(1).max(1000),
  notes: z.string().max(1000).optional(),
});

export const BedTransferSearchSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  patient_id: z.coerce.number().int().positive().optional(),
  from_bed_id: z.coerce.number().int().positive().optional(),
  to_bed_id: z.coerce.number().int().positive().optional(),
  from_department_id: z.coerce.number().int().positive().optional(),
  to_department_id: z.coerce.number().int().positive().optional(),
  status: TransferStatusSchema.optional(),
  transfer_type: TransferTypeSchema.optional(),
  transfer_date_from: z.string().date().optional(),
  transfer_date_to: z.string().date().optional(),
  sort_by: z.string().default('transfer_date'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// ==================
// Availability Schemas
// ==================

export const AvailableBedsQuerySchema = z.object({
  department_id: z.coerce.number().int().positive().optional(),
  bed_type: BedTypeSchema.optional(),
  floor_number: z.coerce.number().int().optional(),
  required_features: z.array(z.string()).optional(),
  exclude_bed_ids: z.array(z.coerce.number().int()).optional(),
});

// ==================
// Type Exports
// ==================

export type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof UpdateDepartmentSchema>;
export type DepartmentSearchInput = z.infer<typeof DepartmentSearchSchema>;

export type CreateBedInput = z.infer<typeof CreateBedSchema>;
export type UpdateBedInput = z.infer<typeof UpdateBedSchema>;
export type BedSearchInput = z.infer<typeof BedSearchSchema>;

export type CreateBedAssignmentInput = z.infer<typeof CreateBedAssignmentSchema>;
export type UpdateBedAssignmentInput = z.infer<typeof UpdateBedAssignmentSchema>;
export type DischargeBedAssignmentInput = z.infer<typeof DischargeBedAssignmentSchema>;
export type BedAssignmentSearchInput = z.infer<typeof BedAssignmentSearchSchema>;

export type CreateBedTransferInput = z.infer<typeof CreateBedTransferSchema>;
export type UpdateBedTransferInput = z.infer<typeof UpdateBedTransferSchema>;
export type CompleteBedTransferInput = z.infer<typeof CompleteBedTransferSchema>;
export type CancelBedTransferInput = z.infer<typeof CancelBedTransferSchema>;
export type BedTransferSearchInput = z.infer<typeof BedTransferSearchSchema>;

export type AvailableBedsQueryInput = z.infer<typeof AvailableBedsQuerySchema>;
