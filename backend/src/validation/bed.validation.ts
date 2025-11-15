/**
 * Zod Validation Schemas for Bed Management System
 * Team: Beta
 * System: Bed Management + Inventory
 */

import { z } from 'zod';

// ==================== Department Schemas ====================

export const CreateDepartmentSchema = z.object({
  department_name: z.string().min(2, 'Department name must be at least 2 characters').max(255),
  department_code: z.string().min(2).max(50).regex(/^[A-Z0-9\-]+$/, 'Department code must be uppercase alphanumeric with hyphens'),
  description: z.string().optional(),
  floor_number: z.number().int().min(0).optional(),
  building: z.string().max(100).optional(),
  total_capacity: z.number().int().min(1, 'Total capacity must be at least 1'),
  status: z.enum(['active', 'inactive']).default('active'),
  contact_phone: z.string().max(20).optional(),
  contact_email: z.string().email('Invalid email format').optional(),
  head_of_department: z.string().max(255).optional(),
});

export const UpdateDepartmentSchema = CreateDepartmentSchema.partial();

// ==================== Bed Schemas ====================

export const BedTypeSchema = z.enum([
  'general',
  'icu',
  'private',
  'semi_private',
  'pediatric',
  'maternity',
  'emergency'
]);

export const BedStatusSchema = z.enum([
  'available',
  'occupied',
  'maintenance',
  'reserved',
  'blocked',
  'cleaning'
]);

export const CreateBedSchema = z.object({
  bed_number: z.string().min(1, 'Bed number is required').max(50),
  department_id: z.number().int().min(1, 'Valid department ID is required'),
  bed_type: BedTypeSchema,
  status: BedStatusSchema.default('available'),
  room_number: z.string().max(50).optional(),
  floor_number: z.number().int().min(0).optional(),
  features: z.record(z.string(), z.any()).optional(),
  last_maintenance_date: z.string().datetime().optional(),
  next_maintenance_date: z.string().datetime().optional(),
  maintenance_notes: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().default(true),
});

export const UpdateBedSchema = CreateBedSchema.partial();

export const BedSearchSchema = z.object({
  department_id: z.string().transform(Number).optional(),
  bed_type: BedTypeSchema.optional(),
  status: BedStatusSchema.optional(),
  floor_number: z.string().transform(Number).optional(),
  room_number: z.string().optional(),
  is_active: z.string().transform((val) => val === 'true').optional(),
  search: z.string().optional(),
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

// ==================== Bed Assignment Schemas ====================

export const PrioritySchema = z.enum(['routine', 'urgent', 'emergency']);
export const DischargeTypeSchema = z.enum(['normal', 'transfer', 'death', 'ama', 'absconded']);

export const CreateBedAssignmentSchema = z.object({
  bed_id: z.number().int().min(1, 'Valid bed ID is required'),
  patient_id: z.number().int().min(1, 'Valid patient ID is required'),
  admission_date: z.string().datetime().optional(),
  expected_discharge_date: z.string().datetime().optional(),
  admission_diagnosis: z.string().optional(),
  admission_notes: z.string().optional(),
  priority: PrioritySchema.optional(),
  assigned_doctor_id: z.number().int().optional(),
  assigned_nurse_id: z.number().int().optional(),
  special_requirements: z.string().optional(),
});

export const UpdateBedAssignmentSchema = CreateBedAssignmentSchema.partial();

export const DischargeBedAssignmentSchema = z.object({
  discharge_reason: z.string().min(1, 'Discharge reason is required'),
  discharge_notes: z.string().optional(),
  discharge_type: DischargeTypeSchema,
  actual_discharge_date: z.string().datetime().optional(),
});

// ==================== Bed Transfer Schemas ====================

export const TransferStatusSchema = z.enum(['pending', 'approved', 'completed', 'cancelled']);

export const CreateBedTransferSchema = z.object({
  patient_id: z.number().int().min(1, 'Valid patient ID is required'),
  from_bed_id: z.number().int().min(1, 'Valid source bed ID is required'),
  to_bed_id: z.number().int().min(1, 'Valid destination bed ID is required'),
  from_department_id: z.number().int().min(1, 'Valid source department ID is required'),
  to_department_id: z.number().int().min(1, 'Valid destination department ID is required'),
  transfer_date: z.string().datetime().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  approved_by: z.number().int().optional(),
  performed_by: z.number().int().optional(),
}).refine(
  (data) => data.from_bed_id !== data.to_bed_id,
  { message: 'Source and destination beds must be different', path: ['to_bed_id'] }
);

export const UpdateBedTransferSchema = z.object({
  status: TransferStatusSchema.optional(),
  transfer_date: z.string().datetime().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  approved_by: z.number().int().optional(),
  performed_by: z.number().int().optional(),
});

export const CompleteBedTransferSchema = z.object({
  performed_by: z.number().int().optional(),
  notes: z.string().optional(),
});

export const CancelBedTransferSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required'),
  notes: z.string().optional(),
});

// ==================== Type Exports ====================

export type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof UpdateDepartmentSchema>;

export type CreateBedInput = z.infer<typeof CreateBedSchema>;
export type UpdateBedInput = z.infer<typeof UpdateBedSchema>;
export type BedSearchInput = z.infer<typeof BedSearchSchema>;

export type CreateBedAssignmentInput = z.infer<typeof CreateBedAssignmentSchema>;
export type UpdateBedAssignmentInput = z.infer<typeof UpdateBedAssignmentSchema>;
export type DischargeBedAssignmentInput = z.infer<typeof DischargeBedAssignmentSchema>;

export type CreateBedTransferInput = z.infer<typeof CreateBedTransferSchema>;
export type UpdateBedTransferInput = z.infer<typeof UpdateBedTransferSchema>;
export type CompleteBedTransferInput = z.infer<typeof CompleteBedTransferSchema>;
export type CancelBedTransferInput = z.infer<typeof CancelBedTransferSchema>;
