# Day 1: Development Setup and Patient Database Schema

## 🎯 Daily Objective
Set up development environment and create the patient database schema in all tenant schemas.

## ⏱️ Estimated Time: 6-8 hours

## 📋 Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ installed
- PostgreSQL client tools installed
- Access to repository

## 🔧 Task 1: Environment Setup (1 hour)

### Step 1.1: Clone and Setup Repository
```bash
# Clone repository
git clone <repository-url>
cd multi-tenant-backend

# Create your feature branch
git checkout -b phase2/team-a/patient-management

# Install backend dependencies
cd backend
npm install

# Copy environment file
cp .env.example .env
```

### Step 1.2: Configure Environment Variables
Edit `backend/.env`:
```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/multitenant_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=multitenant_db
DB_USER=postgres
DB_PASSWORD=password

# AWS (use existing values from Phase 1)
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=<existing-value>
COGNITO_CLIENT_ID=<existing-value>
S3_BUCKET_NAME=<existing-value>

# JWT
JWT_SECRET=<existing-value>
```

### Step 1.3: Start Development Environment
```bash
# Start PostgreSQL
docker-compose up -d postgres

# Verify database connection
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "SELECT version();"

# Should see PostgreSQL version output
```

### Step 1.4: Verify Existing Tenant Schemas
```bash
# List all tenant schemas
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%'
ORDER BY schema_name;
"

# Expected output: 6 tenant schemas
# - demo_hospital_001
# - tenant_1762083064503
# - tenant_1762083064515
# - tenant_1762083586064
# - test_complete_1762083043709
# - test_complete_1762083064426
```

## 🗃️ Task 2: Create Patient Table Schema (2 hours)

### Step 2.1: Create SQL Schema File
Create file: `backend/migrations/schemas/patient-schema.sql`

```sql
-- Patient Management Schema
-- This file will be applied to ALL tenant schemas

-- Main patients table
CREATE TABLE IF NOT EXISTS patients (
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
  insurance_info JSONB,
  
  -- System fields
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deceased', 'transferred')),
  notes TEXT,
  
  -- Audit fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER
);

-- Custom field values for patients
CREATE TABLE IF NOT EXISTS custom_field_values (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL DEFAULT 'patient',
  entity_id INTEGER NOT NULL,
  field_id INTEGER NOT NULL,
  value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(entity_type, entity_id, field_id),
  CHECK (entity_type IN ('patient', 'appointment', 'medical_record'))
);

-- Patient files table
CREATE TABLE IF NOT EXISTS patient_files (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  filename VARCHAR(500) NOT NULL,
  original_filename VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(255) NOT NULL,
  s3_key VARCHAR(1000) NOT NULL,
  file_type VARCHAR(100),
  description TEXT,
  uploaded_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS patients_patient_number_idx ON patients(patient_number);
CREATE INDEX IF NOT EXISTS patients_email_idx ON patients(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS patients_phone_idx ON patients(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS patients_first_name_idx ON patients(first_name);
CREATE INDEX IF NOT EXISTS patients_last_name_idx ON patients(last_name);
CREATE INDEX IF NOT EXISTS patients_full_name_idx ON patients(first_name, last_name);
CREATE INDEX IF NOT EXISTS patients_date_of_birth_idx ON patients(date_of_birth);
CREATE INDEX IF NOT EXISTS patients_status_idx ON patients(status);
CREATE INDEX IF NOT EXISTS patients_created_at_idx ON patients(created_at);

CREATE INDEX IF NOT EXISTS custom_field_values_entity_idx ON custom_field_values(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS custom_field_values_field_idx ON custom_field_values(field_id);

CREATE INDEX IF NOT EXISTS patient_files_patient_id_idx ON patient_files(patient_id);
CREATE INDEX IF NOT EXISTS patient_files_created_at_idx ON patient_files(created_at);
```

### Step 2.2: Create Application Script
Create file: `backend/scripts/apply-patient-schema.js`

```javascript
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function applyPatientSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting patient schema application...\n');
    
    // Read SQL file
    const sqlFile = path.join(__dirname, '../migrations/schemas/patient-schema.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Get all tenant schemas
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%'
      ORDER BY schema_name
    `);
    
    const tenantSchemas = schemasResult.rows.map(row => row.schema_name);
    console.log(`📋 Found ${tenantSchemas.length} tenant schemas:\n`);
    tenantSchemas.forEach(schema => console.log(`   - ${schema}`));
    console.log('');
    
    // Apply schema to each tenant
    for (const schema of tenantSchemas) {
      console.log(`📦 Applying schema to: ${schema}`);
      
      try {
        // Set search path to tenant schema
        await client.query(`SET search_path TO "${schema}"`);
        
        // Execute SQL
        await client.query(sql);
        
        // Verify tables created
        const tablesResult = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = '${schema}' 
          AND table_name IN ('patients', 'custom_field_values', 'patient_files')
          ORDER BY table_name
        `);
        
        const tables = tablesResult.rows.map(row => row.table_name);
        
        if (tables.length === 3) {
          console.log(`   ✅ Success! Created tables: ${tables.join(', ')}\n`);
        } else {
          console.log(`   ⚠️  Warning: Only created ${tables.length}/3 tables\n`);
        }
        
      } catch (error) {
        console.error(`   ❌ Error applying to ${schema}:`, error.message);
        console.error('');
      }
    }
    
    console.log('🎉 Patient schema application complete!\n');
    
    // Summary
    console.log('📊 Verification Summary:');
    for (const schema of tenantSchemas) {
      await client.query(`SET search_path TO "${schema}"`);
      const countResult = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '${schema}' AND table_name = 'patients') as patients,
          (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '${schema}' AND table_name = 'custom_field_values') as custom_fields,
          (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '${schema}' AND table_name = 'patient_files') as files
      `);
      
      const counts = countResult.rows[0];
      const status = (counts.patients && counts.custom_fields && counts.files) ? '✅' : '❌';
      console.log(`   ${status} ${schema}: patients=${counts.patients}, custom_fields=${counts.custom_fields}, files=${counts.files}`);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
applyPatientSchema()
  .then(() => {
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
```

### Step 2.3: Apply Schema to All Tenants
```bash
# Run the application script
cd backend
node scripts/apply-patient-schema.js

# Expected output:
# ✅ Success messages for all 6 tenant schemas
# ✅ Verification summary showing all tables created
```

## 🧪 Task 3: Verify Schema Creation (1 hour)

### Step 3.1: Manual Verification
```bash
# Check one tenant schema in detail
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "
SET search_path TO 'demo_hospital_001';

-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'demo_hospital_001'
ORDER BY table_name;

-- Check patients table structure
\d patients

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'patients' 
AND schemaname = 'demo_hospital_001';
"
```

### Step 3.2: Create Verification Script
Create file: `backend/scripts/verify-patient-schema.js`

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function verifyPatientSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verifying patient schema across all tenants...\n');
    
    // Get all tenant schemas
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%'
      ORDER BY schema_name
    `);
    
    const tenantSchemas = schemasResult.rows.map(row => row.schema_name);
    let allValid = true;
    
    for (const schema of tenantSchemas) {
      await client.query(`SET search_path TO "${schema}"`);
      
      // Check tables exist
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = '${schema}' 
        AND table_name IN ('patients', 'custom_field_values', 'patient_files')
      `);
      
      const tables = tablesResult.rows.map(row => row.table_name);
      
      // Check indexes
      const indexesResult = await client.query(`
        SELECT COUNT(*) as count
        FROM pg_indexes 
        WHERE tablename = 'patients' 
        AND schemaname = '${schema}'
      `);
      
      const indexCount = parseInt(indexesResult.rows[0].count);
      
      // Check constraints
      const constraintsResult = await client.query(`
        SELECT COUNT(*) as count
        FROM information_schema.table_constraints 
        WHERE table_schema = '${schema}' 
        AND table_name = 'patients'
        AND constraint_type IN ('PRIMARY KEY', 'UNIQUE', 'CHECK')
      `);
      
      const constraintCount = parseInt(constraintsResult.rows[0].count);
      
      const isValid = tables.length === 3 && indexCount >= 8 && constraintCount >= 3;
      allValid = allValid && isValid;
      
      const status = isValid ? '✅' : '❌';
      console.log(`${status} ${schema}:`);
      console.log(`   Tables: ${tables.length}/3 (${tables.join(', ')})`);
      console.log(`   Indexes: ${indexCount} (expected >= 8)`);
      console.log(`   Constraints: ${constraintCount} (expected >= 3)`);
      console.log('');
    }
    
    if (allValid) {
      console.log('🎉 All tenant schemas are valid!\n');
      return true;
    } else {
      console.log('⚠️  Some tenant schemas have issues. Please review.\n');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Verification error:', error);
    return false;
  } finally {
    client.release();
    await pool.end();
  }
}

verifyPatientSchema()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  });
```

### Step 3.3: Run Verification
```bash
# Run verification script
node scripts/verify-patient-schema.js

# Expected output:
# ✅ All tenant schemas valid
# ✅ All tables, indexes, and constraints present
```

## 📝 Task 4: Create Sample Test Data (1 hour)

### Step 4.1: Create Test Data Script
Create file: `backend/scripts/create-sample-patients.js`

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

const samplePatients = [
  {
    patient_number: 'P001',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@email.com',
    phone: '555-0101',
    date_of_birth: '1985-01-15',
    gender: 'male',
    blood_type: 'O+',
    address_line_1: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    postal_code: '90210',
    emergency_contact_name: 'Jane Doe',
    emergency_contact_phone: '555-0102',
    status: 'active'
  },
  {
    patient_number: 'P002',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@email.com',
    phone: '555-0201',
    date_of_birth: '1990-05-20',
    gender: 'female',
    blood_type: 'A+',
    address_line_1: '456 Oak Ave',
    city: 'Somewhere',
    state: 'NY',
    postal_code: '10001',
    emergency_contact_name: 'Bob Smith',
    emergency_contact_phone: '555-0202',
    status: 'active'
  },
  {
    patient_number: 'P003',
    first_name: 'Robert',
    last_name: 'Johnson',
    email: 'bob.johnson@email.com',
    phone: '555-0301',
    date_of_birth: '1978-12-03',
    gender: 'male',
    blood_type: 'B-',
    address_line_1: '789 Pine Rd',
    city: 'Elsewhere',
    state: 'TX',
    postal_code: '75001',
    emergency_contact_name: 'Mary Johnson',
    emergency_contact_phone: '555-0302',
    status: 'active'
  }
];

async function createSamplePatients() {
  const client = await pool.connect();
  
  try {
    console.log('🏥 Creating sample patients...\n');
    
    // Use demo_hospital_001 for testing
    const testSchema = 'demo_hospital_001';
    await client.query(`SET search_path TO "${testSchema}"`);
    
    console.log(`📦 Creating patients in: ${testSchema}\n`);
    
    for (const patient of samplePatients) {
      const columns = Object.keys(patient);
      const values = Object.values(patient);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      
      const query = `
        INSERT INTO patients (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING id, patient_number, first_name, last_name
      `;
      
      const result = await client.query(query, values);
      const created = result.rows[0];
      
      console.log(`✅ Created: ${created.patient_number} - ${created.first_name} ${created.last_name} (ID: ${created.id})`);
    }
    
    console.log('\n🎉 Sample patients created successfully!\n');
    
    // Verify
    const countResult = await client.query('SELECT COUNT(*) as count FROM patients');
    console.log(`📊 Total patients in ${testSchema}: ${countResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error creating sample patients:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createSamplePatients()
  .then(() => {
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
```

### Step 4.2: Create Sample Data
```bash
# Run sample data script
node scripts/create-sample-patients.js

# Expected output:
# ✅ 3 sample patients created in demo_hospital_001
```

## 📄 Task 5: Documentation and Commit (1 hour)

### Step 5.1: Create Day 1 Summary
Create file: `backend/docs/phase2/day-1-summary.md`

```markdown
# Day 1 Summary: Patient Database Schema

## ✅ Completed Tasks
1. Development environment setup
2. Patient database schema created
3. Schema applied to all 6 tenant schemas
4. Verification scripts created and run
5. Sample test data created

## 📊 Results
- **Tables Created**: 3 per tenant (patients, custom_field_values, patient_files)
- **Indexes Created**: 9 per tenant
- **Constraints**: 5 per tenant
- **Tenant Schemas**: 6 (all successful)
- **Sample Data**: 3 patients in demo_hospital_001

## 📁 Files Created
- `migrations/schemas/patient-schema.sql`
- `scripts/apply-patient-schema.js`
- `scripts/verify-patient-schema.js`
- `scripts/create-sample-patients.js`
- `docs/phase2/day-1-summary.md`

## 🧪 Verification
All verification scripts pass:
- ✅ Schema structure correct
- ✅ Indexes created
- ✅ Constraints applied
- ✅ Sample data inserted successfully

## 🔄 Next Steps (Day 2)
- Create TypeScript interfaces for Patient model
- Implement Zod validation schemas
- Create patient service layer
- Begin API endpoint implementation
```

### Step 5.2: Commit Your Work
```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "feat(patient): Day 1 - Create patient database schema

- Created patient, custom_field_values, and patient_files tables
- Applied schema to all 6 tenant schemas
- Created 9 performance indexes per tenant
- Added verification and sample data scripts
- All tests passing"

# Push to remote
git push origin phase2/team-a/patient-management
```

## ✅ Day 1 Completion Checklist

- [ ] Development environment set up and verified
- [ ] Patient database schema SQL file created
- [ ] Schema application script created and tested
- [ ] Schema applied to all 6 tenant schemas successfully
- [ ] Verification script created and passing
- [ ] Sample test data created in demo_hospital_001
- [ ] Documentation created (day-1-summary.md)
- [ ] All changes committed and pushed to Git
- [ ] No errors in any verification scripts
- [ ] Ready to proceed to Day 2 (API implementation)

## 🎯 Success Criteria Met

✅ **Database Schema**: All 3 tables created in all 6 tenant schemas
✅ **Performance**: 9 indexes created per tenant for optimal queries
✅ **Data Integrity**: All constraints and foreign keys working
✅ **Verification**: All verification scripts passing
✅ **Sample Data**: Test data available for development
✅ **Documentation**: Complete summary and next steps documented

## 📞 Support

If you encounter any issues:
1. Check error messages in console output
2. Verify database connection with `docker ps`
3. Review `backend/.env` configuration
4. Check PostgreSQL logs: `docker logs backend-postgres-1`
5. Consult team lead if issues persist

**Estimated Completion Time**: 6-8 hours
**Actual Completion Time**: _____ hours
**Blockers Encountered**: _____
**Notes**: _____