-- Migration: Add subdomain column to tenants table
-- Purpose: Enable subdomain-based tenant detection
-- Requirements: 2.4, 11.2

-- Add subdomain column to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subdomain VARCHAR(63) UNIQUE;

-- Create index for fast subdomain lookups
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);

-- Add comment to document the column
COMMENT ON COLUMN tenants.subdomain IS 'Unique subdomain for tenant access (e.g., citygeneral in citygeneral.yourhospitalsystem.com)';
