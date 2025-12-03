/**
 * Medical Records API Client
 * Handles all medical records API calls
 */

import api from './client';

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
  doctor_id: number;
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
  finalized_at?: string;
  finalized_by?: number;
  created_at: string;
  updated_at: string;
  // Joined data from backend
  patient_first_name?: string;
  patient_last_name?: string;
  patient_number?: string;
  patient_name?: string; // Computed field for display
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
  doctor_id: number;
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
  download_url?: string;
  file_id: string;
  expires_in?: number;
  record_id?: number;
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
  const response = await api.get('/api/medical-records', { params });
  return response.data;
}

/**
 * Get a single medical record by ID
 */
export async function getMedicalRecord(id: number) {
  const response = await api.get(`/api/medical-records/${id}`);
  return response.data;
}

/**
 * Create a new medical record
 */
export async function createMedicalRecord(data: CreateRecordData) {
  const response = await api.post('/api/medical-records', data);
  return response.data;
}

/**
 * Update an existing medical record
 */
export async function updateMedicalRecord(id: number, data: UpdateRecordData) {
  const response = await api.put(`/api/medical-records/${id}`, data);
  return response.data;
}

/**
 * Delete a medical record
 */
export async function deleteMedicalRecord(id: number) {
  const response = await api.delete(`/api/medical-records/${id}`);
  return response.data;
}

/**
 * Request presigned URL for file upload
 * Note: This now creates a temporary medical record and returns upload info
 */
export async function requestUploadUrl(
  filename: string,
  contentType: string,
  fileSize: number
): Promise<UploadUrlResponse> {
  // First create a temporary medical record to get a record_id
  const recordResponse = await api.post('/api/medical-records', {
    patient_id: 1, // Temporary, will be updated
    doctor_id: 1,
    visit_date: new Date().toISOString(),
    chief_complaint: `File upload: ${filename}`,
    notes: 'Temporary record for file attachment',
  });
  
  const recordId = recordResponse.data.data?.record?.id || recordResponse.data.data?.id || recordResponse.data.id;
  
  if (!recordId) {
    throw new Error('Failed to create record for file upload');
  }
  
  // Now get the upload URL with the record_id
  const response = await api.post('/api/medical-records/upload-url', {
    record_id: recordId,
    filename,
    content_type: contentType,
    file_size: fileSize
  });
  
  return {
    upload_url: response.data.data?.uploadUrl || response.data.uploadUrl,
    file_id: response.data.data?.s3Key || response.data.s3Key,
    record_id: recordId,
  };
}

/**
 * Get presigned URL for file download
 */
export async function getDownloadUrl(fileId: string) {
  const response = await api.get(`/api/medical-records/download-url/${fileId}`);
  return response.data;
}

/**
 * Upload file to S3 using presigned URL
 * Note: This may fail due to CORS. Use uploadFileThroughBackend instead.
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
 * Upload file directly through backend (avoids CORS issues)
 * This is the recommended approach for file uploads
 */
export async function uploadFileThroughBackend(
  file: File,
  recordId?: number,
  description?: string
): Promise<{ file_id: string; record_id: number }> {
  // If no recordId provided, create a temporary medical record
  let actualRecordId = recordId;
  
  if (!actualRecordId) {
    const recordResponse = await api.post('/api/medical-records', {
      patient_id: 1, // Will be updated by the caller
      doctor_id: 1,
      visit_date: new Date().toISOString(),
      chief_complaint: `File upload: ${file.name}`,
      notes: description || 'File attachment',
    });
    
    actualRecordId = recordResponse.data.data?.record?.id || recordResponse.data.data?.id || recordResponse.data.id;
    
    if (!actualRecordId) {
      throw new Error('Failed to create record for file upload');
    }
  }
  
  // Upload file through backend
  const formData = new FormData();
  formData.append('file', file);
  formData.append('record_id', String(actualRecordId));
  formData.append('description', description || '');
  
  const uploadResponse = await api.post(`/api/medical-records/${actualRecordId}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  const attachment = uploadResponse.data.data;
  
  return {
    file_id: attachment?.s3_key || attachment?.id?.toString() || '',
    record_id: actualRecordId,
  };
}

/**
 * Attach file to medical record
 */
export async function attachFileToRecord(recordId: number, data: AttachFileData) {
  const response = await api.post(
    `/api/medical-records/${recordId}/attachments`,
    data
  );
  return response.data;
}

/**
 * Get attachments for a medical record
 */
export async function getRecordAttachments(recordId: number) {
  const response = await api.get(`/api/medical-records/${recordId}/attachments`);
  return response.data;
}

/**
 * Finalize a medical record (make it read-only)
 */
export async function finalizeRecord(recordId: number) {
  const response = await api.post(`/api/medical-records/${recordId}/finalize`);
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
