-- Migration: Create lab_order_items table
-- Description: Individual tests within a lab order
-- Date: 2025-11-15

-- Create lab_order_items table in tenant schemas
CREATE TABLE IF NOT EXISTS lab_order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
  test_id INTEGER NOT NULL REFERENCES lab_tests(id) ON DELETE RESTRICT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, collected, processing, completed, cancelled
  specimen_collected_at TIMESTAMP,
  processing_started_at TIMESTAMP,
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  notes TEXT,
  price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lab_order_items_order ON lab_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_lab_order_items_test ON lab_order_items(test_id);
CREATE INDEX IF NOT EXISTS idx_lab_order_items_status ON lab_order_items(status);
CREATE INDEX IF NOT EXISTS idx_lab_order_items_completed ON lab_order_items(completed_at);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_lab_order_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lab_order_items_updated_at
  BEFORE UPDATE ON lab_order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_lab_order_items_updated_at();

-- Function to update order status based on items
CREATE OR REPLACE FUNCTION update_lab_order_status()
RETURNS TRIGGER AS $$
DECLARE
  order_status VARCHAR(50);
  all_completed BOOLEAN;
  any_processing BOOLEAN;
  any_collected BOOLEAN;
  all_cancelled BOOLEAN;
BEGIN
  -- Get status of all items in the order
  SELECT 
    BOOL_AND(status = 'completed') as all_completed,
    BOOL_OR(status = 'processing') as any_processing,
    BOOL_OR(status = 'collected') as any_collected,
    BOOL_AND(status = 'cancelled') as all_cancelled
  INTO all_completed, any_processing, any_collected, all_cancelled
  FROM lab_order_items
  WHERE order_id = COALESCE(NEW.order_id, OLD.order_id);
  
  -- Determine order status
  IF all_cancelled THEN
    order_status := 'cancelled';
  ELSIF all_completed THEN
    order_status := 'completed';
  ELSIF any_processing THEN
    order_status := 'processing';
  ELSIF any_collected THEN
    order_status := 'collected';
  ELSE
    order_status := 'pending';
  END IF;
  
  -- Update order status
  UPDATE lab_orders
  SET status = order_status
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lab_order_status
  AFTER INSERT OR UPDATE OR DELETE ON lab_order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_lab_order_status();

COMMENT ON TABLE lab_order_items IS 'Individual tests within a laboratory order';
COMMENT ON COLUMN lab_order_items.status IS 'Item status: pending, collected, processing, completed, cancelled';
COMMENT ON COLUMN lab_order_items.specimen_collected_at IS 'When specimen was collected for this test';
COMMENT ON COLUMN lab_order_items.processing_started_at IS 'When lab started processing this test';
COMMENT ON COLUMN lab_order_items.completed_at IS 'When test results were finalized';
COMMENT ON COLUMN lab_order_items.cancellation_reason IS 'Reason for cancelling this test';
