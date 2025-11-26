-- Migration: Create departments table
-- Purpose: Organize beds by hospital units/departments
-- Multi-tenant: Yes (tenant-specific schemas)

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    department_name VARCHAR(255) NOT NULL,
    department_code VARCHAR(50) NOT NULL,
    description TEXT,
    floor_number INTEGER,
    building VARCHAR(100),
    total_capacity INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    head_of_department VARCHAR(255),
    
    -- Audit fields
    created_by INTEGER,
    updated_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT departments_code_unique UNIQUE (department_code)
);

-- Create indexes for performance
CREATE INDEX idx_departments_code ON departments(department_code);
CREATE INDEX idx_departments_status ON departments(status);
CREATE INDEX idx_departments_created_at ON departments(created_at DESC);

-- Add trigger for updated_at
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

-- Add comments
COMMENT ON TABLE departments IS 'Hospital departments for organizing beds and staff';
COMMENT ON COLUMN departments.department_code IS 'Unique code for department identification';
COMMENT ON COLUMN departments.total_capacity IS 'Total bed capacity for this department';
COMMENT ON COLUMN departments.status IS 'Department status: active or inactive';
