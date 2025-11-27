/**
 * Fix bed_assignments table schema in tenant
 * Apply the enhanced bed management schema to tenant
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function fixBedAssignmentsSchema() {
  try {
    console.log('🔧 Fixing bed_assignments table schema...\n');

    const tenantId = 'aajmin_polyclinic';
    
    // Set tenant context
    await pool.query(`SET search_path TO "${tenantId}"`);
    console.log(`✅ Set tenant context to: ${tenantId}`);

    // Check if there's any existing data
    const dataCheck = await pool.query('SELECT COUNT(*) FROM bed_assignments');
    const existingRecords = parseInt(dataCheck.rows[0].count);
    console.log(`📊 Existing records in bed_assignments: ${existingRecords}`);

    if (existingRecords > 0) {
      console.log('⚠️  Found existing data. Backing up before schema change...');
      
      // Create backup table
      await pool.query(`
        CREATE TABLE bed_assignments_backup AS 
        SELECT * FROM bed_assignments;
      `);
      console.log('✅ Backup created as bed_assignments_backup');
    }

    // Drop the old table
    console.log('🗑️  Dropping old bed_assignments table...');
    await pool.query('DROP TABLE IF EXISTS bed_assignments CASCADE');

    // Create the new table with enhanced schema
    console.log('🏗️  Creating new bed_assignments table with enhanced schema...');
    await pool.query(`
      CREATE TABLE bed_assignments (
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
      );
    `);

    // Add indexes for performance
    console.log('📊 Adding indexes...');
    await pool.query(`
      CREATE INDEX idx_bed_assignments_bed_id ON bed_assignments(bed_id);
      CREATE INDEX idx_bed_assignments_patient_id ON bed_assignments(patient_id);
      CREATE INDEX idx_bed_assignments_status ON bed_assignments(status);
      CREATE INDEX idx_bed_assignments_admission_date ON bed_assignments(admission_date);
    `);

    // Verify the new structure
    console.log('\n✅ New table structure:');
    const newColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = $1 AND table_name = 'bed_assignments'
      ORDER BY ordinal_position;
    `, [tenantId]);
    
    newColumns.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Check if we now have the required columns
    const hasPatientName = newColumns.rows.some(col => col.column_name === 'patient_name');
    const hasPatientMrn = newColumns.rows.some(col => col.column_name === 'patient_mrn');
    
    if (hasPatientName && hasPatientMrn) {
      console.log('\n🎉 SUCCESS! bed_assignments table now has the correct enhanced schema');
      console.log('✅ Backend assignment API should now work correctly');
    } else {
      console.log('\n❌ Something went wrong - missing required columns');
    }

    if (existingRecords > 0) {
      console.log('\n💡 Note: Old data is backed up in bed_assignments_backup table');
      console.log('   You may need to migrate the data manually if needed');
    }

  } catch (error) {
    console.error('❌ Error fixing schema:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

fixBedAssignmentsSchema();