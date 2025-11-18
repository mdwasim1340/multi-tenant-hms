-- Team Alpha - Medical Record Templates Migration
-- Create template system for medical records

-- Create medical_record_templates table
CREATE TABLE medical_record_templates (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_type VARCHAR(100) NOT NULL, -- 'consultation', 'follow_up', 'emergency', 'procedure', 'discharge'
  specialty VARCHAR(100), -- 'cardiology', 'neurology', 'general', 'pediatrics', etc.
  fields JSONB NOT NULL, -- Template field definitions
  default_values JSONB, -- Default values for fields
  validation_rules JSONB, -- Field validation rules
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  version INTEGER DEFAULT 1,
  parent_template_id INTEGER REFERENCES medical_record_templates(id),
  created_by INTEGER NOT NULL, -- References public.users.id
  updated_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_templates_tenant ON medical_record_templates(tenant_id);
CREATE INDEX idx_templates_type ON medical_record_templates(template_type);
CREATE INDEX idx_templates_specialty ON medical_record_templates(specialty);
CREATE INDEX idx_templates_active ON medical_record_templates(is_active);
CREATE INDEX idx_templates_default ON medical_record_templates(is_default);
CREATE INDEX idx_templates_created_by ON medical_record_templates(created_by);
CREATE INDEX idx_templates_parent ON medical_record_templates(parent_template_id);

-- Create composite indexes for common queries
CREATE INDEX idx_templates_tenant_type ON medical_record_templates(tenant_id, template_type);
CREATE INDEX idx_templates_tenant_specialty ON medical_record_templates(tenant_id, specialty);
CREATE INDEX idx_templates_tenant_active ON medical_record_templates(tenant_id, is_active);

-- Add comments for documentation
COMMENT ON TABLE medical_record_templates IS 'Templates for medical record creation with predefined fields and validation';
COMMENT ON COLUMN medical_record_templates.tenant_id IS 'Tenant identifier for multi-tenant isolation';
COMMENT ON COLUMN medical_record_templates.name IS 'Human-readable template name';
COMMENT ON COLUMN medical_record_templates.description IS 'Detailed description of template purpose';
COMMENT ON COLUMN medical_record_templates.template_type IS 'Type of medical record: consultation, follow_up, emergency, procedure, discharge';
COMMENT ON COLUMN medical_record_templates.specialty IS 'Medical specialty this template is designed for';
COMMENT ON COLUMN medical_record_templates.fields IS 'JSON definition of template fields with types and properties';
COMMENT ON COLUMN medical_record_templates.default_values IS 'Default values for template fields';
COMMENT ON COLUMN medical_record_templates.validation_rules IS 'Validation rules for template fields';
COMMENT ON COLUMN medical_record_templates.is_default IS 'Whether this is the default template for its type/specialty';
COMMENT ON COLUMN medical_record_templates.is_active IS 'Whether this template is currently active';
COMMENT ON COLUMN medical_record_templates.version IS 'Template version number';
COMMENT ON COLUMN medical_record_templates.parent_template_id IS 'Parent template for versioning';
COMMENT ON COLUMN medical_record_templates.created_by IS 'User who created this template';
COMMENT ON COLUMN medical_record_templates.updated_by IS 'User who last updated this template';

-- Create template usage tracking table
CREATE TABLE medical_record_template_usage (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  template_id INTEGER NOT NULL REFERENCES medical_record_templates(id) ON DELETE CASCADE,
  medical_record_id INTEGER NOT NULL, -- References tenant-specific medical_records.id
  user_id INTEGER NOT NULL, -- References public.users.id
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  customizations JSONB, -- Any customizations made to the template
  completion_time_seconds INTEGER -- Time taken to complete the record
);

-- Create indexes for usage tracking
CREATE INDEX idx_template_usage_tenant ON medical_record_template_usage(tenant_id);
CREATE INDEX idx_template_usage_template ON medical_record_template_usage(template_id);
CREATE INDEX idx_template_usage_record ON medical_record_template_usage(medical_record_id);
CREATE INDEX idx_template_usage_user ON medical_record_template_usage(user_id);
CREATE INDEX idx_template_usage_used_at ON medical_record_template_usage(used_at);

-- Create composite indexes for analytics
CREATE INDEX idx_template_usage_tenant_template ON medical_record_template_usage(tenant_id, template_id);
CREATE INDEX idx_template_usage_tenant_user ON medical_record_template_usage(tenant_id, user_id);

COMMENT ON TABLE medical_record_template_usage IS 'Track usage of medical record templates for analytics';
COMMENT ON COLUMN medical_record_template_usage.tenant_id IS 'Tenant identifier for multi-tenant isolation';
COMMENT ON COLUMN medical_record_template_usage.template_id IS 'Template that was used';
COMMENT ON COLUMN medical_record_template_usage.medical_record_id IS 'Medical record created from template';
COMMENT ON COLUMN medical_record_template_usage.user_id IS 'User who used the template';
COMMENT ON COLUMN medical_record_template_usage.used_at IS 'When the template was used';
COMMENT ON COLUMN medical_record_template_usage.customizations IS 'Any customizations made to the template';
COMMENT ON COLUMN medical_record_template_usage.completion_time_seconds IS 'Time taken to complete the record';

-- Create function to get template statistics
CREATE OR REPLACE FUNCTION get_template_statistics(p_tenant_id VARCHAR(255))
RETURNS TABLE (
  template_id INTEGER,
  template_name VARCHAR(255),
  template_type VARCHAR(100),
  specialty VARCHAR(100),
  usage_count BIGINT,
  unique_users BIGINT,
  avg_completion_time NUMERIC,
  last_used TIMESTAMP,
  is_popular BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as template_id,
    t.name as template_name,
    t.template_type,
    t.specialty,
    COUNT(u.id) as usage_count,
    COUNT(DISTINCT u.user_id) as unique_users,
    AVG(u.completion_time_seconds) as avg_completion_time,
    MAX(u.used_at) as last_used,
    COUNT(u.id) > 10 as is_popular -- Popular if used more than 10 times
  FROM medical_record_templates t
  LEFT JOIN medical_record_template_usage u ON t.id = u.template_id
  WHERE t.tenant_id = p_tenant_id AND t.is_active = true
  GROUP BY t.id, t.name, t.template_type, t.specialty
  ORDER BY usage_count DESC, t.name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_template_statistics IS 'Get usage statistics for medical record templates';

-- Create function to get recommended templates for a user
CREATE OR REPLACE FUNCTION get_recommended_templates(
  p_tenant_id VARCHAR(255),
  p_user_id INTEGER,
  p_specialty VARCHAR(100) DEFAULT NULL,
  p_template_type VARCHAR(100) DEFAULT NULL
)
RETURNS TABLE (
  template_id INTEGER,
  template_name VARCHAR(255),
  template_type VARCHAR(100),
  specialty VARCHAR(100),
  description TEXT,
  usage_count BIGINT,
  user_usage_count BIGINT,
  avg_completion_time NUMERIC,
  recommendation_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as template_id,
    t.name as template_name,
    t.template_type,
    t.specialty,
    t.description,
    COUNT(u.id) as usage_count,
    COUNT(CASE WHEN u.user_id = p_user_id THEN 1 END) as user_usage_count,
    AVG(u.completion_time_seconds) as avg_completion_time,
    -- Recommendation score based on usage, user preference, and specialty match
    (
      COUNT(u.id) * 0.4 + -- General popularity
      COUNT(CASE WHEN u.user_id = p_user_id THEN 1 END) * 0.3 + -- User preference
      CASE WHEN t.specialty = p_specialty THEN 20 ELSE 0 END + -- Specialty match
      CASE WHEN t.template_type = p_template_type THEN 15 ELSE 0 END + -- Type match
      CASE WHEN t.is_default THEN 10 ELSE 0 END -- Default template bonus
    ) as recommendation_score
  FROM medical_record_templates t
  LEFT JOIN medical_record_template_usage u ON t.id = u.template_id
  WHERE t.tenant_id = p_tenant_id 
    AND t.is_active = true
    AND (p_specialty IS NULL OR t.specialty = p_specialty OR t.specialty IS NULL)
    AND (p_template_type IS NULL OR t.template_type = p_template_type)
  GROUP BY t.id, t.name, t.template_type, t.specialty, t.description, t.is_default
  ORDER BY recommendation_score DESC, usage_count DESC, t.name
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_recommended_templates IS 'Get recommended templates for a user based on usage patterns and preferences';

-- Insert default templates for common medical record types
INSERT INTO medical_record_templates (
  tenant_id, name, description, template_type, specialty, fields, default_values, validation_rules, is_default, created_by
) VALUES 
-- General Consultation Template
('default', 'General Consultation', 'Standard consultation template for general practice', 'consultation', 'general', 
'{
  "chief_complaint": {"type": "textarea", "label": "Chief Complaint", "required": true, "placeholder": "Patient''s main concern"},
  "history_present_illness": {"type": "textarea", "label": "History of Present Illness", "required": true, "placeholder": "Detailed history of current symptoms"},
  "past_medical_history": {"type": "textarea", "label": "Past Medical History", "required": false, "placeholder": "Previous medical conditions"},
  "medications": {"type": "textarea", "label": "Current Medications", "required": false, "placeholder": "List current medications"},
  "allergies": {"type": "text", "label": "Allergies", "required": false, "placeholder": "Known allergies"},
  "physical_examination": {"type": "textarea", "label": "Physical Examination", "required": true, "placeholder": "Physical examination findings"},
  "vital_signs": {
    "type": "object",
    "label": "Vital Signs",
    "fields": {
      "blood_pressure": {"type": "text", "label": "Blood Pressure", "placeholder": "120/80"},
      "heart_rate": {"type": "number", "label": "Heart Rate (bpm)", "placeholder": "72"},
      "temperature": {"type": "number", "label": "Temperature (°F)", "placeholder": "98.6"},
      "respiratory_rate": {"type": "number", "label": "Respiratory Rate", "placeholder": "16"},
      "oxygen_saturation": {"type": "number", "label": "O2 Saturation (%)", "placeholder": "98"}
    }
  },
  "assessment": {"type": "textarea", "label": "Assessment", "required": true, "placeholder": "Clinical assessment and diagnosis"},
  "plan": {"type": "textarea", "label": "Plan", "required": true, "placeholder": "Treatment plan and follow-up"},
  "follow_up": {"type": "select", "label": "Follow-up Required", "options": ["None", "1 week", "2 weeks", "1 month", "3 months", "6 months"], "default": "None"}
}',
'{}',
'{
  "chief_complaint": {"minLength": 10, "maxLength": 500},
  "history_present_illness": {"minLength": 20, "maxLength": 2000},
  "vital_signs.heart_rate": {"min": 30, "max": 200},
  "vital_signs.temperature": {"min": 90, "max": 110},
  "vital_signs.oxygen_saturation": {"min": 70, "max": 100}
}',
true, 1),

-- Emergency Department Template
('default', 'Emergency Department Visit', 'Template for emergency department consultations', 'emergency', 'emergency', 
'{
  "chief_complaint": {"type": "textarea", "label": "Chief Complaint", "required": true, "placeholder": "Primary reason for ED visit"},
  "triage_level": {"type": "select", "label": "Triage Level", "required": true, "options": ["1 - Resuscitation", "2 - Emergent", "3 - Urgent", "4 - Less Urgent", "5 - Non-urgent"]},
  "history_present_illness": {"type": "textarea", "label": "History of Present Illness", "required": true, "placeholder": "Detailed history of current symptoms"},
  "pain_scale": {"type": "select", "label": "Pain Scale (0-10)", "options": ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]},
  "vital_signs": {
    "type": "object",
    "label": "Vital Signs",
    "required": true,
    "fields": {
      "blood_pressure": {"type": "text", "label": "Blood Pressure", "required": true},
      "heart_rate": {"type": "number", "label": "Heart Rate (bpm)", "required": true},
      "temperature": {"type": "number", "label": "Temperature (°F)", "required": true},
      "respiratory_rate": {"type": "number", "label": "Respiratory Rate", "required": true},
      "oxygen_saturation": {"type": "number", "label": "O2 Saturation (%)", "required": true}
    }
  },
  "physical_examination": {"type": "textarea", "label": "Physical Examination", "required": true, "placeholder": "Focused physical examination"},
  "diagnostic_tests": {"type": "textarea", "label": "Diagnostic Tests", "required": false, "placeholder": "Labs, imaging, other tests ordered"},
  "diagnosis": {"type": "textarea", "label": "ED Diagnosis", "required": true, "placeholder": "Emergency department diagnosis"},
  "treatment": {"type": "textarea", "label": "Treatment Provided", "required": true, "placeholder": "Treatments and interventions"},
  "disposition": {"type": "select", "label": "Disposition", "required": true, "options": ["Discharge", "Admit", "Transfer", "AMA", "Observation"]}
}',
'{"triage_level": "3 - Urgent", "pain_scale": "0"}',
'{
  "chief_complaint": {"minLength": 5, "maxLength": 500},
  "vital_signs.heart_rate": {"min": 30, "max": 250},
  "vital_signs.temperature": {"min": 90, "max": 110},
  "vital_signs.oxygen_saturation": {"min": 70, "max": 100}
}',
true, 1),

