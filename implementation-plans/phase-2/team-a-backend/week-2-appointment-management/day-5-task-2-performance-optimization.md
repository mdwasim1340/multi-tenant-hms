# Week 2, Day 5, Task 2: Performance Optimization

## 🎯 Task Objective
Optimize appointment queries and add database indexes for better performance.

## ⏱️ Estimated Time: 1.5 hours

## 📝 Step 1: Add Database Indexes

Create file: `backend/migrations/add-appointment-indexes.sql`

```sql
-- Indexes for appointments table
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_type ON appointments(appointment_type);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_date ON appointments(patient_id, appointment_date);

-- Indexes for doctor_schedules table
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doctor_id ON doctor_schedules(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_day ON doctor_schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doctor_day ON doctor_schedules(doctor_id, day_of_week);

-- Indexes for doctor_time_off table
CREATE INDEX IF NOT EXISTS idx_doctor_time_off_doctor_id ON doctor_time_off(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_time_off_dates ON doctor_time_off(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_doctor_time_off_status ON doctor_time_off(status);
```

## 📝 Step 2: Apply Indexes to All Tenants

Create file: `backend/scripts/apply-appointment-indexes.js`

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

async function applyIndexes() {
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
      console.log(`\nApplying indexes to schema: ${schema}`);
      
      await client.query(`SET search_path TO "${schema}"`);
      
      // Appointments indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_appointments_type ON appointments(appointment_type)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, appointment_date)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_appointments_patient_date ON appointments(patient_id, appointment_date)');
      
      // Doctor schedules indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doctor_id ON doctor_schedules(doctor_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_doctor_schedules_day ON doctor_schedules(day_of_week)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doctor_day ON doctor_schedules(doctor_id, day_of_week)');
      
      // Doctor time off indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_doctor_time_off_doctor_id ON doctor_time_off(doctor_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_doctor_time_off_dates ON doctor_time_off(start_date, end_date)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_doctor_time_off_status ON doctor_time_off(status)');
      
      console.log(`✅ Indexes applied to ${schema}`);
    }
    
    console.log('\n✅ All indexes applied successfully');
    
  } catch (error) {
    console.error('Error applying indexes:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

applyIndexes();
```

## 📝 Step 3: Optimize Query Performance

Update `backend/src/services/appointment.service.ts` with optimized queries:

```typescript
// Add query optimization hints
async getAppointmentById(id: number, tenantId: string): Promise<Appointment | null> {
  const client = await this.pool.connect();
  
  try {
    await client.query(`SET search_path TO "${tenantId}"`);
    
    // Optimized query with explicit index hints
    const query = `
      SELECT 
        a.*,
        json_build_object(
          'id', p.id,
          'first_name', p.first_name,
          'last_name', p.last_name,
          'patient_number', p.patient_number,
          'phone', p.phone,
          'email', p.email
        ) as patient,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email
        ) as doctor
      FROM appointments a
      INNER JOIN patients p ON p.id = a.patient_id
      LEFT JOIN public.users u ON u.id = a.doctor_id
      WHERE a.id = $1
    `;
    
    const result = await client.query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
    
  } finally {
    client.release();
  }
}
```

## ✅ Verification

```bash
# Apply indexes
node backend/scripts/apply-appointment-indexes.js

# Expected output:
# Found X tenant schemas
# Applying indexes to schema: demo_hospital_001
# ✅ Indexes applied to demo_hospital_001
# ...
# ✅ All indexes applied successfully

# Test query performance
npm run dev

# Run performance test
curl "http://localhost:3000/api/appointments?page=1&limit=100" \
  -H "X-Tenant-ID: demo_hospital_001" \
  -w "\nTime: %{time_total}s\n"

# Should be faster with indexes
```

## 📄 Commit

```bash
git add migrations/add-appointment-indexes.sql scripts/apply-appointment-indexes.js
git commit -m "perf(appointment): Add database indexes for better query performance"
```
