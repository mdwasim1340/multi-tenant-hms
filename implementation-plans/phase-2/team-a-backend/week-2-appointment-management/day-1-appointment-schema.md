# Week 2, Day 1: Appointment Database Schema

## 🎯 Task Objective
Create comprehensive appointment database schema with scheduling, doctor availability, and conflict detection.

## ⏱️ Estimated Time: 6-8 hours

## 📋 Prerequisites
- Week 1 complete (Patient management working)
- Database connection operational
- All 6 tenant schemas available

## 📝 Step 1: Create Appointment Schema SQL

Create file: `backend/migrations/schemas/appointment-schema.sql`

```sql
-- Appointment Management Schema
-- Apply to ALL tenant schemas

-- Main appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  appointment_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Relationships
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INTEGER NOT NULL, -- References public.users.id
  
  -- Appointment timing
  appointment_date TIMESTAMP NOT NULL,
  appointment_end_time TIMESTAMP NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  appointment_type VARCHAR(100), -- 'consultation', 'follow_up', 'emergency', 'procedure'
  
  -- Status workflow
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'confirmed', 'checked_in', 'in_progress', 
    'completed', 'cancelled', 'no_show', 'rescheduled'
  )),
  
  -- Cancellation/rescheduling
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP,
  cancelled_by INTEGER,
  rescheduled_from INTEGER REFERENCES appointments(id),
  rescheduled_to INTEGER REFERENCES appointments(id),
  
  -- Clinical info
  chief_complaint TEXT,
  notes TEXT,
  special_instructions TEXT,
  
  -- Reminders
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMP,
  
  -- Billing
  estimated_cost DECIMAL(10, 2),
  actual_cost DECIMAL(10, 2),
  payment_status VARCHAR(50) DEFAULT 'pending',
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  
  -- Constraints
  CONSTRAINT valid_appointment_time CHECK (appointment_end_time > appointment_date),
  CONSTRAINT valid_duration CHECK (duration_minutes > 0 AND duration_minutes <= 480)
);

-- Doctor schedules
CREATE TABLE IF NOT EXISTS doctor_schedules (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
  break_duration_minutes INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  effective_from DATE,
  effective_until DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_slot_duration CHECK (slot_duration_minutes > 0 AND slot_duration_minutes <= 240),
  UNIQUE(doctor_id, day_of_week, start_time, effective_from)
);

-- Doctor time off
CREATE TABLE IF NOT EXISTS doctor_time_off (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  reason VARCHAR(100),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by INTEGER,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Appointment reminders
CREATE TABLE IF NOT EXISTS appointment_reminders (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  reminder_type VARCHAR(50) NOT NULL,
  scheduled_for TIMESTAMP NOT NULL,
  sent_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  delivery_status VARCHAR(100),
  error_message TEXT,
  patient_confirmed BOOLEAN DEFAULT FALSE,
  patient_response_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS appointments_number_idx ON appointments(appointment_number);
CREATE INDEX IF NOT EXISTS appointments_patient_id_idx ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS appointments_doctor_id_idx ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS appointments_date_idx ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS appointments_date_doctor_idx ON appointments(appointment_date, doctor_id);
CREATE INDEX IF NOT EXISTS appointments_status_idx ON appointments(status);
CREATE INDEX IF NOT EXISTS appointments_status_date_idx ON appointments(status, appointment_date);

CREATE INDEX IF NOT EXISTS doctor_schedules_doctor_id_idx ON doctor_schedules(doctor_id);
CREATE INDEX IF NOT EXISTS doctor_schedules_day_idx ON doctor_schedules(day_of_week);
CREATE INDEX IF NOT EXISTS doctor_schedules_doctor_day_idx ON doctor_schedules(doctor_id, day_of_week);

CREATE INDEX IF NOT EXISTS doctor_time_off_doctor_id_idx ON doctor_time_off(doctor_id);
CREATE INDEX IF NOT EXISTS doctor_time_off_date_range_idx ON doctor_time_off(start_date, end_date);

CREATE INDEX IF NOT EXISTS appointment_reminders_appointment_idx ON appointment_reminders(appointment_id);
CREATE INDEX IF NOT EXISTS appointment_reminders_pending_idx ON appointment_reminders(scheduled_for, status) 
  WHERE status = 'pending';
```

## 📝 Step 2: Create Application Script

