/**
 * Staff Management Tables Migration
 * Team Delta - Operations & Analytics
 * 
 * Creates tables for:
 * - Staff profiles
 * - Staff schedules
 * - Staff credentials
 * - Staff performance reviews
 * - Staff attendance
 * - Staff payroll
 */

exports.up = async (pgm) => {
  // Staff Profiles Table
  pgm.createTable('staff_profiles', {
    id: { type: 'serial', primaryKey: true },
    user_id: { 
      type: 'integer', 
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE'
    },
    employee_id: { type: 'varchar(50)', notNull: true, unique: true },
    department: { type: 'varchar(100)' },
    specialization: { type: 'varchar(100)' },
    license_number: { type: 'varchar(100)' },
    hire_date: { type: 'date', notNull: true },
    employment_type: { type: 'varchar(50)' }, // full-time, part-time, contract
    status: { type: 'varchar(50)', default: "'active'" }, // active, inactive, on_leave
    emergency_contact: { type: 'jsonb' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  });

  // Staff Schedules Table
  pgm.createTable('staff_schedules', {
    id: { type: 'serial', primaryKey: true },
    staff_id: { 
      type: 'integer', 
      notNull: true,
      references: 'staff_profiles',
      onDelete: 'CASCADE'
    },
    shift_date: { type: 'date', notNull: true },
    shift_start: { type: 'time', notNull: true },
    shift_end: { type: 'time', notNull: true },
    shift_type: { type: 'varchar(50)' }, // morning, afternoon, night, on-call
    status: { type: 'varchar(50)', default: "'scheduled'" }, // scheduled, completed, cancelled
    notes: { type: 'text' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  });

  // Staff Credentials Table
  pgm.createTable('staff_credentials', {
    id: { type: 'serial', primaryKey: true },
    staff_id: { 
      type: 'integer', 
      notNull: true,
      references: 'staff_profiles',
      onDelete: 'CASCADE'
    },
    credential_type: { type: 'varchar(100)', notNull: true }, // license, certification, training
    credential_name: { type: 'varchar(255)', notNull: true },
    issuing_authority: { type: 'varchar(255)' },
    issue_date: { type: 'date' },
    expiry_date: { type: 'date' },
    credential_number: { type: 'varchar(100)' },
    status: { type: 'varchar(50)', default: "'active'" }, // active, expired, suspended
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  });

  // Staff Performance Table
  pgm.createTable('staff_performance', {
    id: { type: 'serial', primaryKey: true },
    staff_id: { 
      type: 'integer', 
      notNull: true,
      references: 'staff_profiles',
      onDelete: 'CASCADE'
    },
    review_date: { type: 'date', notNull: true },
    reviewer_id: { 
      type: 'integer',
      references: 'users'
    },
    performance_score: { type: 'decimal(3,2)' }, // 0.00 to 5.00
    strengths: { type: 'text' },
    areas_for_improvement: { type: 'text' },
    goals: { type: 'text' },
    comments: { type: 'text' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  });

  // Staff Attendance Table
  pgm.createTable('staff_attendance', {
    id: { type: 'serial', primaryKey: true },
    staff_id: { 
      type: 'integer', 
      notNull: true,
      references: 'staff_profiles',
      onDelete: 'CASCADE'
    },
    attendance_date: { type: 'date', notNull: true },
    clock_in: { type: 'time' },
    clock_out: { type: 'time' },
    status: { type: 'varchar(50)' }, // present, absent, late, half_day, leave
    leave_type: { type: 'varchar(50)' }, // sick, vacation, personal, unpaid
    notes: { type: 'text' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  });

  // Staff Payroll Table
  pgm.createTable('staff_payroll', {
    id: { type: 'serial', primaryKey: true },
    staff_id: { 
      type: 'integer', 
      notNull: true,
      references: 'staff_profiles',
      onDelete: 'CASCADE'
    },
    pay_period_start: { type: 'date', notNull: true },
    pay_period_end: { type: 'date', notNull: true },
    base_salary: { type: 'decimal(10,2)' },
    overtime_hours: { type: 'decimal(5,2)' },
    overtime_pay: { type: 'decimal(10,2)' },
    bonuses: { type: 'decimal(10,2)' },
    deductions: { type: 'decimal(10,2)' },
    net_pay: { type: 'decimal(10,2)' },
    payment_date: { type: 'date' },
    payment_status: { type: 'varchar(50)', default: "'pending'" }, // pending, processed, paid
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  });

  // Create indexes for performance
  pgm.createIndex('staff_profiles', 'user_id');
  pgm.createIndex('staff_profiles', 'employee_id');
  pgm.createIndex('staff_profiles', 'department');
  pgm.createIndex('staff_profiles', 'status');
  
  pgm.createIndex('staff_schedules', 'staff_id');
  pgm.createIndex('staff_schedules', 'shift_date');
  pgm.createIndex('staff_schedules', 'status');
  
  pgm.createIndex('staff_credentials', 'staff_id');
  pgm.createIndex('staff_credentials', 'expiry_date');
  pgm.createIndex('staff_credentials', 'status');
  
  pgm.createIndex('staff_performance', 'staff_id');
  pgm.createIndex('staff_performance', 'review_date');
  
  pgm.createIndex('staff_attendance', 'staff_id');
  pgm.createIndex('staff_attendance', 'attendance_date');
  pgm.createIndex('staff_attendance', 'status');
  
  pgm.createIndex('staff_payroll', 'staff_id');
  pgm.createIndex('staff_payroll', 'pay_period_start');
  pgm.createIndex('staff_payroll', 'payment_status');
};

exports.down = async (pgm) => {
  pgm.dropTable('staff_payroll');
  pgm.dropTable('staff_attendance');
  pgm.dropTable('staff_performance');
  pgm.dropTable('staff_credentials');
  pgm.dropTable('staff_schedules');
  pgm.dropTable('staff_profiles');
};
