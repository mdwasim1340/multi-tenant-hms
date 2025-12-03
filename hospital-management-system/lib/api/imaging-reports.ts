/**
 * Imaging Reports API Client
 * Handles all imaging reports API calls
 */

import api from './client';

export interface ImagingReport {
  id: number;
  patient_id: number;
  imaging_type: 'x_ray' | 'ct_scan' | 'mri' | 'ultrasound' | 'pet_scan' | 'mammogram' | 'other';
  body_part: string;
  radiologist_id: number;
  findings: string;
  impression: string;
  recommendations?: string;
  report_date: string;
  status: 'pending' | 'completed' | 'reviewed';
  created_at: string;
  updated_at: string;
  // Joined data
  patient_first_name?: string;
  patient_last_name?: string;
  patient_number?: string;
  radiologist_name?: string;
}

export interface ImagingReportFile {
  id: number;
  report_id: number;
  file_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  description?: string;
  uploaded_at: string;
}

export interface CreateReportData {
  patient_id: number;
  imaging_type: 'x_ray' | 'ct_scan' | 'mri' | 'ultrasound' | 'pet_scan' | 'mammogram' | 'other';
  body_part: string;
  radiologist_id: number;
  findings: string;
  impression: string;
  recommendations?: string;
  report_date: string;
}

export interface UpdateReportData {
  imaging_type?: 'x_ray' | 'ct_scan' | 'mri' | 'ultrasound' | 'pet_scan' | 'mammogram' | 'other';
  body_part?: string;
  findings?: string;
  impression?: string;
  recommendations?: string;
  report_date?: string;
  status?: 'pending' | 'completed' | 'reviewed';
}

export interface ListReportsParams {
  patient_id?: number;
  imaging_type?: string;
  status?: 'pending' | 'completed' | 'reviewed';
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface SearchReportsParams {
  q: string;
  imaging_type?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface AttachFileData {
  file_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  description?: string;
}

/**
 * Get list of imaging reports
 */
export async function getImagingReports(params?: ListReportsParams) {
  const response = await api.get('/api/imaging-reports', { params });
  return response.data;
}

/**
 * Get a single imaging report by ID
 */
export async function getImagingReport(id: number) {
  const response = await api.get(`/api/imaging-reports/${id}`);
  return response.data;
}

/**
 * Get imaging reports for a specific patient
 */
export async function getPatientImagingReports(patientId: number, params?: Omit<ListReportsParams, 'patient_id'>) {
  const response = await api.get(`/api/imaging-reports/patient/${patientId}`, { params });
  return response.data;
}

/**
 * Create a new imaging report
 */
export async function createImagingReport(data: CreateReportData) {
  const response = await api.post('/api/imaging-reports', data);
  return response.data;
}

/**
 * Update an existing imaging report
 */
export async function updateImagingReport(id: number, data: UpdateReportData) {
  const response = await api.put(`/api/imaging-reports/${id}`, data);
  return response.data;
}

/**
 * Delete an imaging report
 */
export async function deleteImagingReport(id: number) {
  const response = await api.delete(`/api/imaging-reports/${id}`);
  return response.data;
}

/**
 * Search imaging reports
 */
export async function searchImagingReports(params: SearchReportsParams) {
  const response = await api.get('/api/imaging-reports/search', { params });
  return response.data;
}

/**
 * Attach file to imaging report
 */
export async function attachFileToReport(reportId: number, data: AttachFileData) {
  const response = await api.post(`/api/imaging-reports/${reportId}/files`, data);
  return response.data;
}

/**
 * Get files for an imaging report
 */
export async function getReportFiles(reportId: number) {
  const response = await api.get(`/api/imaging-reports/${reportId}/files`);
  return response.data;
}

/**
 * Delete a file from an imaging report
 */
export async function deleteReportFile(reportId: number, fileId: number) {
  const response = await api.delete(`/api/imaging-reports/${reportId}/files/${fileId}`);
  return response.data;
}
