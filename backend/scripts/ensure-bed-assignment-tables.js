/**
 * Script to ensure bed_assignments table exists in tenant schema
 * Run this to fix the 500 error when creating bed assignments
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function ensureBedAssignmentTables() {
  const client = await pool.connect();
  
  try {
    // Get all tenant schemas
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'aajmin%'
    `);
    
    console.log('Found tenant schemas:', schemasResult.rows.map(r => r.schema_name));
    
    for (const row of schemasResult.rows) {
      const schema = row.schema_name;
      console.log(`\n--- Processing schema: ${schema} ---`);
      
      // Set search path
      await client.query(`SET search_path TO "${schema}", public`);
      
      // Check if bed_assignments table exists
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = 'bed_assignments'
        )
      `, [schema]);
      
      if (!tableCheck.rows[0].exists) {
        console.log(`Creating bed_assignments table in ${schema}...`);
        
        await client.query(`
          CREATE TABLE IF NOT EXISTS bed_assignments (
            id SERIAL PRIMARY KEY,
            bed_id INTEGER NOT NULL,
            patient_id INTEGER,
            patient_name VARCHAR(255) NOT NULL,
            patient_mrn VARCHAR(100),
            patient_age INTEGER,
            patient_gender VARCHAR(20),
            admission_date TIMESTAMP NOT NULL,
            expected_discharge_date TIMESTAMP,
            actual_discharge_date TIMESTAMP,
            condition VARCHAR(50) DEFAULT 'Stable',
            assigned_doctor VARCHAR(255),
            assigned_nurse VARCHAR(255),
            admission_reason TEXT,
            allergies TEXT,
            current_medications TEXT,
            emergency_contact_name VARCHAR(255),
            emergency_contact_phone VARCHAR(50),
            notes TEXT,
            status VARCHAR(50) DEFAULT 'active',
            created_by INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        console.log(`✅ Created bed_assignments table in ${schema}`);
      } else {
        console.log(`✅ bed_assignments table already exists in ${schema}`);
      }
      
      // Check if bed_activity_log table exists
      const activityLogCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = 'bed_activity_log'
        )
      `, [schema]);
      
      if (!activityLogCheck.rows[0].exists) {
        console.log(`Creating bed_activity_log table in ${schema}...`);
        
        await client.query(`
          CREATE TABLE IF NOT EXISTS bed_activity_log (
            id SERIAL PRIMARY KEY,
            bed_id INTEGER NOT NULL,
            event_type VARCHAR(100) NOT NULL,
            patient_name VARCHAR(255),
            patient_mrn VARCHAR(100),
            staff_member VARCHAR(255),
            staff_role VARCHAR(100),
            from_bed VARCHAR(50),
            to_bed VARCHAR(50),
            notes TEXT,
            duration_minutes INTEGER,
            additional_data JSONB,
            ip_address INET,
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        console.log(`✅ Created bed_activity_log table in ${schema}`);
      } else {
        console.log(`✅ bed_activity_log table already exists in ${schema}`);
      }
    }
    
    console.log('\n✅ All tenant schemas processed successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

ensureBedAssignmentTables();
