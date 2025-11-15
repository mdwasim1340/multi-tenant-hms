-- Inventory Categories Table
-- Team Beta - Inventory Management System
-- Migration: 1731652000000_create_inventory_categories_table.sql

CREATE TABLE IF NOT EXISTS inventory_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  parent_category_id INTEGER REFERENCES inventory_categories(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER
);

-- Indexes
CREATE INDEX idx_inventory_categories_code ON inventory_categories(code);
CREATE INDEX idx_inventory_categories_parent ON inventory_categories(parent_category_id);
CREATE INDEX idx_inventory_categories_status ON inventory_categories(status);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_inventory_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory_categories_updated_at
BEFORE UPDATE ON inventory_categories
FOR EACH ROW
EXECUTE FUNCTION update_inventory_categories_updated_at();

-- Seed initial categories
INSERT INTO inventory_categories (name, code, description, parent_category_id, status) VALUES
  ('Medical Supplies', 'MED_SUPPLIES', 'General medical supplies and consumables', NULL, 'active'),
  ('Pharmaceuticals', 'PHARMA', 'Medications and pharmaceutical products', NULL, 'active'),
  ('Medical Equipment', 'MED_EQUIP', 'Medical devices and equipment', NULL, 'active'),
  ('Laboratory Supplies', 'LAB_SUPPLIES', 'Laboratory consumables and reagents', NULL, 'active'),
  ('Surgical Instruments', 'SURG_INSTR', 'Surgical tools and instruments', NULL, 'active'),
  ('Personal Protective Equipment', 'PPE', 'Protective gear and safety equipment', NULL, 'active'),
  ('Diagnostic Equipment', 'DIAG_EQUIP', 'Diagnostic devices and tools', NULL, 'active'),
  ('Office Supplies', 'OFFICE', 'Administrative and office supplies', NULL, 'active')
ON CONFLICT (code) DO NOTHING;
