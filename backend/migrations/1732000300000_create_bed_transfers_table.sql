-- Migration: Create bed_transfers table
-- Description: Track patient transfers between beds
-- Date: 2025-11-18

CREATE TABLE IF NOT EXISTS bed_transfers (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  from_bed_id INTEGER NOT NULL REFERENCES beds(id) ON DELETE RESTRICT,
  to_bed_id INTEGER NOT NULL REFERENCES beds(id) ON DELETE RESTRICT,
  from_department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  to_department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  transfer_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  transfer_reason TEXT NOT NULL,
  transfer_type VARCHAR(50) CHECK (transfer_type IN ('routine', 'emergency', 'medical_necessity', 'patient_request')),
  requested_by INTEGER, -- References public.users.id
  approved_by INTEGER, -- References public.users.id
  completed_by INTEGER, -- References public.users.id
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  completion_date TIMESTAMP,
  cancellation_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraint: from and to beds must be different
  CONSTRAINT different_beds CHECK (from_bed_id != to_bed_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bed_transfers_patient ON bed_transfers(patient_id);
CREATE INDEX IF NOT EXISTS idx_bed_transfers_from_bed ON bed_transfers(from_bed_id);
CREATE INDEX IF NOT EXISTS idx_bed_transfers_to_bed ON bed_transfers(to_bed_id);
CREATE INDEX IF NOT EXISTS idx_bed_transfers_from_dept ON bed_transfers(from_department_id);
CREATE INDEX IF NOT EXISTS idx_bed_transfers_to_dept ON bed_transfers(to_department_id);
CREATE INDEX IF NOT EXISTS idx_bed_transfers_status ON bed_transfers(status);
CREATE INDEX IF NOT EXISTS idx_bed_transfers_date ON bed_transfers(transfer_date);
CREATE INDEX IF NOT EXISTS idx_bed_transfers_completion ON bed_transfers(completion_date);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bed_transfers_patient_status ON bed_transfers(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_bed_transfers_date_status ON bed_transfers(transfer_date, status);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bed_transfers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bed_transfers_updated_at_trigger
  BEFORE UPDATE ON bed_transfers
  FOR EACH ROW
  EXECUTE FUNCTION update_bed_transfers_updated_at();

-- Trigger to handle bed status changes during transfer
CREATE OR REPLACE FUNCTION handle_bed_transfer_status()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'pending' AND NEW.status = 'in_progress' THEN
      -- Mark destination bed as reserved
      UPDATE beds SET status = 'reserved', updated_at = CURRENT_TIMESTAMP WHERE id = NEW.to_bed_id;
    ELSIF OLD.status = 'in_progress' AND NEW.status = 'completed' THEN
      -- Update bed assignment to new bed
      UPDATE bed_assignments 
      SET bed_id = NEW.to_bed_id, 
          status = 'active',
          updated_at = CURRENT_TIMESTAMP
      WHERE patient_id = NEW.patient_id AND status = 'active';
      
      -- Mark old bed as available
      UPDATE beds SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = NEW.from_bed_id;
      
      -- Mark new bed as occupied
      UPDATE beds SET status = 'occupied', updated_at = CURRENT_TIMESTAMP WHERE id = NEW.to_bed_id;
      
      -- Set completion date
      NEW.completion_date = CURRENT_TIMESTAMP;
    ELSIF OLD.status IN ('pending', 'in_progress') AND NEW.status = 'cancelled' THEN
      -- Release reserved bed if transfer is cancelled
      UPDATE beds SET status = 'available', updated_at = CURRENT_TIMESTAMP 
      WHERE id = NEW.to_bed_id AND status = 'reserved';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bed_transfers_status_trigger
  BEFORE UPDATE ON bed_transfers
  FOR EACH ROW
  EXECUTE FUNCTION handle_bed_transfer_status();

-- Comments
COMMENT ON TABLE bed_transfers IS 'Patient transfers between beds with full audit trail';
COMMENT ON COLUMN bed_transfers.transfer_type IS 'Type: routine, emergency, medical_necessity, patient_request';
COMMENT ON COLUMN bed_transfers.status IS 'Transfer status: pending, in_progress, completed, cancelled';
COMMENT ON CONSTRAINT different_beds ON bed_transfers IS 'Ensures source and destination beds are different';
