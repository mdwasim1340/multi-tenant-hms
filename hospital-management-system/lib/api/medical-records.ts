/**
 * Medical Records API Client
 * Handles all medical records API calls
 */

import { apiClient } from './client';

export interface VitalSigns {
  blood_pressure?: string;
  temperature?: string;
  pulse?: string;
  respiratory_rate?: string;
  weight?: string;
  height?: string;
  oxygen_saturation?: string;
  [key: string]: string | undefined;
}

export interface MedicalRecord {
  id: number;
  patient_id: number;
  appointment_id?: number;
  visit_date: string;
  chief_complaint?: string;
  diagnosis?: string;
  treatment_plan?: string;
  vital_signs?: VitalSigns;
  prescriptions?: any;
  lab_results?: any;
  notes?: string;
  follow_up_required?: boolean;
  follow_up_date?: string;
  status: 'draft' | 'finalized';
  created_at: string;
  updated_at: string;
  // Joined data
  patient_name?: string;
  patient_number?: string;
}

export interface RecordAttachment {
  id: number;
  record_id: number;
  file_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  description?: string;
  uploaded_at: string;
}

export interface CreateRecordData {
  patient_id: number;
  appointment_id?: number;
  visit_date: string;
  chief_complaint?: string;
  diagnosis?: string;
  treatment_plan?: string;
  vital_signs?: VitalSigns;
  prescriptions?: any;
  lab_results?: any;
  notes?: string;
  follow_up_required?: boolean;
  follow_up_date?: string;
}

export interface UpdateRecordData {
  chief_complaint?: string;
  diagnosis?: string;
  treatment_plan?: string;
  vital_signs?: VitalSigns;
  prescriptions?: any;
  lab_results?: any;
  notes?: string;
  follow_up_required?: boolean;
  follow_up_date?: string;
}

export interface ListRecordsParams {
  patient_id?: number;
  start_date?: string;
  end_date?: string;
  status?: 'draft' | 'finalized';
  page?: number;
  limit?: number;
}

export interface UploadUrlResponse {
  upload_url: string;
  download_url: string;
  file_id: string;
  expires_in: number;
}

export interface AttachFileData {
  file_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  description?: string;
}

/**
 * Get list of medical records
 */
export async function getMedicalRecords(params?: ListRecordsParams) {
  const response = await apiClient.get('/api/medical-records', { params });
  return response.data;
}

/**
 * Get a single medical record by ID
 */
export async function getMedicalRecord(id: number) {
  const response = await apiClient.get(`/api/medical-records/${id}`);
  return response.data;
}

/**
 * Create a new medical record
 */
export async function createMedicalRecord(data: CreateRecordData) {
  const response = await apiClient.post('/api/medical-records', data);
  return response.data;
}

/**
 * Update an existing medical record
 */
export async function updateMedicalRecord(id: number, data: UpdateRecordData) {
  const response = await apiClient.put(`/api/medical-records/${id}`, data);
  return response.data;
}

/**
 * Delete a medical record
 */
export async function deleteMedicalRecord(id: number) {
  const response = await apiClient.delete(`/api/medical-records/${id}`);
  return response.data;
}

/**
 * Request presigned URL for file upload
 */
export async function requestUploadUrl(
  filename: string,
  contentType: string,
  fileSize: number
): Promise<UploadUrlResponse> {
  const response = await apiClient.post('/api/medical-records/upload-url', {
    filename,
    content_type: contentType,
    file_size: fileSize
  });
  return response.data.data;
}

/**
 * Get presigned URL for file download
 */
export async function getDownloadUrl(fileId: string) {
  const response = await apiClient.get(`/api/medical-records/download-url/${fileId}`);
  return response.data;
}

/**
 * Upload file to S3 using presigned URL
 */
export async function uploadFileToS3(
  uploadUrl: string,
  file: File,
  onProgress?: (progress: number) => void
) {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type
    }
  });

  if (!response.ok) {
    throw new Error('File upload failed');
  }

  return response;
}

/**
 * Attach file to medical record
 */
export async function attachFileToRecord(recordId: number, data: AttachFileData) {
  const response = await apiClient.post(
    `/api/medical-records/${recordId}/attachments`,
    data
  );
  return response.data;
}

/**
 * Get attachments for a medical record
 */
export async function getRecordAttachments(recordId: number) {
  const response = await apiClient.get(`/api/medical-records/${recordId}/attachments`);
  return response.data;
}

/**
 * Finalize a medical record (make it read-only)
 */
export async function finalizeRecord(recordId: number) {
  const response = await apiClient.post(`/api/medical-records/${recordId}/finalize`);
  return response.data;
}

/**
 * Complete file upload workflow
 * 1. Request upload URL
 * 2. Upload file to S3
 * 3. Attach file to record
 */
export async function uploadAndAttachFile(
  recordId: number,
  file: File,
  description?: string,
  onProgress?: (progress: number) => void
) {
  // Step 1: Request upload URL
  const { upload_url, file_id } = await requestUploadUrl(
    file.name,
    file.type,
    file.size
  );

  // Step 2: Upload to S3
  await uploadFileToS3(upload_url, file, onProgress);

  // Step 3: Attach to record
  const result = await attachFileToRecord(recordId, {
    file_id,
    filename: file.name,
    file_type: file.type,
    file_size: file.size,
    description
  });

  return result;
}
