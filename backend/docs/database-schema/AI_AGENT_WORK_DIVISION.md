# AI Agent Work Division - Database Schema Implementation

## 🎯 Mission Overview

The database is currently in a **partial state** with only the `tenants` table implemented. Two AI agents will work simultaneously to resolve critical issues and implement the complete multi-tenant hospital management system.

## 📊 Current State Analysis

### ✅ What Exists Now
- **`tenants` table**: Fully functional with 5 active tenants
- **Tenant schemas**: 5+ schemas created but empty
- **Docker PostgreSQL**: Running and accessible
- **Migration system**: Available but blocked by conflicts

### ❌ Critical Missing Components
- **Core tables**: users, roles, user_roles, user_verification
- **Tenant-specific tables**: patients, appointments, medical_records
- **Functional authentication**: Database integration with Cognito
- **Role-based access control**: Permission system
- **Multi-tenant data storage**: Actual hospital data tables

## 🔄 Two-Agent Parallel Approach

### Agent A: Core System Infrastructure
**Focus**: Global schema, authentication, user management
**Timeline**: 2-3 hours
**Dependencies**: None (can start immediately)

### Agent B: Multi-Tenant Data Layer
**Focus**: Tenant schemas, hospital tables, business logic
**Timeline**: 2-3 hours  
**Dependencies**: Requires Agent A's users table for foreign keys

---

## 🤖 AGENT A: Core System Infrastructure

### 🎯 Primary Objectives
1. **Resolve migration conflicts** and establish working migration system
2. **Create core authentication tables** (users, roles, user_verification)
3. **Implement user management system** with proper tenant relationships
4. **Establish role-based access control** foundation

### 📋 Detailed Task List

#### Phase 1: Migration System Recovery (30 minutes)
```bash
# 1. Backup current state
docker exec backend-postgres-1 pg_dump -U postgres multitenant_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Mark tenants migration as completed (skip conflict)
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "
INSERT INTO pgmigrations (name, run_on) VALUES ('1788886400000_create-tenants-table', NOW());
"

# 3. Run remaining migrations
cd backend
export DATABASE_URL="postgresql://postgres:password@localhost:5432/multitenant_db"
npx node-pg-migrate up
```

#### Phase 2: Core Table Creation (45 minutes)
**If migrations fail, create tables manually:**

```sql
-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active' NOT NULL,
  phone_number VARCHAR(50),
  last_login_date TIMESTAMP,
  profile_picture_url TEXT,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create roles table
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create user_roles junction table
CREATE TABLE user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create user_verification table
CREATE TABLE user_verification (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for performance
CREATE INDEX users_tenant_id_idx ON users(tenant_id);
CREATE INDEX users_email_idx ON users(email);
CREATE INDEX user_roles_user_id_idx ON user_roles(user_id);
CREATE INDEX user_roles_role_id_idx ON user_roles(role_id);
CREATE INDEX user_verification_email_type_idx ON user_verification(email, type);
CREATE INDEX user_verification_expires_idx ON user_verification(expires_at);
```

#### Phase 3: Default Data Population (30 minutes)
```sql
-- Insert default roles
INSERT INTO roles (name, description) VALUES
('Admin', 'System administrator with full access'),
('Doctor', 'Medical practitioner with patient care access'),
('Nurse', 'Nursing staff with patient care access'),
('Receptionist', 'Front desk staff with appointment management'),
('Manager', 'Department manager with reporting access'),
('Lab Technician', 'Laboratory staff with test management'),
('Pharmacist', 'Pharmacy staff with medication management');

-- Create test admin user for each tenant
INSERT INTO users (name, email, password, tenant_id, status) 
SELECT 
  'Admin User',
  'admin@' || LOWER(REPLACE(name, ' ', '')) || '.com',
  '$2b$10$example.hash.for.password123',  -- bcrypt hash for 'password123'
  id,
  'active'
FROM tenants;

-- Assign admin role to admin users
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id 
FROM users u, roles r 
WHERE u.email LIKE 'admin@%' AND r.name = 'Admin';
```

#### Phase 4: Service Integration (45 minutes)
**Update backend services to use new tables:**

1. **Update userService.ts** - Ensure it works with new users table
2. **Update roleService.ts** - Ensure it works with new roles table  
3. **Update auth middleware** - Validate users exist in database
4. **Test authentication flow** - Verify Cognito + database integration

