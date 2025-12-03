/**
 * Clinical Notes API Client
 * Handles all clinical notes API calls
 */

import api from './client';

export interface ClinicalNote {
  id: number;
  patient_id: number;
  provider_id: number;
  note_type: 'progress' | 'consultation' | 'admission' | 'discharge' | 'procedure' | 'follow_up';
  content: string;
  status: 'draft' | 'signed';
  signed_at?: string;
  signed_by?: number;
  created_at: string;
  updated_at: string;
  // Joined data
  patient_first_name?: string;
  patient_last_name?: string;
  patient_number?: string;
  provider_name?: string;
}

export interface ClinicalNoteVersion {
  id: number;
  note_id: number;
  version_number: number;
  content: string;
  changed_by: number;
  changed_at: string;
  change_reason?: string;
}

export interface CreateNoteData {
  patient_id: number;
  provider_id: number;
  note_type: 'progress' | 'consultation' | 'admission' | 'discharge' | 'procedure' | 'follow_up';
  content: string;
}

export interface UpdateNoteData {
  content?: string;
  note_type?: 'progress' | 'consultation' | 'admission' | 'discharge' | 'procedure' | 'follow_up';
  change_reason?: string;
}

export interface ListNotesParams {
  patient_id?: number;
  provider_id?: number;
  note_type?: string;
  status?: 'draft' | 'signed';
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

/**
 * Get list of clinical notes
 */
export async function getClinicalNotes(params?: ListNotesParams) {
  const response = await api.get('/api/clinical-notes', { params });
  return response.data;
}

/**
 * Get a single clinical note by ID
 */
export async function getClinicalNote(id: number) {
  const response = await api.get(`/api/clinical-notes/${id}`);
  return response.data;
}

/**
 * Get clinical notes for a specific patient
 */
export async function getPatientClinicalNotes(patientId: number, params?: Omit<ListNotesParams, 'patient_id'>) {
  const response = await api.get(`/api/clinical-notes/patient/${patientId}`, { params });
  return response.data;
}

/**
 * Create a new clinical note
 */
export async function createClinicalNote(data: CreateNoteData) {
  const response = await api.post('/api/clinical-notes', data);
  return response.data;
}

/**
 * Update an existing clinical note
 */
export async function updateClinicalNote(id: number, data: UpdateNoteData) {
  const response = await api.put(`/api/clinical-notes/${id}`, data);
  return response.data;
}

/**
 * Delete a clinical note
 */
export async function deleteClinicalNote(id: number) {
  const response = await api.delete(`/api/clinical-notes/${id}`);
  return response.data;
}

/**
 * Sign a clinical note (make it read-only)
 */
export async function signClinicalNote(id: number) {
  const response = await api.post(`/api/clinical-notes/${id}/sign`);
  return response.data;
}

/**
 * Get version history for a clinical note
 */
export async function getClinicalNoteVersions(id: number) {
  const response = await api.get(`/api/clinical-notes/${id}/versions`);
  return response.data;
}

/**
 * Get a specific version of a clinical note
 */
export async function getClinicalNoteVersion(noteId: number, versionId: number) {
  const response = await api.get(`/api/clinical-notes/${noteId}/versions/${versionId}`);
  return response.data;
}
