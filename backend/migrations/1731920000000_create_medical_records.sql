-- Migration: Create Medical Records Tables
-- Created: November 18, 2025
-- Purpose: Medical records system with S3 file attachments

-- ============================================================================
-- Medical Records Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS medical_records (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INTEGER NOT NULL, -- References public.users.id (cross-schema)
  visit_date TIMESTAMP NOT NULL,
  chief_complaint TEXT,
  diagnosis TEXT,
  treatment_plan TEXT,
  prescriptions JSONB, -- Array of medications: [{"name": "...", "dosage": "...", "frequency": "..."}]
  vital_signs JSONB, -- {"blood_pressure": "120/80", "temperature": "98.6", "pulse": "72", "weight": "150"}
  lab_results JSONB, -- {"test_name": "result", ...}
  notes TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  status VARCHAR(50) DEFAULT 'draft', -- draft, finalized
  finalized_at TIMESTAMP,
  finalized_by INTEGER, -- References public.users.id
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Record Attachments Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS record_attachments (
  id SERIAL PRIMARY KEY,
  record_id INTEGER NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL, -- MIME type (e.g., application/pdf, image/jpeg)
  file_size BIGINT NOT NULL, -- Size in bytes
  s3_key VARCHAR(500) NOT NULL, -- Full S3 key path
  s3_bucket VARCHAR(255) NOT NULL, -- S3 bucket name
  uploaded_by INTEGER NOT NULL, -- References public.users.id
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Diagnoses Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS diagnoses (
  id SERIAL PRIMARY KEY,
  record_id INTEGER NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  icd_code VARCHAR(20), -- ICD-10 code (e.g., J00, I10)
  diagnosis_name VARCHAR(255) NOT NULL,
  diagnosis_type VARCHAR(50), -- primary, secondary, differential
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Medical Records Indexes
CREATE INDEX IF NOT EXISTS medical_records_patient_id_idx ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS medical_records_doctor_id_idx ON medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS medical_records_visit_date_idx ON medical_records(visit_date);
CREATE INDEX IF NOT EXISTS medical_records_status_idx ON medical_records(status);
CREATE INDEX IF NOT EXISTS medical_records_created_at_idx ON medical_records(created_at);

-- Record Attachments Indexes
CREATE INDEX IF NOT EXISTS record_attachments_record_id_idx ON record_attachments(record_id);
CREATE INDEX IF NOT EXISTS record_attachments_uploaded_by_idx ON record_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS record_attachments_created_at_idx ON record_attachments(created_at);

-- Diagnoses Indexes
CREATE INDEX IF NOT EXISTS diagnoses_record_id_idx ON diagnoses(record_id);
CREATE INDEX IF NOT EXISTS diagnoses_icd_code_idx ON diagnoses(icd_code);

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE medical_records IS 'Patient medical visit records with diagnoses and treatment plans';
COMMENT ON TABLE record_attachments IS 'File attachments for medical records stored in S3';
COMMENT ON TABLE diagnoses IS 'Multiple diagnoses per medical record with ICD-10 codes';

COMMENT ON COLUMN medical_records.prescriptions IS 'JSONB array of prescribed medications';
COMMENT ON COLUMN medical_records.vital_signs IS 'JSONB object with vital signs measurements';
COMMENT ON COLUMN medical_records.lab_results IS 'JSONB object with laboratory test results';
COMMENT ON COLUMN medical_records.status IS 'Record status: draft (editable) or finalized (locked)';

COMMENT ON COLUMN record_attachments.s3_key IS 'Full S3 object key: {tenant-id}/medical-records/{year}/{month}/{record-id}/{filename}';
COMMENT ON COLUMN record_attachments.file_size IS 'File size in bytes for storage tracking';

COMMENT ON COLUMN diagnoses.icd_code IS 'ICD-10 diagnosis code for standardized medical coding';
COMMENT ON COLUMN diagnoses.diagnosis_type IS 'Type: primary (main), secondary (additional), differential (possible)';
