# Week 1: Patient Database Schema Implementation

## 🎯 Objective
Create comprehensive patient database schema in all tenant schemas with proper indexing, constraints, and custom fields integration.

## 📋 Prerequisites
- Phase 1 infrastructure operational (✅ Confirmed)
- 6 active tenant schemas available (✅ Confirmed)
- Custom fields system operational (✅ Confirmed)
- Migration system functional (✅ Confirmed)

## 🗃️ Database Schema Design

### Primary Patient Table
```sql
-- Create in ALL tenant schemas
-- Apply to: demo_hospital_001, tenant_1762083064503, tenant_1762083064515, 
--          tenant_1762083586064, test_complete_1762083043709, test_complete_1762083064426

CREATE TABLE patients (
  -- Primary identification
  id SERIAL PRIMARY KEY,
  patient_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Personal information
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  middle_name VARCHAR(255),
  preferred_name VARCHAR(255),
  
  -- Contact information
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile_phone VARCHAR(50),
  
  -- Demographics
  date_of_birth DATE NOT NULL,
  gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  marital_status VARCHAR(50),
  occupation VARCHAR(255),
  
  -- Address information
  address_line_1 TEXT,
  address_line_2 TEXT,
  city VARCHAR(255),
  state VARCHAR(255),
  postal_code VARCHAR(20),
  country VARCHAR(255) DEFAULT 'United States',
  
  -- Emergency contact
  emergency_contact_name VARCHAR(255),
  emergency_contact_relationship VARCHAR(100),
  emergency_contact_phone VARCHAR(50),
  emergency_contact_email VARCHAR(255),
  
  -- Medical information
  blood_type VARCHAR(10) CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  allergies TEXT,
  current_medications TEXT,
  medical_history TEXT,
  family_medical_history TEXT,
  
  -- Insurance information
  insurance_provider VARCHAR(255),
  insurance_policy_number VARCHAR(100),
  insurance_group_number VARCHAR(100),
  insurance_info JSONB, -- Flexible insurance data
  
  -- System fields
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deceased', 'transferred')),
  notes TEXT,
  
  -- Audit fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER, -- References public.users.id
  updated_by INTEGER  -- References public.users.id
);
```

### Custom Field Values Table
```sql
-- Create in ALL tenant schemas
-- Links patients to their custom field values
CREATE TABLE custom_field_values (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL DEFAULT 'patient',
  entity_id INTEGER NOT NULL, -- References patients.id, appointments.id, etc.
  field_id INTEGER NOT NULL, -- References public.custom_fields.id
  value TEXT, -- Stored as text, parsed based on field type
  
  -- Audit fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  UNIQUE(entity_type, entity_id, field_id),
  
  -- Note: Cannot create foreign key to public.custom_fields from tenant schema
  -- This will be enforced at application level
  CHECK (entity_type IN ('patient', 'appointment', 'medical_record'))
);
```

### Patient Files Table
```sql
-- Create in ALL tenant schemas
-- Track files uploaded for patients
CREATE TABLE patient_files (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  -- File information
  filename VARCHAR(500) NOT NULL,
  original_filename VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(255) NOT NULL,
  s3_key VARCHAR(1000) NOT NULL, -- S3 object key: tenant_id/patients/patient_id/filename
  
  -- File metadata
  file_type VARCHAR(100), -- 'insurance_card', 'id_document', 'medical_report', 'other'
  description TEXT,
  
  -- System fields
  uploaded_by INTEGER, -- References public.users.id
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔍 Indexes for Performance

### Primary Indexes
```sql
-- Patient search and lookup indexes
CREATE INDEX patients_patient_number_idx ON patients(patient_number);
CREATE INDEX patients_email_idx ON patients(email) WHERE email IS NOT NULL;
CREATE INDEX patients_phone_idx ON patients(phone) WHERE phone IS NOT NULL;
CREATE INDEX patients_mobile_phone_idx ON patients(mobile_phone) WHERE mobile_phone IS NOT NULL;

