/**
 * Medical Records Module API Client
 * Placeholder functions for medical records API integration
 */

import api from './client';
import type {
  LabReport,
  ImagingReport,
  ClinicalNote,
  ClinicalDocument,
  MedicalRecordListItem,
  MedicalRecordsFilters,
  PaginationParams,
  PaginatedResponse,
  UploadDocumentData,
} from '@/types/medical-records';

// ============================================
// Lab Reports API (uses lab-results backend endpoint)
// ============================================

export async function fetchLabReports(
  patientId: number,
  filters?: MedicalRecordsFilters,
  pagination?: PaginationParams
): Promise<PaginatedResponse<LabReport>> {
  const params = {
    patient_id: patientId,
    ...filters,
    page: pagination?.page || 1,
    limit: pagination?.limit || 20,
  };
  const response = await api.get('/api/lab-results', { params });
  
  // Transform backend response to match expected format
  const data = response.data.data || response.data;
  const results = data.results || data || [];
  const paginationData = data.pagination || { page: 1, limit: 20, total: results.length, pages: 1 };
  
  // Transform lab results to LabReport format
  const reports: LabReport[] = (Array.isArray(results) ? results : []).map((result: any) => ({
    id: result.id,
    patient_id: result.patient_id || patientId,
    test_name: result.test_name || result.test?.name || 'Unknown Test',
    test_code: result.test_code || result.test?.code || '',
    panel_name: result.panel_name || result.panel?.name,
    panel_code: result.panel_code || result.panel?.code,
    report_date: result.result_date || result.created_at || new Date().toISOString(),
    collection_date: result.collection_date,
    ordering_doctor_id: result.ordering_doctor_id || result.ordered_by,
    ordering_doctor_name: result.ordering_doctor_name || result.doctor_name || 'N/A',
    performing_lab: result.performing_lab || result.lab_name || 'Hospital Lab',
    status: result.status || 'final',
    has_abnormal: result.is_abnormal || result.has_abnormal || false,
    results: result.results || [{
      test_name: result.test_name || 'Test',
      value: result.value,
      unit: result.unit,
      reference_range: result.reference_range,
      is_abnormal: result.is_abnormal || false,
      flag: result.flag,
    }],
    notes: result.notes || result.comments,
    visit_type: result.visit_type,
    created_at: result.created_at || new Date().toISOString(),
    updated_at: result.updated_at || new Date().toISOString(),
  }));
  
  return {
    data: reports,
    pagination: paginationData,
  };
}

export async function fetchLabReportDetails(reportId: number): Promise<LabReport> {
  const response = await api.get(`/api/lab-results/${reportId}`);
  const result = response.data.data || response.data;
  
  // Transform to LabReport format
  return {
    id: result.id,
    patient_id: result.patient_id,
    test_name: result.test_name || result.test?.name || 'Unknown Test',
    test_code: result.test_code || result.test?.code || '',
    panel_name: result.panel_name || result.panel?.name,
    panel_code: result.panel_code || result.panel?.code,
    report_date: result.result_date || result.created_at || new Date().toISOString(),
    collection_date: result.collection_date,
    ordering_doctor_id: result.ordering_doctor_id || result.ordered_by,
    ordering_doctor_name: result.ordering_doctor_name || result.doctor_name || 'N/A',
    performing_lab: result.performing_lab || result.lab_name || 'Hospital Lab',
    status: result.status || 'final',
    has_abnormal: result.is_abnormal || result.has_abnormal || false,
    results: result.results || [{
      test_name: result.test_name || 'Test',
      value: result.value,
      unit: result.unit,
      reference_range: result.reference_range,
      is_abnormal: result.is_abnormal || false,
      flag: result.flag,
    }],
    notes: result.notes || result.comments,
    visit_type: result.visit_type,
    created_at: result.created_at || new Date().toISOString(),
    updated_at: result.updated_at || new Date().toISOString(),
  };
}

export async function fetchLabReportHistory(
  patientId: number,
  testCode: string
): Promise<LabReport[]> {
  const response = await api.get(`/api/lab-results/history/${patientId}`, {
    params: { test_code: testCode },
  });
  const results = response.data.data || response.data || [];
  
  return (Array.isArray(results) ? results : []).map((result: any) => ({
    id: result.id,
    patient_id: result.patient_id || patientId,
    test_name: result.test_name || 'Unknown Test',
    test_code: result.test_code || testCode,
    report_date: result.result_date || result.created_at,
    status: result.status || 'final',
    has_abnormal: result.is_abnormal || false,
    results: result.results || [],
    created_at: result.created_at,
    updated_at: result.updated_at,
  }));
}

