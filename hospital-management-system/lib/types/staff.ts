export interface StaffProfile {
  id: number;
  user_id: number;
  employee_id: string;
  department?: string;
  specialization?: string;
  license_number?: string;
  hire_date: string;
  employment_type?: string;
  status?: string;
  emergency_contact?: any;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface StaffSchedule {
  id: number;
  staff_id: number;
  shift_date: string;
  shift_start: string;
  shift_end: string;
  shift_type?: string;
  status?: string;
  notes?: string;
  employee_id?: string;
  staff_name?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface StaffCredential {
  id: number;
  staff_id: number;
  credential_type: string;
  credential_name: string;
  issuing_authority?: string;
  issue_date?: string;
  expiry_date?: string;
  credential_number?: string;
  status?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface StaffPerformance {
  id: number;
  staff_id: number;
  review_date: string;
  reviewer_id?: number;
  performance_score?: number;
  strengths?: string;
  areas_for_improvement?: string;
  goals?: string;
  comments?: string;
  reviewer_name?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface StaffAttendance {
  id: number;
  staff_id: number;
  attendance_date: string;
  clock_in?: string;
  clock_out?: string;
  status?: string;
  leave_type?: string;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface StaffPayroll {
  id: number;
  staff_id: number;
  pay_period_start: string;
  pay_period_end: string;
  base_salary?: number;
  overtime_hours?: number;
  overtime_pay?: number;
  bonuses?: number;
  deductions?: number;
  net_pay?: number;
  payment_date?: string;
  payment_status?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
  error?: string;
}
