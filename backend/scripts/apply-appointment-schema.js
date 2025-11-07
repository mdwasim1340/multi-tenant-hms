const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function applyAppointmentSchema() {
  const client = await pool.connect();

  try {
    console.log('🚀 Applying appointment schema...\n');

    const sqlFile = path.join(
      __dirname,
      '../migrations/schemas/appointment-schema.sql'
    );
    const sql = fs.readFileSync(sqlFile, 'utf8');

    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%'
      ORDER BY schema_name
    `);

    const tenantSchemas = schemasResult.rows.map((row) => row.schema_name);
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

      const tables = tablesResult.rows.map((row) => row.table_name);
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
