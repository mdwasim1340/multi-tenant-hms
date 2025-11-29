-- Create bed_transfers table to log transfer activities
CREATE TABLE IF NOT EXISTS bed_transfers (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL,
  from_bed_id INTEGER NOT NULL REFERENCES beds(id) ON DELETE CASCADE,
  to_bed_id INTEGER NOT NULL REFERENCES beds(id) ON DELETE CASCADE,
  from_department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  to_department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  transfer_date TIMESTAMP NOT NULL,
  completion_date TIMESTAMP,
  reason TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS bed_transfers_patient_id_idx ON bed_transfers(patient_id);
CREATE INDEX IF NOT EXISTS bed_transfers_from_bed_id_idx ON bed_transfers(from_bed_id);
CREATE INDEX IF NOT EXISTS bed_transfers_to_bed_id_idx ON bed_transfers(to_bed_id);
CREATE INDEX IF NOT EXISTS bed_transfers_status_idx ON bed_transfers(status);
CREATE INDEX IF NOT EXISTS bed_transfers_transfer_date_idx ON bed_transfers(transfer_date);
CREATE INDEX IF NOT EXISTS bed_transfers_from_department_id_idx ON bed_transfers(from_department_id);
CREATE INDEX IF NOT EXISTS bed_transfers_to_department_id_idx ON bed_transfers(to_department_id);
