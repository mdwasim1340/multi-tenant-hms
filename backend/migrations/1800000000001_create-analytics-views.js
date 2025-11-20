/**
 * Analytics Views Migration
 * Team Delta - Operations & Analytics
 * 
 * Creates database views for:
 * - Dashboard analytics
 * - Patient analytics
 * - Clinical analytics
 * - Financial analytics
 * - Operational analytics
 */

exports.up = async (pgm) => {
  // Dashboard Analytics View
  pgm.createView('dashboard_analytics', {}, `
    SELECT 
      COUNT(DISTINCT sp.id) as total_staff,
      COUNT(DISTINCT CASE WHEN sp.status = 'active' THEN sp.id END) as active_staff,
      COUNT(DISTINCT CASE WHEN sp.status = 'on_leave' THEN sp.id END) as staff_on_leave,
      COUNT(DISTINCT ss.id) as total_schedules,
      COUNT(DISTINCT CASE WHEN ss.status = 'scheduled' THEN ss.id END) as scheduled_shifts,
      COUNT(DISTINCT CASE WHEN ss.status = 'completed' THEN ss.id END) as completed_shifts,
      COUNT(DISTINCT sa.id) as total_attendance_records,
      COUNT(DISTINCT CASE WHEN sa.status = 'present' THEN sa.id END) as present_count,
      COUNT(DISTINCT CASE WHEN sa.status = 'absent' THEN sa.id END) as absent_count,
      AVG(CASE WHEN sper.performance_score IS NOT NULL THEN sper.performance_score END) as avg_performance_score
    FROM staff_profiles sp
    LEFT JOIN staff_schedules ss ON sp.id = ss.staff_id
    LEFT JOIN staff_attendance sa ON sp.id = sa.staff_id
    LEFT JOIN staff_performance sper ON sp.id = sper.staff_id
  `);

  // Staff Analytics View
  pgm.createView('staff_analytics', {}, `
    SELECT 
      DATE_TRUNC('month', sp.hire_date) as month,
      COUNT(*) as new_hires,
      COUNT(CASE WHEN sp.employment_type = 'full-time' THEN 1 END) as full_time_count,
      COUNT(CASE WHEN sp.employment_type = 'part-time' THEN 1 END) as part_time_count,
      COUNT(CASE WHEN sp.employment_type = 'contract' THEN 1 END) as contract_count,
      sp.department,
      COUNT(*) as staff_per_department
    FROM staff_profiles sp
    GROUP BY DATE_TRUNC('month', sp.hire_date), sp.department
  `);

  // Schedule Analytics View
  pgm.createView('schedule_analytics', {}, `
    SELECT 
      DATE_TRUNC('week', ss.shift_date) as week,
      COUNT(*) as total_shifts,
      COUNT(CASE WHEN ss.shift_type = 'morning' THEN 1 END) as morning_shifts,
      COUNT(CASE WHEN ss.shift_type = 'afternoon' THEN 1 END) as afternoon_shifts,
      COUNT(CASE WHEN ss.shift_type = 'night' THEN 1 END) as night_shifts,
      COUNT(CASE WHEN ss.shift_type = 'on-call' THEN 1 END) as on_call_shifts,
      COUNT(CASE WHEN ss.status = 'completed' THEN 1 END) as completed_shifts,
      COUNT(CASE WHEN ss.status = 'cancelled' THEN 1 END) as cancelled_shifts,
      AVG(EXTRACT(EPOCH FROM (ss.shift_end::time - ss.shift_start::time))/3600) as avg_shift_hours
    FROM staff_schedules ss
    GROUP BY DATE_TRUNC('week', ss.shift_date)
  `);

  // Attendance Analytics View
  pgm.createView('attendance_analytics', {}, `
    SELECT 
      DATE_TRUNC('month', sa.attendance_date) as month,
      COUNT(*) as total_records,
      COUNT(CASE WHEN sa.status = 'present' THEN 1 END) as present_count,
      COUNT(CASE WHEN sa.status = 'absent' THEN 1 END) as absent_count,
      COUNT(CASE WHEN sa.status = 'late' THEN 1 END) as late_count,
      COUNT(CASE WHEN sa.status = 'half_day' THEN 1 END) as half_day_count,
      COUNT(CASE WHEN sa.status = 'leave' THEN 1 END) as leave_count,
      ROUND(COUNT(CASE WHEN sa.status = 'present' THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as attendance_rate,
      COUNT(CASE WHEN sa.leave_type = 'sick' THEN 1 END) as sick_leave_count,
      COUNT(CASE WHEN sa.leave_type = 'vacation' THEN 1 END) as vacation_count
    FROM staff_attendance sa
    GROUP BY DATE_TRUNC('month', sa.attendance_date)
  `);

  // Performance Analytics View
  pgm.createView('performance_analytics', {}, `
    SELECT 
      DATE_TRUNC('quarter', sper.review_date) as quarter,
      COUNT(*) as total_reviews,
      AVG(sper.performance_score) as avg_score,
      MIN(sper.performance_score) as min_score,
      MAX(sper.performance_score) as max_score,
      COUNT(CASE WHEN sper.performance_score >= 4.0 THEN 1 END) as excellent_count,
      COUNT(CASE WHEN sper.performance_score >= 3.0 AND sper.performance_score < 4.0 THEN 1 END) as good_count,
      COUNT(CASE WHEN sper.performance_score < 3.0 THEN 1 END) as needs_improvement_count
    FROM staff_performance sper
    GROUP BY DATE_TRUNC('quarter', sper.review_date)
  `);

  // Payroll Analytics View
  pgm.createView('payroll_analytics', {}, `
    SELECT 
      DATE_TRUNC('month', spay.pay_period_start) as month,
      COUNT(*) as total_payroll_records,
      SUM(spay.base_salary) as total_base_salary,
      SUM(spay.overtime_pay) as total_overtime_pay,
      SUM(spay.bonuses) as total_bonuses,
      SUM(spay.deductions) as total_deductions,
      SUM(spay.net_pay) as total_net_pay,
      AVG(spay.net_pay) as avg_net_pay,
      SUM(spay.overtime_hours) as total_overtime_hours,
      COUNT(CASE WHEN spay.payment_status = 'paid' THEN 1 END) as paid_count,
      COUNT(CASE WHEN spay.payment_status = 'pending' THEN 1 END) as pending_count
    FROM staff_payroll spay
    GROUP BY DATE_TRUNC('month', spay.pay_period_start)
  `);

  // Credentials Expiry View
  pgm.createView('credentials_expiry_view', {}, `
    SELECT 
      sc.id,
      sc.staff_id,
      sp.employee_id,
      u.name as staff_name,
      sc.credential_type,
      sc.credential_name,
      sc.expiry_date,
      sc.status,
      CASE 
        WHEN sc.expiry_date < CURRENT_DATE THEN 'expired'
        WHEN sc.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
        WHEN sc.expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'expiring_in_90_days'
        ELSE 'valid'
      END as expiry_status,
      sc.expiry_date - CURRENT_DATE as days_until_expiry
    FROM staff_credentials sc
    JOIN staff_profiles sp ON sc.staff_id = sp.id
    JOIN users u ON sp.user_id = u.id
    WHERE sc.status = 'active'
  `);

  // Department Statistics View
  pgm.createView('department_statistics', {}, `
    SELECT 
      sp.department,
      COUNT(DISTINCT sp.id) as total_staff,
      COUNT(DISTINCT CASE WHEN sp.status = 'active' THEN sp.id END) as active_staff,
      AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, sp.hire_date))) as avg_tenure_years,
      COUNT(DISTINCT ss.id) as total_shifts,
      COUNT(DISTINCT sa.id) as total_attendance_records,
      AVG(sper.performance_score) as avg_performance_score,
      SUM(spay.net_pay) as total_payroll
    FROM staff_profiles sp
    LEFT JOIN staff_schedules ss ON sp.id = ss.staff_id
    LEFT JOIN staff_attendance sa ON sp.id = sa.staff_id
    LEFT JOIN staff_performance sper ON sp.id = sper.staff_id
    LEFT JOIN staff_payroll spay ON sp.id = spay.staff_id
    GROUP BY sp.department
  `);
};

exports.down = async (pgm) => {
  pgm.dropView('department_statistics');
  pgm.dropView('credentials_expiry_view');
  pgm.dropView('payroll_analytics');
  pgm.dropView('performance_analytics');
  pgm.dropView('attendance_analytics');
  pgm.dropView('schedule_analytics');
  pgm.dropView('staff_analytics');
  pgm.dropView('dashboard_analytics');
};
