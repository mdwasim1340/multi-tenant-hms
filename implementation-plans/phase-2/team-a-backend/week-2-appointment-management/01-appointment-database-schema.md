# Week 2: Appointment Management Database Schema

## 🎯 Objective
Create comprehensive appointment scheduling database schema with doctor availability management, conflict detection, and appointment workflow support.

## 📋 Prerequisites
- Patient database schema implemented (✅ Week 1)
- Users table with doctor roles available (✅ Phase 1)
- Custom fields system operational (✅ Phase 1)

## 🗃️ Database Schema Design

### Primary Appointments Table
```sql
-- Create in ALL tenant schemas
CREATE TABLE appointments (
  -- Primary identification
  id SERIAL PRIMARY KEY,
  appointment_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Relationships
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INTEGER NOT NULL, -- References public.users.id (validated at app level)
  
  -- Appointment details
  appointment_date TIMESTAMP NOT NULL,
  appointment_end_time TIMESTAMP NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  appointment_type VARCHAR(100), -- 'consultation', 'follow_up', 'emergency', 'procedure'
  
  -- Status workflow
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN (
    'scheduled',    -- Initial state
    'confirmed',    -- Patient confirmed
    'checked_in',   -- Patient arrived
    'in_progress',  -- Doctor with patient
    'completed',    -- Appointment finished
    'cancelled',    -- Cancelled by patient/staff
    'no_show',      -- Patient didn't show up
    'rescheduled'   -- Moved to different time
  )),
  
  -- Cancellation/rescheduling info
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP,
  cancelled_by INTEGER, -- References public.users.id
  rescheduled_from INTEGER, -- References appointments.id
  rescheduled_to INTEGER, -- References appointments.id
  
  -- Clinical information
  chief_complaint TEXT,
  notes TEXT,
  special_instructions TEXT,
  
  -- Reminder tracking
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMP,
  
  -- Billing information
  estimated_cost DECIMAL(10, 2),
  actual_cost DECIMAL(10, 2),
  payment_status VARCHAR(50) DEFAULT 'pending',
  
  -- Audit fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER, -- References public.users.id
  updated_by INTEGER, -- References public.users.id
  
  -- Constraints
  CONSTRAINT valid_appointment_time CHECK (appointment_end_time > appointment_date),
  CONSTRAINT valid_duration CHECK (duration_minutes > 0 AND duration_minutes <= 480)
);
```

### Doctor Availability Schedule
```sql
-- Create in ALL tenant schemas
-- Defines when doctors are available for appointments
CREATE TABLE doctor_schedules (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER NOT NULL, -- References public.users.id
  
  -- Schedule details
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Slot configuration
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
  break_duration_minutes INTEGER DEFAULT 0,
  
  -- Availability status
  is_available BOOLEAN DEFAULT TRUE,
  
  -- Date range (for temporary schedules)
  effective_from DATE,
  effective_until DATE,
  
  -- Audit fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_slot_duration CHECK (slot_duration_minutes > 0 AND slot_duration_minutes <= 240),
  UNIQUE(doctor_id, day_of_week, start_time, effective_from)
);
```

### Doctor Time Off / Exceptions
```sql
-- Create in ALL tenant schemas
-- Handles vacation, sick days, and other exceptions
CREATE TABLE doctor_time_off (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER NOT NULL, -- References public.users.id
  
  -- Time off details
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME, -- NULL means all day
  end_time TIME,   -- NULL means all day
  
  -- Reason
  reason VARCHAR(100), -- 'vacation', 'sick_leave', 'conference', 'emergency', 'other'
  notes TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Approval tracking
  approved_by INTEGER, -- References public.users.id
  approved_at TIMESTAMP,
  
  -- Audit fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT valid_time_range_if_specified CHECK (
    (start_time IS NULL AND end_time IS NULL) OR 
    (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
  )
);
```

