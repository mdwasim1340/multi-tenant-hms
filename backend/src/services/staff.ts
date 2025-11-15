import pool from '../database';
import * as authService from './auth';

export interface StaffProfile {
  id?: number;
  user_id: number;
  employee_id: string;
  department?: string;
  specialization?: string;
  license_number?: string;
  hire_date: string;
  employment_type?: string;
  status?: string;
  emergency_contact?: any;
  created_at?: Date;
  updated_at?: Date;
}

export interface StaffSchedule {
  id?: number;
  staff_id: number;
  shift_date: string;
  shift_start: string;
  shift_end: string;
  shift_type?: string;
  status?: string;
  notes?: string;
}

export interface StaffCredential {
  id?: number;
  staff_id: number;
  credential_type: string;
  credential_name: string;
  issuing_authority?: string;
  issue_date?: string;
  expiry_date?: string;
  credential_number?: string;
  status?: string;
}

export interface StaffPerformance {
  id?: number;
  staff_id: number;
  review_date: string;
  reviewer_id?: number;
  performance_score?: number;
  strengths?: string;
  areas_for_improvement?: string;
  goals?: string;
  comments?: string;
}

export interface StaffAttendance {
  id?: number;
  staff_id: number;
  attendance_date: string;
  clock_in?: string;
  clock_out?: string;
  status?: string;
  leave_type?: string;
  notes?: string;
}

export interface StaffPayroll {
  id?: number;
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
}

// Staff Profile Operations

/**
 * Create staff member with user account
 * This creates both a Cognito user and a staff profile
 */
export const createStaffWithUser = async (data: {
  name: string;
  email: string;
  role: string;
  employee_id: string;
  department?: string;
  specialization?: string;
  license_number?: string;
  hire_date: string;
  employment_type?: string;
  status?: string;
  emergency_contact?: any;
}) => {
  // Generate temporary password
  const temporaryPassword = generateTemporaryPassword();
  
  // Create user in Cognito and database
  const user = await authService.createUser({
    name: data.name,
    email: data.email,
    password: temporaryPassword,
    tenant: '', // Will be set by middleware
    role: data.role
  });
  
  // Create staff profile
  const staffProfile = await createStaffProfile({
    user_id: user.id,
    employee_id: data.employee_id,
    department: data.department,
    specialization: data.specialization,
    license_number: data.license_number,
    hire_date: data.hire_date,
    employment_type: data.employment_type,
    status: data.status || 'active',
    emergency_contact: data.emergency_contact
  });
  
  return {
    staff: staffProfile,
    credentials: {
      email: data.email,
      temporaryPassword: temporaryPassword,
      userId: user.id
    }
  };
};

/**
 * Generate a secure temporary password
 */
function generateTemporaryPassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Ensure password has at least one of each required character type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special char
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export const createStaffProfile = async (profile: StaffProfile) => {
  const result = await pool.query(
    `INSERT INTO staff_profiles 
    (user_id, employee_id, department, specialization, license_number, hire_date, 
     employment_type, status, emergency_contact)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      profile.user_id,
      profile.employee_id,
      profile.department,
      profile.specialization,
      profile.license_number,
      profile.hire_date,
      profile.employment_type,
      profile.status || 'active',
      profile.emergency_contact ? JSON.stringify(profile.emergency_contact) : null
    ]
  );
  return result.rows[0];
};

export const getStaffProfiles = async (filters: any = {}) => {
  let query = `
    SELECT sp.*, u.name as user_name, u.email as user_email
    FROM staff_profiles sp
    JOIN users u ON sp.user_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters.department) {
    params.push(filters.department);
    query += ` AND sp.department = $${params.length}`;
  }

  if (filters.status) {
    params.push(filters.status);
    query += ` AND sp.status = $${params.length}`;
  }

  if (filters.search) {
    params.push(`%${filters.search}%`);
    query += ` AND (u.name ILIKE $${params.length} OR sp.employee_id ILIKE $${params.length})`;
  }

  query += ' ORDER BY sp.created_at DESC';

  if (filters.limit) {
    params.push(filters.limit);
    query += ` LIMIT $${params.length}`;
  }

  if (filters.offset) {
    params.push(filters.offset);
    query += ` OFFSET $${params.length}`;
  }

  const result = await pool.query(query, params);
  return result.rows;
};

export const getStaffProfileById = async (id: number) => {
  const result = await pool.query(
    `SELECT sp.*, u.name as user_name, u.email as user_email, u.phone as user_phone
    FROM staff_profiles sp
    JOIN users u ON sp.user_id = u.id
    WHERE sp.id = $1`,
    [id]
  );
  return result.rows[0];
};

export const updateStaffProfile = async (id: number, updates: Partial<StaffProfile>) => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && value !== undefined) {
      fields.push(`${key} = $${paramCount}`);
      values.push(key === 'emergency_contact' ? JSON.stringify(value) : value);
      paramCount++;
    }
  });

  if (fields.length === 0) return null;

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await pool.query(
    `UPDATE staff_profiles SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  return result.rows[0];
};

export const deleteStaffProfile = async (id: number) => {
  await pool.query('DELETE FROM staff_profiles WHERE id = $1', [id]);
};

// Staff Schedule Operations
export const createStaffSchedule = async (schedule: StaffSchedule) => {
  const result = await pool.query(
    `INSERT INTO staff_schedules 
    (staff_id, shift_date, shift_start, shift_end, shift_type, status, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      schedule.staff_id,
      schedule.shift_date,
      schedule.shift_start,
      schedule.shift_end,
      schedule.shift_type,
      schedule.status || 'scheduled',
      schedule.notes
    ]
  );
  return result.rows[0];
};

