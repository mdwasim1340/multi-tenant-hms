-- Appointment Management Schema
-- Apply to ALL tenant schemas

-- Main appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  appointment_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Relationships
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INTEGER NOT NULL, -- References public.users.id
  
  -- Appointment timing
  appointment_date TIMESTAMP NOT NULL,
  appointment_end_time TIMESTAMP NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  appointment_type VARCHAR(100), -- 'consultation', 'follow_up', 'emergency', 'procedure'
  
  -- Status workflow
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'confirmed', 'checked_in', 'in_progress', 
    'completed', 'cancelled', 'no_show', 'rescheduled'
  )),
  
  -- Cancellation/rescheduling
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP,
  cancelled_by INTEGER,
  rescheduled_from INTEGER REFERENCES appointments(id),
  rescheduled_to INTEGER REFERENCES appointments(id),
  
  -- Clinical info
  chief_complaint TEXT,
  notes TEXT,
  special_instructions TEXT,
  
  -- Reminders
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMP,
  
  -- Billing
  estimated_cost DECIMAL(10, 2),
  actual_cost DECIMAL(10, 2),
  payment_status VARCHAR(50) DEFAULT 'pending',
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  
  -- Constraints
  CONSTRAINT valid_appointment_time CHECK (appointment_end_time > appointment_date),
  CONSTRAINT valid_duration CHECK (duration_minutes > 0 AND duration_minutes <= 480)
);

-- Doctor schedules
CREATE TABLE IF NOT EXISTS doctor_schedules (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
  break_duration_minutes INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  effective_from DATE,
  effective_until DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_slot_duration CHECK (slot_duration_minutes > 0 AND slot_duration_minutes <= 240),
  UNIQUE(doctor_id, day_of_week, start_time, effective_from)
);

-- Doctor time off
CREATE TABLE IF NOT EXISTS doctor_time_off (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  reason VARCHAR(100),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by INTEGER,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Appointment reminders
CREATE TABLE IF NOT EXISTS appointment_reminders (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  reminder_type VARCHAR(50) NOT NULL,
  scheduled_for TIMESTAMP NOT NULL,
  sent_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  delivery_status VARCHAR(100),
  error_message TEXT,
  patient_confirmed BOOLEAN DEFAULT FALSE,
  patient_response_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS appointments_number_idx ON appointments(appointment_number);
CREATE INDEX IF NOT EXISTS appointments_patient_id_idx ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS appointments_doctor_id_idx ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS appointments_date_idx ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS appointments_date_doctor_idx ON appointments(appointment_date, doctor_id);
CREATE INDEX IF NOT EXISTS appointments_status_idx ON appointments(status);
CREATE INDEX IF NOT EXISTS appointments_status_date_idx ON appointments(status, appointment_date);

CREATE INDEX IF NOT EXISTS doctor_schedules_doctor_id_idx ON doctor_schedules(doctor_id);
CREATE INDEX IF NOT EXISTS doctor_schedules_day_idx ON doctor_schedules(day_of_week);
CREATE INDEX IF NOT EXISTS doctor_schedules_doctor_day_idx ON doctor_schedules(doctor_id, day_of_week);

CREATE INDEX IF NOT EXISTS doctor_time_off_doctor_id_idx ON doctor_time_off(doctor_id);
CREATE INDEX IF NOT EXISTS doctor_time_off_date_range_idx ON doctor_time_off(start_date, end_date);

CREATE INDEX IF NOT EXISTS appointment_reminders_appointment_idx ON appointment_reminders(appointment_id);
CREATE INDEX IF NOT EXISTS appointment_reminders_pending_idx ON appointment_reminders(scheduled_for, status) 
  WHERE status = 'pending';
