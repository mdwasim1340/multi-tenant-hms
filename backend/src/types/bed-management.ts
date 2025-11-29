/**
 * TypeScript Type Definitions for Bed Management Optimization System
 * AI-powered bed management with LOS prediction, discharge readiness, transfer optimization, and capacity forecasting
 */

import { z } from 'zod';

// ============================================================================
// Patient Admission Types
// ============================================================================
export interface PatientAdmission {
  id: number;
  patient_id: number;
  admission_date: Date;
  diagnosis: string;
  severity: string;
  age: number;
  comorbidities: string[];
  admission_source: string;
  expected_discharge_date?: Date;
}

// ============================================================================
// LOS (Length of Stay) Prediction Types
// ============================================================================
export interface LOSPrediction {
  id: number;
  tenant_id: string;
  admission_id: number;
  patient_id: number;
  predicted_los_days: number;
  confidence_interval_lower?: number;
  confidence_interval_upper?: number;
  prediction_factors?: {
    diagnosis: string;
    severity: string;
    age: number;
    comorbidities: string[];
    admission_source: string;
  };
  actual_los_days?: number;
  prediction_accuracy?: number;
  created_at: Date;
  updated_at: Date;
  created_by?: number;
}

export const LOSPredictionSchema = z.object({
  admission_id: z.number().int().positive(),
  patient_id: z.number().int().positive(),
  predicted_los_days: z.number().positive(),
  confidence_interval_lower: z.number().positive().optional(),
  confidence_interval_upper: z.number().positive().optional(),
  prediction_factors: z.object({
    diagnosis: z.string(),
    severity: z.string(),
    age: z.number().int().positive(),
    comorbidities: z.array(z.string()),
    admission_source: z.string(),
  }).optional(),
});

// ============================================================================
// Bed Requirements and Recommendations
// ============================================================================
export type IsolationType = 'contact' | 'droplet' | 'airborne' | 'protective';

export interface IsolationRequirement {
  patient_id?: number;
  type?: IsolationType | null;
  isolation_type?: IsolationType | null;
  required?: boolean;
  isolation_required?: boolean;
  reason?: string;
  reasons?: string[];
  checked_at?: Date;
  requires_negative_pressure?: boolean;
  requires_positive_pressure?: boolean;
  requires_anteroom?: boolean;
  ppe_requirements?: string[];
}

export interface IsolationRoomAvailability {
  unit_id?: any;
  unit_name?: any;
  isolation_type: IsolationType;
  available_rooms: number;
  available_count?: number;
  occupied_count?: number;
  total_rooms: number;
  total_count?: number;
  availability_percentage: number;
  utilization_rate?: number;
}

export interface BedRequirements {
  patient_id: number;
  isolation_required: boolean;
  isolation_type?: IsolationType;
  telemetry_required: boolean;
  oxygen_required: boolean;
  specialty_unit?: string;
  proximity_preference?: string;
  gender_preference?: string;
}

export interface BedFeatures {
  isolation_capable: boolean;
  isolation_type?: IsolationType;
  telemetry: boolean;
  telemetry_capable?: boolean;
  oxygen: boolean;
  oxygen_capable?: boolean;
  oxygen_available?: boolean;
  bariatric_capable?: boolean;
  specialty_unit?: string;
}

export interface BedScore {
  bed_id: number;
  bed_number: string;
  unit_name: string;
  floor: number;
  score: number;
  reasons?: string[];
  warnings?: string[];
  features: BedFeatures;
}

export interface BedRecommendation {
  bed_id: number;
  bed_number: string;
  unit_name: string;
  floor: number;
  score: number;
  reasoning: string;
  features: {
    isolation_capable: boolean;
    isolation_type?: string;
    telemetry: boolean;
    oxygen: boolean;
  };
  distance_from_nurses_station?: number;
  current_status: string;
}

export const BedRequirementsSchema = z.object({
  patient_id: z.number().int().positive(),
  isolation_required: z.boolean(),
  isolation_type: z.enum(['contact', 'droplet', 'airborne']).optional(),
  telemetry_required: z.boolean(),
  oxygen_required: z.boolean(),
  specialty_unit: z.string().optional(),
  proximity_preference: z.string().optional(),
  gender_preference: z.string().optional(),
});

// ============================================================================
// Bed Status Types
// ============================================================================
export interface BedStatus {
  bed_id: number;
  bed_number: string;
  unit_name: string;
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'reserved';
  patient_id?: number;
  expected_discharge?: Date;
  estimated_availability?: Date;
  isolation_status?: {
    required: boolean;
    type?: string;
  };
  last_updated: Date;
}

