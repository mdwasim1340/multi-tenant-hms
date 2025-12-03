/**
 * Medical History API Client
 * Handles all medical history API calls
 */

import api from './client';

export interface MedicalHistoryEntry {
  id: number;
  patient_id: number;
  category: 'condition' | 'surgery' | 'allergy' | 'family_history';
  name: string;
  description?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  reaction?: string;
  onset_date?: string;
  resolution_date?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  patient_first_name?: string;
  patient_last_name?: string;
  patient_number?: string;
}

export interface CreateHistoryData {
  patient_id: number;
  category: 'condition' | 'surgery' | 'allergy' | 'family_history';
  name: string;
  description?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  reaction?: string;
  onset_date?: string;
  resolution_date?: string;
  is_active?: boolean;
  notes?: string;
}

export interface UpdateHistoryData {
  name?: string;
  description?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  reaction?: string;
  onset_date?: string;
  resolution_date?: string;
  is_active?: boolean;
  notes?: string;
}

export interface ListHistoryParams {
  patient_id?: number;
  category?: 'condition' | 'surgery' | 'allergy' | 'family_history';
  is_active?: boolean;
  severity?: 'mild' | 'moderate' | 'severe';
  page?: number;
  limit?: number;
}

export interface CriticalAllergy {
  id: number;
  patient_id: number;
  name: string;
  severity: 'severe';
  reaction?: string;
  notes?: string;
}

export interface MedicalHistorySummary {
  patient_id: number;
  conditions: MedicalHistoryEntry[];
  surgeries: MedicalHistoryEntry[];
  allergies: MedicalHistoryEntry[];
  family_history: MedicalHistoryEntry[];
  critical_allergies: CriticalAllergy[];
}

/**
 * Get list of medical history entries
 */
export async function getMedicalHistory(params?: ListHistoryParams) {
  const response = await api.get('/api/medical-history', { params });
  return response.data;
}

/**
 * Get a single medical history entry by ID
 */
export async function getMedicalHistoryEntry(id: number) {
  const response = await api.get(`/api/medical-history/${id}`);
  return response.data;
}

/**
 * Get medical history for a specific patient
 */
export async function getPatientMedicalHistory(patientId: number, params?: Omit<ListHistoryParams, 'patient_id'>) {
  const response = await api.get(`/api/medical-history/patient/${patientId}`, { params });
  return response.data;
}

/**
 * Create a new medical history entry
 */
export async function createMedicalHistoryEntry(data: CreateHistoryData) {
  const response = await api.post('/api/medical-history', data);
  return response.data;
}

/**
 * Update an existing medical history entry
 */
export async function updateMedicalHistoryEntry(id: number, data: UpdateHistoryData) {
  const response = await api.put(`/api/medical-history/${id}`, data);
  return response.data;
}

/**
 * Delete a medical history entry
 */
export async function deleteMedicalHistoryEntry(id: number) {
  const response = await api.delete(`/api/medical-history/${id}`);
  return response.data;
}

/**
 * Get critical allergies for a patient
 */
export async function getPatientCriticalAllergies(patientId: number) {
  const response = await api.get(`/api/medical-history/patient/${patientId}/critical-allergies`);
  return response.data;
}

/**
 * Get complete medical history summary for a patient
 */
export async function getPatientMedicalHistorySummary(patientId: number): Promise<MedicalHistorySummary> {
  const response = await api.get(`/api/medical-history/patient/${patientId}/summary`);
  return response.data;
}
