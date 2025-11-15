-- Migration: Add Record Attachments Table
-- Created: November 18, 2025
-- Purpose: Add S3 file attachments support to medical records

-- ============================================================================
-- Record Attachments Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS record_attachments (
  id SERIAL PRIMARY KEY,
  medical_record_id INTEGER NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
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
-- Indexes for Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS record_attachments_medical_record_id_idx ON record_attachments(medical_record_id);
CREATE INDEX IF NOT EXISTS record_attachments_uploaded_by_idx ON record_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS record_attachments_created_at_idx ON record_attachments(created_at);

-- ============================================================================
-- Comments for Documentation
-- ============================================================================
COMMENT ON TABLE record_attachments IS 'File attachments for medical records stored in S3';
COMMENT ON COLUMN record_attachments.s3_key IS 'Full S3 object key: {tenant-id}/medical-records/{year}/{month}/{record-id}/{filename}';
COMMENT ON COLUMN record_attachments.file_size IS 'File size in bytes for storage tracking';
COMMENT ON COLUMN record_attachments.medical_record_id IS 'References medical_records.id (not record_id)';
