/**
 * Bed Management API Client
 * Handles all bed management operations
 */

import { api } from './client';

export interface Department {
  id: number;
  name: string;
  department_code: string;
  floor_number: number;
  total_bed_capacity: number;
  active_bed_count: number;
  status: string;
  bed_capacity?: number; // Alternative field name
}

export interface DepartmentStats {
  department_id: number;
  department_name: string;
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  maintenance_beds: number;
  occupancy_rate: number;
  avgOccupancyTime?: number;
  criticalPatients?: number;
}

export interface Bed {
  id: number;
  bed_number: string;
  department_id: number;
  category_id?: number; // ✅ ADDED: Bed category ID for grouping
  unit?: string; // ✅ ADDED: Unit/Category name (ICU, Cardiology, etc.)
  bed_type: string;
  status: string;
  floor_number?: number;
  room_number?: string;
  wing?: string;
  features?: string[];
  updated_at?: string;
}

export interface BedAssignment {
  id: number;
  bed_id: number;
  patient_id: number;
  patient_name: string;
  admission_date: string;
  status: string;
}

export interface BedTransfer {
  id: number;
  from_bed_id: number;
  to_bed_id: number;
  patient_id: number;
  reason: string;
  priority: string;
  status: string;
  created_at: string;
}

export interface BedOccupancy {
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  maintenance_beds: number;
  occupancy_rate: number;
}

class BedManagementAPI {
  // Department operations
  async getDepartments() {
    const response = await api.get('/api/departments');
    return response.data;
  }

  async getDepartmentStats(departmentId: number) {
    const response = await api.get(`/api/departments/${departmentId}/stats`);
    return response.data;
  }

  // Bed operations
  async getBeds(filters?: {
    department_id?: number;
    category_id?: number; // ✅ ADDED: Filter by bed category
    bed_type?: string;
    status?: string;
    floor_number?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.department_id) params.append('department_id', filters.department_id.toString());
    if (filters?.category_id) params.append('category_id', filters.category_id.toString()); // ✅ ADDED
    if (filters?.bed_type) params.append('bed_type', filters.bed_type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.floor_number) params.append('floor_number', filters.floor_number.toString());

    const queryString = params.toString();
    const url = `/api/beds${queryString ? `?${queryString}` : ''}`;
    console.log('🔍 API: Calling', url);
    const response = await api.get(url);
    console.log('🔍 API: Response status', response.status);
    console.log('🔍 API: Response data', response.data);
    console.log('🔍 API: Beds count', response.data?.beds?.length || 0);
    return response.data;
  }

  async getBedOccupancy() {
    const response = await api.get('/api/beds/occupancy');
    return response.data;
  }

  async getAvailableBeds(filters?: {
    department_id?: number;
    bed_type?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.department_id) params.append('department_id', filters.department_id.toString());
    if (filters?.bed_type) params.append('bed_type', filters.bed_type);

    const queryString = params.toString();
    const response = await api.get(`/api/beds/availability${queryString ? `?${queryString}` : ''}`);
    return response.data;
  }

  async createBed(bedData: {
    bed_number: string;
    department_id: number;
    bed_type: string;
    floor_number?: number;
    room_number?: string;
    wing?: string;
    features?: any;
    notes?: string;
  }) {
    const response = await api.post('/api/beds', bedData);
    return response.data;
  }

  async updateBed(bedId: number, bedData: {
    bed_type?: string;
    floor_number?: string;
    room_number?: string;
    wing?: string;
    status?: string;
    features?: any;
    notes?: string;
  }) {
    const response = await api.put(`/api/beds/${bedId}`, bedData);
    return response.data;
  }

  async deleteBed(bedId: number) {
    const response = await api.delete(`/api/beds/${bedId}`);
    return response.data;
  }

  // Assignment operations
  async getAssignments(filters?: {
    bed_id?: number;
    patient_id?: number;
    status?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.bed_id) params.append('bed_id', filters.bed_id.toString());
    if (filters?.patient_id) params.append('patient_id', filters.patient_id.toString());
    if (filters?.status) params.append('status', filters.status);

    const queryString = params.toString();
    const response = await api.get(`/api/beds/assignments${queryString ? `?${queryString}` : ''}`);
    return response.data;
  }

  async createAssignment(assignmentData: any) {
    const response = await api.post('/api/beds/assignments', assignmentData);
    return response.data;
  }

  async dischargePatient(assignmentId: number, dischargeData: any) {
    const response = await api.post(`/api/beds/assignments/${assignmentId}/discharge`, dischargeData);
    return response.data;
  }

  async getPatientHistory(patientId: number) {
    const response = await api.get(`/api/beds/assignments/patient/${patientId}`);
    return response.data;
  }

  // Transfer operations
  async getTransfers(filters?: {
    patient_id?: number;
    status?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.patient_id) params.append('patient_id', filters.patient_id.toString());
    if (filters?.status) params.append('status', filters.status);

    const queryString = params.toString();
    const response = await api.get(`/api/beds/transfers${queryString ? `?${queryString}` : ''}`);
    return response.data;
  }

  async createTransfer(transferData: any) {
    const response = await api.post('/api/beds/transfers', transferData);
    return response.data;
  }

  async completeTransfer(transferId: number) {
    const response = await api.post(`/api/beds/transfers/${transferId}/complete`);
    return response.data;
  }

  async cancelTransfer(transferId: number) {
    const response = await api.post(`/api/beds/transfers/${transferId}/cancel`);
    return response.data;
  }