// Create a new lab result/report
export async function createLabReport(data: {
  patient_id: number;
  order_id?: number;
  test_id: number;
  value: string;
  unit?: string;
  reference_range?: string;
  is_abnormal?: boolean;
  flag?: string;
  notes?: string;
  result_date?: string;
}): Promise<LabReport> {
  const response = await api.post('/api/lab-results', {
    ...data,
    result_date: data.result_date || new Date().toISOString(),
  });
  const result = response.data.data || response.data;
  
  return {
    id: result.id,
    patient_id: result.patient_id,
    test_name: result.test_name || 'Test',
    test_code: result.test_code || '',
    report_date: result.result_date || result.created_at,
    status: result.status || 'pending',
    has_abnormal: result.is_abnormal || false,
    results: [{
      test_name: result.test_name || 'Test',
      value: result.value,
      unit: result.unit,
      reference_range: result.reference_range,
      is_abnormal: result.is_abnormal || false,
      flag: result.flag,
    }],
    notes: result.notes,
    created_at: result.created_at,
    updated_at: result.updated_at,
  };
}

// ============================================
// Imaging Reports API
// ============================================

export async function fetchImagingReports(
  patientId: number,
  filters?: MedicalRecordsFilters,
  pagination?: PaginationParams
): Promise<PaginatedResponse<ImagingReport>> {
  const params = {
    patient_id: patientId,
    ...filters,
    ...pagination,
  };
  const response = await api.get('/api/imaging-reports', { params });
  return response.data;
}

export async function fetchImagingReportDetails(reportId: number): Promise<ImagingReport> {
  const response = await api.get(`/api/imaging-reports/${reportId}`);
  return response.data.data;
}

export async function downloadImagingReport(reportId: number): Promise<string> {
  // Returns presigned URL for download
  const response = await api.get(`/api/imaging-reports/${reportId}/download`);
  return response.data.download_url;
}

// ============================================
// Clinical Notes API
// ============================================

export async function fetchClinicalNotes(
  patientId: number,
  filters?: MedicalRecordsFilters,
  pagination?: PaginationParams
): Promise<PaginatedResponse<ClinicalNote>> {
  const params = {
    patient_id: patientId,
    ...filters,
    ...pagination,
  };
  const response = await api.get('/api/clinical-notes', { params });
  return response.data;
}

export async function fetchClinicalNoteDetails(noteId: number): Promise<ClinicalNote> {
  const response = await api.get(`/api/clinical-notes/${noteId}`);
  return response.data.data;
}

export async function printClinicalNote(noteId: number): Promise<void> {
  // TODO: Implement print functionality
  console.log('Print clinical note:', noteId);
}

export async function downloadClinicalNoteAsPdf(noteId: number): Promise<string> {
  const response = await api.get(`/api/clinical-notes/${noteId}/pdf`);
  return response.data.download_url;
}

// ============================================
// Clinical Documents API (uses medical-records backend)
// ============================================

export async function fetchClinicalDocuments(
  patientId: number,
  filters?: MedicalRecordsFilters,
  pagination?: PaginationParams
): Promise<PaginatedResponse<ClinicalDocument>> {
  const params = {
    patient_id: patientId,
    ...filters,
    page: pagination?.page || 1,
    limit: pagination?.limit || 20,
  };
  // Uses medical-records endpoint with document type filter
  const response = await api.get('/api/medical-records', { params });
  
  // Transform backend response to match expected format
  const data = response.data.data || response.data;
  const records = data.records || [];
  const paginationData = data.pagination || { page: 1, limit: 20, total: 0, pages: 0 };
  
  return {
    data: records,
    pagination: paginationData,
  };
}

export async function fetchClinicalDocumentDetails(documentId: number): Promise<ClinicalDocument> {
  const response = await api.get(`/api/medical-records/${documentId}`);
  const data = response.data.data || response.data;
  const record = data.record || data;
  const attachments = data.attachments || [];
  
  // Get file info from first attachment if available
  let fileUrl = record.file_url || '';
  let fileType = record.file_type || 'application/pdf';
  let fileSize = record.file_size || 0;
  
  if (attachments.length > 0) {
    const attachment = attachments[0];
    fileType = attachment.file_type || fileType;
    fileSize = attachment.file_size || fileSize;
    // Try to get download URL for the attachment
    try {
      const downloadResponse = await api.get(`/api/medical-records/download-url/${attachment.id}`);
      fileUrl = downloadResponse.data.data?.downloadUrl || downloadResponse.data.downloadUrl || '';
    } catch (e) {
      console.warn('Could not get download URL for attachment:', e);
    }
  }
  
  // Transform backend medical record to ClinicalDocument format
  return {
    id: record.id,
    patient_id: record.patient_id,
    document_type: 'uploaded_pdf',
    title: record.chief_complaint || record.diagnosis || `Medical Record #${record.id}`,
    description: record.notes || record.diagnosis,
    source: record.source,
    date_of_service: record.visit_date,
    uploaded_by_id: record.doctor_id || 1,
    uploaded_by_name: record.doctor_name,
    category: record.category,
    tags: record.tags || [],
    file_url: fileUrl,
    file_type: fileType,
    file_size: fileSize,
    status: record.status || 'draft',
    created_at: record.created_at || new Date().toISOString(),
    updated_at: record.updated_at || new Date().toISOString(),
  };
}

