import pool from '../database';

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

// Dashboard Analytics
export const getDashboardAnalytics = async (): Promise<DashboardAnalytics> => {
  const result = await pool.query('SELECT * FROM dashboard_analytics');
  return result.rows[0] || {
    total_staff: 0,
    active_staff: 0,
    staff_on_leave: 0,
    total_schedules: 0,
    scheduled_shifts: 0,
    completed_shifts: 0,
    total_attendance_records: 0,
    present_count: 0,
    absent_count: 0,
    avg_performance_score: 0
  };
};

// Staff Analytics
export const getStaffAnalytics = async (filters: any = {}): Promise<StaffAnalytics[]> => {
  let query = 'SELECT * FROM staff_analytics WHERE 1=1';
  const params: any[] = [];

  if (filters.department) {
    params.push(filters.department);
    query += ` AND department = $${params.length}`;
  }

  if (filters.start_date) {
    params.push(filters.start_date);
    query += ` AND month >= $${params.length}`;
  }

  if (filters.end_date) {
    params.push(filters.end_date);
    query += ` AND month <= $${params.length}`;
  }

  query += ' ORDER BY month DESC';

  const result = await pool.query(query, params);
  return result.rows;
};

// Schedule Analytics
export const getScheduleAnalytics = async (filters: any = {}): Promise<ScheduleAnalytics[]> => {
  let query = 'SELECT * FROM schedule_analytics WHERE 1=1';
  const params: any[] = [];

  if (filters.start_date) {
    params.push(filters.start_date);
    query += ` AND week >= $${params.length}`;
  }

  if (filters.end_date) {
    params.push(filters.end_date);
    query += ` AND week <= $${params.length}`;
  }

  query += ' ORDER BY week DESC';

  const result = await pool.query(query, params);
  return result.rows;
};

// Attendance Analytics
export const getAttendanceAnalytics = async (filters: any = {}): Promise<AttendanceAnalytics[]> => {
  let query = 'SELECT * FROM attendance_analytics WHERE 1=1';
  const params: any[] = [];

  if (filters.start_date) {
    params.push(filters.start_date);
    query += ` AND month >= $${params.length}`;
  }

  if (filters.end_date) {
    params.push(filters.end_date);
    query += ` AND month <= $${params.length}`;
  }

  query += ' ORDER BY month DESC';

  const result = await pool.query(query, params);
  return result.rows;
};

// Performance Analytics
export const getPerformanceAnalytics = async (filters: any = {}): Promise<PerformanceAnalytics[]> => {
  let query = 'SELECT * FROM performance_analytics WHERE 1=1';
  const params: any[] = [];

  if (filters.start_date) {
    params.push(filters.start_date);
    query += ` AND quarter >= $${params.length}`;
  }

  if (filters.end_date) {
    params.push(filters.end_date);
    query += ` AND quarter <= $${params.length}`;
  }

  query += ' ORDER BY quarter DESC';

  const result = await pool.query(query, params);
  return result.rows;
};

// Payroll Analytics
export const getPayrollAnalytics = async (filters: any = {}): Promise<PayrollAnalytics[]> => {
  let query = 'SELECT * FROM payroll_analytics WHERE 1=1';
  const params: any[] = [];

  if (filters.start_date) {
    params.push(filters.start_date);
    query += ` AND month >= $${params.length}`;
  }

  if (filters.end_date) {
    params.push(filters.end_date);
    query += ` AND month <= $${params.length}`;
  }

  query += ' ORDER BY month DESC';

  const result = await pool.query(query, params);
  return result.rows;
};

// Credentials Expiry
export const getCredentialsExpiry = async (filters: any = {}): Promise<CredentialExpiry[]> => {
  let query = 'SELECT * FROM credentials_expiry_view WHERE 1=1';
  const params: any[] = [];

  if (filters.expiry_status) {
    params.push(filters.expiry_status);
    query += ` AND expiry_status = $${params.length}`;
  }

  if (filters.department) {
    params.push(filters.department);
    query += ` AND staff_id IN (SELECT id FROM staff_profiles WHERE department = $${params.length})`;
  }

  query += ' ORDER BY expiry_date ASC';

  const result = await pool.query(query, params);
  return result.rows;
};

