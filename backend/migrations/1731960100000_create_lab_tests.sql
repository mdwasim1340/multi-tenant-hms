-- Migration: Create lab_tests table
-- Description: Master list of available laboratory tests
-- Date: 2025-11-15

-- Create lab_tests table in tenant schemas
CREATE TABLE IF NOT EXISTS lab_tests (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES lab_test_categories(id) ON DELETE SET NULL,
  test_code VARCHAR(50) UNIQUE NOT NULL,
  test_name VARCHAR(255) NOT NULL,
  description TEXT,
  normal_range_min VARCHAR(100),
  normal_range_max VARCHAR(100),
  normal_range_text VARCHAR(255),
  unit VARCHAR(50),
  specimen_type VARCHAR(100), -- Blood, Urine, Tissue, etc.
  price DECIMAL(10,2),
  turnaround_time INTEGER, -- in hours
  preparation_instructions TEXT,
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, discontinued
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lab_tests_category ON lab_tests(category_id);
CREATE INDEX IF NOT EXISTS idx_lab_tests_code ON lab_tests(test_code);
CREATE INDEX IF NOT EXISTS idx_lab_tests_name ON lab_tests(test_name);
CREATE INDEX IF NOT EXISTS idx_lab_tests_status ON lab_tests(status);
CREATE INDEX IF NOT EXISTS idx_lab_tests_specimen ON lab_tests(specimen_type);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_lab_tests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lab_tests_updated_at
  BEFORE UPDATE ON lab_tests
  FOR EACH ROW
  EXECUTE FUNCTION update_lab_tests_updated_at();

-- Insert common lab tests
INSERT INTO lab_tests (category_id, test_code, test_name, description, normal_range_text, unit, specimen_type, price, turnaround_time) 
SELECT c.id, 'CBC', 'Complete Blood Count', 'Measures different components of blood', 'Varies by component', 'cells/mcL', 'Blood', 50.00, 4
FROM lab_test_categories c WHERE c.name = 'Hematology'
UNION ALL
SELECT c.id, 'HGB', 'Hemoglobin', 'Measures oxygen-carrying protein in blood', '12-16 g/dL (Female), 14-18 g/dL (Male)', 'g/dL', 'Blood', 25.00, 2
FROM lab_test_categories c WHERE c.name = 'Hematology'
UNION ALL
SELECT c.id, 'WBC', 'White Blood Cell Count', 'Measures infection-fighting cells', '4,500-11,000 cells/mcL', 'cells/mcL', 'Blood', 20.00, 2
FROM lab_test_categories c WHERE c.name = 'Hematology'
UNION ALL
SELECT c.id, 'PLT', 'Platelet Count', 'Measures blood clotting cells', '150,000-400,000 cells/mcL', 'cells/mcL', 'Blood', 20.00, 2
FROM lab_test_categories c WHERE c.name = 'Hematology'
UNION ALL
SELECT c.id, 'GLU', 'Glucose (Fasting)', 'Measures blood sugar level', '70-100 mg/dL', 'mg/dL', 'Blood', 15.00, 2
FROM lab_test_categories c WHERE c.name = 'Clinical Chemistry'
UNION ALL
SELECT c.id, 'HBA1C', 'Hemoglobin A1C', 'Average blood sugar over 3 months', 'Below 5.7%', '%', 'Blood', 40.00, 24
FROM lab_test_categories c WHERE c.name = 'Clinical Chemistry'
UNION ALL
SELECT c.id, 'CHOL', 'Total Cholesterol', 'Measures total cholesterol', 'Below 200 mg/dL', 'mg/dL', 'Blood', 30.00, 4
FROM lab_test_categories c WHERE c.name = 'Clinical Chemistry'
UNION ALL
SELECT c.id, 'HDL', 'HDL Cholesterol', 'Good cholesterol', 'Above 40 mg/dL (Male), Above 50 mg/dL (Female)', 'mg/dL', 'Blood', 25.00, 4
FROM lab_test_categories c WHERE c.name = 'Clinical Chemistry'
UNION ALL
SELECT c.id, 'LDL', 'LDL Cholesterol', 'Bad cholesterol', 'Below 100 mg/dL', 'mg/dL', 'Blood', 25.00, 4
FROM lab_test_categories c WHERE c.name = 'Clinical Chemistry'
UNION ALL
SELECT c.id, 'TG', 'Triglycerides', 'Measures blood fats', 'Below 150 mg/dL', 'mg/dL', 'Blood', 25.00, 4
FROM lab_test_categories c WHERE c.name = 'Clinical Chemistry'
UNION ALL
SELECT c.id, 'CREAT', 'Creatinine', 'Kidney function test', '0.6-1.2 mg/dL', 'mg/dL', 'Blood', 20.00, 4
FROM lab_test_categories c WHERE c.name = 'Clinical Chemistry'
UNION ALL
SELECT c.id, 'BUN', 'Blood Urea Nitrogen', 'Kidney function test', '7-20 mg/dL', 'mg/dL', 'Blood', 20.00, 4
FROM lab_test_categories c WHERE c.name = 'Clinical Chemistry'
UNION ALL
SELECT c.id, 'ALT', 'ALT (SGPT)', 'Liver enzyme test', '7-56 U/L', 'U/L', 'Blood', 25.00, 4
FROM lab_test_categories c WHERE c.name = 'Clinical Chemistry'
UNION ALL
SELECT c.id, 'AST', 'AST (SGOT)', 'Liver enzyme test', '10-40 U/L', 'U/L', 'Blood', 25.00, 4
FROM lab_test_categories c WHERE c.name = 'Clinical Chemistry'
UNION ALL
SELECT c.id, 'UA', 'Urinalysis Complete', 'Complete urine analysis', 'Varies by component', 'Various', 'Urine', 30.00, 2
FROM lab_test_categories c WHERE c.name = 'Urinalysis'
UNION ALL
SELECT c.id, 'URINE-CULT', 'Urine Culture', 'Tests for urinary tract infection', 'No growth', 'CFU/mL', 'Urine', 45.00, 48
FROM lab_test_categories c WHERE c.name = 'Urinalysis'
UNION ALL
SELECT c.id, 'BLOOD-CULT', 'Blood Culture', 'Tests for bloodstream infection', 'No growth', 'CFU/mL', 'Blood', 75.00, 72
FROM lab_test_categories c WHERE c.name = 'Microbiology'
UNION ALL
SELECT c.id, 'THROAT-CULT', 'Throat Culture', 'Tests for throat infection', 'Normal flora', 'CFU/mL', 'Throat Swab', 40.00, 48
FROM lab_test_categories c WHERE c.name = 'Microbiology'
ON CONFLICT (test_code) DO NOTHING;

COMMENT ON TABLE lab_tests IS 'Master list of available laboratory tests';
COMMENT ON COLUMN lab_tests.test_code IS 'Unique code for the test (e.g., CBC, HBA1C)';
COMMENT ON COLUMN lab_tests.test_name IS 'Full name of the test';
COMMENT ON COLUMN lab_tests.normal_range_text IS 'Human-readable normal range';
COMMENT ON COLUMN lab_tests.specimen_type IS 'Type of specimen required (Blood, Urine, etc.)';
COMMENT ON COLUMN lab_tests.turnaround_time IS 'Expected time to get results in hours';
COMMENT ON COLUMN lab_tests.preparation_instructions IS 'Patient preparation instructions (e.g., fasting required)';