export async function uploadClinicalDocument(
  patientId: number,
  data: UploadDocumentData
): Promise<ClinicalDocument> {
  // Ensure date is in ISO datetime format (required by backend Zod schema)
  let visitDate: string;
  if (!data.date_of_service) {
    visitDate = new Date().toISOString();
  } else {
    // Convert date string to ISO datetime
    // Handle both YYYY-MM-DD and DD-MM-YYYY formats
    let dateStr = data.date_of_service;
    if (dateStr.includes('-') && dateStr.split('-')[0].length === 2) {
      // Convert DD-MM-YYYY to YYYY-MM-DD
      const parts = dateStr.split('-');
      if (parts.length === 3 && parts[2].length === 4) {
        dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    // Convert to full ISO datetime string
    visitDate = new Date(dateStr).toISOString();
  }

  // Step 1: Create medical record first
  const recordResponse = await api.post('/api/medical-records', {
    patient_id: patientId,
    doctor_id: 1, // TODO: Get from auth context
    visit_date: visitDate,
    chief_complaint: data.title,
    notes: data.description,
  });

  const recordId = recordResponse.data.data?.record?.id || recordResponse.data.data?.id || recordResponse.data.id;

  if (!recordId) {
    throw new Error('Failed to create medical record - no ID returned');
  }

  // Step 2: Get presigned upload URL
  const urlResponse = await api.post('/api/medical-records/upload-url', {
    record_id: recordId,
    filename: data.file.name,
    content_type: data.file.type,
  });

  // Backend returns { success, data: { uploadUrl, s3Key } }
  const uploadUrl = urlResponse.data.data?.uploadUrl || urlResponse.data.uploadUrl;
  const s3Key = urlResponse.data.data?.s3Key || urlResponse.data.s3Key;

  if (!uploadUrl || !s3Key) {
    throw new Error('Failed to get upload URL from server');
  }

  // Step 3: Upload file to S3
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: data.file,
    headers: { 'Content-Type': data.file.type },
  });

  if (!uploadResponse.ok) {
    throw new Error(`Failed to upload file to S3: ${uploadResponse.statusText}`);
  }

  // Step 4: Add attachment record
  // Use the same bucket name as backend S3 service
  const s3Bucket = process.env.NEXT_PUBLIC_S3_BUCKET || 'hospital-medical-records';
  
  await api.post(`/api/medical-records/${recordId}/attachments`, {
    file_name: data.file.name,
    file_type: data.file.type,
    file_size: data.file.size,
    s3_key: s3Key,
    s3_bucket: s3Bucket,
    description: data.description,
  });

  // Return the created record
  const finalRecord = await api.get(`/api/medical-records/${recordId}`);
  return finalRecord.data.data?.record || finalRecord.data.data || finalRecord.data;
}

export async function downloadDocument(documentId: number): Promise<string> {
  // Get attachments for the record first
  const attachmentsResponse = await api.get(`/api/medical-records/${documentId}/attachments`);
  const attachments = attachmentsResponse.data.data || attachmentsResponse.data || [];
  
  if (attachments.length > 0) {
    const response = await api.get(`/api/medical-records/download-url/${attachments[0].id}`);
    return response.data.download_url;
  }
  throw new Error('No attachments found for this document');
}

// ============================================
// Combined Records API (All Types)
// ============================================

export async function fetchAllMedicalRecords(
  patientId: number,
  filters?: MedicalRecordsFilters,
  pagination?: PaginationParams
): Promise<PaginatedResponse<MedicalRecordListItem>> {
  const params = {
    patient_id: patientId,
    ...filters,
    page: pagination?.page || 1,
    limit: pagination?.limit || 20,
  };
  // Use the main medical-records endpoint (no /all suffix)
  const response = await api.get('/api/medical-records', { params });
  
  // Transform backend response to match expected format
  const data = response.data.data || response.data;
  const rawRecords = data.records || [];
  const paginationData = data.pagination || { page: 1, limit: 20, total: 0, pages: 0 };
  
  // Transform backend records to MedicalRecordListItem format
  const records: MedicalRecordListItem[] = rawRecords.map((record: any) => ({
    id: record.id,
    type: 'document' as const, // Default type for medical records
    date: record.visit_date || record.created_at || new Date().toISOString(),
    title: record.chief_complaint || record.diagnosis || `Medical Record #${record.id}`,
    visit_type: record.visit_type,
    department: record.department,
    status: record.status || 'draft',
    has_attachment: false, // Will be updated when attachments are loaded
    is_abnormal: false,
  }));
  
  return {
    data: records,
    pagination: paginationData,
  };
}

// ============================================
// File/Attachment Utilities
// ============================================

export async function getFileDownloadUrl(fileId: string): Promise<string> {
  if (!fileId) {
    throw new Error('File ID is required');
  }
  const response = await api.get(`/api/files/${fileId}/download`);
  return response.data.download_url;
}

export async function getFileViewUrl(fileId: string): Promise<string> {
  if (!fileId) {
    throw new Error('File ID is required');
  }
  const response = await api.get(`/api/files/${fileId}/view`);
  return response.data.view_url;
}
