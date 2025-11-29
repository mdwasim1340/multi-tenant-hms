-- Equipment Maintenance Table
CREATE TABLE IF NOT EXISTS equipment_maintenance (
  id SERIAL PRIMARY KEY,
  equipment_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  maintenance_type VARCHAR(50) NOT NULL CHECK (maintenance_type IN ('preventive', 'corrective', 'calibration', 'inspection')),
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  next_maintenance_date DATE,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'overdue')),
  technician_name VARCHAR(100),
  cost DECIMAL(10, 2),
  description TEXT,
  findings TEXT,
  recommendations TEXT,
  parts_replaced TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER NOT NULL,
  updated_by INTEGER
);

CREATE INDEX idx_equipment_maintenance_equipment ON equipment_maintenance(equipment_id);
CREATE INDEX idx_equipment_maintenance_type ON equipment_maintenance(maintenance_type);
CREATE INDEX idx_equipment_maintenance_status ON equipment_maintenance(status);
CREATE INDEX idx_equipment_maintenance_scheduled_date ON equipment_maintenance(scheduled_date);
CREATE INDEX idx_equipment_maintenance_next_date ON equipment_maintenance(next_maintenance_date);

CREATE OR REPLACE FUNCTION update_equipment_maintenance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_equipment_maintenance_updated_at
BEFORE UPDATE ON equipment_maintenance
FOR EACH ROW
EXECUTE FUNCTION update_equipment_maintenance_updated_at();
