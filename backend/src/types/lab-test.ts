export interface LabTest {
  id: number;
  test_number: string;
  patient_id: number;
  medical_record_id: number | null;
  appointment_id: number | null;
  ordered_by: number;
  test_type: string;
  test_code: string | null;
  test_name: string;
  panel_id: number | null;
  priority: LabTestPriority;
  clinical_indication: string | null;
  specimen_type: string | null;
  specimen_collected_at: Date | null;
  specimen_collected_by: number | null;
  status: LabTestStatus;
  ordered_date: Date;
  expected_completion_date: Date | null;
  completed_date: Date | null;
  notes: string | null;
  cancelled_reason: string | null;
  cancelled_date: Date | null;
  cancelled_by: number | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  
  // Populated fields
  patient?: {
    id: number;
    first_name: string;
    last_name: string;
    patient_number: string;
  };
  ordered_by_user?: {
    id: number;
    name: string;
  };
  results?: LabResult[];
  panel?: LabPanel;
}

export type LabTestStatus = 'ordered' | 'collected' | 'processing' | 'completed' | 'cancelled';
export type LabTestPriority = 'routine' | 'urgent' | 'stat';

export interface LabResult {
  id: number;
  lab_test_id: number;
  result_code: string | null;
  result_name: string;
  result_value: string | null;
  result_unit: string | null;
  reference_range_low: string | null;
  reference_range_high: string | null;
  reference_range_text: string | null;
  is_abnormal: boolean;
  abnormal_flag: AbnormalFlag | null;
  interpretation: string | null;
  result_date: Date;
  verified_by: number | null;
  verified_at: Date | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export type AbnormalFlag = 'high' | 'low' | 'critical_high' | 'critical_low';

export interface LabPanel {
  id: number;
  panel_code: string;
  panel_name: string;
  description: string | null;
  category: string | null;
  tests_included: string[];
  turnaround_time_hours: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ImagingStudy {
  id: number;
  study_number: string;
  patient_id: number;
  medical_record_id: number | null;
  appointment_id: number | null;
  ordered_by: number;
  study_type: string;
  body_part: string;
  modality: string | null;
  clinical_indication: string | null;
  priority: LabTestPriority;
  status: ImagingStatus;
  ordered_date: Date;
  scheduled_date: Date | null;
  performed_date: Date | null;
  completed_date: Date | null;
  performing_facility: string | null;
  radiologist_id: number | null;
  findings: string | null;
  impression: string | null;
  recommendations: string | null;
  images_url: string | null;
  report_url: string | null;
  is_critical: boolean;
  critical_findings: string | null;
  notified_at: Date | null;
  notified_by: number | null;
  cancelled_reason: string | null;
  cancelled_date: Date | null;
  cancelled_by: number | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export type ImagingStatus = 'ordered' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

// DTOs
export interface CreateLabTestData {
  patient_id: number;
  medical_record_id?: number;
  appointment_id?: number;
  ordered_by: number;
  test_type: string;
  test_code?: string;
  test_name: string;
  panel_id?: number;
  priority?: LabTestPriority;
  clinical_indication?: string;
  specimen_type?: string;
  expected_completion_date?: Date;
  notes?: string;
}

export interface CreateLabResultData {
  lab_test_id: number;
  result_code?: string;
  result_name: string;
  result_value?: string;
  result_unit?: string;
  reference_range_low?: string;
  reference_range_high?: string;
  reference_range_text?: string;
  interpretation?: string;
  notes?: string;
}

export interface CreateImagingStudyData {
  patient_id: number;
  medical_record_id?: number;
  appointment_id?: number;
  ordered_by: number;
  study_type: string;
  body_part: string;
  modality?: string;
  clinical_indication?: string;
  priority?: LabTestPriority;
  scheduled_date?: Date;
  performing_facility?: string;
}

export interface LabTestSearchParams {
  page?: number;
  limit?: number;
  patient_id?: number;
  status?: LabTestStatus;
  test_type?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: 'ordered_date' | 'completed_date' | 'created_at';
  sort_order?: 'asc' | 'desc';
}
