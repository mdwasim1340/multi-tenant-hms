-- Migration: Create beds table
-- Description: Physical beds in the hospital
-- Date: 2025-11-18

CREATE TABLE IF NOT EXISTS beds (
  id SERIAL PRIMARY KEY,
  bed_number VARCHAR(50) UNIQUE NOT NULL,
  department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  bed_type VARCHAR(50) NOT NULL CHECK (bed_type IN ('standard', 'icu', 'isolation', 'pediatric', 'maternity')),
  floor_number INTEGER,
  room_number VARCHAR(50),
  wing VARCHAR(50),
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'cleaning', 'reserved')),
  features JSONB DEFAULT '{}'::jsonb,
  last_cleaned_at TIMESTAMP,
  last_maintenance_at TIMESTAMP,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_beds_number ON beds(bed_number);
CREATE INDEX IF NOT EXISTS idx_beds_department ON beds(department_id);
CREATE INDEX IF NOT EXISTS idx_beds_status ON beds(status);
CREATE INDEX IF NOT EXISTS idx_beds_type ON beds(bed_type);
CREATE INDEX IF NOT EXISTS idx_beds_active ON beds(is_active);
CREATE INDEX IF NOT EXISTS idx_beds_room ON beds(room_number);
CREATE INDEX IF NOT EXISTS idx_beds_floor ON beds(floor_number);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_beds_dept_status ON beds(department_id, status);
CREATE INDEX IF NOT EXISTS idx_beds_status_active ON beds(status, is_active);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_beds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER beds_updated_at_trigger
  BEFORE UPDATE ON beds
  FOR EACH ROW
  EXECUTE FUNCTION update_beds_updated_at();

-- Comments
COMMENT ON TABLE beds IS 'Physical beds available in the hospital';
COMMENT ON COLUMN beds.bed_number IS 'Unique identifier for the bed (e.g., ICU-101, WARD-A-205)';
COMMENT ON COLUMN beds.bed_type IS 'Type of bed: standard, icu, isolation, pediatric, maternity';
COMMENT ON COLUMN beds.status IS 'Current status: available, occupied, maintenance, cleaning, reserved';
COMMENT ON COLUMN beds.features IS 'JSON object with bed features (ventilator, monitor, oxygen, etc.)';
COMMENT ON COLUMN beds.is_active IS 'Whether bed is currently in service';