-- Name search indexes
CREATE INDEX patients_first_name_idx ON patients(first_name);
CREATE INDEX patients_last_name_idx ON patients(last_name);
CREATE INDEX patients_full_name_idx ON patients(first_name, last_name);

-- Demographics indexes
CREATE INDEX patients_date_of_birth_idx ON patients(date_of_birth);
CREATE INDEX patients_gender_idx ON patients(gender) WHERE gender IS NOT NULL;
CREATE INDEX patients_status_idx ON patients(status);

-- Location indexes
CREATE INDEX patients_city_state_idx ON patients(city, state) WHERE city IS NOT NULL AND state IS NOT NULL;
CREATE INDEX patients_postal_code_idx ON patients(postal_code) WHERE postal_code IS NOT NULL;

-- Medical information indexes
CREATE INDEX patients_blood_type_idx ON patients(blood_type) WHERE blood_type IS NOT NULL;

-- Audit indexes
CREATE INDEX patients_created_at_idx ON patients(created_at);
CREATE INDEX patients_updated_at_idx ON patients(updated_at);
CREATE INDEX patients_created_by_idx ON patients(created_by) WHERE created_by IS NOT NULL;
```

### Full-Text Search Index
```sql
-- Full-text search across patient information
CREATE INDEX patients_search_idx ON patients USING gin(
  to_tsvector('english', 
    COALESCE(patient_number, '') || ' ' ||
    COALESCE(first_name, '') || ' ' ||
    COALESCE(last_name, '') || ' ' ||
    COALESCE(middle_name, '') || ' ' ||
    COALESCE(email, '') || ' ' ||
    COALESCE(phone, '') || ' ' ||
    COALESCE(mobile_phone, '')
  )
);
```

### Custom Field Values Indexes
```sql
-- Custom field values indexes
CREATE INDEX custom_field_values_entity_idx ON custom_field_values(entity_type, entity_id);
CREATE INDEX custom_field_values_field_idx ON custom_field_values(field_id);
CREATE INDEX custom_field_values_value_idx ON custom_field_values(value) WHERE value IS NOT NULL;
```

### Patient Files Indexes
```sql
-- Patient files indexes
CREATE INDEX patient_files_patient_id_idx ON patient_files(patient_id);
CREATE INDEX patient_files_file_type_idx ON patient_files(file_type) WHERE file_type IS NOT NULL;
CREATE INDEX patient_files_created_at_idx ON patient_files(created_at);
CREATE INDEX patient_files_s3_key_idx ON patient_files(s3_key);
```

## 🔧 Implementation Script

### Step 1: Schema Creation Script
```sql
-- File: create-patient-schema.sql
-- This script creates patient tables in a specific tenant schema

-- Set the tenant schema (replace with actual tenant ID)
SET search_path TO "tenant_schema_name";

-- Create patients table
CREATE TABLE patients (
  -- [Full table definition from above]
);

-- Create custom_field_values table
CREATE TABLE custom_field_values (
  -- [Full table definition from above]
);

-- Create patient_files table
CREATE TABLE patient_files (
  -- [Full table definition from above]
);

-- Create all indexes
-- [All index definitions from above]

-- Verify table creation
SELECT table_name FROM information_schema.tables 
WHERE table_schema = current_schema() 
AND table_name IN ('patients', 'custom_field_values', 'patient_files');
```

### Step 2: Apply to All Tenant Schemas
```bash
#!/bin/bash
# File: apply-patient-schema.sh
# Apply patient schema to all tenant schemas

TENANT_SCHEMAS=(
  "demo_hospital_001"
  "tenant_1762083064503"
  "tenant_1762083064515"
  "tenant_1762083586064"
  "test_complete_1762083043709"
  "test_complete_1762083064426"
)

for schema in "${TENANT_SCHEMAS[@]}"; do
  echo "Creating patient tables in schema: $schema"
  
  # Replace schema name in SQL file and execute
  sed "s/tenant_schema_name/$schema/g" create-patient-schema.sql | \
  docker exec -i backend-postgres-1 psql -U postgres -d multitenant_db
  
  if [ $? -eq 0 ]; then
    echo "✅ Successfully created tables in $schema"
  else
    echo "❌ Failed to create tables in $schema"
    exit 1
  fi
