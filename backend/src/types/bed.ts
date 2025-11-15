/**
 * TypeScript interfaces for Bed Management System
 * Team: Beta
 * System: Bed Management + Inventory
 */

// ==================== Department Entity ====================

export interface Department {
  id: number;
  department_name: string;
  department_code: string;
  description?: string;
  floor_number?: number;
  building?: string;
  total_capacity: number;
  status: 'active' | 'inactive';
  contact_phone?: string;
  contact_email?: string;
  head_of_department?: string;
  
  // Audit fields
  created_by?: number;
  updated_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateDepartmentData {
  department_name: string;
  department_code: string;
  description?: string;
  floor_number?: number;
  building?: string;
  total_capacity: number;
  status?: 'active' | 'inactive';
  contact_phone?: string;
  contact_email?: string;
  head_of_department?: string;
}

export interface UpdateDepartmentData extends Partial<CreateDepartmentData> {}

// ==================== Bed Entity ====================

export type BedType = 'general' | 'icu' | 'private' | 'semi_private' | 'pediatric' | 'maternity' | 'emergency';
export type BedStatus = 'available' | 'occupied' | 'maintenance' | 'reserved' | 'blocked' | 'cleaning';

export interface Bed {
  id: number;
  bed_number: string;
  department_id: number;
  bed_type: BedType;
  status: BedStatus;
  
  // Location
  room_number?: string;
  floor_number?: number;
  
  // Features (JSONB)
  features?: Record<string, any>;
  
  // Maintenance
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  maintenance_notes?: string;
  
  // Additional info
  notes?: string;
  is_active: boolean;
  
  // Audit fields
  created_by?: number;
  updated_by?: number;
  created_at?: string;
  updated_at?: string;
  
  // Relations (optional, for joined queries)
  department?: Department;
}

export interface CreateBedData {
  bed_number: string;
  department_id: number;
  bed_type: BedType;
  status?: BedStatus;
  room_number?: string;
  floor_number?: number;
  features?: Record<string, any>;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  maintenance_notes?: string;
  notes?: string;
  is_active?: boolean;
}

export interface UpdateBedData extends Partial<CreateBedData> {}

export interface BedSearchParams {
  department_id?: number;
  bed_type?: BedType;
  status?: BedStatus;
  floor_number?: number;
  room_number?: string;
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// ==================== Bed Assignment Entity ====================

export type AssignmentStatus = 'active' | 'discharged' | 'transferred';
export type DischargeType = 'normal' | 'transfer' | 'death' | 'ama' | 'absconded';
export type Priority = 'routine' | 'urgent' | 'emergency';

export interface BedAssignment {
  id: number;
  bed_id: number;
  patient_id: number;
  status: AssignmentStatus;
  
  // Dates
  admission_date: string;
  expected_discharge_date?: string;
  actual_discharge_date?: string;
  
  // Discharge info
  discharge_reason?: string;
  discharge_notes?: string;
  discharge_type?: DischargeType;
  
  // Clinical info
  admission_diagnosis?: string;
  admission_notes?: string;
  priority?: Priority;
  
  // Staff assignment
  assigned_doctor_id?: number;
  assigned_nurse_id?: number;
  special_requirements?: string;
  
  // Audit fields
  created_by?: number;
  updated_by?: number;
  created_at?: string;
  updated_at?: string;
  
  // Relations (optional)
  bed?: Bed;
  patient?: any; // Define patient type when available
}

export interface CreateBedAssignmentData {
  bed_id: number;
  patient_id: number;
  admission_date?: string;
  expected_discharge_date?: string;
  admission_diagnosis?: string;
  admission_notes?: string;
  priority?: Priority;
  assigned_doctor_id?: number;
  assigned_nurse_id?: number;
  special_requirements?: string;
}

export interface UpdateBedAssignmentData extends Partial<CreateBedAssignmentData> {}

export interface DischargeBedAssignmentData {
  discharge_reason: string;
  discharge_notes?: string;
  discharge_type: DischargeType;
  actual_discharge_date?: string;
}

// ==================== Bed Transfer Entity ====================

export type TransferStatus = 'pending' | 'approved' | 'completed' | 'cancelled';

export interface BedTransfer {
  id: number;
  patient_id: number;
  from_bed_id: number;
  to_bed_id: number;
  from_department_id: number;
  to_department_id: number;
  status: TransferStatus;
  transfer_date: string;
  reason?: string;
  notes?: string;
  approved_by?: number;
  performed_by?: number;
  
  // Audit fields
  created_by?: number;
  updated_by?: number;
  created_at?: string;
  updated_at?: string;
  
  // Relations (optional)
  from_bed?: Bed;
  to_bed?: Bed;
  from_department?: Department;
  to_department?: Department;
  patient?: any;
}

export interface CreateBedTransferData {
  patient_id: number;
  from_bed_id: number;
  to_bed_id: number;
  from_department_id: number;
  to_department_id: number;
  transfer_date?: string;
  reason?: string;
  notes?: string;
  approved_by?: number;
  performed_by?: number;
}

export interface UpdateBedTransferData {
  status?: TransferStatus;
  transfer_date?: string;
  reason?: string;
  notes?: string;
  approved_by?: number;
  performed_by?: number;
}

// ==================== API Response Types ====================

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface BedsResponse {
  data: {
    beds: Bed[];
    pagination: PaginationMeta;
  };
}

export interface BedResponse {
  data: {
    bed: Bed;
  };
}

export interface DepartmentsResponse {
  data: {
    departments: Department[];
    pagination: PaginationMeta;
  };
}

export interface DepartmentResponse {
  data: {
    department: Department;
  };
}

export interface BedAssignmentsResponse {
  data: {
    assignments: BedAssignment[];
    pagination: PaginationMeta;
  };
}

export interface BedAssignmentResponse {
  data: {
    assignment: BedAssignment;
  };
}

export interface BedTransfersResponse {
  data: {
    transfers: BedTransfer[];
    pagination: PaginationMeta;
  };
}

export interface BedTransferResponse {
  data: {
    transfer: BedTransfer;
  };
}

export interface BedOccupancyStats {
  department_id: number;
  department_name: string;
  total_beds: number;
  available: number;
  occupied: number;
  maintenance: number;
  reserved: number;
  blocked: number;
  cleaning: number;
  occupancy_rate: number; // Percentage
}

export interface DepartmentStatsResponse {
  data: {
    department: Department;
    occupancy: BedOccupancyStats;
  };
}

export interface SystemOccupancyResponse {
  data: {
    occupancy_by_department: BedOccupancyStats[];
    total_stats: {
      total_beds: number;
      available: number;
      occupied: number;
      occupancy_rate: number;
    };
  };
}
