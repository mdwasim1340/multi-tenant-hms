-- Migration: Create lab_results table
-- Description: Laboratory test results
-- Date: 2025-11-15

-- Create lab_results table in tenant schemas
CREATE TABLE IF NOT EXISTS lab_results (
  id SERIAL PRIMARY KEY,
  order_item_id INTEGER NOT NULL REFERENCES lab_order_items(id) ON DELETE CASCADE,
  result_value VARCHAR(500),
  result_numeric DECIMAL(15,4), -- For numeric results
  result_text TEXT, -- For text/descriptive results
  result_unit VARCHAR(50),
  reference_range VARCHAR(255),
  is_abnormal BOOLEAN DEFAULT FALSE,
  abnormal_flag VARCHAR(20), -- H (High), L (Low), HH (Critical High), LL (Critical Low)
  result_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  performed_by INTEGER, -- References public.users(id) (lab technician)
  verified_by INTEGER, -- References public.users(id) (pathologist/senior tech)
  verified_at TIMESTAMP,
  interpretation TEXT,
  notes TEXT,
  attachments JSONB, -- Array of file attachments (S3 keys)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lab_results_order_item ON lab_results(order_item_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_abnormal ON lab_results(is_abnormal);
CREATE INDEX IF NOT EXISTS idx_lab_results_verified ON lab_results(verified_at);
CREATE INDEX IF NOT EXISTS idx_lab_results_date ON lab_results(result_date);
CREATE INDEX IF NOT EXISTS idx_lab_results_performed_by ON lab_results(performed_by);
CREATE INDEX IF NOT EXISTS idx_lab_results_verified_by ON lab_results(verified_by);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_lab_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lab_results_updated_at
  BEFORE UPDATE ON lab_results
  FOR EACH ROW
  EXECUTE FUNCTION update_lab_results_updated_at();

-- Function to mark order item as completed when result is verified
CREATE OR REPLACE FUNCTION mark_order_item_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verified_at IS NOT NULL AND OLD.verified_at IS NULL THEN
    UPDATE lab_order_items
    SET 
      status = 'completed',
      completed_at = NEW.verified_at
    WHERE id = NEW.order_item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mark_order_item_completed
  AFTER UPDATE ON lab_results
  FOR EACH ROW
  EXECUTE FUNCTION mark_order_item_completed();

-- Function to check if result is abnormal based on reference range
CREATE OR REPLACE FUNCTION check_abnormal_result()
RETURNS TRIGGER AS $$
DECLARE
  range_parts TEXT[];
  min_val DECIMAL;
  max_val DECIMAL;
BEGIN
  -- Only check numeric results
  IF NEW.result_numeric IS NOT NULL AND NEW.reference_range IS NOT NULL THEN
    -- Try to parse reference range (e.g., "70-100", "<5", ">10")
    IF NEW.reference_range ~ '^\d+\.?\d*-\d+\.?\d*$' THEN
      -- Range format: "min-max"
      range_parts := string_to_array(NEW.reference_range, '-');
      min_val := range_parts[1]::DECIMAL;
      max_val := range_parts[2]::DECIMAL;
      
      IF NEW.result_numeric < min_val THEN
        NEW.is_abnormal := TRUE;
        NEW.abnormal_flag := 'L';
      ELSIF NEW.result_numeric > max_val THEN
        NEW.is_abnormal := TRUE;
        NEW.abnormal_flag := 'H';
      ELSE
        NEW.is_abnormal := FALSE;
        NEW.abnormal_flag := NULL;
      END IF;
    ELSIF NEW.reference_range ~ '^<\d+\.?\d*$' THEN
      -- Less than format: "<max"
      max_val := SUBSTRING(NEW.reference_range FROM 2)::DECIMAL;
      IF NEW.result_numeric >= max_val THEN
        NEW.is_abnormal := TRUE;
        NEW.abnormal_flag := 'H';
      END IF;
    ELSIF NEW.reference_range ~ '^>\d+\.?\d*$' THEN
      -- Greater than format: ">min"
      min_val := SUBSTRING(NEW.reference_range FROM 2)::DECIMAL;
      IF NEW.result_numeric <= min_val THEN
        NEW.is_abnormal := TRUE;
        NEW.abnormal_flag := 'L';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_abnormal_result
  BEFORE INSERT OR UPDATE ON lab_results
  FOR EACH ROW
  EXECUTE FUNCTION check_abnormal_result();

COMMENT ON TABLE lab_results IS 'Laboratory test results';
COMMENT ON COLUMN lab_results.result_value IS 'Primary result value (string representation)';
COMMENT ON COLUMN lab_results.result_numeric IS 'Numeric result value for calculations and comparisons';
COMMENT ON COLUMN lab_results.result_text IS 'Descriptive or text-based results';
COMMENT ON COLUMN lab_results.abnormal_flag IS 'H=High, L=Low, HH=Critical High, LL=Critical Low';
COMMENT ON COLUMN lab_results.verified_at IS 'When result was verified by authorized personnel';
COMMENT ON COLUMN lab_results.interpretation IS 'Clinical interpretation of the result';
COMMENT ON COLUMN lab_results.attachments IS 'JSON array of file attachments (images, reports)';
