/**
 * Bed Management Type Definitions
 * Complete TypeScript interfaces for bed management system
 */

// ==================
// Enums and Constants
// ==================

export type BedType = 'standard' | 'icu' | 'isolation' | 'pediatric' | 'maternity';
export type BedStatus = 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'reserved';
export type AdmissionType = 'emergency' | 'scheduled' | 'transfer';
export type PatientCondition = 'stable' | 'critical' | 'moderate' | 'serious';
export type AssignmentStatus = 'active' | 'discharged' | 'transferred';
export type TransferType = 'routine' | 'emergency' | 'medical_necessity' | 'patient_request';
export type TransferStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type DepartmentStatus = 'active' | 'inactive';

// ==================
// Core Entities
// ==================

export interface Department {
  id: number;
  department_code: string;
  name: string;
  description?: string;
  floor_number?: number;
  building?: string;
  total_bed_capacity: number;
  active_bed_count: number;
  status: DepartmentStatus;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface Bed {
  id: number;
  bed_number: string;
  department_id: number;
  bed_type: BedType;
  floor_number?: number;
  room_number?: string;
  wing?: string;
  status: BedStatus;
  features?: Record<string, any>;
  last_cleaned_at?: string;
  last_maintenance_at?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
  
  // Joined data (optional)
  department?: Department;
  current_assignment?: BedAssignment;
}

export interface BedAssignment {
  id: number;
  bed_id: number;
  patient_id: number;
  admission_date: string;
  discharge_date?: string;
  expected_discharge_date?: string;
  admission_type: AdmissionType;
  admission_reason?: string;
  patient_condition?: PatientCondition;
  assigned_nurse_id?: number;
  assigned_doctor_id?: number;
  status: AssignmentStatus;
  discharge_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
  
