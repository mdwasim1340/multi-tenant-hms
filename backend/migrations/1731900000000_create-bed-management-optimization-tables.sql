-- Migration: Create Bed Management Optimization Tables
-- Description: AI-powered bed management system with LOS prediction, discharge readiness, transfer optimization, and capacity forecasting
-- Date: 2025-11-20

-- ============================================================================
-- LOS (Length of Stay) Predictions
-- ============================================================================
CREATE TABLE IF NOT EXISTS los_predictions (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  admission_id INTEGER NOT NULL,
  patient_id INTEGER NOT NULL,
  predicted_los_days DECIMAL(5,2) NOT NULL,
  confidence_interval_lower DECIMAL(5,2),
  confidence_interval_upper DECIMAL(5,2),
  prediction_factors JSONB, -- diagnosis, severity, age, comorbidities, admission_source
  actual_los_days DECIMAL(5,2),
  prediction_accuracy DECIMAL(5,2), -- calculated when actual LOS is known
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  CONSTRAINT fk_los_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_los_predictions_tenant ON los_predictions(tenant_id);
CREATE INDEX idx_los_predictions_admission ON los_predictions(admission_id);
CREATE INDEX idx_los_predictions_patient ON los_predictions(patient_id);
CREATE INDEX idx_los_predictions_created_at ON los_predictions(created_at);

-- ============================================================================
-- Bed Assignments with Isolation Tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS bed_assignments (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  bed_id INTEGER NOT NULL,
  patient_id INTEGER NOT NULL,
  assignment_date TIMESTAMP NOT NULL,
  expected_discharge_date TIMESTAMP,
  actual_discharge_date TIMESTAMP,
  isolation_required BOOLEAN DEFAULT FALSE,
  isolation_type VARCHAR(50), -- contact, droplet, airborne
  assignment_score DECIMAL(5,2), -- AI recommendation score
  assignment_reasoning TEXT, -- why this bed was recommended
  status VARCHAR(50) DEFAULT 'active', -- active, completed, cancelled
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  CONSTRAINT fk_bed_assignment_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_bed_assignments_tenant ON bed_assignments(tenant_id);
CREATE INDEX idx_bed_assignments_bed ON bed_assignments(bed_id);
CREATE INDEX idx_bed_assignments_patient ON bed_assignments(patient_id);
CREATE INDEX idx_bed_assignments_status ON bed_assignments(status);
CREATE INDEX idx_bed_assignments_assignment_date ON bed_assignments(assignment_date);

-- ============================================================================
-- Discharge Readiness Predictions
-- ============================================================================
CREATE TABLE IF NOT EXISTS discharge_readiness_predictions (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  patient_id INTEGER NOT NULL,
  admission_id INTEGER NOT NULL,
  medical_readiness_score DECIMAL(5,2) NOT NULL, -- 0-100
  social_readiness_score DECIMAL(5,2) NOT NULL, -- 0-100
  overall_readiness_score DECIMAL(5,2) NOT NULL, -- 0-100
  predicted_discharge_date DATE,
  barriers JSONB, -- array of identified barriers
  recommended_interventions JSONB, -- array of suggested interventions
  discharge_planning_progress DECIMAL(5,2), -- 0-100
  actual_discharge_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  CONSTRAINT fk_discharge_readiness_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_discharge_readiness_tenant ON discharge_readiness_predictions(tenant_id);
CREATE INDEX idx_discharge_readiness_patient ON discharge_readiness_predictions(patient_id);
CREATE INDEX idx_discharge_readiness_admission ON discharge_readiness_predictions(admission_id);
CREATE INDEX idx_discharge_readiness_score ON discharge_readiness_predictions(overall_readiness_score);
CREATE INDEX idx_discharge_readiness_created_at ON discharge_readiness_predictions(created_at);

-- ============================================================================
-- Transfer Priorities (ED to Ward)
-- ============================================================================
CREATE TABLE IF NOT EXISTS transfer_priorities (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  patient_id INTEGER NOT NULL,
  ed_arrival_time TIMESTAMP NOT NULL,
  acuity_score DECIMAL(5,2) NOT NULL, -- 0-100
  wait_time_minutes INTEGER NOT NULL,
  priority_score DECIMAL(5,2) NOT NULL, -- calculated priority
  target_unit VARCHAR(100),
  predicted_bed_availability TIMESTAMP,
  transfer_urgency VARCHAR(50), -- critical, high, medium, low
  boarding_time_minutes INTEGER,
  transfer_completed BOOLEAN DEFAULT FALSE,
  transfer_completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  CONSTRAINT fk_transfer_priority_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_transfer_priorities_tenant ON transfer_priorities(tenant_id);
CREATE INDEX idx_transfer_priorities_patient ON transfer_priorities(patient_id);
CREATE INDEX idx_transfer_priorities_score ON transfer_priorities(priority_score DESC);
CREATE INDEX idx_transfer_priorities_urgency ON transfer_priorities(transfer_urgency);
CREATE INDEX idx_transfer_priorities_completed ON transfer_priorities(transfer_completed);

-- ============================================================================
-- Capacity Forecasts
-- ============================================================================
CREATE TABLE IF NOT EXISTS capacity_forecasts (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  unit_name VARCHAR(100) NOT NULL,
  forecast_date DATE NOT NULL,
  forecast_hours_ahead INTEGER NOT NULL, -- 24, 48, 72
  predicted_census INTEGER NOT NULL,
  predicted_admissions INTEGER,
  predicted_discharges INTEGER,
  predicted_transfers_in INTEGER,
  predicted_transfers_out INTEGER,
  bed_utilization_percentage DECIMAL(5,2),
  surge_capacity_needed BOOLEAN DEFAULT FALSE,
  staffing_recommendations JSONB,
  confidence_level DECIMAL(5,2), -- 0-100
  actual_census INTEGER,
  forecast_accuracy DECIMAL(5,2), -- calculated when actual data is available
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_capacity_forecast_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_capacity_forecasts_tenant ON capacity_forecasts(tenant_id);
CREATE INDEX idx_capacity_forecasts_unit ON capacity_forecasts(unit_name);
CREATE INDEX idx_capacity_forecasts_date ON capacity_forecasts(forecast_date);
CREATE INDEX idx_capacity_forecasts_hours ON capacity_forecasts(forecast_hours_ahead);
CREATE INDEX idx_capacity_forecasts_surge ON capacity_forecasts(surge_capacity_needed);

-- ============================================================================
-- Bed Turnover Metrics
-- ============================================================================
CREATE TABLE IF NOT EXISTS bed_turnover_metrics (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  bed_id INTEGER NOT NULL,
  patient_discharged_at TIMESTAMP NOT NULL,
  cleaning_started_at TIMESTAMP,
  cleaning_completed_at TIMESTAMP,
  bed_ready_at TIMESTAMP,
  turnover_time_minutes INTEGER, -- calculated
  target_turnover_time_minutes INTEGER DEFAULT 120,
  exceeded_target BOOLEAN DEFAULT FALSE,
  housekeeping_priority VARCHAR(50), -- critical, high, normal, low
  housekeeping_staff_id INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bed_turnover_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_bed_turnover_tenant ON bed_turnover_metrics(tenant_id);
CREATE INDEX idx_bed_turnover_bed ON bed_turnover_metrics(bed_id);
CREATE INDEX idx_bed_turnover_discharged_at ON bed_turnover_metrics(patient_discharged_at);
CREATE INDEX idx_bed_turnover_exceeded ON bed_turnover_metrics(exceeded_target);
CREATE INDEX idx_bed_turnover_priority ON bed_turnover_metrics(housekeeping_priority);

-- ============================================================================
-- Bed Management Performance Metrics
-- ============================================================================
CREATE TABLE IF NOT EXISTS bed_management_performance (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  metric_date DATE NOT NULL,
  metric_type VARCHAR(100) NOT NULL, -- los_accuracy, bed_utilization, ed_boarding, capacity_forecast_accuracy, discharge_delay
  metric_value DECIMAL(10,2) NOT NULL,
  metric_unit VARCHAR(50), -- percentage, minutes, days, count
  target_value DECIMAL(10,2),
  variance_from_target DECIMAL(10,2),
  unit_name VARCHAR(100), -- specific unit or 'hospital-wide'
  additional_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bed_performance_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_bed_performance_tenant ON bed_management_performance(tenant_id);
CREATE INDEX idx_bed_performance_date ON bed_management_performance(metric_date);
CREATE INDEX idx_bed_performance_type ON bed_management_performance(metric_type);
CREATE INDEX idx_bed_performance_unit ON bed_management_performance(unit_name);

-- ============================================================================
-- AI Feature Management (for enabling/disabling features)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_feature_management (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  feature_name VARCHAR(100) NOT NULL, -- los_prediction, bed_assignment_optimization, discharge_readiness, transfer_optimization, capacity_forecasting
  enabled BOOLEAN DEFAULT TRUE,
  enabled_at TIMESTAMP,
  disabled_at TIMESTAMP,
  disabled_reason TEXT,
  configuration JSONB, -- feature-specific configuration
  last_modified_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ai_feature_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT unique_tenant_feature UNIQUE (tenant_id, feature_name)
);

CREATE INDEX idx_ai_feature_tenant ON ai_feature_management(tenant_id);
CREATE INDEX idx_ai_feature_name ON ai_feature_management(feature_name);
CREATE INDEX idx_ai_feature_enabled ON ai_feature_management(enabled);

-- ============================================================================
-- AI Feature Audit Log
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_feature_audit_log (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  feature_name VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL, -- enabled, disabled, configured
  previous_state JSONB,
  new_state JSONB,
  reason TEXT,
  performed_by INTEGER NOT NULL,
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ai_audit_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_ai_audit_tenant ON ai_feature_audit_log(tenant_id);
CREATE INDEX idx_ai_audit_feature ON ai_feature_audit_log(feature_name);
CREATE INDEX idx_ai_audit_performed_at ON ai_feature_audit_log(performed_at);
CREATE INDEX idx_ai_audit_performed_by ON ai_feature_audit_log(performed_by);

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE los_predictions IS 'AI-powered length of stay predictions for patient admissions';
COMMENT ON TABLE bed_assignments IS 'Bed assignments with AI recommendations and isolation tracking';
COMMENT ON TABLE discharge_readiness_predictions IS 'AI predictions for patient discharge readiness';
COMMENT ON TABLE transfer_priorities IS 'ED to ward transfer prioritization with AI scoring';
COMMENT ON TABLE capacity_forecasts IS 'Unit-level capacity forecasting for 24/48/72 hours ahead';
COMMENT ON TABLE bed_turnover_metrics IS 'Bed turnover time tracking and housekeeping coordination';
COMMENT ON TABLE bed_management_performance IS 'Performance metrics for bed management system';
COMMENT ON TABLE ai_feature_management IS 'Enable/disable AI features per tenant';
COMMENT ON TABLE ai_feature_audit_log IS 'Audit trail for AI feature changes';


-- ============================================================================
-- AI Feature Audit Log
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_feature_audit_log (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  feature_name VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL, -- enable, disable, configure
  performed_by VARCHAR(255) NOT NULL,
  reason TEXT,
  previous_state JSONB,
  new_state JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_log_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_audit_log_tenant ON ai_feature_audit_log(tenant_id);
CREATE INDEX idx_audit_log_feature ON ai_feature_audit_log(feature_name);
CREATE INDEX idx_audit_log_created_at ON ai_feature_audit_log(created_at);
