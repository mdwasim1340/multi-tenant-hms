-- Migration: Create departments table
-- Description: Hospital departments/units for organizing beds
-- Date: 2025-11-18

CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  department_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  floor_number INTEGER,
  building VARCHAR(100),
  total_bed_capacity INTEGER NOT NULL DEFAULT 0,
  active_bed_count INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(department_code);
CREATE INDEX IF NOT EXISTS idx_departments_status ON departments(status);
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_departments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER departments_updated_at_trigger
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_departments_updated_at();

-- Comments
COMMENT ON TABLE departments IS 'Hospital departments/units for organizing beds and staff';
COMMENT ON COLUMN departments.department_code IS 'Unique code for department (e.g., ICU, CARD, ORTHO)';
COMMENT ON COLUMN departments.total_bed_capacity IS 'Maximum number of beds this department can have';
COMMENT ON COLUMN departments.active_bed_count IS 'Current number of active beds in this department';
