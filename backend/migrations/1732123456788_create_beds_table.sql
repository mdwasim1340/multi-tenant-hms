-- Create Beds Table Migration
-- Creates the core beds table for bed management

-- Beds table
CREATE TABLE IF NOT EXISTS beds (
    id SERIAL PRIMARY KEY,
    bed_number VARCHAR(50) NOT NULL,
    department_id INTEGER NOT NULL,
    bed_type VARCHAR(50) NOT NULL,
    floor_number VARCHAR(10),
    room_number VARCHAR(50),
    wing VARCHAR(10),
    status VARCHAR(20) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Occupied', 'Maintenance', 'Under Cleaning', 'Reserved')),
    features JSONB DEFAULT '{}',
    last_cleaned_at TIMESTAMP,
    last_maintenance_at TIMESTAMP,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    updated_by INTEGER NOT NULL,
    UNIQUE(bed_number, department_id)
);

-- Departments table (if not exists)
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default departments if they don't exist
INSERT INTO departments (id, name, description, status) VALUES
    (1, 'Cardiology', 'Cardiac care and treatment', 'active'),
    (2, 'Orthopedics', 'Bone and joint care', 'active'),
    (3, 'Neurology', 'Neurological care', 'active'),
    (4, 'Pediatrics', 'Child healthcare', 'active'),
    (5, 'ICU', 'Intensive Care Unit', 'active'),
    (6, 'Emergency Room', 'Emergency medical services', 'active')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_beds_bed_number ON beds(bed_number);
CREATE INDEX IF NOT EXISTS idx_beds_department_id ON beds(department_id);
CREATE INDEX IF NOT EXISTS idx_beds_status ON beds(status);
CREATE INDEX IF NOT EXISTS idx_beds_bed_type ON beds(bed_type);
CREATE INDEX IF NOT EXISTS idx_beds_is_active ON beds(is_active);
CREATE INDEX IF NOT EXISTS idx_beds_floor_number ON beds(floor_number);
CREATE INDEX IF NOT EXISTS idx_beds_wing ON beds(wing);

CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX IF NOT EXISTS idx_departments_status ON departments(status);

-- Add trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_beds_updated_at BEFORE UPDATE ON beds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();