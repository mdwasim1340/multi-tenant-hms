-- Add wait_time_adjustment column to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS wait_time_adjustment INTEGER DEFAULT 0;

-- Create index for wait_time_adjustment
CREATE INDEX IF NOT EXISTS appointments_wait_time_adjustment_idx ON appointments(wait_time_adjustment);
