-- Enhanced Bed Management System Schema
-- Comprehensive bed management with real-time operations, audit trail, and analytics

-- Create bed_assignments table for patient assignments
CREATE TABLE IF NOT EXISTS bed_assignments (
    id SERIAL PRIMARY KEY,
    bed_id INTEGER NOT NULL,
    patient_id INTEGER,
    patient_name VARCHAR(255) NOT NULL,
    patient_mrn VARCHAR(100),
    patient_age INTEGER,
    patient_gender VARCHAR(20),
    admission_date TIMESTAMP NOT NULL,
    expected_discharge_date TIMESTAMP,
    actual_discharge_date TIMESTAMP,
    condition VARCHAR(50) DEFAULT 'Stable',
    assigned_doctor VARCHAR(255),
    assigned_nurse VARCHAR(255),
    admission_reason TEXT,
    allergies TEXT,
    current_medications TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bed_transfers table for patient transfers
CREATE TABLE IF NOT EXISTS bed_transfers (
    id SERIAL PRIMARY KEY,
    from_bed_id INTEGER NOT NULL,
    to_bed_id INTEGER NOT NULL,
    patient_id INTEGER,
    patient_name VARCHAR(255),
    reason VARCHAR(255) NOT NULL,
    priority VARCHAR(50) DEFAULT 'Medium',
    scheduled_time TIMESTAMP,
    executed_at TIMESTAMP,
    completed_at TIMESTAMP,
    notes TEXT,
    new_doctor VARCHAR(255),
    new_nurse VARCHAR(255),
    transport_method VARCHAR(100),
    equipment_needed TEXT,
    status VARCHAR(50) DEFAULT 'scheduled',
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bed_maintenance table for maintenance scheduling
CREATE TABLE IF NOT EXISTS bed_maintenance (
    id SERIAL PRIMARY KEY,
    bed_id INTEGER NOT NULL,
    maintenance_type VARCHAR(100) NOT NULL,
    priority VARCHAR(50) DEFAULT 'Medium',
    description TEXT NOT NULL,
    estimated_duration INTEGER, -- in minutes
    scheduled_time TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    assigned_technician VARCHAR(255),
    equipment_needed TEXT,
    safety_precautions TEXT,
    requires_patient_relocation BOOLEAN DEFAULT FALSE,
    cost_estimate DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    vendor_name VARCHAR(255),
    warranty_work BOOLEAN DEFAULT FALSE,
    preventive_maintenance BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'scheduled',
    completion_notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bed_reservations table for bed reservations
CREATE TABLE IF NOT EXISTS bed_reservations (
    id SERIAL PRIMARY KEY,
    bed_id INTEGER NOT NULL,
    patient_name VARCHAR(255),
    patient_mrn VARCHAR(100),
    reservation_type VARCHAR(100) NOT NULL,
    priority VARCHAR(50) DEFAULT 'Medium',
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    expected_admission_time TIMESTAMP,
    reserving_doctor VARCHAR(255),
    department VARCHAR(100),
    reason TEXT NOT NULL,
    special_requirements TEXT,
    contact_person VARCHAR(255),
    contact_phone VARCHAR(50),
    auto_release BOOLEAN DEFAULT TRUE,
    release_buffer_hours INTEGER DEFAULT 2,
    requires_preparation BOOLEAN DEFAULT FALSE,
    preparation_instructions TEXT,
    insurance_verified BOOLEAN DEFAULT FALSE,
    pre_auth_required BOOLEAN DEFAULT FALSE,
    pre_auth_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bed_activity_log table for comprehensive audit trail
CREATE TABLE IF NOT EXISTS bed_activity_log (
    id SERIAL PRIMARY KEY,
    bed_id INTEGER NOT NULL,
    event_type VARCHAR(100) NOT NULL, -- admission, discharge, transfer_in, transfer_out, maintenance_start, maintenance_end, cleaning, status_change, reservation
    patient_name VARCHAR(255),
    patient_mrn VARCHAR(100),
    staff_member VARCHAR(255),
    staff_role VARCHAR(100),
    from_bed VARCHAR(50),
    to_bed VARCHAR(50),
    notes TEXT,
    duration_minutes INTEGER,
    additional_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bed_equipment table for equipment tracking
CREATE TABLE IF NOT EXISTS bed_equipment (
    id SERIAL PRIMARY KEY,
    bed_id INTEGER NOT NULL,
    equipment_name VARCHAR(255) NOT NULL,
    equipment_type VARCHAR(100),
    serial_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    last_maintenance TIMESTAMP,
    next_maintenance TIMESTAMP,
    warranty_expiry TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bed_cleaning_log table for cleaning tracking
CREATE TABLE IF NOT EXISTS bed_cleaning_log (
    id SERIAL PRIMARY KEY,
    bed_id INTEGER NOT NULL,
    cleaning_type VARCHAR(100) NOT NULL, -- terminal, routine, deep, isolation
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    staff_member VARCHAR(255),
    cleaning_products_used TEXT,
    disinfection_level VARCHAR(50),
    inspection_passed BOOLEAN,
    inspector_name VARCHAR(255),
    notes TEXT,
    duration_minutes INTEGER,
    status VARCHAR(50) DEFAULT 'in_progress',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bed_occupancy_history table for analytics
CREATE TABLE IF NOT EXISTS bed_occupancy_history (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    hour INTEGER, -- 0-23 for hourly tracking
    department_id INTEGER,
    bed_type VARCHAR(100),
    total_beds INTEGER NOT NULL,
    occupied_beds INTEGER NOT NULL,
    available_beds INTEGER NOT NULL,
    maintenance_beds INTEGER DEFAULT 0,
    cleaning_beds INTEGER DEFAULT 0,
    reserved_beds INTEGER DEFAULT 0,
    blocked_beds INTEGER DEFAULT 0,
    occupancy_rate DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bed_assignments_bed_id ON bed_assignments(bed_id);
CREATE INDEX IF NOT EXISTS idx_bed_assignments_status ON bed_assignments(status);
CREATE INDEX IF NOT EXISTS idx_bed_assignments_patient_mrn ON bed_assignments(patient_mrn);
CREATE INDEX IF NOT EXISTS idx_bed_assignments_admission_date ON bed_assignments(admission_date);

CREATE INDEX IF NOT EXISTS idx_bed_transfers_from_bed ON bed_transfers(from_bed_id);
CREATE INDEX IF NOT EXISTS idx_bed_transfers_to_bed ON bed_transfers(to_bed_id);
CREATE INDEX IF NOT EXISTS idx_bed_transfers_status ON bed_transfers(status);
CREATE INDEX IF NOT EXISTS idx_bed_transfers_scheduled_time ON bed_transfers(scheduled_time);

CREATE INDEX IF NOT EXISTS idx_bed_maintenance_bed_id ON bed_maintenance(bed_id);
CREATE INDEX IF NOT EXISTS idx_bed_maintenance_status ON bed_maintenance(status);
CREATE INDEX IF NOT EXISTS idx_bed_maintenance_scheduled_time ON bed_maintenance(scheduled_time);

CREATE INDEX IF NOT EXISTS idx_bed_reservations_bed_id ON bed_reservations(bed_id);
CREATE INDEX IF NOT EXISTS idx_bed_reservations_status ON bed_reservations(status);
CREATE INDEX IF NOT EXISTS idx_bed_reservations_start_time ON bed_reservations(start_time);

CREATE INDEX IF NOT EXISTS idx_bed_activity_log_bed_id ON bed_activity_log(bed_id);
CREATE INDEX IF NOT EXISTS idx_bed_activity_log_event_type ON bed_activity_log(event_type);
CREATE INDEX IF NOT EXISTS idx_bed_activity_log_created_at ON bed_activity_log(created_at);

CREATE INDEX IF NOT EXISTS idx_bed_equipment_bed_id ON bed_equipment(bed_id);
CREATE INDEX IF NOT EXISTS idx_bed_equipment_status ON bed_equipment(status);

CREATE INDEX IF NOT EXISTS idx_bed_cleaning_log_bed_id ON bed_cleaning_log(bed_id);
CREATE INDEX IF NOT EXISTS idx_bed_cleaning_log_status ON bed_cleaning_log(status);

CREATE INDEX IF NOT EXISTS idx_bed_occupancy_history_date ON bed_occupancy_history(date);
CREATE INDEX IF NOT EXISTS idx_bed_occupancy_history_department ON bed_occupancy_history(department_id);

-- Add foreign key constraints (assuming beds and departments tables exist)
-- Note: These will be added only if the referenced tables exist

-- Add triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to relevant tables
DROP TRIGGER IF EXISTS update_bed_assignments_updated_at ON bed_assignments;
CREATE TRIGGER update_bed_assignments_updated_at 
    BEFORE UPDATE ON bed_assignments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bed_transfers_updated_at ON bed_transfers;
CREATE TRIGGER update_bed_transfers_updated_at 
    BEFORE UPDATE ON bed_transfers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bed_maintenance_updated_at ON bed_maintenance;
CREATE TRIGGER update_bed_maintenance_updated_at 
    BEFORE UPDATE ON bed_maintenance 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bed_reservations_updated_at ON bed_reservations;
CREATE TRIGGER update_bed_reservations_updated_at 
    BEFORE UPDATE ON bed_reservations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bed_equipment_updated_at ON bed_equipment;
CREATE TRIGGER update_bed_equipment_updated_at 
    BEFORE UPDATE ON bed_equipment 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically log bed status changes
CREATE OR REPLACE FUNCTION log_bed_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO bed_activity_log (
            bed_id, 
            event_type, 
            notes, 
            additional_data,
            created_at
        ) VALUES (
            NEW.id,
            'status_change',
            CONCAT('Status changed from ', COALESCE(OLD.status, 'NULL'), ' to ', NEW.status),
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'changed_by', 'system'
            ),
            CURRENT_TIMESTAMP
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply bed status change trigger (assuming beds table exists)
-- This will be applied when the beds table is available
-- DROP TRIGGER IF EXISTS log_bed_status_change_trigger ON beds;
-- CREATE TRIGGER log_bed_status_change_trigger 
--     AFTER UPDATE ON beds 
--     FOR EACH ROW EXECUTE FUNCTION log_bed_status_change();

-- Insert sample data for testing (optional)
-- This can be uncommented for development/testing purposes

/*
-- Sample bed assignments
INSERT INTO bed_assignments (
    bed_id, patient_name, patient_mrn, patient_age, patient_gender,
    admission_date, condition, assigned_doctor, assigned_nurse,
    admission_reason, status
) VALUES 
(1, 'John Smith', 'MRN-001234', 45, 'Male', '2025-11-20 10:30:00', 'Stable', 'Dr. Wilson', 'Nurse Johnson', 'Chest pain evaluation', 'active'),
(2, 'Maria Garcia', 'MRN-001235', 32, 'Female', '2025-11-21 14:15:00', 'Fair', 'Dr. Brown', 'Nurse Davis', 'Post-operative care', 'active'),
(3, 'Robert Johnson', 'MRN-001236', 67, 'Male', '2025-11-22 08:45:00', 'Critical', 'Dr. Anderson', 'Nurse Smith', 'Cardiac monitoring', 'active');

-- Sample maintenance records
INSERT INTO bed_maintenance (
    bed_id, maintenance_type, priority, description,
    estimated_duration, assigned_technician, status
) VALUES 
(4, 'Equipment Repair', 'High', 'Bed frame side rail mechanism repair', 120, 'Tech Support Team', 'scheduled'),
(5, 'Preventive Maintenance', 'Low', 'Quarterly safety inspection and calibration', 60, 'Biomedical Engineering', 'scheduled');

-- Sample activity log entries
INSERT INTO bed_activity_log (
    bed_id, event_type, patient_name, staff_member, notes
) VALUES 
(1, 'admission', 'John Smith', 'Nurse Johnson', 'Patient admitted from Emergency Department'),
(2, 'admission', 'Maria Garcia', 'Nurse Davis', 'Post-operative admission from Recovery'),
(3, 'transfer_in', 'Robert Johnson', 'Nurse Smith', 'Transfer from ICU for step-down care'),
(4, 'maintenance_start', NULL, 'Tech Support', 'Started bed frame repair'),
(5, 'cleaning', NULL, 'Housekeeping', 'Terminal cleaning completed');
*/

-- Add comments for documentation
COMMENT ON TABLE bed_assignments IS 'Patient assignments to beds with comprehensive patient information';
COMMENT ON TABLE bed_transfers IS 'Patient transfer records between beds with scheduling and tracking';
COMMENT ON TABLE bed_maintenance IS 'Bed maintenance scheduling and tracking with cost management';
COMMENT ON TABLE bed_reservations IS 'Bed reservations for scheduled admissions and procedures';
COMMENT ON TABLE bed_activity_log IS 'Comprehensive audit trail of all bed-related activities';
COMMENT ON TABLE bed_equipment IS 'Equipment associated with beds and maintenance tracking';
COMMENT ON TABLE bed_cleaning_log IS 'Detailed cleaning and disinfection tracking';
COMMENT ON TABLE bed_occupancy_history IS 'Historical occupancy data for analytics and reporting';

-- Grant permissions (adjust as needed for your user roles)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO hospital_staff;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO hospital_readonly;