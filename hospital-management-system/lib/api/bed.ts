import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-App-ID': 'hospital-management',
    'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'hospital-dev-key-789',
  },
});

// Add auth interceptor
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  const tenantId = Cookies.get('tenant_id');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId;
  }

  return config;
});

// Types
export interface Bed {
  id: number;
  bed_number: string;
  department_id: number;
  department_name?: string;
  bed_type: 'standard' | 'icu' | 'private' | 'semi-private' | 'isolation';
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  floor_number?: number;
  room_number?: string;
  features?: Record<string, any>;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BedAssignment {
  id: number;
  bed_id: number;
  patient_id: number;
  patient_name?: string;
  bed_number?: string;
  department_name?: string;
  admission_date: string;
  discharge_date?: string;
  admission_reason?: string;
  discharge_reason?: string;
  assigned_by?: number;
  assigned_by_name?: string;
  status: 'active' | 'discharged';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BedTransfer {
  id: number;
  patient_id: number;
  patient_name?: string;
  from_bed_id: number;
  from_bed_number?: string;
  from_department_name?: string;
  to_bed_id: number;
  to_bed_number?: string;
  to_department_name?: string;
  transfer_date: string;
  transfer_reason?: string;
  requested_by?: number;
  requested_by_name?: string;
  approved_by?: number;
  approved_by_name?: string;
  completed_by?: number;
  completed_by_name?: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  floor_number?: number;
  head_of_department?: string;
  contact_number?: string;
  total_beds?: number;
  available_beds?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OccupancyStats {
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  maintenance_beds: number;
  reserved_beds: number;
  occupancy_rate: number;
}

export interface DepartmentStats {
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  occupancy_rate: number;
  total_assignments: number;
  active_assignments: number;
  avg_stay_duration_days: number;
  recent_admissions: number;
  recent_discharges: number;
}

// Bed API
export const bedApi = {
  // List beds with filters
  async list(params?: {
    page?: number;
    limit?: number;
    search?: string;
    department_id?: number;
    bed_type?: string;
    status?: string;
    floor_number?: number;
    is_active?: boolean;
  }) {
    const response = await api.get<{
      beds: Bed[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>('/api/beds', { params });
    return response.data;
  },

  // Get bed by ID
  async getById(id: number) {
    const response = await api.get<{ bed: Bed }>(`/api/beds/${id}`);
    return response.data.bed;
  },

  // Create bed
  async create(data: {
    bed_number: string;
    department_id: number;
    bed_type: string;
    floor_number?: number;
    room_number?: string;
    features?: Record<string, any>;
    notes?: string;
  }) {
    const response = await api.post<{ bed: Bed }>('/api/beds', data);
    return response.data.bed;
  },

  // Update bed
  async update(id: number, data: Partial<Bed>) {
    const response = await api.put<{ bed: Bed }>(`/api/beds/${id}`, data);
    return response.data.bed;
  },

  // Delete bed (soft delete)
  async delete(id: number) {
    const response = await api.delete<{ message: string }>(`/api/beds/${id}`);
    return response.data;
  },

  // Get occupancy statistics
  async getOccupancy() {
    const response = await api.get<{ stats: OccupancyStats }>('/api/beds/occupancy');
    return response.data.stats;
  },
};

// Bed Assignment API
export const bedAssignmentApi = {
  // List assignments
  async list(params?: {
    page?: number;
    limit?: number;
    patient_id?: number;
    bed_id?: number;
    department_id?: number;
    status?: string;
    admission_date_from?: string;
    admission_date_to?: string;
  }) {
    const response = await api.get<{
      assignments: BedAssignment[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>('/api/beds/assignments', { params });
    return response.data;
  },

  // Get assignment by ID
  async getById(id: number) {
    const response = await api.get<{ assignment: BedAssignment }>(`/api/beds/assignments/${id}`);
    return response.data.assignment;
  },

  // Create assignment
  async create(data: {
    bed_id: number;
    patient_id: number;
    admission_date: string;
    admission_reason?: string;
    notes?: string;
  }) {
    const response = await api.post<{ assignment: BedAssignment }>('/api/beds/assignments', data);
    return response.data.assignment;
  },

  // Update assignment
  async update(id: number, data: Partial<BedAssignment>) {
    const response = await api.put<{ assignment: BedAssignment }>(`/api/beds/assignments/${id}`, data);
    return response.data.assignment;
  },

  // Discharge patient
  async discharge(id: number, data: { discharge_date: string; discharge_reason?: string }) {
    const response = await api.post<{ assignment: BedAssignment }>(`/api/beds/assignments/${id}/discharge`, data);
    return response.data.assignment;
  },

  // Get patient assignment history
  async getPatientHistory(patientId: number) {
    const response = await api.get<{ assignments: BedAssignment[] }>(`/api/beds/assignments/patient/${patientId}`);
    return response.data.assignments;
  },

  // Get bed assignment history
  async getBedHistory(bedId: number) {
    const response = await api.get<{ assignments: BedAssignment[] }>(`/api/beds/assignments/bed/${bedId}`);
    return response.data.assignments;
  },
};

// Bed Transfer API
export const bedTransferApi = {
  // List transfers
  async list(params?: {
    page?: number;
    limit?: number;
    patient_id?: number;
    from_bed_id?: number;
    to_bed_id?: number;
    status?: string;
    transfer_date_from?: string;
    transfer_date_to?: string;
  }) {
    const response = await api.get<{
      transfers: BedTransfer[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>('/api/beds/transfers', { params });
    return response.data;
  },

  // Get transfer by ID
  async getById(id: number) {
    const response = await api.get<{ transfer: BedTransfer }>(`/api/beds/transfers/${id}`);
    return response.data.transfer;
  },

  // Create transfer
  async create(data: {
    patient_id: number;
    from_bed_id: number;
    to_bed_id: number;
    transfer_date: string;
    transfer_reason?: string;
    notes?: string;
  }) {
    const response = await api.post<{ transfer: BedTransfer }>('/api/beds/transfers', data);
    return response.data.transfer;
  },

  // Update transfer
  async update(id: number, data: Partial<BedTransfer>) {
    const response = await api.put<{ transfer: BedTransfer }>(`/api/beds/transfers/${id}`, data);
    return response.data.transfer;
  },

  // Complete transfer
  async complete(id: number) {
    const response = await api.post<{ transfer: BedTransfer }>(`/api/beds/transfers/${id}/complete`);
    return response.data.transfer;
  },

  // Cancel transfer
  async cancel(id: number, reason?: string) {
    const response = await api.post<{ transfer: BedTransfer }>(`/api/beds/transfers/${id}/cancel`, { reason });
    return response.data.transfer;
  },

  // Get patient transfer history
  async getPatientHistory(patientId: number) {
    const response = await api.get<{ transfers: BedTransfer[] }>(`/api/beds/transfers/patient/${patientId}/history`);
    return response.data.transfers;
  },
};

// Department API
export const departmentApi = {
  // List departments
  async list(params?: {
    page?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
  }) {
    const response = await api.get<{
      departments: Department[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>('/api/beds/departments', { params });
    return response.data;
  },

  // Get department by ID
  async getById(id: number) {
    const response = await api.get<{ department: Department }>(`/api/beds/departments/${id}`);
    return response.data.department;
  },

  // Create department
  async create(data: {
    name: string;
    code: string;
    description?: string;
    floor_number?: number;
    head_of_department?: string;
    contact_number?: string;
  }) {
    const response = await api.post<{ department: Department }>('/api/beds/departments', data);
    return response.data.department;
  },

  // Update department
  async update(id: number, data: Partial<Department>) {
    const response = await api.put<{ department: Department }>(`/api/beds/departments/${id}`, data);
    return response.data.department;
  },

  // Get department statistics
  async getStats(id: number) {
    const response = await api.get<{ stats: DepartmentStats }>(`/api/beds/departments/${id}/stats`);
    return response.data.stats;
  },
};
