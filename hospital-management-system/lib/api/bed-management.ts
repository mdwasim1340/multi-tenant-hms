/**
 * Enhanced Bed Management API Client
 * Handles all bed management operations including transfers and discharges
 */

import { api } from './client';

export interface Bed {
  id: string;
  bedNumber: string;
  status: 'Occupied' | 'Available' | 'Maintenance' | 'Under Cleaning' | 'Reserved';
  patientName?: string;
  patientId?: string;
  admissionDate?: string;
  expectedDischarge?: string;
  condition?: 'Critical' | 'Stable' | 'Fair' | 'Good';
  assignedNurse?: string;
  assignedDoctor?: string;
  bedType: 'Standard' | 'ICU' | 'Isolation' | 'Pediatric' | 'Bariatric' | 'Maternity';
  categoryId?: number | null;
  floor: string;
  wing: string;
  room: string;
  equipment: string[];
  lastUpdated: string;
}

export interface DepartmentStats {
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  maintenanceBeds: number;
  occupancyRate: number;
  avgOccupancyTime: number;
  criticalPatients: number;
}

export interface TransferData {
  fromBedId: number;
  toBedId: number;
  patientId: number;
  reason: string;
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  scheduledTime?: string;
  notes?: string;
  notifications: string[];
  newDoctorId?: number;
  newNurseId?: number;
  updatedCondition?: string;
}

export interface Transfer {
  id: number;
  fromBedId: number;
  toBedId: number;
  patientId: number;
  reason: string;
  priority: string;
  scheduledTime?: string;
  executedTime?: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  notes?: string;
  performedBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface DischargeData {
  bedId: number;
  patientId: number;
  dischargeDate: string;
  dischargeType: 'Recovered' | 'Transferred to another facility' | 'AMA' | 'Deceased';
  dischargeSummary: string;
  finalBillStatus: 'Paid' | 'Pending' | 'Insurance Claim';
  followUpRequired: boolean;
  followUpDate?: string;
  followUpInstructions?: string;
  medications: string[];
  homeCareInstructions?: string;
  notifications: string[];
  transportArrangement: string;
}

export interface Discharge {
  id: number;
  bedId: number;
  patientId: number;
  dischargeDate: string;
  dischargeType: string;
  dischargeSummary: string;
  finalBillStatus: string;
  followUpRequired: boolean;
  followUpDate?: string;
  followUpInstructions?: string;
  medications: string[];
  homeCareInstructions?: string;
  transportArrangement: string;
  performedBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface BedHistory {
  id: string;
  timestamp: string;
  eventType: 'Admission' | 'Discharge' | 'Transfer In' | 'Transfer Out' | 'Maintenance Start' | 'Maintenance End' | 'Cleaning';
  patientName?: string;
  staffMember: string;
  notes?: string;
}

export class BedManagementAPI {
  /**
   * Get all beds for a specific department
   */
  static async getDepartmentBeds(
    departmentName: string,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      bedType?: string;
      floor?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ) {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.bedType) searchParams.append('bed_type', params.bedType);
    if (params?.sortBy) searchParams.append('sort_by', params.sortBy);
    if (params?.sortOrder) searchParams.append('sort_order', params.sortOrder);

