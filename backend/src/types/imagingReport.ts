// Imaging Report Types and Interfaces
// Requirements: 4.1, 4.2 - Imaging report data structures

export type ImagingReportStatus = 'pending' | 'completed' | 'amended';

export type ImagingModality = 
  | 'CT'
  | 'MRI'
  | 'X-Ray'
  | 'Ultrasound'
  | 'PET'
  | 'Mammography'
  | 'Fluoroscopy'
  | 'Nuclear Medicine'
  | 'Other';

export interface ImagingReport {
  id: number;
  patient_id: number;
  imaging_type: string;
  radiologist_id: number;
  findings: string;
  impression?: string | null;
  status: ImagingReportStatus;
  report_date: Date;
  study_date?: Date | null;
  modality?: ImagingModality | null;
  body_part?: string | null;
  contrast_used: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ImagingReportFile {
  id: number;
  report_id: number;
  file_id: string; // S3 object key
  filename: string;
  file_type: string;
  file_size: number;
  mime_type?: string | null;
  is_primary: boolean;
  uploaded_at: Date;
}

export interface ImagingReportWithFiles extends ImagingReport {
  files: ImagingReportFile[];
}

// Request/Response DTOs
export interface CreateImagingReportRequest {
  patient_id: number;
  imaging_type: string;
  radiologist_id: number;
  findings: string;
  impression?: string;
  report_date: string;
  study_date?: string;
  modality?: ImagingModality;
  body_part?: string;
  contrast_used?: boolean;
}

export interface UpdateImagingReportRequest {
  imaging_type?: string;
  findings?: string;
  impression?: string;
  status?: ImagingReportStatus;
  report_date?: string;
  study_date?: string;
  modality?: ImagingModality;
  body_part?: string;
  contrast_used?: boolean;
}

export interface AddImagingFileRequest {
  file_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  mime_type?: string;
  is_primary?: boolean;
}

export interface ImagingReportFilters {
  patient_id?: number;
  radiologist_id?: number;
  imaging_type?: string;
  modality?: ImagingModality;
  status?: ImagingReportStatus;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ImagingReportListResponse {
  reports: ImagingReport[];
  total: number;
  page: number;
  limit: number;
}

// Common imaging types
export const IMAGING_TYPES = [
  'Chest X-Ray',
  'Abdominal X-Ray',
  'CT Head',
  'CT Chest',
  'CT Abdomen',
  'CT Pelvis',
  'MRI Brain',
  'MRI Spine',
  'MRI Knee',
  'MRI Shoulder',
  'Ultrasound Abdomen',
  'Ultrasound Pelvis',
  'Echocardiogram',
  'Mammogram',
  'Bone Scan',
  'PET Scan',
  'Other'
] as const;

export const BODY_PARTS = [
  'Head',
  'Neck',
  'Chest',
  'Abdomen',
  'Pelvis',
  'Spine',
  'Upper Extremity',
  'Lower Extremity',
  'Whole Body',
  'Other'
] as const;
