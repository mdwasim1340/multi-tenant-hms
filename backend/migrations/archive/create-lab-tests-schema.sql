-- Lab Panels Table (Common test groupings)
CREATE TABLE IF NOT EXISTS lab_panels (
  id SERIAL PRIMARY KEY,
  panel_code VARCHAR(50) UNIQUE NOT NULL,
  panel_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- chemistry, hematology, microbiology, etc.
  tests_included JSONB, -- Array of test codes included in panel
  turnaround_time_hours INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lab Tests Table
CREATE TABLE IF NOT EXISTS lab_tests (
  id SERIAL PRIMARY KEY,
  test_number VARCHAR(50) UNIQUE NOT NULL,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  medical_record_id INTEGER REFERENCES medical_records(id) ON DELETE SET NULL,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  ordered_by INTEGER NOT NULL, -- References public.users.id (doctor)
  test_type VARCHAR(100) NOT NULL, -- blood, urine, imaging, etc.
  test_code VARCHAR(50), -- LOINC code
  test_name VARCHAR(255) NOT NULL,
  panel_id INTEGER REFERENCES lab_panels(id),
  priority VARCHAR(50) DEFAULT 'routine', -- routine, urgent, stat
  clinical_indication TEXT,
  specimen_type VARCHAR(100), -- blood, urine, tissue, etc.
  specimen_collected_at TIMESTAMP,
  specimen_collected_by INTEGER, -- References public.users.id
  status VARCHAR(50) DEFAULT 'ordered', -- ordered, collected, processing, completed, cancelled
  ordered_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expected_completion_date TIMESTAMP,
  completed_date TIMESTAMP,
  notes TEXT,
  cancelled_reason TEXT,
  cancelled_date TIMESTAMP,
  cancelled_by INTEGER, -- References public.users.id
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lab Results Table
CREATE TABLE IF NOT EXISTS lab_results (
  id SERIAL PRIMARY KEY,
  lab_test_id INTEGER NOT NULL REFERENCES lab_tests(id) ON DELETE CASCADE,
  result_code VARCHAR(50), -- LOINC code for specific result
  result_name VARCHAR(255) NOT NULL,
  result_value VARCHAR(500),
  result_unit VARCHAR(50),
  reference_range_low VARCHAR(50),
  reference_range_high VARCHAR(50),
  reference_range_text VARCHAR(255), -- For non-numeric ranges
  is_abnormal BOOLEAN DEFAULT FALSE,
  abnormal_flag VARCHAR(50), -- high, low, critical_high, critical_low
  interpretation TEXT,
  result_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  verified_by INTEGER, -- References public.users.id
  verified_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Imaging Studies Table
CREATE TABLE IF NOT EXISTS imaging_studies (
  id SERIAL PRIMARY KEY,
  study_number VARCHAR(50) UNIQUE NOT NULL,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  medical_record_id INTEGER REFERENCES medical_records(id) ON DELETE SET NULL,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  ordered_by INTEGER NOT NULL, -- References public.users.id
  study_type VARCHAR(100) NOT NULL, -- x-ray, ct, mri, ultrasound, etc.
  body_part VARCHAR(100) NOT NULL,
  modality VARCHAR(50), -- DICOM modality code
  clinical_indication TEXT,
  priority VARCHAR(50) DEFAULT 'routine',
  status VARCHAR(50) DEFAULT 'ordered', -- ordered, scheduled, in_progress, completed, cancelled
  ordered_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  scheduled_date TIMESTAMP,
  performed_date TIMESTAMP,
  completed_date TIMESTAMP,
  performing_facility VARCHAR(255),
  radiologist_id INTEGER, -- References public.users.id
  findings TEXT,
  impression TEXT,
  recommendations TEXT,
  images_url TEXT, -- Link to PACS or image storage
  report_url TEXT,
  is_critical BOOLEAN DEFAULT FALSE,
  critical_findings TEXT,
  notified_at TIMESTAMP,
  notified_by INTEGER, -- References public.users.id
  cancelled_reason TEXT,
  cancelled_date TIMESTAMP,
  cancelled_by INTEGER,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lab_tests
CREATE INDEX idx_lab_tests_patient_id ON lab_tests(patient_id);
CREATE INDEX idx_lab_tests_medical_record_id ON lab_tests(medical_record_id);
CREATE INDEX idx_lab_tests_appointment_id ON lab_tests(appointment_id);
CREATE INDEX idx_lab_tests_ordered_by ON lab_tests(ordered_by);
CREATE INDEX idx_lab_tests_status ON lab_tests(status);
CREATE INDEX idx_lab_tests_test_type ON lab_tests(test_type);
CREATE INDEX idx_lab_tests_ordered_date ON lab_tests(ordered_date);
CREATE INDEX idx_lab_tests_patient_date ON lab_tests(patient_id, ordered_date DESC);

-- Indexes for lab_results
CREATE INDEX idx_lab_results_lab_test_id ON lab_results(lab_test_id);
CREATE INDEX idx_lab_results_abnormal ON lab_results(is_abnormal);
CREATE INDEX idx_lab_results_result_date ON lab_results(result_date);

-- Indexes for imaging_studies
CREATE INDEX idx_imaging_studies_patient_id ON imaging_studies(patient_id);
CREATE INDEX idx_imaging_studies_medical_record_id ON imaging_studies(medical_record_id);
CREATE INDEX idx_imaging_studies_ordered_by ON imaging_studies(ordered_by);
CREATE INDEX idx_imaging_studies_status ON imaging_studies(status);
CREATE INDEX idx_imaging_studies_study_type ON imaging_studies(study_type);
CREATE INDEX idx_imaging_studies_ordered_date ON imaging_studies(ordered_date);
CREATE INDEX idx_imaging_studies_critical ON imaging_studies(is_critical);
CREATE INDEX idx_imaging_studies_patient_date ON imaging_studies(patient_id, ordered_date DESC);

-- Indexes for lab_panels
CREATE INDEX idx_lab_panels_category ON lab_panels(category);
CREATE INDEX idx_lab_panels_active ON lab_panels(is_active);

-- Triggers for updated_at
CREATE TRIGGER update_lab_tests_updated_at BEFORE UPDATE ON lab_tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lab_results_updated_at BEFORE UPDATE ON lab_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_imaging_studies_updated_at BEFORE UPDATE ON imaging_studies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lab_panels_updated_at BEFORE UPDATE ON lab_panels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
