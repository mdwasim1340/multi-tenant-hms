-- Migration: Create Appointment Waitlist Table
-- Team: Alpha
-- Date: November 15, 2025
-- Description: Adds support for appointment waitlist management

-- Create appointment_waitlist table in tenant schemas
CREATE TABLE IF NOT EXISTS appointment_waitlist (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INTEGER NOT NULL, -- References public.users.id
  
  -- Preferences
  preferred_dates DATE[], -- Array of preferred dates
  preferred_times TIME[], -- Array of preferred times (e.g., morning, afternoon)
  preferred_time_slots VARCHAR(100)[], -- Array like ['morning', 'afternoon', 'evening']
  duration_minutes INTEGER DEFAULT 30,
  appointment_type VARCHAR(100) NOT NULL,
  
  -- Priority and urgency
  priority VARCHAR(50) DEFAULT 'normal', -- urgent, high, normal, low
  urgency_notes TEXT,
  
  -- Appointment details
  chief_complaint TEXT,
  notes TEXT,
  special_instructions TEXT,
  
  -- Status and tracking
  status VARCHAR(50) DEFAULT 'waiting', -- waiting, notified, converted, expired, cancelled
  notified_at TIMESTAMP,
  notification_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP,
  
  -- Conversion tracking
  converted_to_appointment_id INTEGER, -- References appointments(id)
  converted_at TIMESTAMP,
  converted_by INTEGER,
  
  -- Cancellation
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP,
  cancelled_by INTEGER,
  
  -- Audit fields
  created_by INTEGER,
  updated_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_priority CHECK (
    priority IN ('urgent', 'high', 'normal', 'low')
  ),
  CONSTRAINT valid_status CHECK (
    status IN ('waiting', 'notified', 'converted', 'expired', 'cancelled')
  ),
  CONSTRAINT valid_duration CHECK (duration_minutes > 0)
);

-- Create indexes for performance
CREATE INDEX appointment_waitlist_patient_id_idx ON appointment_waitlist(patient_id);
CREATE INDEX appointment_waitlist_doctor_id_idx ON appointment_waitlist(doctor_id);
CREATE INDEX appointment_waitlist_status_idx ON appointment_waitlist(status);
CREATE INDEX appointment_waitlist_priority_idx ON appointment_waitlist(priority);
CREATE INDEX appointment_waitlist_created_at_idx ON appointment_waitlist(created_at);
CREATE INDEX appointment_waitlist_expires_at_idx ON appointment_waitlist(expires_at);

-- Add comments
COMMENT ON TABLE appointment_waitlist IS 'Manages appointment waitlist for patients when no slots are available';
COMMENT ON COLUMN appointment_waitlist.preferred_dates IS 'Array of dates patient prefers (PostgreSQL array type)';
COMMENT ON COLUMN appointment_waitlist.preferred_times IS 'Array of time preferences (PostgreSQL array type)';
COMMENT ON COLUMN appointment_waitlist.priority IS 'Urgency level: urgent, high, normal, low';
COMMENT ON COLUMN appointment_waitlist.status IS 'Current status: waiting, notified, converted, expired, cancelled';
COMMENT ON COLUMN appointment_waitlist.notification_count IS 'Number of times patient has been notified about availability';
COMMENT ON COLUMN appointment_waitlist.converted_to_appointment_id IS 'ID of appointment created from this waitlist entry';
