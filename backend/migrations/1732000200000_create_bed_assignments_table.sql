-- Migration: Create bed_assignments table
-- Description: Track patient-bed assignments
-- Date: 2025-11-18

CREATE TABLE IF NOT EXISTS bed_assignments (
  id SERIAL PRIMARY KEY,
  bed_id INTEGER NOT NULL REFERENCES beds(id) ON DELETE RESTRICT,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  admission_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  discharge_date TIMESTAMP,
  expected_discharge_date DATE,
  admission_type VARCHAR(50) NOT NULL CHECK (admission_type IN ('emergency', 'scheduled', 'transfer')),
  admission_reason TEXT,
  patient_condition VARCHAR(50) CHECK (patient_condition IN ('stable', 'critical', 'moderate', 'serious')),
  assigned_nurse_id INTEGER, -- References public.users.id
  assigned_doctor_id INTEGER, -- References public.users.id
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'discharged', 'transferred')),
  discharge_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  
  -- Constraint: Only one active assignment per bed
  CONSTRAINT unique_active_bed_assignment UNIQUE (bed_id, status) 
    DEFERRABLE INITIALLY DEFERRED
);

-- Remove the EXCLUDE constraint and use a unique partial index instead
CREATE UNIQUE INDEX IF NOT EXISTS idx_bed_assignments_active_bed 
  ON bed_assignments(bed_id) 
  WHERE status = 'active';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bed_assignments_bed ON bed_assignments(bed_id);
CREATE INDEX IF NOT EXISTS idx_bed_assignments_patient ON bed_assignments(patient_id);
CREATE INDEX IF NOT EXISTS idx_bed_assignments_status ON bed_assignments(status);
CREATE INDEX IF NOT EXISTS idx_bed_assignments_admission_date ON bed_assignments(admission_date);
CREATE INDEX IF NOT EXISTS idx_bed_assignments_discharge_date ON bed_assignments(discharge_date);
CREATE INDEX IF NOT EXISTS idx_bed_assignments_nurse ON bed_assignments(assigned_nurse_id);
CREATE INDEX IF NOT EXISTS idx_bed_assignments_doctor ON bed_assignments(assigned_doctor_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bed_assignments_patient_status ON bed_assignments(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_bed_assignments_bed_status ON bed_assignments(bed_id, status);

-- Trigger to update updated_at timestamp
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

-- Trigger to update bed status when assignment is created/updated
CREATE OR REPLACE FUNCTION update_bed_status_on_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    -- Mark bed as occupied when new active assignment is created
    UPDATE beds SET status = 'occupied', updated_at = CURRENT_TIMESTAMP WHERE id = NEW.bed_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'active' AND NEW.status IN ('discharged', 'transferred') THEN
      -- Mark bed as available when assignment ends
      UPDATE beds SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = NEW.bed_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bed_assignments_update_bed_status_trigger
  AFTER INSERT OR UPDATE ON bed_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_bed_status_on_assignment();

-- Comments
COMMENT ON TABLE bed_assignments IS 'Patient assignments to beds with admission/discharge tracking';
COMMENT ON COLUMN bed_assignments.admission_type IS 'Type of admission: emergency, scheduled, transfer';
COMMENT ON COLUMN bed_assignments.patient_condition IS 'Patient condition: stable, critical, moderate, serious';
COMMENT ON COLUMN bed_assignments.status IS 'Assignment status: active, discharged, transferred';
COMMENT ON CONSTRAINT unique_active_bed_assignment ON bed_assignments IS 'Ensures only one active assignment per bed';