  async getPatientTransferHistory(patientId: number) {
    const response = await api.get(`/api/beds/transfers/patient/${patientId}/history`);
    return response.data;
  }

  // Enhanced bed management operations
  async getDashboardMetrics() {
    const response = await api.get('/api/bed-management/dashboard/metrics');
    return response.data;
  }

  async getBedsVisualization(filters?: {
    department_id?: number;
    status?: string;
    bed_type?: string;
    floor_number?: number;
    search?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.department_id) params.append('department_id', filters.department_id.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.bed_type) params.append('bed_type', filters.bed_type);
    if (filters?.floor_number) params.append('floor_number', filters.floor_number.toString());
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString();
    const response = await api.get(`/api/bed-management/beds/visualization${queryString ? `?${queryString}` : ''}`);
    return response.data;
  }

  async createEnhancedAssignment(assignmentData: {
    bed_id: number;
    patient_name: string;
    patient_mrn?: string;
    patient_age?: number;
    patient_gender?: string;
    admission_date: string;
    expected_discharge_date?: string;
    condition?: string;
    assigned_doctor?: string;
    assigned_nurse?: string;
    admission_reason?: string;
    allergies?: string;
    current_medications?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    notes?: string;
  }) {
    const response = await api.post('/api/bed-management/assignments', assignmentData);
    return response.data;
  }

  async createEnhancedTransfer(transferData: {
    from_bed_id: number;
    to_bed_id: number;
    patient_id?: number;
    reason: string;
    priority?: string;
    scheduled_time?: string;
    notes?: string;
    new_doctor?: string;
    new_nurse?: string;
    transport_method?: string;
    equipment_needed?: string;
  }) {
    const response = await api.post('/api/bed-management/transfers', transferData);
    return response.data;
  }

  async scheduleMaintenance(maintenanceData: {
    bed_id: number;
    maintenance_type: string;
    priority?: string;
    description: string;
    estimated_duration?: number;
    scheduled_time?: string;
    assigned_technician?: string;
    equipment_needed?: string;
    safety_precautions?: string;
    requires_patient_relocation?: boolean;
  }) {
    const response = await api.post('/api/bed-management/maintenance', maintenanceData);
    return response.data;
  }

  async getBedHistory(bedId: number, limit?: number, offset?: number) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    const queryString = params.toString();
    const response = await api.get(`/api/bed-management/history/${bedId}${queryString ? `?${queryString}` : ''}`);
    return response.data;
  }

  async getOccupancyReport(filters?: {
    start_date?: string;
    end_date?: string;
    department_id?: number;
    group_by?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.department_id) params.append('department_id', filters.department_id.toString());
    if (filters?.group_by) params.append('group_by', filters.group_by);

    const queryString = params.toString();
    const response = await api.get(`/api/bed-management/reports/occupancy${queryString ? `?${queryString}` : ''}`);
    return response.data;
  }
}

// Export grouped API methods
const bedManagementApi = {
  departments: {
    getDepartments: () => new BedManagementAPI().getDepartments(),
    getDepartmentStats: (id: number) => new BedManagementAPI().getDepartmentStats(id),
  },
  beds: {
    getBeds: (filters?: any) => new BedManagementAPI().getBeds(filters),
    getBedOccupancy: () => new BedManagementAPI().getBedOccupancy(),
    getAvailableBeds: (filters?: any) => new BedManagementAPI().getAvailableBeds(filters),
    createBed: (data: any) => new BedManagementAPI().createBed(data),
    updateBed: (id: number, data: any) => new BedManagementAPI().updateBed(id, data),
    deleteBed: (id: number) => new BedManagementAPI().deleteBed(id),
  },
  assignments: {
    getAssignments: (filters?: any) => new BedManagementAPI().getAssignments(filters),
    createAssignment: (data: any) => new BedManagementAPI().createAssignment(data),
    dischargePatient: (id: number, data: any) => new BedManagementAPI().dischargePatient(id, data),
    getPatientHistory: (patientId: number) => new BedManagementAPI().getPatientHistory(patientId),
  },
  transfers: {
    getTransfers: (filters?: any) => new BedManagementAPI().getTransfers(filters),
    createTransfer: (data: any) => new BedManagementAPI().createTransfer(data),
    completeTransfer: (id: number) => new BedManagementAPI().completeTransfer(id),
    cancelTransfer: (id: number) => new BedManagementAPI().cancelTransfer(id),
    getPatientTransferHistory: (patientId: number) => new BedManagementAPI().getPatientTransferHistory(patientId),
  },
  enhanced: {
    getDashboardMetrics: () => new BedManagementAPI().getDashboardMetrics(),
    getBedsVisualization: (filters?: any) => new BedManagementAPI().getBedsVisualization(filters),
    createEnhancedAssignment: (data: any) => new BedManagementAPI().createEnhancedAssignment(data),
    createEnhancedTransfer: (data: any) => new BedManagementAPI().createEnhancedTransfer(data),
    scheduleMaintenance: (data: any) => new BedManagementAPI().scheduleMaintenance(data),
    getBedHistory: (bedId: number, limit?: number, offset?: number) => new BedManagementAPI().getBedHistory(bedId, limit, offset),
    getOccupancyReport: (filters?: any) => new BedManagementAPI().getOccupancyReport(filters),
  },
};

export default bedManagementApi;
export { BedManagementAPI };