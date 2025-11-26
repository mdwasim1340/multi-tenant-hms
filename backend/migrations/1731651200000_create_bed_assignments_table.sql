-- Migration: Create bed_assignments table
-- Purpose: Track patient-bed relationships and history
-- Multi-tenant: Yes (tenant-specific schemas)

-- Create bed_assignments table
CREATE TABLE IF NOT EXISTS bed_assignments (
    id SERIAL PRIMARY KEY,
    bed_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'discharged', 'transferred')),
    
    -- Assignment dates
    admission_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expected_discharge_date DATE,
    actual_discharge_date TIMESTAMP WITH TIME ZONE,
    
    -- Discharge information
    discharge_reason VARCHAR(255),
    discharge_notes TEXT,
    discharge_type VARCHAR(50) CHECK (discharge_type IN ('normal', 'transfer', 'death', 'ama', 'absconded')),
    
    -- Clinical information
    admission_diagnosis TEXT,
    admission_notes TEXT,
    priority VARCHAR(20) CHECK (priority IN ('routine', 'urgent', 'emergency')),
    
    -- Additional information
    assigned_doctor_id INTEGER,
    assigned_nurse_id INTEGER,
    special_requirements TEXT,
    
    -- Audit fields
    created_by INTEGER,
    updated_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_bed_assignments_bed FOREIGN KEY (bed_id) REFERENCES beds(id) ON DELETE RESTRICT,
    CONSTRAINT fk_bed_assignments_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT
);

-- Note: EXCLUDE constraint for preventing double-booking is handled at application level
-- Application logic in BedAssignmentService ensures only one active assignment per bed at any time
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Create indexes for performance
CREATE INDEX idx_bed_assignments_bed ON bed_assignments(bed_id);
CREATE INDEX idx_bed_assignments_patient ON bed_assignments(patient_id);
CREATE INDEX idx_bed_assignments_status ON bed_assignments(status);
CREATE INDEX idx_bed_assignments_admission_date ON bed_assignments(admission_date DESC);
CREATE INDEX idx_bed_assignments_discharge_date ON bed_assignments(actual_discharge_date DESC);
CREATE INDEX idx_bed_assignments_doctor ON bed_assignments(assigned_doctor_id);
CREATE INDEX idx_bed_assignments_nurse ON bed_assignments(assigned_nurse_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_bed_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bed_assignments_updated_at_trigger
    BEFORE UPDATE ON bed_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_bed_assignments_updated_at();

-- Add trigger to update bed status when assignment is created
CREATE OR REPLACE FUNCTION update_bed_status_on_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'active' THEN
        UPDATE beds SET status = 'occupied' WHERE id = NEW.bed_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bed_assignments_update_bed_status_trigger
    AFTER INSERT ON bed_assignments
    FOR EACH ROW
    WHEN (NEW.status = 'active')
    EXECUTE FUNCTION update_bed_status_on_assignment();

-- Add trigger to update bed status when assignment is discharged
CREATE OR REPLACE FUNCTION update_bed_status_on_discharge()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('discharged', 'transferred') AND OLD.status = 'active' THEN
        UPDATE beds SET status = 'available' WHERE id = NEW.bed_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bed_assignments_update_bed_status_discharge_trigger
    AFTER UPDATE ON bed_assignments
    FOR EACH ROW
    WHEN (NEW.status IN ('discharged', 'transferred') AND OLD.status = 'active')
    EXECUTE FUNCTION update_bed_status_on_discharge();

-- Add comments
COMMENT ON TABLE bed_assignments IS 'Patient-bed assignment tracking and history';
COMMENT ON COLUMN bed_assignments.status IS 'Assignment status: active, discharged, transferred';
COMMENT ON COLUMN bed_assignments.discharge_type IS 'Type of discharge: normal, transfer, death, AMA (Against Medical Advice), absconded';
