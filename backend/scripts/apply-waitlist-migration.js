/**
 * Team Alpha - Apply Waitlist Migration
 * Applies the appointment_waitlist table to all tenant schemas
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function applyMigration() {
  const client = await pool.connect();

  try {
    console.log('\n🔄 Applying Appointment Waitlist Migration');
    console.log('='.repeat(60));

    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/1731673000000_create_appointment_waitlist.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Get all tenant schemas
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%'
      ORDER BY schema_name
    `);

    const schemas = schemasResult.rows.map(row => row.schema_name);
    console.log(`\n📋 Found ${schemas.length} tenant schemas`);

    // Apply migration to each tenant schema
    for (const schema of schemas) {
      try {
        console.log(`\n🔧 Applying to schema: ${schema}`);
        
        // Set search path
        await client.query(`SET search_path TO "${schema}"`);
        
        // Check if table already exists
        const tableCheck = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = $1 
            AND table_name = 'appointment_waitlist'
          )
        `, [schema]);

        if (tableCheck.rows[0].exists) {
          console.log(`  ⚠️  Table already exists, skipping...`);
          continue;
        }

        // Execute migration
        await client.query(migrationSQL);
        
        // Verify table was created
        const verifyResult = await client.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_schema = $1 
          AND table_name = 'appointment_waitlist'
          ORDER BY ordinal_position
        `, [schema]);

        console.log(`  ✅ Table created with ${verifyResult.rows.length} columns`);

      } catch (error) {
        console.error(`  ❌ Error applying to ${schema}:`, error.message);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));

    for (const schema of schemas) {
      await client.query(`SET search_path TO "${schema}"`);
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 
          AND table_name = 'appointment_waitlist'
        )
      `, [schema]);

      const status = tableCheck.rows[0].exists ? '✅' : '❌';
      console.log(`${status} ${schema}`);
    }

    console.log('\n🎉 Migration completed!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
if (require.main === module) {
  applyMigration().catch(console.error);
}

module.exports = { applyMigration };
