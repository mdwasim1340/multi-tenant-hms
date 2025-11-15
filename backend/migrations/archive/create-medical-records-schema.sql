-- Medical Records Table
CREATE TABLE IF NOT EXISTS medical_records (
  id SERIAL PRIMARY KEY,
  record_number VARCHAR(50) UNIQUE NOT NULL,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  doctor_id INTEGER NOT NULL, -- References public.users.id
  visit_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  chief_complaint TEXT,
  history_of_present_illness TEXT,
  review_of_systems JSONB,
  physical_examination TEXT,
  assessment TEXT,
  plan TEXT,
  notes TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  follow_up_instructions TEXT,
  status VARCHAR(50) DEFAULT 'draft', -- draft, finalized, amended
  finalized_at TIMESTAMP,
  finalized_by INTEGER, -- References public.users.id
  created_by INTEGER NOT NULL, -- References public.users.id
  updated_by INTEGER, -- References public.users.id
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Diagnoses Table
CREATE TABLE IF NOT EXISTS diagnoses (
  id SERIAL PRIMARY KEY,
  medical_record_id INTEGER NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  diagnosis_code VARCHAR(20), -- ICD-10 code
  diagnosis_name VARCHAR(500) NOT NULL,
  diagnosis_type VARCHAR(50) DEFAULT 'primary', -- primary, secondary, differential
  severity VARCHAR(50), -- mild, moderate, severe, critical
  status VARCHAR(50) DEFAULT 'active', -- active, resolved, chronic
  onset_date DATE,
  resolution_date DATE,
  notes TEXT,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Treatments Table
CREATE TABLE IF NOT EXISTS treatments (
  id SERIAL PRIMARY KEY,
  medical_record_id INTEGER NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  treatment_type VARCHAR(100) NOT NULL, -- medication, procedure, therapy, surgery, etc.
  treatment_name VARCHAR(500) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  frequency VARCHAR(100), -- once daily, twice daily, as needed, etc.
  dosage VARCHAR(200),
  route VARCHAR(100), -- oral, IV, topical, etc.
  duration VARCHAR(100), -- 7 days, 2 weeks, ongoing, etc.
  instructions TEXT,
  status VARCHAR(50) DEFAULT 'active', -- active, completed, discontinued
  discontinued_reason TEXT,
  discontinued_date DATE,
  discontinued_by INTEGER, -- References public.users.id
  notes TEXT,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prescriptions Table
CREATE TABLE IF NOT EXISTS prescriptions (
  id SERIAL PRIMARY KEY,
  prescription_number VARCHAR(50) UNIQUE NOT NULL,
  medical_record_id INTEGER NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INTEGER NOT NULL, -- References public.users.id
  medication_name VARCHAR(500) NOT NULL,
  medication_code VARCHAR(50), -- Drug code (NDC, etc.)
  dosage VARCHAR(200) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  route VARCHAR(100) NOT NULL,
  duration VARCHAR(100),
  quantity INTEGER,
  refills INTEGER DEFAULT 0,
  instructions TEXT,
  indication TEXT, -- Reason for prescription
  status VARCHAR(50) DEFAULT 'active', -- active, filled, cancelled, expired
  prescribed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_date DATE,
  end_date DATE,
  pharmacy_notes TEXT,
  filled_date DATE,
  filled_by VARCHAR(255), -- Pharmacy name
  cancelled_date DATE,
  cancelled_reason TEXT,
  cancelled_by INTEGER, -- References public.users.id
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for medical_records
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_appointment_id ON medical_records(appointment_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_id ON medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_visit_date ON medical_records(visit_date);
CREATE INDEX IF NOT EXISTS idx_medical_records_status ON medical_records(status);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_date ON medical_records(patient_id, visit_date);

-- Indexes for diagnoses
CREATE INDEX IF NOT EXISTS idx_diagnoses_medical_record_id ON diagnoses(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_code ON diagnoses(diagnosis_code);
CREATE INDEX IF NOT EXISTS idx_diagnoses_status ON diagnoses(status);
CREATE INDEX IF NOT EXISTS idx_diagnoses_type ON diagnoses(diagnosis_type);

-- Indexes for treatments
CREATE INDEX IF NOT EXISTS idx_treatments_medical_record_id ON treatments(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_treatments_type ON treatments(treatment_type);
CREATE INDEX IF NOT EXISTS idx_treatments_status ON treatments(status);
CREATE INDEX IF NOT EXISTS idx_treatments_start_date ON treatments(start_date);

-- Indexes for prescriptions
CREATE INDEX IF NOT EXISTS idx_prescriptions_medical_record_id ON prescriptions(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_prescribed_date ON prescriptions(prescribed_date);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_date ON prescriptions(patient_id, prescribed_date);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diagnoses_updated_at BEFORE UPDATE ON diagnoses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treatments_updated_at BEFORE UPDATE ON treatments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
