-- Migration: Create lab_test_categories table
-- Description: Categories for organizing lab tests (e.g., Hematology, Chemistry, Microbiology)
-- Date: 2025-11-15

-- Create lab_test_categories table in tenant schemas
CREATE TABLE IF NOT EXISTS lab_test_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lab_test_categories_name ON lab_test_categories(name);
CREATE INDEX IF NOT EXISTS idx_lab_test_categories_active ON lab_test_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_lab_test_categories_order ON lab_test_categories(display_order);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_lab_test_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lab_test_categories_updated_at
  BEFORE UPDATE ON lab_test_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_lab_test_categories_updated_at();

-- Insert default categories
INSERT INTO lab_test_categories (name, description, display_order) VALUES
  ('Hematology', 'Blood cell counts and related tests', 1),
  ('Clinical Chemistry', 'Chemical analysis of blood and body fluids', 2),
  ('Microbiology', 'Tests for infectious diseases and microorganisms', 3),
  ('Immunology', 'Immune system and antibody tests', 4),
  ('Urinalysis', 'Urine analysis and related tests', 5),
  ('Serology', 'Blood serum tests for antibodies and antigens', 6),
  ('Molecular Diagnostics', 'DNA/RNA based tests', 7),
  ('Toxicology', 'Drug and poison screening', 8)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE lab_test_categories IS 'Categories for organizing laboratory tests';
COMMENT ON COLUMN lab_test_categories.name IS 'Category name (e.g., Hematology, Chemistry)';
COMMENT ON COLUMN lab_test_categories.description IS 'Detailed description of the category';
COMMENT ON COLUMN lab_test_categories.display_order IS 'Order for displaying categories in UI';
COMMENT ON COLUMN lab_test_categories.is_active IS 'Whether category is currently active';
