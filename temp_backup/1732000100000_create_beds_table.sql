-- Create beds table to store physical bed information
CREATE TABLE IF NOT EXISTS beds (
  id SERIAL PRIMARY KEY,
  bed_number VARCHAR(50) NOT NULL UNIQUE,
  department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  bed_type VARCHAR(100) NOT NULL,
  floor_number INTEGER,
  room_number VARCHAR(50),
  wing VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'available',
  features JSONB DEFAULT '{}',
  last_cleaned_at TIMESTAMP,
  last_maintenance_at TIMESTAMP,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS beds_bed_number_idx ON beds(bed_number);
CREATE INDEX IF NOT EXISTS beds_department_id_idx ON beds(department_id);
CREATE INDEX IF NOT EXISTS beds_status_idx ON beds(status);
CREATE INDEX IF NOT EXISTS beds_bed_type_idx ON beds(bed_type);
CREATE INDEX IF NOT EXISTS beds_is_active_idx ON beds(is_active);
CREATE INDEX IF NOT EXISTS beds_room_number_idx ON beds(room_number);
