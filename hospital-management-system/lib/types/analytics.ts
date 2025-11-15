export interface DashboardAnalytics {
  total_staff: number;
  active_staff: number;
  staff_on_leave: number;
  total_schedules: number;
  scheduled_shifts: number;
  completed_shifts: number;
  total_attendance_records: number;
  present_count: number;
  absent_count: number;
  avg_performance_score: number;
}

export interface StaffAnalytics {
  month: Date;
  new_hires: number;
  full_time_count: number;
  part_time_count: number;
  contract_count: number;
  department: string;
  staff_per_department: number;
}

export interface ScheduleAnalytics {
  week: Date;
  total_shifts: number;
  morning_shifts: number;
  afternoon_shifts: number;
  night_shifts: number;
  on_call_shifts: number;
  completed_shifts: number;
  cancelled_shifts: number;
  avg_shift_hours: number;
}

export interface AttendanceAnalytics {
  month: Date;
  total_records: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  half_day_count: number;
  leave_count: number;
  attendance_rate: number;
  sick_leave_count: number;
  vacation_count: number;
}

export interface PerformanceAnalytics {
  quarter: Date;
  total_reviews: number;
  avg_score: number;
  min_score: number;
  max_score: number;
  excellent_count: number;
  good_count: number;
  needs_improvement_count: number;
}

export interface PayrollAnalytics {
  month: Date;
  total_payroll_records: number;
  total_base_salary: number;
  total_overtime_pay: number;
  total_bonuses: number;
  total_deductions: number;
  total_net_pay: number;
  avg_net_pay: number;
  total_overtime_hours: number;
  paid_count: number;
  pending_count: number;
}

export interface CredentialExpiry {
  id: number;
  staff_id: number;
  employee_id: string;
  staff_name: string;
  credential_type: string;
  credential_name: string;
  expiry_date: Date;
  status: string;
  expiry_status: string;
  days_until_expiry: number;
}

export interface DepartmentStatistics {
  department: string;
  total_staff: number;
  active_staff: number;
  avg_tenure_years: number;
  total_shifts: number;
  total_attendance_records: number;
  avg_performance_score: number;
  total_payroll: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
  error?: string;
}
