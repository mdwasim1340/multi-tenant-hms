const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'multitenant_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function createMissingTables() {
  try {
    console.log('🚀 Creating missing enhanced bed management tables...');
    
    // Get all tenant schemas
    const tenantResult = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%' OR schema_name = 'aajmin_polyclinic'
    `);
    
    console.log(`Found ${tenantResult.rows.length} tenant schemas`);
    
    // SQL for missing tables
    const missingTablesSQL = `
      -- Create bed_maintenance table
      CREATE TABLE IF NOT EXISTS bed_maintenance (
          id SERIAL PRIMARY KEY,
          bed_id INTEGER NOT NULL,
          maintenance_type VARCHAR(100) NOT NULL,
          priority VARCHAR(50) DEFAULT 'Medium',
          description TEXT NOT NULL,
          estimated_duration INTEGER, -- in minutes
          scheduled_time TIMESTAMP,
          started_at TIMESTAMP,
          completed_at TIMESTAMP,
          assigned_technician VARCHAR(255),
          equipment_needed TEXT,
          safety_precautions TEXT,
          requires_patient_relocation BOOLEAN DEFAULT FALSE,
          cost_estimate DECIMAL(10,2),
          actual_cost DECIMAL(10,2),
          vendor_name VARCHAR(255),
          warranty_work BOOLEAN DEFAULT FALSE,
          preventive_maintenance BOOLEAN DEFAULT FALSE,
          status VARCHAR(50) DEFAULT 'scheduled',
          completion_notes TEXT,
          created_by INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create bed_reservations table
      CREATE TABLE IF NOT EXISTS bed_reservations (
          id SERIAL PRIMARY KEY,
          bed_id INTEGER NOT NULL,
          patient_name VARCHAR(255),
          patient_mrn VARCHAR(100),
          reservation_type VARCHAR(100) NOT NULL,
          priority VARCHAR(50) DEFAULT 'Medium',
          start_time TIMESTAMP NOT NULL,
          end_time TIMESTAMP,
          expected_admission_time TIMESTAMP,
          reserving_doctor VARCHAR(255),
          department VARCHAR(100),
          reason TEXT NOT NULL,
          special_requirements TEXT,
          contact_person VARCHAR(255),
          contact_phone VARCHAR(50),
          auto_release BOOLEAN DEFAULT TRUE,
          release_buffer_hours INTEGER DEFAULT 2,
          requires_preparation BOOLEAN DEFAULT FALSE,
          preparation_instructions TEXT,
          insurance_verified BOOLEAN DEFAULT FALSE,
          pre_auth_required BOOLEAN DEFAULT FALSE,
          pre_auth_number VARCHAR(100),
          status VARCHAR(50) DEFAULT 'active',
          created_by INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create bed_activity_log table
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
      );

      -- Create bed_equipment table
      CREATE TABLE IF NOT EXISTS bed_equipment (
          id SERIAL PRIMARY KEY,
          bed_id INTEGER NOT NULL,
          equipment_name VARCHAR(255) NOT NULL,
          equipment_type VARCHAR(100),
          serial_number VARCHAR(100),
          status VARCHAR(50) DEFAULT 'active',
          last_maintenance TIMESTAMP,
          next_maintenance TIMESTAMP,
          warranty_expiry TIMESTAMP,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create bed_cleaning_log table
      CREATE TABLE IF NOT EXISTS bed_cleaning_log (
          id SERIAL PRIMARY KEY,
          bed_id INTEGER NOT NULL,
          cleaning_type VARCHAR(100) NOT NULL,
          started_at TIMESTAMP NOT NULL,
          completed_at TIMESTAMP,
          staff_member VARCHAR(255),
          cleaning_products_used TEXT,
          disinfection_level VARCHAR(50),
          inspection_passed BOOLEAN,
          inspector_name VARCHAR(255),
          notes TEXT,
          duration_minutes INTEGER,
          status VARCHAR(50) DEFAULT 'in_progress',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create bed_occupancy_history table
      CREATE TABLE IF NOT EXISTS bed_occupancy_history (
          id SERIAL PRIMARY KEY,
          date DATE NOT NULL,
          hour INTEGER,
          department_id INTEGER,
          bed_type VARCHAR(100),
          total_beds INTEGER NOT NULL,
          occupied_beds INTEGER NOT NULL,
          available_beds INTEGER NOT NULL,
          maintenance_beds INTEGER DEFAULT 0,
          cleaning_beds INTEGER DEFAULT 0,
          reserved_beds INTEGER DEFAULT 0,
          blocked_beds INTEGER DEFAULT 0,
          occupancy_rate DECIMAL(5,2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_bed_maintenance_bed_id ON bed_maintenance(bed_id);
      CREATE INDEX IF NOT EXISTS idx_bed_maintenance_status ON bed_maintenance(status);
      CREATE INDEX IF NOT EXISTS idx_bed_maintenance_scheduled_time ON bed_maintenance(scheduled_time);

      CREATE INDEX IF NOT EXISTS idx_bed_reservations_bed_id ON bed_reservations(bed_id);
      CREATE INDEX IF NOT EXISTS idx_bed_reservations_status ON bed_reservations(status);
      CREATE INDEX IF NOT EXISTS idx_bed_reservations_start_time ON bed_reservations(start_time);

      CREATE INDEX IF NOT EXISTS idx_bed_activity_log_bed_id ON bed_activity_log(bed_id);
      CREATE INDEX IF NOT EXISTS idx_bed_activity_log_event_type ON bed_activity_log(event_type);
      CREATE INDEX IF NOT EXISTS idx_bed_activity_log_created_at ON bed_activity_log(created_at);

      CREATE INDEX IF NOT EXISTS idx_bed_equipment_bed_id ON bed_equipment(bed_id);
      CREATE INDEX IF NOT EXISTS idx_bed_equipment_status ON bed_equipment(status);

      CREATE INDEX IF NOT EXISTS idx_bed_cleaning_log_bed_id ON bed_cleaning_log(bed_id);
      CREATE INDEX IF NOT EXISTS idx_bed_cleaning_log_status ON bed_cleaning_log(status);

      CREATE INDEX IF NOT EXISTS idx_bed_occupancy_history_date ON bed_occupancy_history(date);
      CREATE INDEX IF NOT EXISTS idx_bed_occupancy_history_department ON bed_occupancy_history(department_id);
    `;
    
    // Apply to each tenant schema
    for (const row of tenantResult.rows) {
      const tenantId = row.schema_name;
      console.log(`  Creating tables in ${tenantId}...`);
      
      try {
        // Set search path to tenant schema
        await pool.query(`SET search_path TO "${tenantId}"`);
        
        // Execute table creation
        await pool.query(missingTablesSQL);
        
        console.log(`  ✅ Tables created in ${tenantId}`);
      } catch (error) {
        console.log(`  ❌ Error creating tables in ${tenantId}:`, error.message);
      }
    }
    
    console.log('✅ Missing bed management tables created successfully');
    
  } catch (error) {
    console.error('❌ Table creation failed:', error.message);
  } finally {
    await pool.end();
  }
}

createMissingTables();