done

echo "🎉 Patient schema applied to all tenant schemas!"
```

### Step 3: Verification Script
```sql
-- File: verify-patient-schema.sql
-- Verify patient tables exist in all tenant schemas

DO $$
DECLARE
  tenant_schema TEXT;
  table_count INTEGER;
  tenant_schemas TEXT[] := ARRAY[
    'demo_hospital_001',
    'tenant_1762083064503', 
    'tenant_1762083064515',
    'tenant_1762083586064',
    'test_complete_1762083043709',
    'test_complete_1762083064426'
  ];
BEGIN
  FOREACH tenant_schema IN ARRAY tenant_schemas LOOP
    -- Check if tables exist in this schema
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = tenant_schema 
    AND table_name IN ('patients', 'custom_field_values', 'patient_files');
    
    IF table_count = 3 THEN
      RAISE NOTICE '✅ Schema % has all patient tables', tenant_schema;
    ELSE
      RAISE NOTICE '❌ Schema % missing tables (found %/3)', tenant_schema, table_count;
    END IF;
  END LOOP;
END $$;
```

## 🧪 Test Data Creation

### Sample Patient Data
```sql
-- File: sample-patient-data.sql
-- Create sample patients for testing

-- Set to specific tenant schema for testing
SET search_path TO "demo_hospital_001";

-- Insert sample patients
INSERT INTO patients (
  patient_number, first_name, last_name, email, phone, date_of_birth, 
  gender, address_line_1, city, state, postal_code,
  emergency_contact_name, emergency_contact_phone,
  blood_type, status, created_by
) VALUES 
(
  'P001', 'John', 'Doe', 'john.doe@email.com', '555-0101', '1985-01-15',
  'male', '123 Main St', 'Anytown', 'CA', '90210',
  'Jane Doe', '555-0102',
  'O+', 'active', 1
),
(
  'P002', 'Jane', 'Smith', 'jane.smith@email.com', '555-0201', '1990-05-20',
  'female', '456 Oak Ave', 'Somewhere', 'NY', '10001',
  'Bob Smith', '555-0202',
  'A+', 'active', 1
),
(
  'P003', 'Robert', 'Johnson', 'bob.johnson@email.com', '555-0301', '1978-12-03',
  'male', '789 Pine Rd', 'Elsewhere', 'TX', '75001',
  'Mary Johnson', '555-0302',
  'B-', 'active', 1
);

-- Verify insertion
SELECT patient_number, first_name, last_name, email, status 
FROM patients 
ORDER BY created_at;
```

## 📊 Performance Testing

### Query Performance Tests
```sql
-- File: test-patient-performance.sql
-- Test query performance with sample data

-- Test 1: Patient lookup by number (should be <10ms)
EXPLAIN ANALYZE
SELECT * FROM patients WHERE patient_number = 'P001';

-- Test 2: Patient search by name (should be <50ms)
EXPLAIN ANALYZE
SELECT * FROM patients 
WHERE first_name ILIKE '%john%' OR last_name ILIKE '%john%';

-- Test 3: Full-text search (should be <100ms)
EXPLAIN ANALYZE
SELECT * FROM patients 
WHERE to_tsvector('english', 
  COALESCE(patient_number, '') || ' ' ||
  COALESCE(first_name, '') || ' ' ||
  COALESCE(last_name, '') || ' ' ||
  COALESCE(email, '')
) @@ plainto_tsquery('english', 'john doe');

-- Test 4: Date range query (should be <50ms)
EXPLAIN ANALYZE
SELECT * FROM patients 
WHERE date_of_birth BETWEEN '1980-01-01' AND '1990-12-31';