#### Phase 5: Validation & Testing (30 minutes)
```sql
-- Verify table creation
\dt

-- Check relationships
SELECT 
  t.name as tenant,
  u.name as user,
  r.name as role
FROM tenants t
LEFT JOIN users u ON t.id = u.tenant_id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY t.name, u.name;

-- Test user creation via API
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant_1762083064503" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123","role_id":2}'
```

### 🚨 Agent A Success Criteria
- [ ] All core tables exist and are properly structured
- [ ] Foreign key relationships work correctly
- [ ] Default roles are created in all tenants
- [ ] At least one admin user exists per tenant
- [ ] User authentication API endpoints function
- [ ] Migration system is restored and functional

---

## 🤖 AGENT B: Multi-Tenant Data Layer

### 🎯 Primary Objectives
1. **Design hospital management schema** for tenant-specific data
2. **Create patient management tables** in all tenant schemas
3. **Implement appointment and medical record systems**
4. **Establish tenant data isolation** and validation

### 📋 Detailed Task List

#### Phase 1: Schema Design & Planning (30 minutes)
**Design comprehensive hospital management tables:**

```sql
-- Patient management
CREATE TABLE patients (
  id SERIAL PRIMARY KEY,
  patient_number VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  date_of_birth DATE NOT NULL,
  gender VARCHAR(20),
  address TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(50),
  medical_history TEXT,
  allergies TEXT,
  current_medications TEXT,
  insurance_info JSONB,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointment scheduling
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INTEGER NOT NULL, -- References users.id (from Agent A)
  appointment_date TIMESTAMP NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  appointment_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'scheduled',
  notes TEXT,
  created_by INTEGER, -- References users.id
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medical records
CREATE TABLE medical_records (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INTEGER NOT NULL, -- References users.id
  visit_date TIMESTAMP NOT NULL,
  chief_complaint TEXT,
  diagnosis TEXT,
  treatment_plan TEXT,
  prescriptions JSONB,
  vital_signs JSONB,
  lab_results JSONB,
  notes TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prescriptions
CREATE TABLE prescriptions (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INTEGER NOT NULL, -- References users.id
  medical_record_id INTEGER REFERENCES medical_records(id),
  medication_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  duration VARCHAR(100),
  instructions TEXT,
  quantity INTEGER,
  refills_allowed INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  prescribed_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lab tests and results
CREATE TABLE lab_tests (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  ordered_by INTEGER NOT NULL, -- References users.id (doctor)
  test_name VARCHAR(255) NOT NULL,
  test_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'ordered',
  ordered_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sample_collected_date TIMESTAMP,
  results_date TIMESTAMP,
  results JSONB,
  normal_range VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Phase 2: Tenant Schema Population (60 minutes)
**Apply schema to all existing tenant schemas:**

```bash
# Get list of tenant schemas
TENANT_SCHEMAS=$(docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -t -c "
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%';
")

# Apply tables to each tenant schema
for schema in $TENANT_SCHEMAS; do
  echo "Creating tables in schema: $schema"
  docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "
    SET search_path TO \"$schema\";
    -- Execute all CREATE TABLE statements here
  "
done
```

#### Phase 3: Indexes and Performance (30 minutes)
```sql
-- Performance indexes for each tenant schema
CREATE INDEX patients_patient_number_idx ON patients(patient_number);
CREATE INDEX patients_email_idx ON patients(email);
CREATE INDEX patients_name_idx ON patients(last_name, first_name);
CREATE INDEX patients_dob_idx ON patients(date_of_birth);

CREATE INDEX appointments_patient_id_idx ON appointments(patient_id);
CREATE INDEX appointments_doctor_id_idx ON appointments(doctor_id);
CREATE INDEX appointments_date_idx ON appointments(appointment_date);
CREATE INDEX appointments_status_idx ON appointments(status);

CREATE INDEX medical_records_patient_id_idx ON medical_records(patient_id);
CREATE INDEX medical_records_doctor_id_idx ON medical_records(doctor_id);
CREATE INDEX medical_records_visit_date_idx ON medical_records(visit_date);

CREATE INDEX prescriptions_patient_id_idx ON prescriptions(patient_id);
CREATE INDEX prescriptions_status_idx ON prescriptions(status);

CREATE INDEX lab_tests_patient_id_idx ON lab_tests(patient_id);
CREATE INDEX lab_tests_status_idx ON lab_tests(status);
```

#### Phase 4: Sample Data Creation (45 minutes)
**Create realistic test data for development:**

```sql
-- Sample patients for each tenant
INSERT INTO patients (patient_number, first_name, last_name, email, phone, date_of_birth, gender, address) VALUES
('P001', 'John', 'Doe', 'john.doe@email.com', '555-0101', '1985-03-15', 'Male', '123 Main St, City, State'),
('P002', 'Jane', 'Smith', 'jane.smith@email.com', '555-0102', '1990-07-22', 'Female', '456 Oak Ave, City, State'),
('P003', 'Robert', 'Johnson', 'robert.j@email.com', '555-0103', '1978-11-08', 'Male', '789 Pine Rd, City, State');

-- Sample appointments
INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_type, status) VALUES
(1, 2, '2025-11-03 09:00:00', 'General Checkup', 'scheduled'),
(2, 2, '2025-11-03 10:30:00', 'Follow-up', 'scheduled'),
(3, 2, '2025-11-03 14:00:00', 'Consultation', 'scheduled');

