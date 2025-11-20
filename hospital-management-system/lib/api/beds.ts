/**
 * Bed Management API Client
 * Connects frontend to backend bed management endpoints
 */

import { api } from '../api';

// ==========================================
// TypeScript Interfaces
// ==========================================

export interface Department {
  id: number;
  name: string;
  description?: string;
  bed_capacity: number;
  floor_number?: number;
  building?: string;
  head_of_department?: string;
  contact_number?: string;
  created_at: string;
  updated_at: string;
}

export interface DepartmentStats {
  department_id: number;
  department_name: string;
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  maintenance_beds: number;
  reserved_beds: number;
  occupancy_rate: number;
}

export interface Bed {
  id: number;
  bed_number: string;
  department_id: number;
  department_name?: string;
  bed_type: 'general' | 'icu' | 'private' | 'semi-private' | 'emergency' | 'pediatric' | 'maternity';
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  floor_number?: number;
  room_number?: string;
  features?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BedAssignment {
  id: number;
  bed_id: number;
  patient_id: number;
  admission_date: string;
  discharge_date?: string;
  admission_reason?: string;
  discharge_reason?: string;
  status: 'active' | 'discharged' | 'transferred';
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  bed_number?: string;
  patient_name?: string;
  department_name?: string;
}

export interface BedTransfer {
  id: number;
  assignment_id: number;
  from_bed_id: number;
  to_bed_id: number;
  transfer_date: string;
  transfer_reason?: string;
  status: 'pending' | 'completed' | 'cancelled';
  completed_at?: string;
  cancelled_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  patient_name?: string;
  from_bed_number?: string;
  to_bed_number?: string;
}

export interface BedOccupancy {
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  maintenance_beds: number;
  reserved_beds: number;
  occupancy_rate: number;
  by_type: {
    [key: string]: {
      total: number;
      occupied: number;
      available: number;
    };
  };
}

// ==========================================
// Department API
// ==========================================

export const departmentApi = {
  /**
   * Get all departments
   */
  async getDepartments(): Promise<{ departments: Department[] }> {
    const response = await api.get('/api/departments');
    return response.data;
  },

  /**
   * Get department by ID
   */
  async getDepartmentById(id: number): Promise<{ department: Department }> {
    const response = await api.get(`/api/beds/departments/${id}`);
    return response.data;
  },

  /**
   * Create new department
   */
  async createDepartment(data: {
    name: string;
    description?: string;
    bed_capacity: number;
    floor_number?: number;
    building?: string;
    head_of_department?: string;
    contact_number?: string;
  }): Promise<{ message: string; department: Department }> {
    const response = await api.post('/api/beds/departments', data);
    return response.data;
  },

  /**
   * Update department
   */
  async updateDepartment(
    id: number,
    data: Partial<{
      name: string;
      description: string;
      bed_capacity: number;
      floor_number: number;
      building: string;
      head_of_department: string;
      contact_number: string;
    }>
  ): Promise<{ message: string; department: Department }> {
    const response = await api.put(`/api/beds/departments/${id}`, data);
    return response.data;
  },

  /**
   * Get department statistics
   */
  async getDepartmentStats(id: number): Promise<{ stats: DepartmentStats }> {
    const response = await api.get(`/api/beds/departments/${id}/stats`);
    return response.data;
  },
};

// ==========================================
// Bed API
// ==========================================

export const bedApi = {
  /**
   * Get beds with filtering
   */
  async getBeds(params?: {
    department_id?: number;
    bed_type?: string;
    status?: string;
    floor_number?: number;
    page?: number;
    limit?: number;
  }): Promise<{ beds: Bed[]; pagination: any }> {
    const response = await api.get('/api/beds', { params });
    return response.data;
  },

  /**
   * Get bed by ID
   */
  async getBedById(id: number): Promise<{ bed: Bed }> {
    const response = await api.get(`/api/beds/${id}`);
    return response.data;
  },

  /**
   * Create new bed
   */
  async createBed(data: {
    bed_number: string;
    department_id: number;
    bed_type: string;
    floor_number?: number;
    room_number?: string;
    features?: string[];
    notes?: string;
  }): Promise<{ message: string; bed: Bed }> {
    const response = await api.post('/api/beds', data);
    return response.data;
  },

  /**
   * Update bed
   */
  async updateBed(
    id: number,
    data: Partial<{
      bed_number: string;
      department_id: number;
      bed_type: string;
      status: string;
      floor_number: number;
      room_number: string;
      features: string[];
      notes: string;
    }>
  ): Promise<{ message: string; bed: Bed }> {
    const response = await api.put(`/api/beds/${id}`, data);
    return response.data;
  },

  /**
   * Delete bed
   */
  async deleteBed(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/api/beds/${id}`);
    return response.data;
  },

  /**
   * Get bed occupancy metrics
   */
  async getBedOccupancy(): Promise<{ occupancy: BedOccupancy }> {
    const response = await api.get('/api/beds/occupancy');
    return response.data;
  },

  /**
   * Get available beds
   */
  async getAvailableBeds(params?: {
    department_id?: number;
    bed_type?: string;
  }): Promise<{ beds: Bed[]; count: number }> {
    const response = await api.get('/api/beds/availability', { params });
    return response.data;
  },
};

// ==========================================
// Bed Assignment API
// ==========================================

export const bedAssignmentApi = {
  /**
   * Get bed assignments
   */
  async getAssignments(params?: {
    bed_id?: number;
    patient_id?: number;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ assignments: BedAssignment[]; pagination: any }> {
    const response = await api.get('/api/beds/assignments', { params });
    return response.data;
  },

  /**
   * Get assignment by ID
   */
  async getAssignmentById(id: number): Promise<{ assignment: BedAssignment }> {
    const response = await api.get(`/api/beds/assignments/${id}`);
    return response.data;
  },

  /**
   * Create bed assignment
   */
  async createAssignment(data: {
    bed_id: number;
    patient_id: number;
    admission_date: string;
    admission_reason?: string;
    notes?: string;
  }): Promise<{ message: string; assignment: BedAssignment }> {
    const response = await api.post('/api/beds/assignments', data);
    return response.data;
  },

  /**
   * Update assignment
   */
  async updateAssignment(
    id: number,
    data: Partial<{
      admission_reason: string;
      notes: string;
    }>
  ): Promise<{ message: string; assignment: BedAssignment }> {
    const response = await api.put(`/api/beds/assignments/${id}`, data);
    return response.data;
  },

  /**
   * Discharge patient
   */
  async dischargePatient(
    id: number,
    data: {
      discharge_date: string;
      discharge_reason?: string;
    }
  ): Promise<{ message: string; assignment: BedAssignment }> {
    const response = await api.post(`/api/beds/assignments/${id}/discharge`, data);
    return response.data;
  },

  /**
   * Get patient bed history
   */
  async getPatientHistory(patientId: number): Promise<{ assignments: BedAssignment[] }> {
    const response = await api.get(`/api/beds/assignments/patient/${patientId}`);
    return response.data;
  },

  /**
   * Get bed assignment history
   */
  async getBedHistory(bedId: number): Promise<{ assignments: BedAssignment[] }> {
    const response = await api.get(`/api/beds/assignments/bed/${bedId}`);
    return response.data;
  },
};

// ==========================================
// Bed Transfer API
// ==========================================

export const bedTransferApi = {
  /**
   * Get bed transfers
   */
  async getTransfers(params?: {
    patient_id?: number;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ transfers: BedTransfer[]; pagination: any }> {
    const response = await api.get('/api/beds/transfers', { params });
    return response.data;
  },

  /**
   * Get transfer by ID
   */
  async getTransferById(id: number): Promise<{ transfer: BedTransfer }> {
    const response = await api.get(`/api/beds/transfers/${id}`);
    return response.data;
  },

  /**
   * Create bed transfer
   */
  async createTransfer(data: {
    assignment_id: number;
    from_bed_id: number;
    to_bed_id: number;
    transfer_date: string;
    transfer_reason?: string;
    notes?: string;
  }): Promise<{ message: string; transfer: BedTransfer }> {
    const response = await api.post('/api/beds/transfers', data);
    return response.data;
  },

  /**
   * Complete transfer
   */
  async completeTransfer(id: number): Promise<{ message: string; transfer: BedTransfer }> {
    const response = await api.post(`/api/beds/transfers/${id}/complete`);
    return response.data;
  },

  /**
   * Cancel transfer
   */
  async cancelTransfer(id: number): Promise<{ message: string; transfer: BedTransfer }> {
    const response = await api.post(`/api/beds/transfers/${id}/cancel`);
    return response.data;
  },

  /**
   * Get patient transfer history
   */
  async getPatientTransferHistory(patientId: number): Promise<{ transfers: BedTransfer[] }> {
    const response = await api.get(`/api/beds/transfers/patient/${patientId}/history`);
    return response.data;
  },
};

// ==========================================
// Export all APIs
// ==========================================

export default {
  departments: departmentApi,
  beds: bedApi,
  assignments: bedAssignmentApi,
  transfers: bedTransferApi,
};
