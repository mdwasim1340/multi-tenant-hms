-- Create Bed Categories Migration
-- Creates tables for bed categories management

-- Bed categories table
CREATE TABLE IF NOT EXISTS bed_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color code for UI display
    icon VARCHAR(50) DEFAULT 'bed', -- Icon name for UI display
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    updated_by INTEGER NOT NULL,
    UNIQUE(name)
);

-- Add category_id to beds table
ALTER TABLE beds ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES bed_categories(id);

-- Insert default bed categories
INSERT INTO bed_categories (name, description, color, icon, created_by, updated_by) VALUES
    ('Standard', 'Standard hospital beds for general patients', '#3B82F6', 'bed', 1, 1),
    ('ICU', 'Intensive Care Unit beds with advanced monitoring', '#EF4444', 'activity', 1, 1),
    ('Isolation', 'Isolation beds for infectious disease control', '#F59E0B', 'shield', 1, 1),
    ('Pediatric', 'Specialized beds for children and infants', '#10B981', 'baby', 1, 1),
    ('Bariatric', 'Heavy-duty beds for bariatric patients', '#8B5CF6', 'weight', 1, 1),
    ('Maternity', 'Specialized beds for maternity care', '#EC4899', 'heart', 1, 1),
    ('Recovery', 'Post-operative recovery beds', '#06B6D4', 'refresh-cw', 1, 1),
    ('Emergency', 'Emergency department beds for urgent care', '#F97316', 'zap', 1, 1)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bed_categories_name ON bed_categories(name);
CREATE INDEX IF NOT EXISTS idx_bed_categories_is_active ON bed_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_beds_category_id ON beds(category_id);

-- Add trigger for updated_at timestamp
CREATE TRIGGER update_bed_categories_updated_at BEFORE UPDATE ON bed_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update existing beds to have default categories based on bed_type
UPDATE beds SET category_id = (
    SELECT id FROM bed_categories 
    WHERE LOWER(bed_categories.name) = LOWER(beds.bed_type)
    LIMIT 1
) WHERE category_id IS NULL;

-- Set default category for beds without matching category
UPDATE beds SET category_id = (
    SELECT id FROM bed_categories WHERE name = 'Standard' LIMIT 1
) WHERE category_id IS NULL;