/**
 * Medical Records Types
 * Type definitions for all medical record types in the MediFlow system
 */

// Base record interface
export interface BaseRecord {
  id: number;
  patient_id: number;
  created_at: string;
  updated_at: string;
}

// Lab Report Types
export interface LabReport extends BaseRecord {
  order_number: string;
  test_name: string;
  test_code?: string;
  panel_name?: string;
  ordering_doctor_id: number;
  ordering_doctor_name?: string;
  lab_name?: string;
  collection_date: string;
  report_date: string;
  status: 'pending' | 'preliminary' | 'final' | 'corrected' | 'cancelled';
  visit_type?: 'OPD' | 'IPD' | 'ER';
  department?: string;
  results: LabTestResult[];
  has_abnormal: boolean;
  attachment_url?: string;
  notes?: string;
}

export interface LabTestResult {
  id: number;
  test_name: string;
  result_value: string | number;
  result_unit?: string;
  reference_range?: string;
  is_abnormal: boolean;
  abnormal_flag?: 'H' | 'L' | 'HH' | 'LL' | 'A';
  interpretation?: string;
}

// Imaging Report Types
export interface ImagingReport extends BaseRecord {
  study_id: string;
  modality: 'X-ray' | 'CT' | 'MRI' | 'Ultrasound' | 'PET' | 'Mammography' | 'Fluoroscopy' | 'Other';
  body_part: string;
  study_description: string;
  ordering_doctor_id: number;
  ordering_doctor_name?: string;
  radiologist_id?: number;
  radiologist_name?: string;
  facility?: string;
  study_date: string;
  report_date?: string;
  status: 'scheduled' | 'in_progress' | 'preliminary' | 'final' | 'addendum';
  visit_type?: 'OPD' | 'IPD' | 'ER';
  department?: string;
  findings?: string;
  impression?: string;
  recommendations?: string;
  images: ImagingImage[];
  attachment_url?: string;
}

export interface ImagingImage {
  id: number;
  thumbnail_url?: string;
  full_url: string;
  description?: string;
  series_number?: number;
  is_dicom?: boolean;
}

// Clinical Note Types
export interface ClinicalNote extends BaseRecord {
  note_type: 'progress' | 'admission' | 'discharge' | 'operative' | 'consultation' | 'procedure' | 'follow_up';
  title: string;
  author_id: number;
  author_name?: string;
  department?: string;
  visit_type?: 'OPD' | 'IPD' | 'ER';
  encounter_id?: number;
  content: string;
  status: 'draft' | 'signed' | 'amended' | 'addendum';
  signed_at?: string;
  signed_by?: number;
  signed_by_name?: string;
  problems?: string[];
  diagnoses?: string[];
  tags?: string[];
}

// Clinical Document Types
export interface ClinicalDocument extends BaseRecord {
  document_type: 'external_lab' | 'referral_letter' | 'discharge_summary' | 'consent_form' | 'insurance' | 'uploaded_pdf' | 'scanned' | 'other';
  title: string;
  description?: string;
  source?: string;
  date_of_service?: string;
  uploaded_by_id: number;
  uploaded_by_name?: string;
  category?: string;
  tags?: string[];
  file_url: string;
  file_type: string;
  file_size: number;
  status: 'pending_review' | 'reviewed' | 'archived';
}

// Combined Medical Record type for unified list
export type MedicalRecordType = 'lab_report' | 'imaging_report' | 'clinical_note' | 'document';

export interface MedicalRecordListItem {
  id: number;
  type: MedicalRecordType;
  date: string;
  title: string;
  visit_type?: 'OPD' | 'IPD' | 'ER';
  department?: string;
  status: string;
  has_attachment: boolean;
  is_abnormal?: boolean;
}

// Filter Types
export interface MedicalRecordsFilters {
  search?: string;
  record_type?: MedicalRecordType | 'all';
  date_from?: string;
  date_to?: string;
  status?: string;
  visit_type?: 'OPD' | 'IPD' | 'ER';
  department?: string;
  // Lab specific
  panel_name?: string;
  abnormal_only?: boolean;
  // Imaging specific
  modality?: string;
  body_part?: string;
  // Notes specific
  note_type?: string;
  // Documents specific
  document_type?: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Upload Document Form Data
export interface UploadDocumentData {
  document_type: ClinicalDocument['document_type'];
  title: string;
  description?: string;
  date_of_service?: string;
  category?: string;
  tags?: string[];
  file: File;
}
