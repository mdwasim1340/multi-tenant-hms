-- Create departments table for organizing beds by hospital units
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  department_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  floor_number INTEGER,
  building VARCHAR(100),
  total_bed_capacity INTEGER NOT NULL DEFAULT 0,
  active_bed_count INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS departments_department_code_idx ON departments(department_code);
CREATE INDEX IF NOT EXISTS departments_status_idx ON departments(status);
CREATE INDEX IF NOT EXISTS departments_name_idx ON departments(name);