// ============================================================================
// Bed Assignment Types
// ============================================================================
export interface BedAssignment {
  id: number;
  tenant_id: string;
  bed_id: number;
  patient_id: number;
  assignment_date: Date;
  expected_discharge_date?: Date;
  actual_discharge_date?: Date;
  isolation_required: boolean;
  isolation_type?: string;
  assignment_score?: number;
  assignment_reasoning?: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
  created_by?: number;
}

export const BedAssignmentSchema = z.object({
  bed_id: z.number().int().positive(),
  patient_id: z.number().int().positive(),
  assignment_date: z.string().datetime(),
  expected_discharge_date: z.string().datetime().optional(),
  isolation_required: z.boolean(),
  isolation_type: z.enum(['contact', 'droplet', 'airborne']).optional(),
  assignment_score: z.number().min(0).max(100).optional(),
  assignment_reasoning: z.string().optional(),
});

// ============================================================================
// Discharge Readiness Types
// ============================================================================
export interface DischargeReadiness {
  id: number;
  tenant_id: string;
  patient_id: number;
  admission_id: number;
  medical_readiness_score: number;
  social_readiness_score: number;
  overall_readiness_score: number;
  predicted_discharge_date?: Date;
  barriers: DischargeBarrier[];
  recommended_interventions: Intervention[];
  discharge_planning_progress: number;
  actual_discharge_date?: Date;
  created_at: Date;
  updated_at: Date;
  created_by?: number;
}

export interface DischargeBarrier {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  identified_date: Date;
  resolved: boolean;
  resolved_date?: Date;
}

export interface Intervention {
  type: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  due_date?: Date;
  completed: boolean;
  completed_date?: Date;
}

export const DischargeReadinessSchema = z.object({
  patient_id: z.number().int().positive(),
  admission_id: z.number().int().positive(),
  medical_readiness_score: z.number().min(0).max(100),
  social_readiness_score: z.number().min(0).max(100),
  overall_readiness_score: z.number().min(0).max(100),
  predicted_discharge_date: z.string().date().optional(),
  barriers: z.array(z.object({
    type: z.string(),
    description: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    identified_date: z.string().datetime(),
    resolved: z.boolean(),
    resolved_date: z.string().datetime().optional(),
  })),
  recommended_interventions: z.array(z.object({
    type: z.string(),
    description: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    assigned_to: z.string().optional(),
    due_date: z.string().datetime().optional(),
    completed: z.boolean(),
    completed_date: z.string().datetime().optional(),
  })),
  discharge_planning_progress: z.number().min(0).max(100),
});

// ============================================================================
// Transfer Priority Types
// ============================================================================
export interface TransferPriority {
  id: number;
  tenant_id: string;
  patient_id: number;
  ed_arrival_time: Date;
  acuity_score: number;
  wait_time_minutes: number;
  priority_score: number;
  target_unit?: string;
  predicted_bed_availability?: Date;
  transfer_urgency: 'critical' | 'high' | 'medium' | 'low';
  boarding_time_minutes?: number;
  transfer_completed: boolean;
  transfer_completed_at?: Date;
  created_at: Date;
  updated_at: Date;
  created_by?: number;
}

export const TransferPrioritySchema = z.object({
  patient_id: z.number().int().positive(),
  ed_arrival_time: z.string().datetime(),
  acuity_score: z.number().min(0).max(100),
  wait_time_minutes: z.number().int().nonnegative(),
  target_unit: z.string().optional(),
  transfer_urgency: z.enum(['critical', 'high', 'medium', 'low']),
});

// ============================================================================
// Capacity Forecast Types
// ============================================================================
export interface CapacityForecast {
  id: number;
  tenant_id: string;
  unit_name: string;
  forecast_date: Date;
  forecast_hours_ahead: number;
  predicted_census: number;
  predicted_admissions?: number;
  predicted_discharges?: number;
  predicted_transfers_in?: number;
  predicted_transfers_out?: number;
  bed_utilization_percentage?: number;
  surge_capacity_needed: boolean;
  staffing_recommendations?: StaffingRecommendation[];
  confidence_level?: number;
  actual_census?: number;
  forecast_accuracy?: number;
  created_at: Date;
  updated_at: Date;
}

export interface StaffingRecommendation {
  role: string;
  current_staff: number;
  recommended_staff: number;
  shift: 'day' | 'evening' | 'night';
  reasoning: string;
}

