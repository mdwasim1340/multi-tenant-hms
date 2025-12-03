/**
 * Lab Tests Type Definitions
 * 
 * Types for laboratory test management system including:
 * - Test categories and definitions
 * - Lab orders and order items
 * - Lab results and verification
 */

import { z } from 'zod';

// ============================================================================
// Lab Test Categories
// ============================================================================

export interface LabTestCategory {
  id: number;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export const LabTestCategorySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  display_order: z.number().int().default(0),
  is_active: z.boolean().default(true)
});

// ============================================================================
// Lab Tests
// ============================================================================

export interface LabTest {
  id: number;
  category_id: number | null;
  test_code: string;
  test_name: string;
  description: string | null;
  normal_range_min: string | null;
  normal_range_max: string | null;
  normal_range_text: string | null;
  unit: string | null;
  specimen_type: string | null;
  price: number | null;
  turnaround_time: number | null; // in hours
  preparation_instructions: string | null;
  status: 'active' | 'inactive' | 'discontinued';
  created_at: Date;
  updated_at: Date;
}

export interface LabTestWithCategory extends LabTest {
  category_name?: string;
}

export const LabTestSchema = z.object({
  category_id: z.number().int().optional().nullable(),
  test_code: z.string().min(1).max(50),
  test_name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  normal_range_min: z.string().max(100).optional().nullable(),
  normal_range_max: z.string().max(100).optional().nullable(),
  normal_range_text: z.string().max(255).optional().nullable(),
  unit: z.string().max(50).optional().nullable(),
  specimen_type: z.string().max(100).optional().nullable(),
  price: z.number().positive().optional().nullable(),
  turnaround_time: z.number().int().positive().optional().nullable(),
  preparation_instructions: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive', 'discontinued']).default('active')
});

// ============================================================================
// Lab Orders
// ============================================================================