Create file: `backend/scripts/apply-appointment-schema.js`

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

async function applyAppointmentSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Applying appointment schema...\n');
    
    const sqlFile = path.join(__dirname, '../migrations/schemas/appointment-schema.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%'
      ORDER BY schema_name
    `);
    
    const tenantSchemas = schemasResult.rows.map(row => row.schema_name);
    console.log(`📋 Found ${tenantSchemas.length} tenant schemas\n`);
    
    for (const schema of tenantSchemas) {
      console.log(`📦 Applying to: ${schema}`);
      
      await client.query(`SET search_path TO "${schema}"`);
      await client.query(sql);
      
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = '${schema}' 
        AND table_name IN ('appointments', 'doctor_schedules', 'doctor_time_off', 'appointment_reminders')
        ORDER BY table_name
      `);
      
      const tables = tablesResult.rows.map(row => row.table_name);
      console.log(`   ✅ Created: ${tables.join(', ')}\n`);
    }
    
    console.log('🎉 Appointment schema applied successfully!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

applyAppointmentSchema()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
```

## 📝 Step 3: Apply Schema

```bash
node scripts/apply-appointment-schema.js
```

## 📝 Step 4: Create Sample Data

Create file: `backend/scripts/create-sample-appointments.js`

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

async function createSampleData() {
  const client = await pool.connect();
  
  try {
    await client.query(`SET search_path TO "demo_hospital_001"`);
    
    console.log('🏥 Creating sample appointment data...\n');
    
    // Create doctor schedule (Monday-Friday, 9 AM - 5 PM)
    console.log('1. Creating doctor schedule...');
    for (let day = 1; day <= 5; day++) {
      await client.query(`
        INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes)
        VALUES (1, $1, '09:00', '17:00', 30)
        ON CONFLICT DO NOTHING
      `, [day]);
    }
    console.log('   ✅ Doctor schedule created\n');
    
    // Create sample appointments
    console.log('2. Creating sample appointments...');
    const appointments = [
      {
        patient_id: 1,
        doctor_id: 1,
        appointment_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        duration_minutes: 30,
        appointment_type: 'consultation',
        status: 'scheduled'
      },
      {
        patient_id: 2,
        doctor_id: 1,
        appointment_date: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // Tomorrow + 30 min
        duration_minutes: 30,
        appointment_type: 'follow_up',
        status: 'scheduled'
      }
    ];
    
    for (const apt of appointments) {
      const endTime = new Date(apt.appointment_date.getTime() + apt.duration_minutes * 60 * 1000);
      
      await client.query(`
        INSERT INTO appointments (
          appointment_number, patient_id, doctor_id, appointment_date, 
          appointment_end_time, duration_minutes, appointment_type, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        `APT${Date.now()}${Math.floor(Math.random() * 1000)}`,
        apt.patient_id, apt.doctor_id, apt.appointment_date,
        endTime, apt.duration_minutes, apt.appointment_type, apt.status
      ]);
    }
    console.log('   ✅ Sample appointments created\n');
    
    console.log('🎉 Sample data created successfully!');
    
  } finally {
    client.release();
    await pool.end();
  }
}

createSampleData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
```

Run it:
```bash
node scripts/create-sample-appointments.js
```

## ✅ Verification

```bash
# Verify tables created
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "
SET search_path TO 'demo_hospital_001';
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'demo_hospital_001' 
AND table_name LIKE '%appointment%' OR table_name LIKE '%doctor%'
ORDER BY table_name;
"

# Check sample data
docker exec -it backend-postgres-1 psql -U postgres -d multitenant_db -c "
SET search_path TO 'demo_hospital_001';
SELECT COUNT(*) as appointments FROM appointments;
SELECT COUNT(*) as schedules FROM doctor_schedules;
"
```

## 📄 Commit

```bash
git add migrations/schemas/appointment-schema.sql scripts/
git commit -m "feat(appointment): Create appointment database schema

- Created appointments, doctor_schedules, doctor_time_off, appointment_reminders tables
- Applied schema to all 6 tenant schemas
- Created 15+ performance indexes
- Added sample data scripts"
```

## 🎯 Success Criteria
- ✅ 4 tables created in all 6 tenant schemas
- ✅ 15+ indexes created per tenant
- ✅ Sample doctor schedule created
- ✅ Sample appointments created
- ✅ All verification scripts passing