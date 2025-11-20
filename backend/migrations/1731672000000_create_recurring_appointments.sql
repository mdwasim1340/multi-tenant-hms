-- Migration: Create Recurring Appointments Table
-- Team: Alpha
-- Date: November 15, 2025
-- Description: Adds support for recurring appointment patterns

-- Create recurring_appointments table in tenant schemas
CREATE TABLE IF NOT EXISTS recurring_appointments (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INTEGER NOT NULL, -- References public.users.id
  
  -- Recurrence pattern configuration
  recurrence_pattern VARCHAR(50) NOT NULL, -- daily, weekly, monthly, custom
  recurrence_interval INTEGER DEFAULT 1, -- Every X days/weeks/months
  recurrence_days VARCHAR(50), -- For weekly: 'MON,WED,FRI' or '1,3,5'
  recurrence_day_of_month INTEGER, -- For monthly: 1-31
  
  -- Date range
  start_date DATE NOT NULL,
  end_date DATE, -- NULL for indefinite
  max_occurrences INTEGER, -- Alternative to end_date
  occurrences_created INTEGER DEFAULT 0, -- Track how many created
  
  -- Appointment details
  start_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  appointment_type VARCHAR(100) NOT NULL,
  chief_complaint TEXT,
  notes TEXT,
  special_instructions TEXT,
  estimated_cost DECIMAL(10, 2),
  
  -- Status and metadata
  status VARCHAR(50) DEFAULT 'active', -- active, paused, cancelled, completed
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP,
  cancelled_by INTEGER,
  
  -- Audit fields
  created_by INTEGER,
  updated_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_recurrence_pattern CHECK (
    recurrence_pattern IN ('daily', 'weekly', 'monthly', 'custom')
  ),
  CONSTRAINT valid_status CHECK (
    status IN ('active', 'paused', 'cancelled', 'completed')
  ),
  CONSTRAINT valid_interval CHECK (recurrence_interval > 0),
  CONSTRAINT valid_day_of_month CHECK (
    recurrence_day_of_month IS NULL OR 
    (recurrence_day_of_month >= 1 AND recurrence_day_of_month <= 31)
  ),
  CONSTRAINT end_date_or_max_occurrences CHECK (
    end_date IS NOT NULL OR max_occurrences IS NOT NULL
  )
);

-- Create indexes for performance
CREATE INDEX recurring_appointments_patient_id_idx ON recurring_appointments(patient_id);
CREATE INDEX recurring_appointments_doctor_id_idx ON recurring_appointments(doctor_id);
CREATE INDEX recurring_appointments_start_date_idx ON recurring_appointments(start_date);
CREATE INDEX recurring_appointments_status_idx ON recurring_appointments(status);
CREATE INDEX recurring_appointments_pattern_idx ON recurring_appointments(recurrence_pattern);

-- Add comment
COMMENT ON TABLE recurring_appointments IS 'Stores recurring appointment patterns that generate individual appointments';
COMMENT ON COLUMN recurring_appointments.recurrence_pattern IS 'Pattern type: daily, weekly, monthly, or custom';
COMMENT ON COLUMN recurring_appointments.recurrence_interval IS 'Frequency: every X days/weeks/months';
COMMENT ON COLUMN recurring_appointments.recurrence_days IS 'For weekly: comma-separated day numbers (0=Sun, 6=Sat) or names';
COMMENT ON COLUMN recurring_appointments.occurrences_created IS 'Number of individual appointments created so far';