export interface LabOrder {
  id: number;
  order_number: string;
  patient_id: number;
  medical_record_id: number | null;
  appointment_id: number | null;
  order_date: Date;
  ordered_by: number; // user_id (doctor)
  priority: 'routine' | 'urgent' | 'stat';
  status: 'pending' | 'collected' | 'processing' | 'completed' | 'cancelled';
  collection_date: Date | null;
  collected_by: number | null; // user_id (lab technician)
  clinical_notes: string | null;
  special_instructions: string | null;
  total_price: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface LabOrderWithDetails extends LabOrder {
  patient_name?: string;
  patient_number?: string;
  ordered_by_name?: string;
  collected_by_name?: string;
  items?: LabOrderItemWithTest[];
  items_count?: number;
  completed_items_count?: number;
}

export const CreateLabOrderSchema = z.object({
  patient_id: z.number().int().positive(),
  medical_record_id: z.number().int().positive().optional().nullable(),
  appointment_id: z.number().int().positive().optional().nullable(),
  order_date: z.string().datetime().optional(),
  ordered_by: z.number().int().positive(),
  priority: z.enum(['routine', 'urgent', 'stat']).default('routine'),
  clinical_notes: z.string().optional().nullable(),
  special_instructions: z.string().optional().nullable(),
  test_ids: z.array(z.number().int().positive()).min(1)
});

export const UpdateLabOrderSchema = z.object({
  priority: z.enum(['routine', 'urgent', 'stat']).optional(),
  clinical_notes: z.string().optional().nullable(),
  special_instructions: z.string().optional().nullable()
});

// ============================================================================
// Lab Order Items
// ============================================================================

export interface LabOrderItem {
  id: number;
  order_id: number;
  test_id: number;
  status: 'pending' | 'collected' | 'processing' | 'completed' | 'cancelled';
  specimen_collected_at: Date | null;
  processing_started_at: Date | null;
  completed_at: Date | null;
  cancelled_at: Date | null;
  cancellation_reason: string | null;
  notes: string | null;
  price: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface LabOrderItemWithTest extends LabOrderItem {
  test_code?: string;
  test_name?: string;
  test_unit?: string;
  specimen_type?: string;
  turnaround_time?: number;
  result?: LabResult;
}

export const UpdateLabOrderItemSchema = z.object({
  status: z.enum(['pending', 'collected', 'processing', 'completed', 'cancelled']).optional(),
  specimen_collected_at: z.string().datetime().optional().nullable(),
  processing_started_at: z.string().datetime().optional().nullable(),
  cancellation_reason: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

// ============================================================================
// Lab Results
// ============================================================================

export interface LabResult {
  id: number;
  order_item_id: number;
  result_value: string | null;
  result_numeric: number | null;
  result_text: string | null;
  result_unit: string | null;
  reference_range: string | null;
  is_abnormal: boolean;
  abnormal_flag: 'H' | 'L' | 'HH' | 'LL' | null; // High, Low, Critical High, Critical Low
  result_date: Date;
  performed_by: number | null; // user_id (lab technician)
  verified_by: number | null; // user_id (pathologist/senior tech)
  verified_at: Date | null;
  interpretation: string | null;
  notes: string | null;
  attachments: any | null; // JSONB
  created_at: Date;
  updated_at: Date;
}

export interface LabResultWithDetails extends LabResult {
  test_code?: string;
  test_name?: string;
  patient_name?: string;
  patient_number?: string;
  order_number?: string;
  performed_by_name?: string;
  verified_by_name?: string;
}

export const CreateLabResultSchema = z.object({
  // Either order_item_id OR (patient_id + test_id) is required
  order_item_id: z.number().int().positive().optional(),
  patient_id: z.number().int().positive().optional(),
  test_id: z.number().int().positive().optional(),
  result_value: z.string().max(500).optional().nullable(),
  result_numeric: z.number().optional().nullable(),
  result_text: z.string().optional().nullable(),
  result_unit: z.string().max(50).optional().nullable(),
  reference_range: z.string().max(255).optional().nullable(),
  result_date: z.string().optional(),
  performed_by: z.number().int().positive().optional().nullable(),
  interpretation: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  attachments: z.any().optional().nullable(),
  is_abnormal: z.boolean().optional(),
  abnormal_flag: z.string().optional().nullable(),
  value: z.string().optional(), // Alias for result_value
  unit: z.string().optional().nullable(), // Alias for result_unit
  // New fields for enhanced lab result entry
  sample_type: z.string().max(50).optional().nullable(), // blood, urine, stool, CSF, etc.
  ordering_doctor: z.string().max(100).optional().nullable(), // doctor who ordered the test
  result_status: z.enum(['final', 'preliminary', 'corrected', 'amended']).optional().default('final'),
});

export const UpdateLabResultSchema = z.object({
  result_value: z.string().max(500).optional().nullable(),
  result_numeric: z.number().optional().nullable(),
  result_text: z.string().optional().nullable(),
  result_unit: z.string().max(50).optional().nullable(),
  reference_range: z.string().max(255).optional().nullable(),
  interpretation: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  attachments: z.any().optional().nullable()
});

export const VerifyLabResultSchema = z.object({
  verified_by: z.number().int().positive()
});

// ============================================================================
// Query Filters
// ============================================================================

export interface LabOrderFilters {
  patient_id?: number;
  medical_record_id?: number;
  appointment_id?: number;
  ordered_by?: number;
  priority?: 'routine' | 'urgent' | 'stat';
  status?: 'pending' | 'collected' | 'processing' | 'completed' | 'cancelled';
  order_date_from?: string;
  order_date_to?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface LabTestFilters {
  category_id?: number;
  specimen_type?: string;
  status?: 'active' | 'inactive' | 'discontinued';
  search?: string;
  page?: number;
  limit?: number;
}

export interface LabResultFilters {
  order_id?: number;
  patient_id?: number;
  is_abnormal?: boolean;
  verified?: boolean;
  result_date_from?: string;
  result_date_to?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// Response Types
// ============================================================================

export interface LabOrdersResponse {
  orders: LabOrderWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface LabTestsResponse {
  tests: LabTestWithCategory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface LabResultsResponse {
  results: LabResultWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ============================================================================
// Statistics Types
// ============================================================================

export interface LabOrderStatistics {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  urgent_orders: number;
  stat_orders: number;
  avg_turnaround_time: number | null;
}

export interface LabResultStatistics {
  total_results: number;
  abnormal_results: number;
  verified_results: number;
  pending_verification: number;
  critical_results: number;
}