-- Test 5: Status and location filter (should be <30ms)
EXPLAIN ANALYZE
SELECT * FROM patients 
WHERE status = 'active' AND state = 'CA';
```

## 🔒 Security Considerations

### Data Privacy
```sql
-- Create view for limited patient information (for non-medical staff)
CREATE VIEW patient_basic_info AS
SELECT 
  id,
  patient_number,
  first_name,
  last_name,
  phone,
  email,
  status,
  created_at
FROM patients;

-- Create view for medical staff with full access
CREATE VIEW patient_medical_info AS
SELECT 
  p.*,
  array_agg(
    json_build_object(
      'field_name', cf.name,
      'field_value', cfv.value
    )
  ) FILTER (WHERE cfv.id IS NOT NULL) as custom_fields
FROM patients p
LEFT JOIN custom_field_values cfv ON cfv.entity_id = p.id AND cfv.entity_type = 'patient'
LEFT JOIN public.custom_fields cf ON cf.id = cfv.field_id
GROUP BY p.id;
```

### Audit Triggers
```sql
-- Create audit log table
CREATE TABLE patient_audit_log (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  old_values JSONB,
  new_values JSONB,
  changed_by INTEGER, -- References public.users.id
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION patient_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO patient_audit_log (patient_id, action, new_values, changed_by)
    VALUES (NEW.id, 'INSERT', row_to_json(NEW), NEW.created_by);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO patient_audit_log (patient_id, action, old_values, new_values, changed_by)
    VALUES (NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), NEW.updated_by);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO patient_audit_log (patient_id, action, old_values, changed_by)
    VALUES (OLD.id, 'DELETE', row_to_json(OLD), OLD.updated_by);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit trigger
CREATE TRIGGER patient_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON patients
  FOR EACH ROW EXECUTE FUNCTION patient_audit_trigger();
```

## ✅ Implementation Checklist

### Database Schema Creation
- [ ] Create patients table with all required fields
- [ ] Create custom_field_values table for patient custom fields
- [ ] Create patient_files table for document management
- [ ] Apply schema to all 6 tenant schemas
- [ ] Verify table creation in all schemas

### Index Creation
- [ ] Create primary lookup indexes (patient_number, email, phone)
- [ ] Create name search indexes (first_name, last_name, full_name)
- [ ] Create demographic indexes (date_of_birth, gender, status)
- [ ] Create full-text search index
- [ ] Create custom field values indexes
- [ ] Create patient files indexes

### Performance Testing
- [ ] Test patient lookup performance (<10ms)
- [ ] Test name search performance (<50ms)
- [ ] Test full-text search performance (<100ms)
- [ ] Test date range queries (<50ms)
- [ ] Test filtered queries (<30ms)

### Security Implementation
- [ ] Create patient basic info view for limited access
- [ ] Create patient medical info view with custom fields
- [ ] Implement audit logging triggers
- [ ] Test data privacy controls
- [ ] Verify tenant isolation

### Sample Data & Testing
- [ ] Create sample patient data in test schemas
- [ ] Test custom field value insertion
- [ ] Test patient file upload simulation
- [ ] Verify all constraints and validations
- [ ] Test edge cases and error conditions

### Documentation
- [ ] Document table schemas and relationships
- [ ] Document index strategy and performance expectations
- [ ] Document security views and access controls
- [ ] Create troubleshooting guide
- [ ] Update API documentation with data models

## 🎯 Success Criteria

### Performance Benchmarks
- Patient lookup by number: <10ms
- Name search queries: <50ms
- Full-text search: <100ms
- Complex filtered queries: <30ms
- Bulk operations: <1s for 100 records

### Data Integrity
- All foreign key constraints working
- Unique constraints preventing duplicates
- Check constraints validating data
- Audit logging capturing all changes
- Custom fields integration functional

### Multi-Tenant Isolation
- Tables created in all 6 tenant schemas
- No cross-tenant data access possible
- Schema-specific queries working correctly
- Performance consistent across all tenants
- Backup and restore procedures tested

This patient database schema provides the foundation for all hospital patient management operations, ensuring scalability, performance, and security across the multi-tenant architecture.