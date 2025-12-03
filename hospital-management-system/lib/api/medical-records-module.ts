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
  
  // Transform lab results to LabReport format with all new fields
  const reports: LabReport[] = (Array.isArray(results) ? results : []).map((result: any) => ({
    id: result.id,
    patient_id: result.patient_id || patientId,
    test_name: result.test_name || result.test?.name || 'Unknown Test',
    test_code: result.test_code || result.test?.code || '',
    panel_name: result.panel_name || result.panel?.name,
    panel_code: result.panel_code || result.panel?.code,
    report_date: result.result_date || result.report_date || result.created_at || new Date().toISOString(),
    collection_date: result.collection_date,
    ordering_doctor_id: result.ordering_doctor_id || result.ordered_by,
    ordering_doctor_name: result.ordering_doctor_name || result.ordering_doctor || result.doctor_name || 'N/A',
    performing_lab: result.performing_lab || result.lab_name || 'Hospital Lab',
    status: result.result_status || result.status || 'final',
    has_abnormal: result.is_abnormal || result.has_abnormal || false,
    results: result.results || [{
      test_name: result.test_name || 'Test',
      value: result.result_value || result.value,
      unit: result.result_unit || result.unit,
      reference_range: result.reference_range,
      is_abnormal: result.is_abnormal || false,
      flag: result.abnormal_flag || result.flag,
    }],
    notes: result.notes || result.comments,
    visit_type: result.visit_type,
    // Include new fields
    sample_type: result.sample_type,
    ordering_doctor: result.ordering_doctor,
    result_status: result.result_status || result.status || 'final',
    attachment_file_id: result.attachment_file_id,
    attachment_filename: result.attachment_filename,
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
  
  // Transform to LabReport format with all new fields
  return {
    id: result.id,
    patient_id: result.patient_id,
    test_name: result.test_name || result.test?.name || 'Unknown Test',
    test_code: result.test_code || result.test?.code || '',
    panel_name: result.panel_name || result.panel?.name,
    panel_code: result.panel_code || result.panel?.code,
    report_date: result.result_date || result.report_date || result.created_at || new Date().toISOString(),
    collection_date: result.collection_date,
    ordering_doctor_id: result.ordering_doctor_id || result.ordered_by,
    ordering_doctor_name: result.ordering_doctor_name || result.ordering_doctor || result.doctor_name || 'N/A',
    performing_lab: result.performing_lab || result.lab_name || 'Hospital Lab',
    status: result.result_status || result.status || 'final',
    has_abnormal: result.is_abnormal || result.has_abnormal || false,
    results: result.results || [{
      test_name: result.test_name || 'Test',
      value: result.result_value || result.value,
      unit: result.result_unit || result.unit,
      reference_range: result.reference_range,
      is_abnormal: result.is_abnormal || false,
      flag: result.abnormal_flag || result.flag,
    }],
    notes: result.notes || result.comments,
    visit_type: result.visit_type,
    // Include new fields
    sample_type: result.sample_type,
    ordering_doctor: result.ordering_doctor,
    result_status: result.result_status || result.status || 'final',
    attachment_file_id: result.attachment_file_id,
    attachment_filename: result.attachment_filename,
    created_at: result.created_at || new Date().toISOString(),
    updated_at: result.updated_at || new Date().toISOString(),
  } as LabReport & { sample_type?: string; ordering_doctor?: string; result_status?: string };
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
  sample_type?: string;
  ordering_doctor?: string;
  result_status?: string;
  attachment_file_id?: string;
  attachment_filename?: string;
}): Promise<LabReport> {
  const response = await api.post('/api/lab-results', {
    patient_id: data.patient_id,
    order_id: data.order_id,
    test_id: data.test_id,
    value: data.value,
    unit: data.unit,
    reference_range: data.reference_range,
    is_abnormal: data.is_abnormal,
    flag: data.flag,
    notes: data.notes,
    result_date: data.result_date || new Date().toISOString(),
    sample_type: data.sample_type,
    ordering_doctor: data.ordering_doctor,
    result_status: data.result_status || 'final',
    attachment_file_id: data.attachment_file_id,
    attachment_filename: data.attachment_filename,
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
    attachment_file_id: result.attachment_file_id,
    attachment_filename: result.attachment_filename,
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
  
  // Transform backend response format { reports: [], pagination: {} }
  // to expected format { data: [], pagination: {} }
  const backendData = response.data;
  return {
    data: backendData.reports || [],
    pagination: backendData.pagination || { page: 1, limit: 20, total: 0, pages: 0 },
  };
}

export async function fetchImagingReportDetails(reportId: number): Promise<ImagingReport> {
  const response = await api.get(`/api/imaging-reports/${reportId}`);
  // Backend may return data directly or wrapped in { data: ... }
  const report = response.data.data || response.data;
  
  // Transform to expected ImagingReport format
  return {
    id: report.id,
    patient_id: report.patient_id,
    modality: report.modality || report.imaging_type || 'Unknown',
    body_part: report.body_part || 'N/A',
    study_description: report.study_description || report.imaging_type || 'Imaging Study',
    ordering_doctor_id: report.ordering_doctor_id,
    ordering_doctor_name: report.ordering_doctor_name || report.radiologist_name || 'N/A',
    radiologist_id: report.radiologist_id,
    radiologist_name: report.radiologist_name || 'N/A',
    facility: report.facility,
    study_date: report.study_date || report.created_at || new Date().toISOString(),
    report_date: report.report_date || report.created_at,
    status: report.status || 'final',
    findings: report.findings || '',
    impression: report.impression,
    recommendations: report.recommendations,
    images: report.images || [],
    attachment_url: report.attachment_url,
    created_at: report.created_at || new Date().toISOString(),
    updated_at: report.updated_at || new Date().toISOString(),
  } as ImagingReport;
}

// Create a new imaging report
export async function createImagingReport(data: {
  patient_id: number;
  imaging_type: string;
  modality?: string;
  body_part: string;
  study_description?: string;
  radiologist_id?: number;
  radiologist_name?: string;
  study_date?: string;
  report_date?: string;
  findings: string;
  impression?: string;
  recommendations?: string;
  contrast_used?: boolean;
  status?: string;
  attachment_file_ids?: string[];
}): Promise<ImagingReport> {
  const response = await api.post('/api/imaging-reports', {
    patient_id: data.patient_id,
    imaging_type: data.imaging_type,
    modality: data.modality || data.imaging_type,
    body_part: data.body_part,
    study_description: data.study_description,
    radiologist_id: data.radiologist_id || 1,
    findings: data.findings,
    impression: data.impression,
    recommendations: data.recommendations,
    report_date: data.report_date || new Date().toISOString().split('T')[0],
    study_date: data.study_date || new Date().toISOString().split('T')[0],
    contrast_used: data.contrast_used || false,
    status: data.status || 'final',
  });
  return response.data;
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
  // Transform response format
  const backendData = response.data;
  return {
    data: backendData.notes || backendData.data || [],
    pagination: backendData.pagination || { page: 1, limit: 20, total: 0, pages: 0 },
  };
}

// Create a new clinical note
export async function createClinicalNote(data: {
  patient_id: number;
  note_type: string;
  title: string;
  visit_type?: string;
  department?: string;
  author_id?: number;
  author_name?: string;
  content: string;
  chief_complaint?: string;
  history_of_present_illness?: string;
  physical_examination?: string;
  assessment?: string;
  plan?: string;
  diagnoses?: string[];
  status?: string;
}): Promise<ClinicalNote> {
  // Map frontend note types to backend expected values
  const noteTypeMap: Record<string, string> = {
    progress: 'progress_note',
    admission: 'admission_note',
    discharge: 'discharge_summary',
    consultation: 'consultation',
    procedure: 'procedure_note',
    operative: 'operative_note',
    follow_up: 'follow_up',
    other: 'other',
  };

  // Build full content with all sections including metadata
  let fullContent = '';
  
  // Add metadata header
  if (data.visit_type) {
    fullContent += `Visit Type: ${data.visit_type}\n`;
  }
  if (data.department) {
    fullContent += `Department: ${data.department}\n`;
  }
  if (data.author_name) {
    fullContent += `Author: ${data.author_name}\n`;
  }
  if (fullContent) {
    fullContent += '\n---\n\n';
  }
  
  if (data.chief_complaint) {
    fullContent += `Chief Complaint: ${data.chief_complaint}\n\n`;
  }
  
  fullContent += data.content;
  
  if (data.assessment) {
    fullContent += `\n\nAssessment: ${data.assessment}`;
  }
  if (data.plan) {
    fullContent += `\n\nPlan: ${data.plan}`;
  }
  if (data.diagnoses && data.diagnoses.length > 0) {
    fullContent += `\n\nDiagnoses: ${data.diagnoses.join(', ')}`;
  }

  const response = await api.post('/api/clinical-notes', {
    patient_id: data.patient_id,
    provider_id: data.author_id || 1, // Backend requires provider_id as number
    note_type: noteTypeMap[data.note_type] || 'progress_note',
    content: fullContent,
    summary: data.title, // Use title as summary
  });
  return response.data.data || response.data;
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

  // Step 2: Upload file through backend (avoids CORS issues)
  console.log('Uploading file through backend for record:', recordId, 'file:', data.file.name);
  
  const formData = new FormData();
  formData.append('file', data.file);
  formData.append('record_id', String(recordId));
  formData.append('description', data.description || '');
  
  console.log('Uploading to:', `/api/medical-records/${recordId}/upload`);
  console.log('File size:', data.file.size, 'bytes');
  console.log('File type:', data.file.type);
  
  try {
    const uploadResponse = await api.post(`/api/medical-records/${recordId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('File uploaded successfully through backend:', uploadResponse.data);
  } catch (error: any) {
    console.error('Backend upload error - Full error:', error);
    console.error('Error response:', error.response);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    throw new Error(`Failed to upload file: ${error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error'}`);
  }

  // Return the created record
  const finalRecord = await api.get(`/api/medical-records/${recordId}`);
  return finalRecord.data.data?.record || finalRecord.data.data || finalRecord.data;
}

export async function downloadDocument(documentId: number): Promise<string> {
  // Get attachments for the record first
  console.log('Fetching attachments for document:', documentId);
  const attachmentsResponse = await api.get(`/api/medical-records/${documentId}/attachments`);
  console.log('Attachments response:', attachmentsResponse.data);
  
  // Handle different response structures
  const attachments = attachmentsResponse.data.data?.attachments 
    || attachmentsResponse.data.attachments 
    || attachmentsResponse.data.data 
    || attachmentsResponse.data 
    || [];
  
  console.log('Parsed attachments:', attachments);
  
  if (Array.isArray(attachments) && attachments.length > 0) {
    const attachmentId = attachments[0].id;
    console.log('Getting download URL for attachment:', attachmentId);
    const response = await api.get(`/api/medical-records/download-url/${attachmentId}`);
    console.log('Download URL response:', response.data);
    return response.data.data?.downloadUrl || response.data.downloadUrl || response.data.download_url;
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
  const allRecords: MedicalRecordListItem[] = [];
  
  // Fetch from all sources in parallel
  const [labResults, imagingReports, clinicalNotes, documents] = await Promise.allSettled([
    // Lab Results
    api.get('/api/lab-results', { params: { patient_id: patientId } }).catch(() => ({ data: { data: [] } })),
    // Imaging Reports
    api.get('/api/imaging-reports', { params: { patient_id: patientId } }).catch(() => ({ data: { data: [] } })),
    // Clinical Notes
    api.get('/api/clinical-notes', { params: { patient_id: patientId } }).catch(() => ({ data: { data: [] } })),
    // Documents (medical records with attachments)
    api.get('/api/medical-records', { params: { patient_id: patientId } }).catch(() => ({ data: { data: { records: [] } } })),
  ]);
  
  // Process Lab Results
  if (labResults.status === 'fulfilled') {
    const labs = labResults.value.data?.data || labResults.value.data?.results || [];
    (Array.isArray(labs) ? labs : []).forEach((lab: any) => {
      allRecords.push({
        id: lab.id,
        type: 'lab_report',
        date: lab.result_date || lab.created_at || new Date().toISOString(),
        title: lab.test_name || `Lab Result #${lab.id}`,
        status: lab.result_status || 'final',
        has_attachment: !!lab.attachment_file_id,
        is_abnormal: lab.is_abnormal || false,
      });
    });
  }
  
  // Process Imaging Reports
  if (imagingReports.status === 'fulfilled') {
    const imaging = imagingReports.value.data?.data || imagingReports.value.data?.reports || [];
    (Array.isArray(imaging) ? imaging : []).forEach((report: any) => {
      allRecords.push({
        id: report.id,
        type: 'imaging_report',
        date: report.study_date || report.created_at || new Date().toISOString(),
        title: report.study_description || report.modality || `Imaging Report #${report.id}`,
        status: report.status || 'final',
        has_attachment: !!report.attachment_ids?.length,
        is_abnormal: false,
      });
    });
  }
  
  // Process Clinical Notes
  if (clinicalNotes.status === 'fulfilled') {
    const notes = clinicalNotes.value.data?.data || clinicalNotes.value.data?.notes || [];
    (Array.isArray(notes) ? notes : []).forEach((note: any) => {
      allRecords.push({
        id: note.id,
        type: 'clinical_note',
        date: note.created_at || new Date().toISOString(),
        title: note.summary || note.note_type || `Clinical Note #${note.id}`,
        status: note.status || 'draft',
        has_attachment: false,
        is_abnormal: false,
      });
    });
  }
  
  // Process Documents
  if (documents.status === 'fulfilled') {
    const docs = documents.value.data?.data?.records || documents.value.data?.records || [];
    (Array.isArray(docs) ? docs : []).forEach((doc: any) => {
      allRecords.push({
        id: doc.id,
        type: 'document',
        date: doc.visit_date || doc.created_at || new Date().toISOString(),
        title: doc.chief_complaint || doc.diagnosis || `Document #${doc.id}`,
        status: doc.status || 'draft',
        has_attachment: true,
        is_abnormal: false,
      });
    });
  }
  
  // Sort by date descending
  allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Apply pagination
  const page = pagination?.page || 1;
  const limit = pagination?.limit || 20;
  const startIndex = (page - 1) * limit;
  const paginatedRecords = allRecords.slice(startIndex, startIndex + limit);
  
  return {
    data: paginatedRecords,
    pagination: {
      page,
      limit,
      total: allRecords.length,
      pages: Math.ceil(allRecords.length / limit),
    },
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
