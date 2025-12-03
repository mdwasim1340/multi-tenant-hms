#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function applyAppointmentsMigration() {
  const client = await pool.connect();

  try {
    console.log('📋 Applying appointments table migration...\n');

    // Read the migration SQL
    const migrationPath = path.join(__dirname, '../migrations/1732400000000_create_appointments.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Get all tenant schemas
    const schemasResult = await client.query(`
      SELECT schema_name FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%'
      ORDER BY schema_name
    `);

    const schemas = schemasResult.rows.map(r => r.schema_name);
    console.log(`Found ${schemas.length} tenant schemas\n`);

    if (schemas.length === 0) {
      console.log('⚠️  No tenant schemas found. Skipping migration.');
      return;
    }

    // Apply migration to each tenant schema
    for (const schema of schemas) {
      try {
        console.log(`⏳ Applying migration to schema: ${schema}`);
        
        // Set search path to tenant schema
        await client.query(`SET search_path TO "${schema}"`);
        
        // Execute migration SQL
        await client.query(migrationSQL);
        
        console.log(`✅ Successfully applied migration to ${schema}\n`);
      } catch (error) {
        console.error(`❌ Error applying migration to ${schema}:`, error.message);
        console.error(`   Details: ${error.detail || 'No additional details'}\n`);
      }
    }

    console.log('✨ Appointments table migration completed!');
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

applyAppointmentsMigration();