export const CapacityForecastSchema = z.object({
  unit_name: z.string(),
  forecast_date: z.string().date(),
  forecast_hours_ahead: z.number().int().positive(),
  predicted_census: z.number().int().nonnegative(),
  predicted_admissions: z.number().int().nonnegative().optional(),
  predicted_discharges: z.number().int().nonnegative().optional(),
  predicted_transfers_in: z.number().int().nonnegative().optional(),
  predicted_transfers_out: z.number().int().nonnegative().optional(),
  bed_utilization_percentage: z.number().min(0).max(100).optional(),
  surge_capacity_needed: z.boolean(),
  staffing_recommendations: z.array(z.object({
    role: z.string(),
    current_staff: z.number().int().nonnegative(),
    recommended_staff: z.number().int().nonnegative(),
    shift: z.enum(['day', 'evening', 'night']),
    reasoning: z.string(),
  })).optional(),
  confidence_level: z.number().min(0).max(100).optional(),
});

// ============================================================================
// Bed Turnover Types
// ============================================================================
export interface BedTurnoverMetric {
  id: number;
  tenant_id: string;
  bed_id: number;
  patient_discharged_at: Date;
  cleaning_started_at?: Date;
  cleaning_completed_at?: Date;
  bed_ready_at?: Date;
  turnover_time_minutes?: number;
  target_turnover_time_minutes: number;
  exceeded_target: boolean;
  housekeeping_priority: 'critical' | 'high' | 'normal' | 'low';
  housekeeping_staff_id?: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export const BedTurnoverSchema = z.object({
  bed_id: z.number().int().positive(),
  patient_discharged_at: z.string().datetime(),
  cleaning_started_at: z.string().datetime().optional(),
  cleaning_completed_at: z.string().datetime().optional(),
  bed_ready_at: z.string().datetime().optional(),
  target_turnover_time_minutes: z.number().int().positive().default(120),
  housekeeping_priority: z.enum(['critical', 'high', 'normal', 'low']),
  housekeeping_staff_id: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

// ============================================================================
// Performance Metrics Types
// ============================================================================
export interface BedManagementPerformance {
  id: number;
  tenant_id: string;
  metric_date: Date;
  metric_type: 'los_accuracy' | 'bed_utilization' | 'ed_boarding' | 'capacity_forecast_accuracy' | 'discharge_delay';
  metric_value: number;
  metric_unit?: string;
  target_value?: number;
  variance_from_target?: number;
  unit_name?: string;
  additional_data?: Record<string, any>;
  created_at: Date;
}

// ============================================================================
// AI Feature Management Types
// ============================================================================
export enum BedManagementFeature {
  LOS_PREDICTION = 'los_prediction',
  BED_ASSIGNMENT_OPTIMIZATION = 'bed_assignment_optimization',
  DISCHARGE_READINESS = 'discharge_readiness',
  TRANSFER_OPTIMIZATION = 'transfer_optimization',
  CAPACITY_FORECASTING = 'capacity_forecasting',
}

export interface AIFeatureManagement {
  id: number;
  tenant_id: string;
  feature_name: BedManagementFeature;
  enabled: boolean;
  enabled_at?: Date;
  disabled_at?: Date;
  disabled_reason?: string;
  configuration?: Record<string, any>;
  last_modified_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface AIFeatureAuditLog {
  id: number;
  tenant_id: string;
  feature_name: BedManagementFeature;
  action: 'enabled' | 'disabled' | 'configured';
  previous_state?: Record<string, any>;
  new_state?: Record<string, any>;
  reason?: string;
  performed_by: number;
  performed_at: Date;
}

export const AIFeatureManagementSchema = z.object({
  feature_name: z.enum([
    'los_prediction',
    'bed_assignment_optimization',
    'discharge_readiness',
    'transfer_optimization',
    'capacity_forecasting',
  ]),
  enabled: z.boolean(),
  disabled_reason: z.string().optional(),
  configuration: z.record(z.string(), z.any()).optional(),
});

// ============================================================================
// API Request/Response Types
// ============================================================================
export interface PredictLOSRequest {
  admission_id: number;
  patient_id: number;
  diagnosis: string;
  severity: string;
  age: number;
  comorbidities: string[];
  admission_source: string;
}

export interface RecommendBedsRequest {
  patient_id: number;
  requirements: BedRequirements;
  preferred_unit?: string;
}

export interface RecommendBedsResponse {
  recommendations: BedRecommendation[];
  total_available_beds: number;
  timestamp: Date;
}

export interface DischargeReadyPatientsResponse {
  patients: Array<{
    patient_id: number;
    patient_name: string;
    admission_id: number;
    readiness_score: number;
    predicted_discharge_date?: Date;
    barriers_count: number;
    interventions_pending: number;
  }>;
  total: number;
}

export interface TransferPrioritiesResponse {
  priorities: Array<TransferPriority & {
    patient_name: string;
    current_location: string;
  }>;
  total_waiting: number;
  average_wait_time: number;
}

export interface CapacityForecastResponse {
  forecasts: CapacityForecast[];
  unit_name: string;
  current_census: number;
  current_utilization: number;
}

// Types are already exported as interfaces above, no need for duplicate export
