-- Add patient-related fields to invoices table for diagnostic invoices
-- Migration: 1731900000000_add_patient_fields_to_invoices.sql

-- Add patient fields to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS patient_id INTEGER,
ADD COLUMN IF NOT EXISTS patient_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS patient_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS referring_doctor VARCHAR(255),
ADD COLUMN IF NOT EXISTS report_delivery_date DATE,
ADD COLUMN IF NOT EXISTS advance_paid DECIMAL(10, 2) DEFAULT 0;

-- Add comment to explain the purpose
COMMENT ON COLUMN invoices.patient_id IS 'Patient ID for diagnostic invoices (NULL for subscription invoices)';
COMMENT ON COLUMN invoices.patient_name IS 'Patient full name for diagnostic invoices';
COMMENT ON COLUMN invoices.patient_number IS 'Patient number for diagnostic invoices';
COMMENT ON COLUMN invoices.referring_doctor IS 'Referring doctor name for diagnostic invoices';
COMMENT ON COLUMN invoices.report_delivery_date IS 'Expected report delivery date for diagnostic tests';
COMMENT ON COLUMN invoices.advance_paid IS 'Advance payment amount received';

-- Create index for patient lookups
CREATE INDEX IF NOT EXISTS idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_patient_number ON invoices(patient_number);
