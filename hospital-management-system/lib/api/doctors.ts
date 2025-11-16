/**
 * Doctors API Client
 * Frontend API integration for doctor management
 */

import { api } from './client';

export interface Doctor {
  id: number;
  name: string;
  email: string;
  specialty?: string;
  phone?: string;
  license_number?: string;
  department?: string;
  created_at: string;
  updated_at: string;
}

export interface DoctorListResponse {
  success: boolean;
  data: {
    doctors: Doctor[];
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
 * Get list of doctors
 */
export async function getDoctors(params?: {
  page?: number;
  limit?: number;
  search?: string;
  specialty?: string;
}): Promise<DoctorListResponse> {
  const response = await api.get('/api/doctors', { params });
  return response.data;
}

/**
 * Get doctor by ID
 */
export async function getDoctorById(id: number): Promise<{ success: boolean; data: { doctor: Doctor } }> {
  const response = await api.get(`/api/doctors/${id}`);
  return response.data;
}