### Appointment Reminders
```sql
-- Create in ALL tenant schemas
-- Track reminder notifications sent to patients
CREATE TABLE appointment_reminders (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  
  -- Reminder details
  reminder_type VARCHAR(50) NOT NULL, -- 'email', 'sms', 'push', 'call'
  scheduled_for TIMESTAMP NOT NULL,
  sent_at TIMESTAMP,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  
  -- Delivery tracking
  delivery_status VARCHAR(100),
  error_message TEXT,
  
  -- Patient response
  patient_confirmed BOOLEAN DEFAULT FALSE,
  patient_response_at TIMESTAMP,
  
  -- Audit fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Appointment History / Audit Log
```sql
-- Create in ALL tenant schemas
-- Track all changes to appointments for audit purposes
CREATE TABLE appointment_history (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  
  -- Change tracking
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'cancelled', 'rescheduled', 'status_changed'
  old_values JSONB,
  new_values JSONB,
  
  -- Change details
  changed_by INTEGER, -- References public.users.id
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  change_reason TEXT,
  
  -- System tracking
  ip_address VARCHAR(45),
  user_agent TEXT
);
```

### Appointment Conflicts Log
```sql
-- Create in ALL tenant schemas
-- Log potential scheduling conflicts for analysis
CREATE TABLE appointment_conflicts (
  id SERIAL PRIMARY KEY,
  
  -- Conflict details
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
  conflicting_appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  doctor_id INTEGER NOT NULL,
  conflict_date TIMESTAMP NOT NULL,
  
  -- Conflict type
  conflict_type VARCHAR(50) NOT NULL, -- 'double_booking', 'outside_schedule', 'time_off', 'overlap'
  conflict_description TEXT,
  
  -- Resolution
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  resolved_by INTEGER, -- References public.users.id
  resolution_notes TEXT,
  
  -- Audit fields
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔍 Indexes for Performance

### Appointment Indexes
```sql
-- Primary lookup indexes
CREATE INDEX appointments_appointment_number_idx ON appointments(appointment_number);
CREATE INDEX appointments_patient_id_idx ON appointments(patient_id);
CREATE INDEX appointments_doctor_id_idx ON appointments(doctor_id);

-- Date and time indexes
CREATE INDEX appointments_date_idx ON appointments(appointment_date);
CREATE INDEX appointments_date_doctor_idx ON appointments(appointment_date, doctor_id);
CREATE INDEX appointments_date_range_idx ON appointments(appointment_date, appointment_end_time);

-- Status indexes
CREATE INDEX appointments_status_idx ON appointments(status);
CREATE INDEX appointments_status_date_idx ON appointments(status, appointment_date);

-- Workflow indexes
CREATE INDEX appointments_reminder_pending_idx ON appointments(reminder_sent, appointment_date) 
  WHERE reminder_sent = FALSE AND status IN ('scheduled', 'confirmed');

-- Payment tracking
CREATE INDEX appointments_payment_status_idx ON appointments(payment_status) 
  WHERE payment_status != 'paid';

-- Audit indexes
CREATE INDEX appointments_created_at_idx ON appointments(created_at);
CREATE INDEX appointments_updated_at_idx ON appointments(updated_at);
```

### Doctor Schedule Indexes
```sql
-- Schedule lookup indexes
CREATE INDEX doctor_schedules_doctor_id_idx ON doctor_schedules(doctor_id);
CREATE INDEX doctor_schedules_day_idx ON doctor_schedules(day_of_week);
CREATE INDEX doctor_schedules_doctor_day_idx ON doctor_schedules(doctor_id, day_of_week);

-- Availability indexes
CREATE INDEX doctor_schedules_available_idx ON doctor_schedules(doctor_id, is_available) 
  WHERE is_available = TRUE;

-- Date range indexes
CREATE INDEX doctor_schedules_effective_range_idx ON doctor_schedules(effective_from, effective_until);
```

### Time Off Indexes
```sql
-- Time off lookup indexes
CREATE INDEX doctor_time_off_doctor_id_idx ON doctor_time_off(doctor_id);
CREATE INDEX doctor_time_off_date_range_idx ON doctor_time_off(start_date, end_date);
CREATE INDEX doctor_time_off_doctor_date_idx ON doctor_time_off(doctor_id, start_date, end_date);

-- Status indexes
CREATE INDEX doctor_time_off_status_idx ON doctor_time_off(status) 
  WHERE status = 'approved';
```

### Reminder Indexes
```sql
-- Reminder processing indexes
CREATE INDEX appointment_reminders_appointment_idx ON appointment_reminders(appointment_id);
CREATE INDEX appointment_reminders_pending_idx ON appointment_reminders(scheduled_for, status) 
  WHERE status = 'pending';
CREATE INDEX appointment_reminders_status_idx ON appointment_reminders(status);
```

## 🔧 Database Functions and Triggers

### Auto-generate Appointment Number
```sql
-- Function to generate unique appointment number
CREATE OR REPLACE FUNCTION generate_appointment_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.appointment_number IS NULL THEN
    NEW.appointment_number := 'APT' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || 
                              LPAD(nextval('appointment_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for appointment numbers
CREATE SEQUENCE IF NOT EXISTS appointment_number_seq;

-- Apply trigger
CREATE TRIGGER generate_appointment_number_trigger
  BEFORE INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION generate_appointment_number();
```

### Calculate Appointment End Time
```sql
-- Function to automatically calculate end time based on duration
CREATE OR REPLACE FUNCTION calculate_appointment_end_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.appointment_end_time IS NULL OR NEW.appointment_end_time <= NEW.appointment_date THEN
    NEW.appointment_end_time := NEW.appointment_date + (NEW.duration_minutes || ' minutes')::INTERVAL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
CREATE TRIGGER calculate_appointment_end_time_trigger
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION calculate_appointment_end_time();
```

### Appointment History Tracking
```sql
-- Function to log appointment changes
CREATE OR REPLACE FUNCTION log_appointment_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO appointment_history (appointment_id, action, new_values, changed_by)
    VALUES (NEW.id, 'created', row_to_json(NEW), NEW.created_by);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO appointment_history (appointment_id, action, old_values, new_values, changed_by)
    VALUES (NEW.id, 'updated', row_to_json(OLD), row_to_json(NEW), NEW.updated_by);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO appointment_history (appointment_id, action, old_values)
    VALUES (OLD.id, 'deleted', row_to_json(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
CREATE TRIGGER appointment_history_trigger
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION log_appointment_changes();
```

### Conflict Detection Function
```sql
-- Function to check for appointment conflicts
CREATE OR REPLACE FUNCTION check_appointment_conflicts(
  p_doctor_id INTEGER,
  p_appointment_date TIMESTAMP,
  p_appointment_end_time TIMESTAMP,
  p_exclude_appointment_id INTEGER DEFAULT NULL
)
RETURNS TABLE(
  conflict_type VARCHAR(50),
  conflict_description TEXT,
  conflicting_appointment_id INTEGER
) AS $$
BEGIN
  -- Check for overlapping appointments
  RETURN QUERY
  SELECT 
    'overlap'::VARCHAR(50) as conflict_type,
    'Overlaps with existing appointment'::TEXT as conflict_description,
    a.id as conflicting_appointment_id
  FROM appointments a
  WHERE a.doctor_id = p_doctor_id
    AND a.status NOT IN ('cancelled', 'no_show')
    AND (p_exclude_appointment_id IS NULL OR a.id != p_exclude_appointment_id)
    AND (
      (a.appointment_date, a.appointment_end_time) OVERLAPS 
      (p_appointment_date, p_appointment_end_time)
    );
  
  -- Check for time off
  RETURN QUERY
  SELECT 
    'time_off'::VARCHAR(50) as conflict_type,
    'Doctor has time off during this period: ' || t.reason as conflict_description,
    NULL::INTEGER as conflicting_appointment_id
  FROM doctor_time_off t
  WHERE t.doctor_id = p_doctor_id
    AND t.status = 'approved'
    AND (
      (t.start_time IS NULL AND t.end_time IS NULL AND 
       p_appointment_date::DATE BETWEEN t.start_date AND t.end_date)
      OR
      (t.start_time IS NOT NULL AND t.end_time IS NOT NULL AND
       p_appointment_date::DATE BETWEEN t.start_date AND t.end_date AND
       p_appointment_date::TIME BETWEEN t.start_time AND t.end_time)
    );
  
  -- Check if outside regular schedule
  RETURN QUERY
  SELECT 
    'outside_schedule'::VARCHAR(50) as conflict_type,
    'Appointment is outside doctor regular schedule'::TEXT as conflict_description,
    NULL::INTEGER as conflicting_appointment_id
  WHERE NOT EXISTS (
    SELECT 1 FROM doctor_schedules s
    WHERE s.doctor_id = p_doctor_id
      AND s.is_available = TRUE
      AND s.day_of_week = EXTRACT(DOW FROM p_appointment_date)
      AND p_appointment_date::TIME >= s.start_time
      AND p_appointment_end_time::TIME <= s.end_time
      AND (s.effective_from IS NULL OR p_appointment_date::DATE >= s.effective_from)
      AND (s.effective_until IS NULL OR p_appointment_date::DATE <= s.effective_until)
  );
END;
$$ LANGUAGE plpgsql;
```

## 🧪 Sample Data and Testing

### Sample Doctor Schedules
```sql
-- Set to specific tenant schema for testing
SET search_path TO "demo_hospital_001";

-- Sample doctor schedule (Monday-Friday, 9 AM - 5 PM)
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes)
VALUES 
  (1, 1, '09:00', '17:00', 30), -- Monday
  (1, 2, '09:00', '17:00', 30), -- Tuesday
  (1, 3, '09:00', '17:00', 30), -- Wednesday
  (1, 4, '09:00', '17:00', 30), -- Thursday
  (1, 5, '09:00', '17:00', 30); -- Friday

-- Sample time off
INSERT INTO doctor_time_off (doctor_id, start_date, end_date, reason, status)
VALUES 
  (1, '2025-12-24', '2025-12-26', 'vacation', 'approved');
```

### Sample Appointments
```sql
-- Sample appointments
INSERT INTO appointments (
  patient_id, doctor_id, appointment_date, duration_minutes,
  appointment_type, status, chief_complaint, created_by
) VALUES 
(
  1, 1, '2025-11-10 10:00:00', 30,
  'consultation', 'scheduled', 'Annual checkup', 1
),
(
  2, 1, '2025-11-10 10:30:00', 30,
  'follow_up', 'scheduled', 'Follow-up on blood test results', 1
),
(
  3, 1, '2025-11-10 14:00:00', 60,
  'procedure', 'scheduled', 'Minor procedure', 1
);

-- Verify appointments
SELECT 
  a.appointment_number,
  p.first_name || ' ' || p.last_name as patient_name,
  a.appointment_date,
  a.duration_minutes,
  a.status
FROM appointments a
JOIN patients p ON p.id = a.patient_id
ORDER BY a.appointment_date;
```

### Test Conflict Detection
```sql
-- Test conflict detection function
SELECT * FROM check_appointment_conflicts(
  1,                              -- doctor_id
  '2025-11-10 10:15:00',         -- appointment_date (overlaps with existing)
  '2025-11-10 10:45:00',         -- appointment_end_time
  NULL                            -- exclude_appointment_id
);

-- Should return conflict with existing appointment at 10:00
```

## 📊 Performance Testing Queries

### Query Performance Tests
```sql
-- Test 1: Get doctor's appointments for a day (should be <50ms)
EXPLAIN ANALYZE
SELECT * FROM appointments 
WHERE doctor_id = 1 
  AND appointment_date::DATE = '2025-11-10'
  AND status NOT IN ('cancelled', 'no_show')
ORDER BY appointment_date;

-- Test 2: Find available time slots (should be <100ms)
EXPLAIN ANALYZE
SELECT 
  s.start_time,
  s.end_time,
  s.slot_duration_minutes
FROM doctor_schedules s
WHERE s.doctor_id = 1
  AND s.day_of_week = 1 -- Monday
  AND s.is_available = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM doctor_time_off t
    WHERE t.doctor_id = s.doctor_id
      AND t.status = 'approved'
      AND '2025-11-10'::DATE BETWEEN t.start_date AND t.end_date
  );

-- Test 3: Get patient's appointment history (should be <100ms)
EXPLAIN ANALYZE
SELECT 
  a.appointment_number,
  a.appointment_date,
  a.status,
  a.appointment_type
FROM appointments a
WHERE a.patient_id = 1
ORDER BY a.appointment_date DESC
LIMIT 20;

-- Test 4: Find pending reminders (should be <50ms)
EXPLAIN ANALYZE
SELECT 
  r.id,
  r.appointment_id,
  a.appointment_date,
  p.first_name,
  p.email
FROM appointment_reminders r
JOIN appointments a ON a.id = r.appointment_id
JOIN patients p ON p.id = a.patient_id
WHERE r.status = 'pending'
  AND r.scheduled_for <= NOW() + INTERVAL '5 minutes'
ORDER BY r.scheduled_for
LIMIT 100;
```

## ✅ Implementation Checklist

### Database Schema Creation
- [ ] Create appointments table with all fields and constraints
- [ ] Create doctor_schedules table for availability management
- [ ] Create doctor_time_off table for exceptions
- [ ] Create appointment_reminders table for notifications
- [ ] Create appointment_history table for audit logging
- [ ] Create appointment_conflicts table for conflict tracking
- [ ] Apply schema to all 6 tenant schemas

### Index Creation
- [ ] Create appointment lookup indexes (number, patient, doctor)
- [ ] Create date and time range indexes
- [ ] Create status and workflow indexes
- [ ] Create doctor schedule indexes
- [ ] Create time off indexes
- [ ] Create reminder processing indexes

### Functions and Triggers
- [ ] Implement appointment number auto-generation
- [ ] Implement end time calculation trigger
- [ ] Implement appointment history tracking
- [ ] Implement conflict detection function
- [ ] Test all triggers with sample data

### Performance Testing
- [ ] Test appointment queries (<50ms)
- [ ] Test availability checking (<100ms)
- [ ] Test conflict detection (<100ms)
- [ ] Test reminder processing (<50ms)
- [ ] Optimize slow queries with additional indexes

### Sample Data & Testing
- [ ] Create sample doctor schedules
- [ ] Create sample time off records
- [ ] Create sample appointments
- [ ] Test conflict detection scenarios
- [ ] Verify appointment workflow transitions

## 🎯 Success Criteria

### Performance Benchmarks
- Appointment lookup by number: <10ms
- Doctor's daily schedule: <50ms
- Availability checking: <100ms
- Conflict detection: <100ms
- Reminder processing: <50ms per batch of 100

### Data Integrity
- All foreign key constraints working
- Appointment status transitions validated
- Conflict detection preventing double bookings
- Audit logging capturing all changes
- Time calculations accurate

### Multi-Tenant Isolation
- Tables created in all 6 tenant schemas
- No cross-tenant appointment access
- Doctor schedules isolated per tenant
- Performance consistent across tenants

This appointment management schema provides a robust foundation for hospital scheduling operations with conflict detection, availability management, and comprehensive audit tracking.