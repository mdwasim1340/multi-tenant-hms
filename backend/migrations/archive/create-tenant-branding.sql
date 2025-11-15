-- Migration: Create tenant_branding table
-- Purpose: Store custom branding configuration for each tenant
-- Requirements: 7.1, 7.2, 7.3

-- Create tenant_branding table
CREATE TABLE IF NOT EXISTS tenant_branding (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) UNIQUE NOT NULL,
  logo_url TEXT,
  logo_small_url TEXT,
  logo_medium_url TEXT,
  logo_large_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#1e40af',
  secondary_color VARCHAR(7) DEFAULT '#3b82f6',
  accent_color VARCHAR(7) DEFAULT '#60a5fa',
  custom_css TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tenant_branding_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Create index for fast tenant lookups
CREATE INDEX IF NOT EXISTS idx_tenant_branding_tenant_id ON tenant_branding(tenant_id);

-- Add comments to document the table and columns
COMMENT ON TABLE tenant_branding IS 'Stores custom branding configuration (logo, colors, CSS) for each tenant';
COMMENT ON COLUMN tenant_branding.tenant_id IS 'Foreign key to tenants table (one-to-one relationship)';
COMMENT ON COLUMN tenant_branding.logo_url IS 'URL to original uploaded logo in S3';
COMMENT ON COLUMN tenant_branding.logo_small_url IS 'URL to small logo (64x64) in S3';
COMMENT ON COLUMN tenant_branding.logo_medium_url IS 'URL to medium logo (128x128) in S3';
COMMENT ON COLUMN tenant_branding.logo_large_url IS 'URL to large logo (256x256) in S3';
COMMENT ON COLUMN tenant_branding.primary_color IS 'Primary brand color in hex format (#RRGGBB)';
COMMENT ON COLUMN tenant_branding.secondary_color IS 'Secondary brand color in hex format (#RRGGBB)';
COMMENT ON COLUMN tenant_branding.accent_color IS 'Accent brand color in hex format (#RRGGBB)';
COMMENT ON COLUMN tenant_branding.custom_css IS 'Custom CSS for advanced branding (sanitized)';
