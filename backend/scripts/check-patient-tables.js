/**
 * Check if patient tables exist in tenant schemas
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function checkPatientTables() {
  try {
    console.log('🔍 Checking for patient tables in tenant schemas...\n');

    // Get all tenant schemas
    const schemasResult = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%' OR schema_name = 'aajmin_polyclinic'
      ORDER BY schema_name
    `);

    if (schemasResult.rows.length === 0) {
      console.log('❌ No tenant schemas found');
      return;
    }

    console.log(`Found ${schemasResult.rows.length} tenant schemas\n`);

    for (const row of schemasResult.rows) {
      const schema = row.schema_name;
      console.log(`📁 Schema: ${schema}`);

      // Check for patient table
      const tableResult = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = $1 AND table_name = 'patients'
      `, [schema]);

      if (tableResult.rows.length > 0) {
        // Get patient count
        const countResult = await pool.query(`
          SELECT COUNT(*) as count FROM "${schema}".patients
        `);
        console.log(`   ✅ patients table exists (${countResult.rows[0].count} records)`);

        // Get table structure
        const columnsResult = await pool.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = $1 AND table_name = 'patients'
          ORDER BY ordinal_position
        `, [schema]);

        console.log(`   📋 Columns: ${columnsResult.rows.length}`);
        columnsResult.rows.slice(0, 5).forEach(col => {
          console.log(`      - ${col.column_name} (${col.data_type})`);
        });
        if (columnsResult.rows.length > 5) {
          console.log(`      ... and ${columnsResult.rows.length - 5} more`);
        }
      } else {
        console.log(`   ❌ patients table does NOT exist`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error checking patient tables:', error.message);
  } finally {
    await pool.end();
  }
}

checkPatientTables();