-- Follow-up Visit Template
('default', 'Follow-up Visit', 'Template for follow-up appointments', 'follow_up', 'general', 
'{
  "reason_for_followup": {"type": "textarea", "label": "Reason for Follow-up", "required": true, "placeholder": "Reason for this follow-up visit"},
  "interval_history": {"type": "textarea", "label": "Interval History", "required": true, "placeholder": "What has happened since last visit"},
  "current_symptoms": {"type": "textarea", "label": "Current Symptoms", "required": false, "placeholder": "Current symptoms or concerns"},
  "medication_compliance": {"type": "select", "label": "Medication Compliance", "options": ["Excellent", "Good", "Fair", "Poor", "Not applicable"]},
  "vital_signs": {
    "type": "object",
    "label": "Vital Signs",
    "fields": {
      "blood_pressure": {"type": "text", "label": "Blood Pressure"},
      "heart_rate": {"type": "number", "label": "Heart Rate (bpm)"},
      "weight": {"type": "number", "label": "Weight (lbs)"}
    }
  },
  "physical_examination": {"type": "textarea", "label": "Physical Examination", "required": true, "placeholder": "Focused examination findings"},
  "assessment": {"type": "textarea", "label": "Assessment", "required": true, "placeholder": "Current status and assessment"},
  "plan_changes": {"type": "textarea", "label": "Plan Changes", "required": false, "placeholder": "Any changes to treatment plan"},
  "next_followup": {"type": "select", "label": "Next Follow-up", "options": ["1 week", "2 weeks", "1 month", "3 months", "6 months", "1 year", "PRN"]}
}',
'{"medication_compliance": "Good", "next_followup": "3 months"}',
'{}',
true, 1),

