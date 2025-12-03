-- Team Alpha - File Access Logs Migration
-- Track file access patterns for S3 Intelligent-Tiering optimization

-- Create file_access_logs table
CREATE TABLE file_access_logs (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  file_id VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  access_type VARCHAR(50) NOT NULL, -- 'download', 'view', 'upload'
  user_id INTEGER,
  file_size_bytes BIGINT,
  storage_class VARCHAR(50), -- 'STANDARD', 'STANDARD_IA', 'GLACIER', etc.
  access_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT
);

-- Create indexes for efficient queries
CREATE INDEX idx_file_access_tenant ON file_access_logs(tenant_id);
CREATE INDEX idx_file_access_file ON file_access_logs(file_id);
CREATE INDEX idx_file_access_time ON file_access_logs(access_time);
CREATE INDEX idx_file_access_type ON file_access_logs(access_type);
CREATE INDEX idx_file_access_user ON file_access_logs(user_id);
CREATE INDEX idx_file_access_storage_class ON file_access_logs(storage_class);
CREATE INDEX idx_file_access_success ON file_access_logs(success);

-- Create composite indexes for common queries
CREATE INDEX idx_file_access_tenant_file ON file_access_logs(tenant_id, file_id);
CREATE INDEX idx_file_access_tenant_time ON file_access_logs(tenant_id, access_time);
CREATE INDEX idx_file_access_file_time ON file_access_logs(file_id, access_time);

-- Add comments for documentation
COMMENT ON TABLE file_access_logs IS 'Track file access patterns for S3 Intelligent-Tiering optimization';
COMMENT ON COLUMN file_access_logs.tenant_id IS 'Tenant identifier for multi-tenant isolation';
COMMENT ON COLUMN file_access_logs.file_id IS 'Unique file identifier (filename or UUID)';
COMMENT ON COLUMN file_access_logs.file_path IS 'Full S3 key path to the file';
COMMENT ON COLUMN file_access_logs.access_type IS 'Type of access: download, view, upload';
COMMENT ON COLUMN file_access_logs.user_id IS 'User who accessed the file (optional)';
COMMENT ON COLUMN file_access_logs.file_size_bytes IS 'File size in bytes for cost calculations';
COMMENT ON COLUMN file_access_logs.storage_class IS 'Current S3 storage class of the file';
COMMENT ON COLUMN file_access_logs.access_time IS 'When the file was accessed';
COMMENT ON COLUMN file_access_logs.ip_address IS 'IP address of the client';
COMMENT ON COLUMN file_access_logs.user_agent IS 'User agent string for analytics';
COMMENT ON COLUMN file_access_logs.response_time_ms IS 'Response time in milliseconds';
COMMENT ON COLUMN file_access_logs.success IS 'Whether the access was successful';
COMMENT ON COLUMN file_access_logs.error_message IS 'Error message if access failed';

-- Create access pattern analysis view
CREATE VIEW file_access_patterns AS
SELECT 
  tenant_id,
  file_id,
  file_path,
  COUNT(*) as total_accesses,
  COUNT(DISTINCT user_id) as unique_users,
  MAX(access_time) as last_accessed,
  MIN(access_time) as first_accessed,
  AVG(file_size_bytes) as avg_file_size,
  COUNT(CASE WHEN access_type = 'download' THEN 1 END) as download_count,
  COUNT(CASE WHEN access_type = 'view' THEN 1 END) as view_count,
  COUNT(CASE WHEN success = false THEN 1 END) as error_count,
  AVG(response_time_ms) as avg_response_time,
  -- Calculate access frequency (accesses per day)
  CASE 
    WHEN MAX(access_time) = MIN(access_time) THEN COUNT(*)
    ELSE COUNT(*) / GREATEST(1, EXTRACT(DAYS FROM (MAX(access_time) - MIN(access_time))))
  END as accesses_per_day,
  -- Determine recommended storage class based on access patterns
  CASE 
    WHEN MAX(access_time) < NOW() - INTERVAL '180 days' THEN 'DEEP_ARCHIVE'
    WHEN MAX(access_time) < NOW() - INTERVAL '90 days' THEN 'GLACIER'
    WHEN MAX(access_time) < NOW() - INTERVAL '30 days' THEN 'STANDARD_IA'
    ELSE 'STANDARD'
  END as recommended_storage_class
