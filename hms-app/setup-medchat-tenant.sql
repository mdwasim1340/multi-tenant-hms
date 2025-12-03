-- ============================================================
-- MedChat Mobile App Tenant Setup Script
-- Run this script against the multitenant_db database
-- ============================================================

-- 1. Create the tenant record
INSERT INTO public.tenants (id, name, email, plan, status, subdomain)
VALUES (
  'tenant_medchat_mobile',
  'MedChat Mobile App',
  'admin@medchat.ai',
  'enterprise',
  'active',
  'medchat'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  plan = EXCLUDED.plan,
  status = EXCLUDED.status,
  subdomain = EXCLUDED.subdomain;

-- 2. Create the tenant schema
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'tenant_medchat_mobile') THEN
    CREATE SCHEMA "tenant_medchat_mobile";
    RAISE NOTICE 'Schema tenant_medchat_mobile created';
  ELSE
    RAISE NOTICE 'Schema tenant_medchat_mobile already exists';
  END IF;
END $$;

-- 3. Create subscription for the tenant
INSERT INTO tenant_subscriptions (tenant_id, tier_id, usage_limits, billing_cycle, status)
VALUES (
  'tenant_medchat_mobile',
  'enterprise',
  '{"max_patients": 10000, "max_users": 1000, "storage_gb": 100, "api_calls_per_day": 100000}',
  'monthly',
  'active'
)
ON CONFLICT (tenant_id) DO UPDATE SET
  tier_id = EXCLUDED.tier_id,
  usage_limits = EXCLUDED.usage_limits,
  status = EXCLUDED.status;

-- 4. Create branding for the tenant (MedChat teal theme)
INSERT INTO tenant_branding (tenant_id, primary_color, secondary_color, accent_color)
VALUES (
  'tenant_medchat_mobile',
  '#00897B',  -- Teal primary (matches Flutter app)
  '#26A69A',  -- Teal light
  '#4DB6AC'   -- Teal accent
)
ON CONFLICT (tenant_id) DO UPDATE SET
  primary_color = EXCLUDED.primary_color,
  secondary_color = EXCLUDED.secondary_color,
  accent_color = EXCLUDED.accent_color;

-- 5. Create required tables in tenant schema
SET search_path TO "tenant_medchat_mobile";

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  patient_number VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(20),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  blood_type VARCHAR(10),
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(50),
  insurance_provider VARCHAR(255),
  insurance_policy_number VARCHAR(100),
  allergies TEXT,
  medical_conditions TEXT,
  current_medications TEXT,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medical records table
CREATE TABLE IF NOT EXISTS medical_records (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id),
  record_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  diagnosis TEXT,
  treatment TEXT,
  notes TEXT,
  attachments JSONB DEFAULT '[]',
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat sessions table (for MedChat AI)
CREATE TABLE IF NOT EXISTS chat_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title VARCHAR(255),
  messages JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES chat_sessions(id),
  role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reset search path
SET search_path TO public;

-- 6. Verify setup
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  t.subdomain,
  t.status,
  ts.tier_id as subscription_tier,
  tb.primary_color
FROM tenants t
LEFT JOIN tenant_subscriptions ts ON t.id = ts.tenant_id
LEFT JOIN tenant_branding tb ON t.id = tb.tenant_id
WHERE t.id = 'tenant_medchat_mobile';

-- Output success message
DO $$
BEGIN
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'MedChat Mobile Tenant Setup Complete!';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Tenant ID: tenant_medchat_mobile';
  RAISE NOTICE 'Subdomain: medchat';
  RAISE NOTICE 'Plan: enterprise';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Create admin user in Cognito';
  RAISE NOTICE '2. Add user record to public.users table';
  RAISE NOTICE '3. Configure Flutter app with tenant ID';
  RAISE NOTICE '============================================================';
END $$;
