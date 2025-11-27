/**
 * Check which bed_assignments migration was applied to tenant
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

async function checkBedAssignmentsMigration() {
  try {
    console.log('🔍 Checking bed_assignments migration status...\n');

    const tenantId = 'aajmin_polyclinic';
    
    // Check migration history
    console.log('📋 Migration history:');
    const migrations = await pool.query(`
      SELECT name, run_on 
      FROM pgmigrations 
      WHERE name LIKE '%bed%' OR name LIKE '%assignment%'
      ORDER BY run_on;
    `);
    
    migrations.rows.forEach(row => {
      console.log(`  ${row.name} - ${row.run_on}`);
    });

    // Set tenant context and check current table structure
    await pool.query(`SET search_path TO "${tenantId}"`);
    console.log(`\n✅ Set tenant context to: ${tenantId}`);

    // Get detailed column info
    console.log('\n📋 Current bed_assignments table structure:');
    const columns = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_schema = $1 AND table_name = 'bed_assignments'
      ORDER BY ordinal_position;
    `, [tenantId]);
    
    columns.rows.forEach(row => {
      const length = row.character_maximum_length ? `(${row.character_maximum_length})` : '';
      console.log(`  ${row.column_name}: ${row.data_type}${length} - nullable: ${row.is_nullable}`);
    });

    // Check if we have the new columns
    const hasPatientName = columns.rows.some(col => col.column_name === 'patient_name');
    const hasPatientMrn = columns.rows.some(col => col.column_name === 'patient_mrn');
    const hasPatientId = columns.rows.some(col => col.column_name === 'patient_id');
    
    console.log(`\n🔍 Column analysis:`);
    console.log(`  Has patient_name: ${hasPatientName}`);
    console.log(`  Has patient_mrn: ${hasPatientMrn}`);
    console.log(`  Has patient_id: ${hasPatientId}`);
    
    if (!hasPatientName && hasPatientId) {
      console.log('\n❌ Table has OLD schema (patient_id) instead of NEW schema (patient_name, patient_mrn, etc.)');
      console.log('💡 Need to apply the enhanced bed management migration to tenant schema');
    } else if (hasPatientName) {
      console.log('\n✅ Table has NEW schema with inline patient data');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkBedAssignmentsMigration();