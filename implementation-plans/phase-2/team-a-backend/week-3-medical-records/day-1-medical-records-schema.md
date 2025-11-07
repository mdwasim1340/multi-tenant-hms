# Week 3, Day 1: Medical Records Database Schema

## 🎯 Task Objective
Create comprehensive medical records database schema including medical_records, diagnoses, treatments, and prescriptions tables.

## ⏱️ Estimated Time: 6-8 hours

## 📝 Step 1: Create Medical Records Schema

Create file: `backend/migrations/create-medical-records-schema.sql`

```sql
-- Medical Records Table
CREATE TABLE IF NOT EXISTS medical_records (
  id SERIAL PRIMARY KEY,
  record_number VARCHAR(50) UNIQUE NOT NULL,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  doctor_id INTEGER NOT NULL, -- References public.users.id
  visit_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  chief_complaint TEXT,
  history_of_present_illness TEXT,
  review_of_systems JSONB,
  physical_examination TEXT,
  assessment TEXT,
  plan TEXT,
  notes TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  follow_up_instructions TEXT,
  status VARCHAR(50) DEFAULT 'draft', -- draft, finalized, amended
  finalized_at TIMESTAMP,
  finalized_by INTEGER, -- References public.users.id
  created_by INTEGER NOT NULL, -- References public.users.id
  updated_by INTEGER, -- References public.users.id
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vital Signs (embedded in medical_records as JSONB, but documented here)
-- {
--   "temperature": "98.6",
--   "temperature_unit": "F",
--   "blood_pressure_systolic": "120",
--   "blood_pressure_diastolic": "80",
--   "heart_rate": "72",
--   "respiratory_rate": "16",
--   "oxygen_saturation": "98",
--   "weight": "70",
--   "weight_unit": "kg",
--   "height": "175",
--   "height_unit": "cm",
--   "bmi": "22.9"
-- }

-- Diagnoses Table
CREATE TABLE IF NOT EXISTS diagnoses (
  id SERIAL PRIMARY KEY,
  medical_record_id INTEGER NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  diagnosis_code VARCHAR(20), -- ICD-10 code
  diagnosis_name VARCHAR(500) NOT NULL,
  diagnosis_type VARCHAR(50) DEFAULT 'primary', -- primary, secondary, differential
  severity VARCHAR(50), -- mild, moderate, severe, critical
  status VARCHAR(50) DEFAULT 'active', -- active, resolved, chronic
  onset_date DATE,
  resolution_date DATE,
  notes TEXT,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Treatments Table
CREATE TABLE IF NOT EXISTS treatments (
  id SERIAL PRIMARY KEY,
  medical_record_id INTEGER NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  treatment_type VARCHAR(100) NOT NULL, -- medication, procedure, therapy, surgery, etc.
  treatment_name VARCHAR(500) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  frequency VARCHAR(100), -- once daily, twice daily, as needed, etc.
  dosage VARCHAR(200),
  route VARCHAR(100), -- oral, IV, topical, etc.
  duration VARCHAR(100), -- 7 days, 2 weeks, ongoing, etc.
  instructions TEXT,
  status VARCHAR(50) DEFAULT 'active', -- active, completed, discontinued
  discontinued_reason TEXT,
  discontinued_date DATE,
  discontinued_by INTEGER, -- References public.users.id
  notes TEXT,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prescriptions Table (Foundation for Week 4)
CREATE TABLE IF NOT EXISTS prescriptions (
  id SERIAL PRIMARY KEY,
  prescription_number VARCHAR(50) UNIQUE NOT NULL,
  medical_record_id INTEGER NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INTEGER NOT NULL, -- References public.users.id
  medication_name VARCHAR(500) NOT NULL,
  medication_code VARCHAR(50), -- Drug code (NDC, etc.)
  dosage VARCHAR(200) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  route VARCHAR(100) NOT NULL,
  duration VARCHAR(100),
  quantity INTEGER,
  refills INTEGER DEFAULT 0,
  instructions TEXT,
  indication TEXT, -- Reason for prescription
  status VARCHAR(50) DEFAULT 'active', -- active, filled, cancelled, expired
  prescribed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_date DATE,
  end_date DATE,
  pharmacy_notes TEXT,
  filled_date DATE,
  filled_by VARCHAR(255), -- Pharmacy name
  cancelled_date DATE,
  cancelled_reason TEXT,
  cancelled_by INTEGER, -- References public.users.id
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for medical_records
CREATE INDEX idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX idx_medical_records_appointment_id ON medical_records(appointment_id);
CREATE INDEX idx_medical_records_doctor_id ON medical_records(doctor_id);
CREATE INDEX idx_medical_records_visit_date ON medical_records(visit_date);
CREATE INDEX idx_medical_records_status ON medical_records(status);
CREATE INDEX idx_medical_records_patient_date ON medical_records(patient_id, visit_date);

-- Indexes for diagnoses
CREATE INDEX idx_diagnoses_medical_record_id ON diagnoses(medical_record_id);
CREATE INDEX idx_diagnoses_code ON diagnoses(diagnosis_code);
CREATE INDEX idx_diagnoses_status ON diagnoses(status);
CREATE INDEX idx_diagnoses_type ON diagnoses(diagnosis_type);

-- Indexes for treatments
CREATE INDEX idx_treatments_medical_record_id ON treatments(medical_record_id);
CREATE INDEX idx_treatments_type ON treatments(treatment_type);
CREATE INDEX idx_treatments_status ON treatments(status);
CREATE INDEX idx_treatments_start_date ON treatments(start_date);

-- Indexes for prescriptions
CREATE INDEX idx_prescriptions_medical_record_id ON prescriptions(medical_record_id);
CREATE INDEX idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_prescriptions_prescribed_date ON prescriptions(prescribed_date);
CREATE INDEX idx_prescriptions_patient_date ON prescriptions(patient_id, prescribed_date);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diagnoses_updated_at BEFORE UPDATE ON diagnoses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treatments_updated_at BEFORE UPDATE ON treatments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 📝 Step 2: Apply to All Tenant Schemas

Create file: `backend/scripts/apply-medical-records-schema.js`

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function applyMedicalRecordsSchema() {
  const client = await pool.connect();
  
  try {
    // Get all tenant schemas
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%'
    `);
    
    const schemas = schemasResult.rows.map(row => row.schema_name);
    
    console.log(`Found ${schemas.length} tenant schemas`);
    
    for (const schema of schemas) {
      console.log(`\nApplying medical records schema to: ${schema}`);
      
      await client.query(`SET search_path TO "${schema}"`);
      
      // Read and execute the SQL file
      const fs = require('fs');
      const sql = fs.readFileSync('migrations/create-medical-records-schema.sql', 'utf8');
      
      await client.query(sql);
      
      console.log(`✅ Medical records schema applied to ${schema}`);
    }
    
    console.log('\n✅ All schemas updated successfully');
    
  } catch (error) {
    console.error('Error applying schema:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

applyMedicalRecordsSchema();
```

## 📝 Step 3: Create Verification Script

Create file: `backend/scripts/verify-medical-records-schema.js`

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function verifySchema() {
  const client = await pool.connect();
  
  try {
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%'
    `);
    
    const schemas = schemasResult.rows.map(row => row.schema_name);
    
    console.log('Verifying medical records schema in all tenant schemas...\n');
    
    const expectedTables = ['medical_records', 'diagnoses', 'treatments', 'prescriptions'];
    
    for (const schema of schemas) {
      await client.query(`SET search_path TO "${schema}"`);
      
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = $1 
        AND table_name = ANY($2)
      `, [schema, expectedTables]);
      
      const foundTables = tablesResult.rows.map(row => row.table_name);
      const missingTables = expectedTables.filter(t => !foundTables.includes(t));
      
      if (missingTables.length === 0) {
        console.log(`✅ ${schema}: All tables present`);
      } else {
        console.log(`❌ ${schema}: Missing tables: ${missingTables.join(', ')}`);
      }
    }
    
    console.log('\n✅ Verification complete');
    
  } catch (error) {
    console.error('Error verifying schema:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

verifySchema();
```

## ✅ Verification

```bash
# Apply schema to all tenants
node backend/scripts/apply-medical-records-schema.js

# Expected output:
# Found X tenant schemas
# Applying medical records schema to: demo_hospital_001
# ✅ Medical records schema applied to demo_hospital_001
# ...
# ✅ All schemas updated successfully

# Verify schema
node backend/scripts/verify-medical-records-schema.js

# Expected output:
# ✅ demo_hospital_001: All tables present
# ✅ tenant_1762083064503: All tables present
# ...
# ✅ Verification complete
```

## 📄 Commit

```bash
git add migrations/create-medical-records-schema.sql
git add scripts/apply-medical-records-schema.js
git add scripts/verify-medical-records-schema.js
git commit -m "feat(medical-records): Add medical records database schema

- Create medical_records, diagnoses, treatments, prescriptions tables
- Add comprehensive indexes for performance
- Apply to all tenant schemas
- Add verification scripts"
```

## 🎯 Success Criteria
- ✅ 4 new tables created in all tenant schemas
- ✅ 18 indexes added for performance
- ✅ Triggers for updated_at columns
- ✅ Foreign key relationships established
- ✅ Verification script confirms all tables present
