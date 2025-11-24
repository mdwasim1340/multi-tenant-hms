/**
 * Create Bed Management Tables
 * Simple script to create only the missing tables for bed management
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'multitenant_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function createTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Creating Bed Management Tables...\n');
    
    // Check and create each table individually
    const tables = [
      {
        name: 'bed_transfers',
        sql: `
          CREATE TABLE bed_transfers (
            id SERIAL PRIMARY KEY,
            from_bed_id INTEGER NOT NULL,
            to_bed_id INTEGER NOT NULL,
            patient_id INTEGER NOT NULL,
            reason TEXT NOT NULL,
            priority VARCHAR(20) NOT NULL CHECK (priority IN ('Urgent', 'High', 'Medium', 'Low')),
            scheduled_time TIMESTAMP,
            executed_time TIMESTAMP,
            status VARCHAR(20) NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Cancelled')),
            notes TEXT,
            performed_by INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `
      },
      {
        name: 'patient_discharges',
        sql: `
          CREATE TABLE patient_discharges (
            id SERIAL PRIMARY KEY,
            bed_id INTEGER NOT NULL,
            patient_id INTEGER NOT NULL,
            discharge_date TIMESTAMP NOT NULL,
            discharge_type VARCHAR(50) NOT NULL CHECK (discharge_type IN ('Recovered', 'Transferred to another facility', 'AMA', 'Deceased')),
            discharge_summary TEXT NOT NULL,
            final_bill_status VARCHAR(20) NOT NULL CHECK (final_bill_status IN ('Paid', 'Pending', 'Insurance Claim')),
            follow_up_required BOOLEAN DEFAULT FALSE,
            follow_up_date DATE,
            follow_up_instructions TEXT,
            medications JSONB,
            home_care_instructions TEXT,
            transport_arrangement VARCHAR(100) NOT NULL,
            performed_by INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `
      },
      {
        name: 'bed_history',
        sql: `
          CREATE TABLE bed_history (
            id SERIAL PRIMARY KEY,
            bed_id INTEGER NOT NULL,
            event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('Admission', 'Discharge', 'Transfer In', 'Transfer Out', 'Maintenance Start', 'Maintenance End', 'Cleaning')),
            patient_id INTEGER,
            performed_by INTEGER NOT NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `
      },
      {
        name: 'bed_assignments',
        sql: `
          CREATE TABLE bed_assignments (
            id SERIAL PRIMARY KEY,
            bed_id INTEGER NOT NULL,
            patient_id INTEGER NOT NULL,
            assigned_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            discharge_date TIMESTAMP,
            status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Discharged', 'Transferred')),
            assigned_by INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `
      },
      {
        name: 'housekeeping_tasks',
        sql: `
          CREATE TABLE housekeeping_tasks (
            id SERIAL PRIMARY KEY,
            bed_id INTEGER NOT NULL,
            task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('Routine Cleaning', 'Deep Cleaning', 'Maintenance', 'Sanitization')),
            priority VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
            status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),
            assigned_to INTEGER,
            notes TEXT,
            scheduled_time TIMESTAMP,
            completed_time TIMESTAMP,
            created_by INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `
      },
      {
        name: 'follow_up_appointments',
        sql: `
          CREATE TABLE follow_up_appointments (
            id SERIAL PRIMARY KEY,
            patient_id INTEGER NOT NULL,
            scheduled_date DATE NOT NULL,
            instructions TEXT,
            status VARCHAR(20) NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled', 'No Show')),
            created_by INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `
      }
    ];
    
    for (const table of tables) {
      // Check if table exists
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${table.name}'
        );
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log(`📋 Creating table: ${table.name}`);
        await client.query(table.sql);
        console.log(`✅ Table ${table.name} created`);
      } else {
        console.log(`✅ Table ${table.name} already exists`);
      }
    }
    
    // Create indexes
    console.log('\n📋 Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_bed_transfers_from_bed ON bed_transfers(from_bed_id);',
      'CREATE INDEX IF NOT EXISTS idx_bed_transfers_to_bed ON bed_transfers(to_bed_id);',
      'CREATE INDEX IF NOT EXISTS idx_bed_transfers_patient ON bed_transfers(patient_id);',
      'CREATE INDEX IF NOT EXISTS idx_bed_transfers_status ON bed_transfers(status);',
      'CREATE INDEX IF NOT EXISTS idx_patient_discharges_bed ON patient_discharges(bed_id);',
      'CREATE INDEX IF NOT EXISTS idx_patient_discharges_patient ON patient_discharges(patient_id);',
      'CREATE INDEX IF NOT EXISTS idx_bed_history_bed ON bed_history(bed_id);',
      'CREATE INDEX IF NOT EXISTS idx_bed_assignments_bed ON bed_assignments(bed_id);',
      'CREATE INDEX IF NOT EXISTS idx_bed_assignments_patient ON bed_assignments(patient_id);',
      'CREATE INDEX IF NOT EXISTS idx_bed_assignments_assigned_date ON bed_assignments(assigned_date);'
    ];
    
    for (const indexSQL of indexes) {
      await client.query(indexSQL);
    }
    
    console.log('✅ All indexes created');