  // Joined data (optional)
  bed?: Bed;
  patient?: PatientInfo;
  assigned_nurse?: UserInfo;
  assigned_doctor?: UserInfo;
}

export interface BedTransfer {
  id: number;
  patient_id: number;
  from_bed_id: number;
  to_bed_id: number;
  from_department_id: number;
  to_department_id: number;
  transfer_date: string;
  transfer_reason: string;
  transfer_type?: TransferType;
  requested_by?: number;
  approved_by?: number;
  completed_by?: number;
  status: TransferStatus;
  completion_date?: string;
  cancellation_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Joined data (optional)
  patient?: PatientInfo;
  from_bed?: Bed;
  to_bed?: Bed;
  from_department?: Department;
  to_department?: Department;
  requester?: UserInfo;
  approver?: UserInfo;
  completer?: UserInfo;
}

// ==================
// Helper Interfaces
// ==================

export interface PatientInfo {
  id: number;
  patient_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  email?: string;
}

export interface UserInfo {
  id: number;
  name: string;
  email: string;
  role?: string;
}

// ==================
// Request DTOs
// ==================

export interface CreateDepartmentData {
  department_code: string;
  name: string;
  description?: string;
  floor_number?: number;
  building?: string;
  total_bed_capacity: number;
}

export interface UpdateDepartmentData {
  name?: string;
  description?: string;
  floor_number?: number;
  building?: string;
  total_bed_capacity?: number;
  status?: DepartmentStatus;
}

export interface CreateBedData {
  bed_number: string;
  department_id?: number;
  category_id?: number;
  bed_type: string; // Allow any string, will be validated/mapped
  floor_number?: number;
  room_number?: string;
  wing?: string;
  status?: BedStatus;
  features?: Record<string, any>;
  notes?: string;
}

export interface UpdateBedData {
  bed_number?: string;
  department_id?: number;
  category_id?: number;
  bed_type?: string;
  floor_number?: number | string;
  room_number?: string;
  wing?: string;
  status?: string;
  features?: any;
  last_cleaned_at?: string;
  last_maintenance_at?: string;
  notes?: string;
  is_active?: boolean;
}

export interface CreateBedAssignmentData {
  bed_id: number;
  patient_id: number;
  admission_type: AdmissionType;
  admission_reason?: string;
  patient_condition?: PatientCondition;
  assigned_nurse_id?: number;
  assigned_doctor_id?: number;
  expected_discharge_date?: string;
  notes?: string;
}

export interface UpdateBedAssignmentData {
  expected_discharge_date?: string;
  patient_condition?: PatientCondition;
  assigned_nurse_id?: number;
  assigned_doctor_id?: number;
  notes?: string;
}

export interface DischargeBedAssignmentData {
  discharge_reason: string;
  notes?: string;
}

export interface CreateBedTransferData {
  patient_id: number;
  from_bed_id: number;
  to_bed_id: number;
  transfer_reason: string;
  transfer_type?: TransferType;
  notes?: string;
}

export interface UpdateBedTransferData {
  transfer_reason?: string;
  transfer_type?: TransferType;
  notes?: string;
}

// ==================
// Query Parameters
// ==================

export interface BedSearchParams {
  page?: number;
  limit?: number;
  department_id?: number;
  status?: BedStatus;
  bed_type?: BedType;
  floor_number?: number;
  room_number?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  is_active?: boolean;
}

export interface BedAssignmentSearchParams {
  page?: number;
  limit?: number;
  bed_id?: number;
  patient_id?: number;
  status?: AssignmentStatus;
  admission_type?: AdmissionType;
  patient_condition?: PatientCondition;
  assigned_nurse_id?: number;
  assigned_doctor_id?: number;
  admission_date_from?: string;
  admission_date_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface BedTransferSearchParams {
  page?: number;
  limit?: number;
  patient_id?: number;
  from_bed_id?: number;
  to_bed_id?: number;
  from_department_id?: number;
  to_department_id?: number;
  status?: TransferStatus;
  transfer_type?: TransferType;
  transfer_date_from?: string;
  transfer_date_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface DepartmentSearchParams {
  status?: DepartmentStatus;
  floor_number?: number;
  building?: string;
  search?: string;
}

// ==================
// Response DTOs
// ==================

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface BedsResponse {
  beds: Bed[];
  pagination: PaginationInfo;
}

export interface BedResponse {
  bed: Bed;
}

export interface BedAssignmentsResponse {
  assignments: BedAssignment[];
  pagination: PaginationInfo;
}

export interface BedAssignmentResponse {
  assignment: BedAssignment;
}

export interface BedTransfersResponse {
  transfers: BedTransfer[];
  pagination: PaginationInfo;
}

export interface BedTransferResponse {
  transfer: BedTransfer;
}

export interface DepartmentsResponse {
  departments: Department[];
}

export interface DepartmentResponse {
  department: Department;
}

export interface BedOccupancyMetrics {
  total_beds: number;
  available_beds: number;
  occupied_beds: number;
  maintenance_beds: number;
  cleaning_beds: number;
  reserved_beds: number;
  occupancy_rate: number;
  availability_rate: number;
}

export interface DepartmentOccupancyMetrics extends BedOccupancyMetrics {
  department_id: number;
  department_name: string;
  department_code: string;
}

export interface BedOccupancyResponse {
  overall: BedOccupancyMetrics;
  by_department: DepartmentOccupancyMetrics[];
  by_bed_type: Record<BedType, BedOccupancyMetrics>;
}

export interface DepartmentStatsResponse {
  department: Department;
  occupancy: BedOccupancyMetrics;
  recent_assignments: BedAssignment[];
  recent_transfers: BedTransfer[];
}

// ==================
// Availability Check
// ==================

export interface BedAvailabilityCheck {
  bed_id: number;
  is_available: boolean;
  reason?: string;
  current_status: BedStatus;
  has_active_assignment: boolean;
  has_reservation: boolean;
  next_available_date?: string;
}

export interface AvailableBedsQuery {
  department_id?: number;
  bed_type?: BedType;
  floor_number?: number;
  required_features?: string[];
  exclude_bed_ids?: number[];
}

// ==================
// Error Types
// ==================

export interface BedError {
  code: string;
  message: string;
  details?: any;
}

export class BedNotFoundError extends Error {
  code = 'BED_NOT_FOUND';
  constructor(bedId: number) {
    super(`Bed with ID ${bedId} not found`);
    this.name = 'BedNotFoundError';
  }
}

export class BedUnavailableError extends Error {
  code = 'BED_UNAVAILABLE';
  constructor(bedId: number, reason: string) {
    super(`Bed ${bedId} is unavailable: ${reason}`);
    this.name = 'BedUnavailableError';
  }
}

export class BedAssignmentConflictError extends Error {
  code = 'BED_ASSIGNMENT_CONFLICT';
  constructor(bedId: number) {
    super(`Bed ${bedId} already has an active assignment`);
    this.name = 'BedAssignmentConflictError';
  }
}

export class InvalidTransferError extends Error {
  code = 'INVALID_TRANSFER';
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTransferError';
  }
}

export class DepartmentNotFoundError extends Error {
  code = 'DEPARTMENT_NOT_FOUND';
  constructor(departmentId: number) {
    super(`Department with ID ${departmentId} not found`);
    this.name = 'DepartmentNotFoundError';
  }
}
