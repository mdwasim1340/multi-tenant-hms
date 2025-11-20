-- Migration: Create lab_orders table
-- Description: Laboratory test orders placed by doctors
-- Date: 2025-11-15

-- Create lab_orders table in tenant schemas
CREATE TABLE IF NOT EXISTS lab_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  medical_record_id INTEGER REFERENCES medical_records(id) ON DELETE SET NULL,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  order_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ordered_by INTEGER NOT NULL, -- References public.users(id) (doctor)
  priority VARCHAR(50) DEFAULT 'routine', -- routine, urgent, stat
  status VARCHAR(50) DEFAULT 'pending', -- pending, collected, processing, completed, cancelled
  collection_date TIMESTAMP,
  collected_by INTEGER, -- References public.users(id) (lab technician)
  clinical_notes TEXT,
  special_instructions TEXT,
  total_price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient ON lab_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_medical_record ON lab_orders(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_appointment ON lab_orders(appointment_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_ordered_by ON lab_orders(ordered_by);
CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON lab_orders(status);
CREATE INDEX IF NOT EXISTS idx_lab_orders_priority ON lab_orders(priority);
CREATE INDEX IF NOT EXISTS idx_lab_orders_order_date ON lab_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_lab_orders_number ON lab_orders(order_number);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_lab_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lab_orders_updated_at
  BEFORE UPDATE ON lab_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_lab_orders_updated_at();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_lab_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'LAB-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || LPAD(NEW.id::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_lab_order_number
  BEFORE INSERT ON lab_orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_lab_order_number();

COMMENT ON TABLE lab_orders IS 'Laboratory test orders placed by doctors';
COMMENT ON COLUMN lab_orders.order_number IS 'Unique order number (e.g., LAB-20251115-000001)';
COMMENT ON COLUMN lab_orders.priority IS 'Order priority: routine (normal), urgent (same day), stat (immediate)';
COMMENT ON COLUMN lab_orders.status IS 'Order status: pending, collected, processing, completed, cancelled';
COMMENT ON COLUMN lab_orders.collection_date IS 'When specimen was collected';
COMMENT ON COLUMN lab_orders.clinical_notes IS 'Clinical information relevant to the tests';
COMMENT ON COLUMN lab_orders.special_instructions IS 'Special handling or processing instructions';
