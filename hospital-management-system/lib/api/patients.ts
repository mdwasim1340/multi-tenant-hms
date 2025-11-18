/**
 * Patients API Client
 * Frontend API integration for patient management
 */

import { api } from './client';

export interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  patient_number?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface PatientListResponse {
  success: boolean;
  data: {
    patients: Patient[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      has_next: boolean;
      has_prev: boolean;
    };
  };
}


/**
 * Get list of patients
 */
export async function getPatients(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<PatientListResponse> {
  const response = await api.get('/api/patients', { params });
  return response.data;
}

/**
 * Get patient by ID
 */
export async function getPatientById(id: number): Promise<{ success: boolean; data: { patient: Patient } }> {
  const response = await api.get(`/api/patients/${id}`);
  return response.data;
}