    const queryString = searchParams.toString();
    const url = `/api/bed-management/departments/${departmentName}/beds${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    
    // Transform snake_case API response to camelCase for frontend
    if (response.data?.beds) {
      response.data.beds = response.data.beds.map((bed: any) => ({
        id: bed.id?.toString() || '',
        bedNumber: bed.bed_number || '',
        status: bed.status || 'Available',
        patientName: bed.patient_name,
        patientId: bed.patient_id,
        admissionDate: bed.admission_date,
        expectedDischarge: bed.expected_discharge,
        condition: bed.condition,
        assignedNurse: bed.assigned_nurse,
        assignedDoctor: bed.assigned_doctor,
        bedType: bed.bed_type || 'Standard',
        categoryId: bed.category_id != null ? Number(bed.category_id) : null,
        floor: bed.floor || '',
        wing: bed.wing || '',
        room: bed.room || bed.room_number || '',
        equipment: bed.features || bed.equipment || [],
        lastUpdated: bed.updated_at || bed.last_updated || new Date().toISOString(),
      }));
    }
    
    return response.data;
  }

  /**
   * Get department-specific bed statistics
   */
  static async getDepartmentStats(departmentName: string): Promise<DepartmentStats> {
    const response = await api.get(`/api/bed-management/departments/${departmentName}/stats`);
    
    // Transform snake_case API response to camelCase for frontend
    const data = response.data;
    return {
      totalBeds: data.total_beds || 0,
      occupiedBeds: data.occupied_beds || 0,
      availableBeds: data.available_beds || 0,
      maintenanceBeds: data.maintenance_beds || 0,
      occupancyRate: data.occupancy_rate || 0,
      avgOccupancyTime: data.avgOccupancyTime || data.avg_occupancy_time || 0,
      criticalPatients: data.criticalPatients || data.critical_patients || 0,
    };
  }

  /**
   * Get bed history
   */
  static async getBedHistory(bedId: number, limit?: number): Promise<{ history: BedHistory[] }> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await api.get(`/api/bed-management/beds/${bedId}/history${params}`);
    return response.data;
  }

  /**
   * Create a new patient transfer
   */
  static async createTransfer(transferData: TransferData): Promise<Transfer> {
    const response = await api.post('/api/bed-management/transfers', transferData);
    return response.data;
  }

  /**
   * Execute a scheduled transfer
   */
  static async executeTransfer(transferId: number): Promise<Transfer> {
    const response = await api.post(`/api/bed-management/transfers/${transferId}/execute`);
    return response.data;
  }

  /**
   * Get transfer history
   */
  static async getTransfers(params?: {
    patientId?: number;
    bedId?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }) {
    const searchParams = new URLSearchParams();
    
    if (params?.patientId) searchParams.append('patientId', params.patientId.toString());
    if (params?.bedId) searchParams.append('bedId', params.bedId.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.dateFrom) searchParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) searchParams.append('dateTo', params.dateTo);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const queryString = searchParams.toString();
    const url = `/api/bed-management/transfers${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  }

  /**
   * Process patient discharge
   */
  static async dischargePatient(dischargeData: DischargeData): Promise<Discharge> {
    const response = await api.post('/api/bed-management/discharges', dischargeData);
    return response.data;
  }

  /**
   * Get discharge history
   */
  static async getDischarges(params?: {
    patientId?: number;
    bedId?: number;
    dischargeType?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }) {
    const searchParams = new URLSearchParams();
    
    if (params?.patientId) searchParams.append('patientId', params.patientId.toString());
    if (params?.bedId) searchParams.append('bedId', params.bedId.toString());
    if (params?.dischargeType) searchParams.append('dischargeType', params.dischargeType);
    if (params?.dateFrom) searchParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) searchParams.append('dateTo', params.dateTo);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const queryString = searchParams.toString();
    const url = `/api/bed-management/discharges${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  }

  /**
   * Get available beds for transfer
   */
  static async getAvailableBeds(params?: {
    departmentId?: number;
    bedType?: string;
  }) {
    const searchParams = new URLSearchParams();
    
    if (params?.departmentId) searchParams.append('departmentId', params.departmentId.toString());
    if (params?.bedType) searchParams.append('bedType', params.bedType);

    const queryString = searchParams.toString();
    const url = `/api/bed-management/available-beds${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  }

  /**
   * Get bed occupancy statistics
   */
  static async getBedOccupancy() {
    const response = await api.get('/api/bed-management/beds/occupancy');
    return response.data;
  }

  /**
   * Create a new bed
   */
  static async createBed(bedData: {
    bed_number: string;
    department_id: number;
    bed_type: string;
    floor_number?: number;
    room_number?: string;
    wing?: string;
    features?: any;
    notes?: string;
  }) {
    const response = await api.post('/api/bed-management/beds', bedData);
    return response.data;
  }

  /**
   * Update bed information
   */
  static async updateBed(bedId: number, bedData: {
    bed_type?: string;
    floor_number?: string;
    room_number?: string;
    wing?: string;
    status?: string;
    features?: any;
    notes?: string;
  }) {
    const response = await api.put(`/api/bed-management/beds/${bedId}`, bedData);
    return response.data;
  }

  /**
   * Delete bed (soft delete)
   */
  static async deleteBed(bedId: number) {
    const response = await api.delete(`/api/bed-management/beds/${bedId}`);
    return response.data;
  }
}