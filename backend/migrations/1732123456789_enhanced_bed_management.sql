-- Enhanced Bed Management Migration
-- Creates tables for transfers, discharges, and bed history

-- Bed transfers table
CREATE TABLE IF NOT EXISTS bed_transfers (
    id SERIAL PRIMARY KEY,
    from_bed_id INTEGER NOT NULL,
    to_bed_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('Urgent', 'High', 'Medium', 'Low')),
    scheduled_time TIMESTAMP,
    executed_time TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Cancelled')),
    notes TEXT,
    performed_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patient discharges table
CREATE TABLE IF NOT EXISTS patient_discharges (
    id SERIAL PRIMARY KEY,
    bed_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    discharge_date TIMESTAMP NOT NULL,
    discharge_type VARCHAR(50) NOT NULL CHECK (discharge_type IN ('Recovered', 'Transferred to another facility', 'AMA', 'Deceased')),
    discharge_summary TEXT NOT NULL,
    final_bill_status VARCHAR(20) NOT NULL CHECK (final_bill_status IN ('Paid', 'Pending', 'Insurance Claim')),
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    follow_up_instructions TEXT,
    medications JSONB,
    home_care_instructions TEXT,
    transport_arrangement VARCHAR(100) NOT NULL,
    performed_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bed history table for tracking all bed events
CREATE TABLE IF NOT EXISTS bed_history (
    id SERIAL PRIMARY KEY,
    bed_id INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('Admission', 'Discharge', 'Transfer In', 'Transfer Out', 'Maintenance Start', 'Maintenance End', 'Cleaning')),
    patient_id INTEGER,
    performed_by INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bed assignments table for tracking patient-bed relationships
CREATE TABLE IF NOT EXISTS bed_assignments (
    id SERIAL PRIMARY KEY,
    bed_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    assigned_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    discharge_date TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Discharged', 'Transferred')),
    assigned_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Housekeeping tasks table
CREATE TABLE IF NOT EXISTS housekeeping_tasks (
    id SERIAL PRIMARY KEY,
    bed_id INTEGER NOT NULL,
    task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('Routine Cleaning', 'Deep Cleaning', 'Maintenance', 'Sanitization')),
    priority VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),
    assigned_to INTEGER,
    notes TEXT,
    scheduled_time TIMESTAMP,
    completed_time TIMESTAMP,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Follow-up appointments table
CREATE TABLE IF NOT EXISTS follow_up_appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL,
    scheduled_date DATE NOT NULL,
    instructions TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled', 'No Show')),
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bed_transfers_from_bed ON bed_transfers(from_bed_id);
CREATE INDEX IF NOT EXISTS idx_bed_transfers_to_bed ON bed_transfers(to_bed_id);
CREATE INDEX IF NOT EXISTS idx_bed_transfers_patient ON bed_transfers(patient_id);
CREATE INDEX IF NOT EXISTS idx_bed_transfers_status ON bed_transfers(status);
CREATE INDEX IF NOT EXISTS idx_bed_transfers_scheduled_time ON bed_transfers(scheduled_time);

CREATE INDEX IF NOT EXISTS idx_patient_discharges_bed ON patient_discharges(bed_id);
CREATE INDEX IF NOT EXISTS idx_patient_discharges_patient ON patient_discharges(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_discharges_date ON patient_discharges(discharge_date);
CREATE INDEX IF NOT EXISTS idx_patient_discharges_type ON patient_discharges(discharge_type);

CREATE INDEX IF NOT EXISTS idx_bed_history_bed ON bed_history(bed_id);
CREATE INDEX IF NOT EXISTS idx_bed_history_patient ON bed_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_bed_history_event_type ON bed_history(event_type);
CREATE INDEX IF NOT EXISTS idx_bed_history_created_at ON bed_history(created_at);

CREATE INDEX IF NOT EXISTS idx_bed_assignments_bed ON bed_assignments(bed_id);
CREATE INDEX IF NOT EXISTS idx_bed_assignments_patient ON bed_assignments(patient_id);
CREATE INDEX IF NOT EXISTS idx_bed_assignments_status ON bed_assignments(status);
CREATE INDEX IF NOT EXISTS idx_bed_assignments_assigned_date ON bed_assignments(assigned_date);

CREATE INDEX IF NOT EXISTS idx_housekeeping_tasks_bed ON housekeeping_tasks(bed_id);
CREATE INDEX IF NOT EXISTS idx_housekeeping_tasks_status ON housekeeping_tasks(status);
CREATE INDEX IF NOT EXISTS idx_housekeeping_tasks_assigned_to ON housekeeping_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_housekeeping_tasks_scheduled_time ON housekeeping_tasks(scheduled_time);

CREATE INDEX IF NOT EXISTS idx_follow_up_appointments_patient ON follow_up_appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_appointments_scheduled_date ON follow_up_appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_follow_up_appointments_status ON follow_up_appointments(status);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bed_transfers_updated_at BEFORE UPDATE ON bed_transfers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patient_discharges_updated_at BEFORE UPDATE ON patient_discharges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bed_assignments_updated_at BEFORE UPDATE ON bed_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_housekeeping_tasks_updated_at BEFORE UPDATE ON housekeeping_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_follow_up_appointments_updated_at BEFORE UPDATE ON follow_up_appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();