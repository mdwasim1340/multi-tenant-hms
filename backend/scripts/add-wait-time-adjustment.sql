-- Add wait_time_adjustment column to all tenant schemas

SET search_path TO "demo_hospital_001";
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS wait_time_adjustment INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS appointments_wait_time_adjustment_idx ON appointments(wait_time_adjustment);

SET search_path TO "tenant_1762083064503";
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS wait_time_adjustment INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS appointments_wait_time_adjustment_idx ON appointments(wait_time_adjustment);

SET search_path TO "tenant_1762083064515";
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS wait_time_adjustment INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS appointments_wait_time_adjustment_idx ON appointments(wait_time_adjustment);

SET search_path TO "tenant_1762083586064";
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS wait_time_adjustment INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS appointments_wait_time_adjustment_idx ON appointments(wait_time_adjustment);

SET search_path TO "tenant_1762276589673";
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS wait_time_adjustment INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS appointments_wait_time_adjustment_idx ON appointments(wait_time_adjustment);

SET search_path TO "tenant_1762276735123";
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS wait_time_adjustment INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS appointments_wait_time_adjustment_idx ON appointments(wait_time_adjustment);

SET search_path TO "tenant_aajmin_polyclinic";
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS wait_time_adjustment INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS appointments_wait_time_adjustment_idx ON appointments(wait_time_adjustment);
