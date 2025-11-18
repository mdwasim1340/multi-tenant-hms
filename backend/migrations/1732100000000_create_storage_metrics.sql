-- Migration: Create Storage Metrics System
-- Purpose: Cost monitoring and optimization for S3 storage
-- Date: November 18, 2025

-- Create storage_metrics table for tracking storage usage and costs
CREATE TABLE IF NOT EXISTS public.storage_metrics (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  total_size_bytes BIGINT NOT NULL DEFAULT 0,
  file_count INTEGER NOT NULL DEFAULT 0,
  storage_class_breakdown JSONB NOT NULL DEFAULT '{}',
  estimated_monthly_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  cost_breakdown JSONB NOT NULL DEFAULT '{}',
  compression_savings_bytes BIGINT DEFAULT 0,
  compression_ratio DECIMAL(5,2) DEFAULT 0.00,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create cost_alerts table for threshold notifications
CREATE TABLE IF NOT EXISTS public.cost_alerts (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  alert_type VARCHAR(50) NOT NULL, -- 'threshold', 'spike', 'trend'
  threshold_amount DECIMAL(10,2),
  current_amount DECIMAL(10,2),
  alert_message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

-- Create file_access_logs table for tracking access patterns
CREATE TABLE IF NOT EXISTS public.file_access_logs (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  file_id VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  access_type VARCHAR(20) NOT NULL, -- 'download', 'view', 'upload'
  user_id INTEGER,
  file_size_bytes BIGINT,
  storage_class VARCHAR(50),
  accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX idx_storage_metrics_tenant ON public.storage_metrics(tenant_id);
CREATE INDEX idx_storage_metrics_recorded ON public.storage_metrics(recorded_at DESC);
CREATE INDEX idx_storage_metrics_tenant_recorded ON public.storage_metrics(tenant_id, recorded_at DESC);

CREATE INDEX idx_cost_alerts_tenant ON public.cost_alerts(tenant_id);
CREATE INDEX idx_cost_alerts_active ON public.cost_alerts(is_active, created_at DESC);
CREATE INDEX idx_cost_alerts_tenant_active ON public.cost_alerts(tenant_id, is_active);

CREATE INDEX idx_file_access_tenant ON public.file_access_logs(tenant_id);
CREATE INDEX idx_file_access_file ON public.file_access_logs(file_id);
CREATE INDEX idx_file_access_accessed ON public.file_access_logs(accessed_at DESC);
CREATE INDEX idx_file_access_tenant_accessed ON public.file_access_logs(tenant_id, accessed_at DESC);

-- Add comments for documentation
COMMENT ON TABLE public.storage_metrics IS 'Storage usage and cost metrics per tenant';
COMMENT ON COLUMN public.storage_metrics.tenant_id IS 'Tenant identifier';
COMMENT ON COLUMN public.storage_metrics.total_size_bytes IS 'Total storage size in bytes';
COMMENT ON COLUMN public.storage_metrics.file_count IS 'Total number of files';
COMMENT ON COLUMN public.storage_metrics.storage_class_breakdown IS 'JSON object with storage class usage';
COMMENT ON COLUMN public.storage_metrics.estimated_monthly_cost IS 'Estimated monthly cost in USD';
COMMENT ON COLUMN public.storage_metrics.cost_breakdown IS 'JSON object with cost breakdown by storage class';
COMMENT ON COLUMN public.storage_metrics.compression_savings_bytes IS 'Bytes saved through compression';
COMMENT ON COLUMN public.storage_metrics.compression_ratio IS 'Compression ratio (0.0 to 1.0)';

COMMENT ON TABLE public.cost_alerts IS 'Cost threshold alerts and notifications';
COMMENT ON COLUMN public.cost_alerts.alert_type IS 'Type of alert (threshold, spike, trend)';
COMMENT ON COLUMN public.cost_alerts.threshold_amount IS 'Alert threshold amount';
COMMENT ON COLUMN public.cost_alerts.current_amount IS 'Current amount that triggered alert';

COMMENT ON TABLE public.file_access_logs IS 'File access patterns for Intelligent-Tiering optimization';
COMMENT ON COLUMN public.file_access_logs.access_type IS 'Type of access (download, view, upload)';
COMMENT ON COLUMN public.file_access_logs.storage_class IS 'Current S3 storage class';