FROM file_access_logs
GROUP BY tenant_id, file_id, file_path;

COMMENT ON VIEW file_access_patterns IS 'Analyze file access patterns for storage optimization';

-- Create function to get access statistics for a tenant
CREATE OR REPLACE FUNCTION get_tenant_access_stats(p_tenant_id VARCHAR(255))
RETURNS TABLE (
  total_files BIGINT,
  total_accesses BIGINT,
  unique_users BIGINT,
  avg_accesses_per_file NUMERIC,
  files_not_accessed_30_days BIGINT,
  files_not_accessed_90_days BIGINT,
  files_not_accessed_180_days BIGINT,
  recommended_standard BIGINT,
  recommended_standard_ia BIGINT,
  recommended_glacier BIGINT,
  recommended_deep_archive BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT fap.file_id) as total_files,
    SUM(fap.total_accesses) as total_accesses,
    COUNT(DISTINCT fal.user_id) as unique_users,
    AVG(fap.total_accesses) as avg_accesses_per_file,
    COUNT(CASE WHEN fap.last_accessed < NOW() - INTERVAL '30 days' THEN 1 END) as files_not_accessed_30_days,
    COUNT(CASE WHEN fap.last_accessed < NOW() - INTERVAL '90 days' THEN 1 END) as files_not_accessed_90_days,
    COUNT(CASE WHEN fap.last_accessed < NOW() - INTERVAL '180 days' THEN 1 END) as files_not_accessed_180_days,
    COUNT(CASE WHEN fap.recommended_storage_class = 'STANDARD' THEN 1 END) as recommended_standard,
    COUNT(CASE WHEN fap.recommended_storage_class = 'STANDARD_IA' THEN 1 END) as recommended_standard_ia,
    COUNT(CASE WHEN fap.recommended_storage_class = 'GLACIER' THEN 1 END) as recommended_glacier,
    COUNT(CASE WHEN fap.recommended_storage_class = 'DEEP_ARCHIVE' THEN 1 END) as recommended_deep_archive
  FROM file_access_patterns fap
  LEFT JOIN file_access_logs fal ON fap.tenant_id = fal.tenant_id AND fap.file_id = fal.file_id
  WHERE fap.tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_tenant_access_stats IS 'Get comprehensive access statistics for a tenant';

-- Create function to recommend storage class transitions
CREATE OR REPLACE FUNCTION recommend_storage_transitions(p_tenant_id VARCHAR(255))
RETURNS TABLE (
  file_id VARCHAR(255),
  file_path VARCHAR(500),
  current_storage_class VARCHAR(50),
  recommended_storage_class VARCHAR(50),
  last_accessed TIMESTAMP,
  total_accesses BIGINT,
  potential_savings_percent INTEGER,
  file_size_bytes BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fap.file_id,
    fap.file_path,
    COALESCE(fal.storage_class, 'STANDARD') as current_storage_class,
    fap.recommended_storage_class,
    fap.last_accessed,
    fap.total_accesses,
    CASE fap.recommended_storage_class
      WHEN 'STANDARD_IA' THEN 46
      WHEN 'GLACIER' THEN 83
      WHEN 'DEEP_ARCHIVE' THEN 96
      ELSE 0
    END as potential_savings_percent,
    fap.avg_file_size::BIGINT as file_size_bytes
  FROM file_access_patterns fap
  LEFT JOIN (
    SELECT DISTINCT ON (file_id) file_id, storage_class
    FROM file_access_logs
    WHERE tenant_id = p_tenant_id
    ORDER BY file_id, access_time DESC
  ) fal ON fap.file_id = fal.file_id
  WHERE fap.tenant_id = p_tenant_id
    AND fap.recommended_storage_class != COALESCE(fal.storage_class, 'STANDARD')
  ORDER BY fap.avg_file_size DESC, fap.last_accessed ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION recommend_storage_transitions IS 'Recommend storage class transitions for cost optimization';