-- Sample medical records
INSERT INTO medical_records (patient_id, doctor_id, visit_date, chief_complaint, diagnosis, treatment_plan) VALUES
(1, 2, '2025-11-01 09:00:00', 'Annual checkup', 'Healthy', 'Continue current lifestyle'),
(2, 2, '2025-11-01 10:30:00', 'Headache', 'Tension headache', 'Rest and hydration');
```

#### Phase 5: API Integration (45 minutes)
**Create or update API endpoints for tenant data:**

1. **Patient management endpoints**
2. **Appointment scheduling endpoints**
3. **Medical records endpoints**
4. **Prescription management endpoints**

### 🚨 Agent B Success Criteria
- [ ] All hospital management tables exist in every tenant schema
- [ ] Sample data is created for testing
- [ ] Performance indexes are in place
- [ ] API endpoints work with tenant context
- [ ] Data isolation is properly enforced
- [ ] Cross-tenant data leakage is prevented

---

## 🔄 Coordination Between Agents

### Synchronization Points
1. **Agent A completes users table** → Agent B can reference users.id for doctor_id
2. **Agent B designs schema** → Agent A can validate foreign key relationships
3. **Both complete core work** → Joint testing and validation

### Communication Protocol
- **Status Updates**: Every 30 minutes in shared documentation
- **Blocking Issues**: Immediate notification if dependencies are blocked
- **Success Confirmation**: Checklist completion before moving to next phase

### Shared Resources
- **Database**: Same PostgreSQL instance (coordinate access)
- **Documentation**: Update shared schema docs as work progresses
- **Testing**: Joint validation of complete system functionality

---

## 🎯 Final Success Criteria (Both Agents)

### System Functionality
- [ ] Complete user authentication with database integration
- [ ] Role-based access control working
- [ ] Multi-tenant data isolation enforced
- [ ] Hospital management workflows functional
- [ ] API endpoints responding correctly
- [ ] Frontend can interact with all backend systems

### Data Integrity
- [ ] All foreign key relationships work
- [ ] Tenant isolation prevents cross-tenant access
- [ ] User permissions are properly enforced
- [ ] Sample data exists for testing

### Performance
- [ ] Database queries execute efficiently
- [ ] Indexes are utilized properly
- [ ] Connection pooling works correctly
- [ ] Schema switching is fast

### Documentation
- [ ] All schema documentation is updated
- [ ] API documentation reflects new endpoints
- [ ] Migration history is accurate
- [ ] Troubleshooting guides are current

---

## 🚀 Getting Started

### For Agent A (Core Infrastructure)
```bash
# 1. Navigate to backend directory
cd backend

# 2. Ensure database is running
docker ps | grep postgres

# 3. Start with migration recovery
# Follow Phase 1 instructions above

# 4. Update documentation as you progress
# Edit files in backend/docs/database-schema/
```

### For Agent B (Multi-Tenant Data)
```bash
# 1. Wait for Agent A to create users table (30-60 minutes)
# 2. Design hospital schema (can start immediately)
# 3. Prepare SQL scripts for tenant schema creation
# 4. Coordinate with Agent A on foreign key references

# 5. Monitor Agent A progress
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "\dt"
```

### Success Tracking
Create a shared progress file:
```bash
# Create progress tracking
echo "Agent A Progress: Starting migration recovery" > backend/docs/AGENT_PROGRESS.md
echo "Agent B Progress: Designing hospital schema" >> backend/docs/AGENT_PROGRESS.md
```

**Let's get both agents working in parallel to resolve these critical database issues and implement the complete multi-tenant hospital management system!**