export const getStaffSchedules = async (filters: any = {}) => {
  let query = `
    SELECT ss.*, sp.employee_id, u.name as staff_name
    FROM staff_schedules ss
    JOIN staff_profiles sp ON ss.staff_id = sp.id
    JOIN users u ON sp.user_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters.staff_id) {
    params.push(filters.staff_id);
    query += ` AND ss.staff_id = $${params.length}`;
  }

  if (filters.date) {
    params.push(filters.date);
    query += ` AND ss.shift_date = $${params.length}`;
  }

  if (filters.status) {
    params.push(filters.status);
    query += ` AND ss.status = $${params.length}`;
  }

  query += ' ORDER BY ss.shift_date DESC, ss.shift_start ASC';

  const result = await pool.query(query, params);
  return result.rows;
};

export const updateStaffSchedule = async (id: number, updates: Partial<StaffSchedule>) => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && value !== undefined) {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  });

  if (fields.length === 0) return null;

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await pool.query(
    `UPDATE staff_schedules SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  return result.rows[0];
};

// Staff Credentials Operations
export const createStaffCredential = async (credential: StaffCredential) => {
  const result = await pool.query(
    `INSERT INTO staff_credentials 
    (staff_id, credential_type, credential_name, issuing_authority, issue_date, 
     expiry_date, credential_number, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      credential.staff_id,
      credential.credential_type,
      credential.credential_name,
      credential.issuing_authority,
      credential.issue_date,
      credential.expiry_date,
      credential.credential_number,
      credential.status || 'active'
    ]
  );
  return result.rows[0];
};

export const getStaffCredentials = async (staffId: number) => {
  const result = await pool.query(
    `SELECT * FROM staff_credentials WHERE staff_id = $1 ORDER BY expiry_date ASC`,
    [staffId]
  );
  return result.rows;
};

// Staff Attendance Operations
export const recordStaffAttendance = async (attendance: StaffAttendance) => {
  const result = await pool.query(
    `INSERT INTO staff_attendance 
    (staff_id, attendance_date, clock_in, clock_out, status, leave_type, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      attendance.staff_id,
      attendance.attendance_date,
      attendance.clock_in,
      attendance.clock_out,
      attendance.status,
      attendance.leave_type,
      attendance.notes
    ]
  );
  return result.rows[0];
};

export const getStaffAttendance = async (filters: any = {}) => {
  let query = `SELECT * FROM staff_attendance WHERE 1=1`;
  const params: any[] = [];

  if (filters.staff_id) {
    params.push(filters.staff_id);
    query += ` AND staff_id = $${params.length}`;
  }

  if (filters.date) {
    params.push(filters.date);
    query += ` AND attendance_date = $${params.length}`;
  }

  query += ' ORDER BY attendance_date DESC';

  const result = await pool.query(query, params);
  return result.rows;
};

// Staff Performance Operations
export const createPerformanceReview = async (review: StaffPerformance) => {
  const result = await pool.query(
    `INSERT INTO staff_performance 
    (staff_id, review_date, reviewer_id, performance_score, strengths, 
     areas_for_improvement, goals, comments)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      review.staff_id,
      review.review_date,
      review.reviewer_id,
      review.performance_score,
      review.strengths,
      review.areas_for_improvement,
      review.goals,
      review.comments
    ]
  );
  return result.rows[0];
};

export const getStaffPerformanceReviews = async (staffId: number) => {
  const result = await pool.query(
    `SELECT sp.*, u.name as reviewer_name
    FROM staff_performance sp
    LEFT JOIN users u ON sp.reviewer_id = u.id
    WHERE sp.staff_id = $1
    ORDER BY sp.review_date DESC`,
    [staffId]
  );
  return result.rows;
};

// Staff Payroll Operations
export const createPayrollRecord = async (payroll: StaffPayroll) => {
  const result = await pool.query(
    `INSERT INTO staff_payroll 
    (staff_id, pay_period_start, pay_period_end, base_salary, overtime_hours, 
     overtime_pay, bonuses, deductions, net_pay, payment_date, payment_status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      payroll.staff_id,
      payroll.pay_period_start,
      payroll.pay_period_end,
      payroll.base_salary,
      payroll.overtime_hours,
      payroll.overtime_pay,
      payroll.bonuses,
      payroll.deductions,
      payroll.net_pay,
      payroll.payment_date,
      payroll.payment_status || 'pending'
    ]
  );
  return result.rows[0];
};

export const getStaffPayroll = async (staffId: number) => {
  const result = await pool.query(
    `SELECT * FROM staff_payroll 
    WHERE staff_id = $1 
    ORDER BY pay_period_start DESC`,
    [staffId]
  );
  return result.rows;
};
