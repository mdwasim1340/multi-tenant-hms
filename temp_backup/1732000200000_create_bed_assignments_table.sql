-- Create bed_assignments table to track patient-bed relationships
CREATE TABLE IF NOT EXISTS bed_assignments (
  id SERIAL PRIMARY KEY,
  bed_id INTEGER NOT NULL REFERENCES beds(id) ON DELETE CASCADE,
  patient_id INTEGER NOT NULL,
  admission_date TIMESTAMP NOT NULL,
  discharge_date TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  reason_for_assignment TEXT,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS bed_assignments_bed_id_idx ON bed_assignments(bed_id);
CREATE INDEX IF NOT EXISTS bed_assignments_patient_id_idx ON bed_assignments(patient_id);
CREATE INDEX IF NOT EXISTS bed_assignments_status_idx ON bed_assignments(status);
CREATE INDEX IF NOT EXISTS bed_assignments_admission_date_idx ON bed_assignments(admission_date);
CREATE INDEX IF NOT EXISTS bed_assignments_discharge_date_idx ON bed_assignments(discharge_date);

-- Create EXCLUDE constraint to prevent double-booking (overlapping assignments on same bed)
-- This ensures a bed cannot have two active assignments at the same time
CREATE UNIQUE INDEX IF NOT EXISTS bed_assignments_no_overlap 
ON bed_assignments (bed_id) 
WHERE status = 'active' AND discharge_date IS NULL;
