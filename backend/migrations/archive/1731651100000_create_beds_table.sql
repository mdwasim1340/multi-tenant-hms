-- Migration: Create beds table
-- Purpose: Store physical bed information and availability
-- Multi-tenant: Yes (tenant-specific schemas)

-- Create beds table
CREATE TABLE IF NOT EXISTS beds (
    id SERIAL PRIMARY KEY,
    bed_number VARCHAR(50) NOT NULL,
    department_id INTEGER NOT NULL,
    bed_type VARCHAR(50) NOT NULL CHECK (bed_type IN ('general', 'icu', 'private', 'semi_private', 'pediatric', 'maternity', 'emergency')),
    status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'reserved', 'blocked', 'cleaning')),
    
    -- Bed characteristics
    room_number VARCHAR(50),
    floor_number INTEGER,
    features JSONB DEFAULT '{}',
    
    -- Maintenance tracking
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    maintenance_notes TEXT,
    
    -- Additional information
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    
    -- Audit fields
    created_by INTEGER,
    updated_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_beds_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
    
    -- Unique constraint
    CONSTRAINT beds_number_unique UNIQUE (bed_number)
);

-- Create indexes for performance
CREATE INDEX idx_beds_number ON beds(bed_number);
CREATE INDEX idx_beds_department ON beds(department_id);
CREATE INDEX idx_beds_status ON beds(status);
CREATE INDEX idx_beds_type ON beds(bed_type);
CREATE INDEX idx_beds_active ON beds(is_active);
CREATE INDEX idx_beds_room ON beds(room_number);
CREATE INDEX idx_beds_features ON beds USING gin(features);

-- Add trigger for updated_at
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

-- Add comments
COMMENT ON TABLE beds IS 'Physical beds in the hospital';
COMMENT ON COLUMN beds.bed_number IS 'Unique identifier for the bed';
COMMENT ON COLUMN beds.bed_type IS 'Type of bed: general, icu, private, semi_private, etc.';
COMMENT ON COLUMN beds.status IS 'Current availability status of the bed';
COMMENT ON COLUMN beds.features IS 'JSONB field for additional bed features (e.g., {"has_ventilator": true, "has_monitor": true})';
COMMENT ON COLUMN beds.is_active IS 'Soft delete flag - false means bed is decommissioned';