-- Procedure Note Template
('default', 'Procedure Note', 'Template for documenting medical procedures', 'procedure', 'general', 
'{
  "procedure_name": {"type": "text", "label": "Procedure Name", "required": true, "placeholder": "Name of procedure performed"},
  "indication": {"type": "textarea", "label": "Indication", "required": true, "placeholder": "Medical indication for procedure"},
  "consent": {"type": "select", "label": "Consent Obtained", "required": true, "options": ["Yes - Written", "Yes - Verbal", "Emergency/Implied"]},
  "anesthesia": {"type": "select", "label": "Anesthesia", "options": ["Local", "Conscious Sedation", "General", "Regional", "None"]},
  "procedure_details": {"type": "textarea", "label": "Procedure Details", "required": true, "placeholder": "Detailed description of procedure performed"},
  "complications": {"type": "textarea", "label": "Complications", "required": false, "placeholder": "Any complications encountered"},
  "specimens": {"type": "textarea", "label": "Specimens", "required": false, "placeholder": "Specimens obtained and sent for analysis"},
  "estimated_blood_loss": {"type": "text", "label": "Estimated Blood Loss", "required": false, "placeholder": "e.g., Minimal, 50ml"},
  "post_procedure_condition": {"type": "select", "label": "Post-Procedure Condition", "required": true, "options": ["Stable", "Improved", "Unchanged", "Worse"]},
  "post_procedure_instructions": {"type": "textarea", "label": "Post-Procedure Instructions", "required": true, "placeholder": "Instructions given to patient"}
}',
'{"consent": "Yes - Written", "anesthesia": "Local", "post_procedure_condition": "Stable"}',
'{
  "procedure_name": {"minLength": 3, "maxLength": 200},
  "indication": {"minLength": 10, "maxLength": 500}
}',
true, 1);

-- Note: The 'default' tenant_id will be replaced with actual tenant IDs when templates are copied to tenants