-- Migration: Create Audit Logs System
-- Purpose: HIPAA compliance - track all medical record operations
-- Date: November 18, 2025

-- Create audit_logs table in public schema (cross-tenant audit trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  user_id INTEGER NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id INTEGER,
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX idx_audit_logs_tenant ON public.audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

-- Create composite index for common queries
CREATE INDEX idx_audit_logs_tenant_resource ON public.audit_logs(tenant_id, resource_type, created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE public.audit_logs IS 'Audit trail for all system operations - HIPAA compliance';
COMMENT ON COLUMN public.audit_logs.tenant_id IS 'Tenant identifier for multi-tenant isolation';
COMMENT ON COLUMN public.audit_logs.user_id IS 'User who performed the action';
COMMENT ON COLUMN public.audit_logs.action IS 'Action performed (CREATE, UPDATE, DELETE, VIEW, DOWNLOAD, etc.)';
COMMENT ON COLUMN public.audit_logs.resource_type IS 'Type of resource (medical_record, patient, appointment, etc.)';
COMMENT ON COLUMN public.audit_logs.resource_id IS 'ID of the affected resource';
COMMENT ON COLUMN public.audit_logs.changes IS 'JSON object containing before/after values for updates';
COMMENT ON COLUMN public.audit_logs.ip_address IS 'IP address of the user';
COMMENT ON COLUMN public.audit_logs.user_agent IS 'Browser/client user agent string';
COMMENT ON COLUMN public.audit_logs.created_at IS 'Timestamp of the action';