// Department Statistics
export const getDepartmentStatistics = async (department?: string): Promise<DepartmentStatistics[]> => {
  let query = 'SELECT * FROM department_statistics WHERE 1=1';
  const params: any[] = [];

  if (department) {
    params.push(department);
    query += ` AND department = $${params.length}`;
  }

  query += ' ORDER BY total_staff DESC';

  const result = await pool.query(query, params);
  return result.rows;
};

// Custom Report Generation
export const generateCustomReport = async (reportConfig: any) => {
  const { metrics, filters, groupBy, dateRange } = reportConfig;
  
  // Build dynamic query based on configuration
  let query = 'SELECT ';
  const params: any[] = [];
  
  // Add metrics
  const metricClauses = metrics.map((metric: string) => {
    switch (metric) {
      case 'staff_count':
        return 'COUNT(DISTINCT sp.id) as staff_count';
      case 'avg_performance':
        return 'AVG(sper.performance_score) as avg_performance';
      case 'total_shifts':
        return 'COUNT(DISTINCT ss.id) as total_shifts';
      case 'attendance_rate':
        return 'ROUND(COUNT(CASE WHEN sa.status = \'present\' THEN 1 END)::numeric / NULLIF(COUNT(sa.id), 0) * 100, 2) as attendance_rate';
      case 'total_payroll':
        return 'SUM(spay.net_pay) as total_payroll';
      default:
        return null;
    }
  }).filter(Boolean);
  
  query += metricClauses.join(', ');
  
  // Add group by
  if (groupBy) {
    query += `, ${groupBy}`;
  }
  
  query += ` FROM staff_profiles sp
    LEFT JOIN staff_schedules ss ON sp.id = ss.staff_id
    LEFT JOIN staff_attendance sa ON sp.id = sa.staff_id
    LEFT JOIN staff_performance sper ON sp.id = sper.staff_id
    LEFT JOIN staff_payroll spay ON sp.id = spay.staff_id
    WHERE 1=1`;
  
  // Add filters
  if (filters.department) {
    params.push(filters.department);
    query += ` AND sp.department = $${params.length}`;
  }
  
  if (filters.status) {
    params.push(filters.status);
    query += ` AND sp.status = $${params.length}`;
  }
  
  if (dateRange?.start) {
    params.push(dateRange.start);
    query += ` AND sp.hire_date >= $${params.length}`;
  }
  
  if (dateRange?.end) {
    params.push(dateRange.end);
    query += ` AND sp.hire_date <= $${params.length}`;
  }
  
  // Add group by clause
  if (groupBy) {
    query += ` GROUP BY ${groupBy}`;
  }
  
  const result = await pool.query(query, params);
  return result.rows;
};

// Export Data
export const exportAnalyticsData = async (dataType: string, format: string = 'json') => {
  let data: any;
  
  switch (dataType) {
    case 'dashboard':
      data = await getDashboardAnalytics();
      break;
    case 'staff':
      data = await getStaffAnalytics();
      break;
    case 'schedule':
      data = await getScheduleAnalytics();
      break;
    case 'attendance':
      data = await getAttendanceAnalytics();
      break;
    case 'performance':
      data = await getPerformanceAnalytics();
      break;
    case 'payroll':
      data = await getPayrollAnalytics();
      break;
    case 'credentials':
      data = await getCredentialsExpiry();
      break;
    case 'departments':
      data = await getDepartmentStatistics();
      break;
    default:
      throw new Error('Invalid data type');
  }
  
  // Format conversion would happen here (CSV, Excel, PDF)
  // For now, return JSON
  return {
    format,
    data,
    timestamp: new Date(),
    recordCount: Array.isArray(data) ? data.length : 1
  };
};
