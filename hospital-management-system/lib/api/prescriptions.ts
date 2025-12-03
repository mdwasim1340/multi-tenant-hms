/**
 * Prescriptions API Client
 * Handles all prescriptions API calls
 */

import api from './client';

export interface Prescription {
  id: number;
  patient_id: number;
  provider_id: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  route: 'oral' | 'topical' | 'injection' | 'inhalation' | 'other';
  duration_days: number;
  quantity: number;
  refills_allowed: number;
  refills_remaining: number;
  instructions?: string;
  indication?: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'discontinued' | 'expired';
  discontinued_reason?: string;
  discontinued_at?: string;
  discontinued_by?: number;
  created_at: string;
  updated_at: string;
  // Joined data
  patient_first_name?: string;
  patient_last_name?: string;
  patient_number?: string;
  provider_name?: string;
}

export interface DrugInteraction {
  medication1: string;
  medication2: string;
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  recommendation: string;
}

export interface CreatePrescriptionData {
  patient_id: number;
  provider_id: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  route: 'oral' | 'topical' | 'injection' | 'inhalation' | 'other';
  duration_days: number;
  quantity: number;
  refills_allowed: number;
  instructions?: string;
  indication?: string;
  start_date: string;
}

export interface UpdatePrescriptionData {
  medication_name?: string;
  dosage?: string;
  frequency?: string;
  route?: 'oral' | 'topical' | 'injection' | 'inhalation' | 'other';
  duration_days?: number;
  quantity?: number;
  refills_allowed?: number;
  instructions?: string;
  indication?: string;
}

export interface ListPrescriptionsParams {
  patient_id?: number;
  provider_id?: number;
  status?: 'active' | 'completed' | 'discontinued' | 'expired';
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface DiscontinuePrescriptionData {
  reason: string;
}

/**
 * Get list of prescriptions
 */
export async function getPrescriptions(params?: ListPrescriptionsParams) {
  const response = await api.get('/api/emr-prescriptions', { params });
  return response.data;
}

/**
 * Get a single prescription by ID
 */
export async function getPrescription(id: number) {
  const response = await api.get(`/api/emr-prescriptions/${id}`);
  return response.data;
}

/**
 * Get prescriptions for a specific patient
 */
export async function getPatientPrescriptions(patientId: number, params?: Omit<ListPrescriptionsParams, 'patient_id'>) {
  const response = await api.get(`/api/emr-prescriptions/patient/${patientId}`, { params });
  return response.data;
}

/**
 * Create a new prescription
 */
export async function createPrescription(data: CreatePrescriptionData) {
  const response = await api.post('/api/emr-prescriptions', data);
  return response.data;
}

/**
 * Update an existing prescription
 */
export async function updatePrescription(id: number, data: UpdatePrescriptionData) {
  const response = await api.put(`/api/emr-prescriptions/${id}`, data);
  return response.data;
}

/**
 * Delete a prescription
 */
export async function deletePrescription(id: number) {
  const response = await api.delete(`/api/emr-prescriptions/${id}`);
  return response.data;
}

/**
 * Discontinue a prescription
 */
export async function discontinuePrescription(id: number, data: DiscontinuePrescriptionData) {
  const response = await api.post(`/api/emr-prescriptions/${id}/discontinue`, data);
  return response.data;
}

/**
 * Request a refill for a prescription
 */
export async function refillPrescription(id: number) {
  const response = await api.post(`/api/emr-prescriptions/${id}/refill`);
  return response.data;
}

/**
 * Check for drug interactions
 */
export async function checkDrugInteractions(patientId: number, medication: string) {
  const response = await api.get(`/api/emr-prescriptions/patient/${patientId}/interactions`, {
    params: { medication }
  });
  return response.data;
}

/**
 * Update expired prescriptions (maintenance task)
 */
export async function updateExpiredPrescriptions() {
  const response = await api.post('/api/emr-prescriptions/maintenance/update-expired');
  return response.data;
}
