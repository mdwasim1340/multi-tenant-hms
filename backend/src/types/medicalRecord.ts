/**
 * Team Alpha - Medical Record Types
 * TypeScript interfaces for medical records system
 */

// ============================================================================
// Main Medical Record Interface
// ============================================================================

export interface MedicalRecord {
  id: number;
  patient_id: number;
  doctor_id: number;
  visit_date: Date;
  chief_complaint?: string;
  diagnosis?: string;
  treatment_plan?: string;
  prescriptions?: Prescription[]; // JSONB
  vital_signs?: VitalSigns; // JSONB
  lab_results?: LabResults; // JSONB
  notes?: string;
  follow_up_required: boolean;
  follow_up_date?: Date;
  status: 'draft' | 'finalized';
  finalized_at?: Date;
  finalized_by?: number;
  created_at: Date;
  updated_at: Date;
  // Joined data
  patient?: {
    id: number;
    first_name: string;
    last_name: string;
    patient_number: string;
  };
  doctor?: {
    id: number;
    name: string;
    email: string;
  };
}

// ============================================================================
// Record Attachment Interface
// ============================================================================

export interface RecordAttachment {
  id: number;
  medical_record_id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  s3_key: string;
  s3_bucket: string;
  uploaded_by: number;
  description?: string;
  created_at: Date;
  // Joined data
  uploader?: {
    id: number;
    name: string;
    email: string;
  };
}

// ============================================================================
// Diagnosis Interface
// ============================================================================

export interface Diagnosis {
  id: number;
  record_id: number;
  icd_code?: string;
  diagnosis_name: string;
  diagnosis_type?: 'primary' | 'secondary' | 'differential';
  notes?: string;
  created_at: Date;
}

// ============================================================================
// Supporting Types
// ============================================================================

export interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface VitalSigns {
  blood_pressure?: string; // e.g., "120/80"
  temperature?: number; // Fahrenheit
  pulse?: number; // BPM
  respiratory_rate?: number; // Breaths per minute
  oxygen_saturation?: number; // Percentage
  weight?: number; // Pounds or kg
  height?: number; // Inches or cm
  bmi?: number;
}

export interface LabResults {
  [testName: string]: {
    value: string | number;
    unit?: string;
    reference_range?: string;
    status?: 'normal' | 'abnormal' | 'critical';
  };
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface CreateMedicalRecordDTO {
  patient_id: number;
  doctor_id: number;
  visit_date: string; // ISO date string
  chief_complaint?: string;
  diagnosis?: string;
  treatment_plan?: string;
  prescriptions?: Prescription[];
  vital_signs?: VitalSigns;
  lab_results?: LabResults;
  notes?: string;
  follow_up_required?: boolean;
  follow_up_date?: string; // ISO date string
}

export interface UpdateMedicalRecordDTO {
  visit_date?: string;
  chief_complaint?: string;
  diagnosis?: string;
  treatment_plan?: string;
  prescriptions?: Prescription[];
  vital_signs?: VitalSigns;
  lab_results?: LabResults;
  notes?: string;
  follow_up_required?: boolean;
  follow_up_date?: string;
}

export interface AddAttachmentDTO {
  file_name: string;
  file_type: string;
  file_size: number;
  s3_key: string;
  s3_bucket: string;
  description?: string;
}

// ============================================================================
// Query Filters
// ============================================================================

export interface MedicalRecordFilters {
  page?: number;
  limit?: number;
  patient_id?: number;
  doctor_id?: number;
  status?: 'draft' | 'finalized';
  date_from?: string;
  date_to?: string;
  search?: string; // Search in chief_complaint, diagnosis
}

// ============================================================================
// API Response Types
// ============================================================================

export interface MedicalRecordListResponse {
  success: boolean;
  data: {
    records: MedicalRecord[];
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

export interface MedicalRecordResponse {
  success: boolean;
  data: {
    record: MedicalRecord;
    attachments?: RecordAttachment[];
    diagnoses?: Diagnosis[];
  };
  message?: string;
}

export interface AttachmentListResponse {
  success: boolean;
  data: {
    attachments: RecordAttachment[];
  };
}

export interface UploadUrlResponse {
  success: boolean;
  data: {
    uploadUrl: string;
    s3Key: string;
    attachmentId?: number;
  };
  message?: string;
}

export interface DownloadUrlResponse {
  success: boolean;
  data: {
    downloadUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  };
  message?: string;
}
