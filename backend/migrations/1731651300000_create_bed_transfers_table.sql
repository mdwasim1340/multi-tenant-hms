-- Migration: Create bed_transfers table
-- Purpose: Log bed transfer activities for patients
-- Multi-tenant: Yes (tenant-specific schemas)

-- Create bed_transfers table
CREATE TABLE IF NOT EXISTS bed_transfers (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL,
    from_bed_id INTEGER NOT NULL,
    to_bed_id INTEGER NOT NULL,
    from_department_id INTEGER NOT NULL,
    to_department_id INTEGER NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')),
    transfer_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(255),
    notes TEXT,
    approved_by INTEGER,
    performed_by INTEGER,

    -- Audit fields
    created_by INTEGER,
    updated_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Foreign keys
    CONSTRAINT fk_bed_transfers_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
    CONSTRAINT fk_bed_transfers_from_bed FOREIGN KEY (from_bed_id) REFERENCES beds(id),
    CONSTRAINT fk_bed_transfers_to_bed FOREIGN KEY (to_bed_id) REFERENCES beds(id),
    CONSTRAINT fk_bed_transfers_from_department FOREIGN KEY (from_department_id) REFERENCES departments(id),
    CONSTRAINT fk_bed_transfers_to_department FOREIGN KEY (to_department_id) REFERENCES departments(id)
);

-- Indexes
CREATE INDEX idx_bed_transfers_patient ON bed_transfers(patient_id);
CREATE INDEX idx_bed_transfers_from_bed ON bed_transfers(from_bed_id);
CREATE INDEX idx_bed_transfers_to_bed ON bed_transfers(to_bed_id);
CREATE INDEX idx_bed_transfers_status ON bed_transfers(status);
CREATE INDEX idx_bed_transfers_date ON bed_transfers(transfer_date DESC);

-- updated_at trigger
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

-- Comments
COMMENT ON TABLE bed_transfers IS 'Logs transfer activities for beds/patients';
COMMENT ON COLUMN bed_transfers.status IS 'active: in progress, completed, cancelled';
COMMENT ON COLUMN bed_transfers.notes IS 'Special comments about the transfer';
