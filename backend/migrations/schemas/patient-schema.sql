-- Patient Management Schema
-- This file will be applied to ALL tenant schemas

-- Main patients table
CREATE TABLE IF NOT EXISTS patients (
  -- Primary identification
  id SERIAL PRIMARY KEY,
  patient_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Personal information
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  middle_name VARCHAR(255),
  preferred_name VARCHAR(255),
  
  -- Contact information
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile_phone VARCHAR(50),
  
  -- Demographics
  date_of_birth DATE NOT NULL,
  gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  marital_status VARCHAR(50),
  occupation VARCHAR(255),
  
  -- Address information
  address_line_1 TEXT,
  address_line_2 TEXT,
  city VARCHAR(255),
  state VARCHAR(255),
  postal_code VARCHAR(20),
  country VARCHAR(255) DEFAULT 'United States',
  
  -- Emergency contact
  emergency_contact_name VARCHAR(255),
  emergency_contact_relationship VARCHAR(100),
  emergency_contact_phone VARCHAR(50),
  emergency_contact_email VARCHAR(255),
  
  -- Medical information
  blood_type VARCHAR(10) CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  allergies TEXT,
  current_medications TEXT,
  medical_history TEXT,
  family_medical_history TEXT,
  
  -- Insurance information
  insurance_provider VARCHAR(255),
  insurance_policy_number VARCHAR(100),
  insurance_group_number VARCHAR(100),
  insurance_info JSONB,
  
  -- System fields
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deceased', 'transferred')),
  notes TEXT,
  
  -- Audit fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER
);

-- Custom field values for patients
CREATE TABLE IF NOT EXISTS custom_field_values (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL DEFAULT 'patient',
  entity_id INTEGER NOT NULL,
  field_id INTEGER NOT NULL,
  value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(entity_type, entity_id, field_id),
  CHECK (entity_type IN ('patient', 'appointment', 'medical_record'))
);

-- Patient files table
CREATE TABLE IF NOT EXISTS patient_files (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  filename VARCHAR(500) NOT NULL,
  original_filename VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(255) NOT NULL,
  s3_key VARCHAR(1000) NOT NULL,
  file_type VARCHAR(100),
  description TEXT,
  uploaded_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS patients_patient_number_idx ON patients(patient_number);
CREATE INDEX IF NOT EXISTS patients_email_idx ON patients(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS patients_phone_idx ON patients(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS patients_first_name_idx ON patients(first_name);
CREATE INDEX IF NOT EXISTS patients_last_name_idx ON patients(last_name);
CREATE INDEX IF NOT EXISTS patients_full_name_idx ON patients(first_name, last_name);
CREATE INDEX IF NOT EXISTS patients_date_of_birth_idx ON patients(date_of_birth);
CREATE INDEX IF NOT EXISTS patients_status_idx ON patients(status);
CREATE INDEX IF NOT EXISTS patients_created_at_idx ON patients(created_at);

CREATE INDEX IF NOT EXISTS custom_field_values_entity_idx ON custom_field_values(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS custom_field_values_field_idx ON custom_field_values(field_id);

CREATE INDEX IF NOT EXISTS patient_files_patient_id_idx ON patient_files(patient_id);
CREATE INDEX IF NOT EXISTS patient_files_created_at_idx ON patient_files(created_at);
