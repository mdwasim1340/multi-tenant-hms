-- Migration: Create Staff Management Tables
-- Team: Delta
-- Purpose: Create staff management system tables for workforce management
-- Date: 2025-11-16

-- ============================================================================
-- TENANT-SPECIFIC TABLES (Created in each tenant schema)
-- ============================================================================

-- staff_profiles table (tenant-specific)
CREATE TABLE IF NOT EXISTS staff_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  department VARCHAR(100),
  specialization VARCHAR(100),
  license_number VARCHAR(100),
  hire_date DATE NOT NULL,
  employment_type VARCHAR(50) DEFAULT 'full-time',
  status VARCHAR(50) DEFAULT 'active',
  emergency_contact JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- staff_schedules table (tenant-specific)
CREATE TABLE IF NOT EXISTS staff_schedules (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  shift_start TIME NOT NULL,
  shift_end TIME NOT NULL,
  shift_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- staff_credentials table (tenant-specific)
CREATE TABLE IF NOT EXISTS staff_credentials (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  credential_type VARCHAR(100) NOT NULL,
  credential_name VARCHAR(255) NOT NULL,
  issuing_authority VARCHAR(255),
  issue_date DATE,
  expiry_date DATE,
  credential_number VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- staff_performance table (tenant-specific)
CREATE TABLE IF NOT EXISTS staff_performance (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  review_date DATE NOT NULL,
  reviewer_id INTEGER REFERENCES public.users(id),
  performance_score DECIMAL(3,2),
  strengths TEXT,
  areas_for_improvement TEXT,
  goals TEXT,
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- staff_attendance table (tenant-specific)
CREATE TABLE IF NOT EXISTS staff_attendance (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  clock_in TIME,
  clock_out TIME,
  status VARCHAR(50),
  leave_type VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- staff_payroll table (tenant-specific)
CREATE TABLE IF NOT EXISTS staff_payroll (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  base_salary DECIMAL(10,2),
  overtime_hours DECIMAL(5,2),
  overtime_pay DECIMAL(10,2),
  bonuses DECIMAL(10,2),
  deductions DECIMAL(10,2),
  net_pay DECIMAL(10,2),
  payment_date DATE,
  payment_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_staff_profiles_user_id ON staff_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_employee_id ON staff_profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_department ON staff_profiles(department);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_status ON staff_profiles(status);

CREATE INDEX IF NOT EXISTS idx_staff_schedules_staff_id ON staff_schedules(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_schedules_shift_date ON staff_schedules(shift_date);
CREATE INDEX IF NOT EXISTS idx_staff_schedules_status ON staff_schedules(status);

CREATE INDEX IF NOT EXISTS idx_staff_credentials_staff_id ON staff_credentials(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_credentials_expiry_date ON staff_credentials(expiry_date);
CREATE INDEX IF NOT EXISTS idx_staff_credentials_status ON staff_credentials(status);

CREATE INDEX IF NOT EXISTS idx_staff_performance_staff_id ON staff_performance(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_performance_review_date ON staff_performance(review_date);

CREATE INDEX IF NOT EXISTS idx_staff_attendance_staff_id ON staff_attendance(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_date ON staff_attendance(attendance_date);

CREATE INDEX IF NOT EXISTS idx_staff_payroll_staff_id ON staff_payroll(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_payroll_period ON staff_payroll(pay_period_start, pay_period_end);
CREATE INDEX IF NOT EXISTS idx_staff_payroll_status ON staff_payroll(payment_status);
