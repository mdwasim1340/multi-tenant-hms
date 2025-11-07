const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function applyMedicalRecordsSchema() {
  const client = await pool.connect();

  try {
    console.log('🚀 Applying medical records schema...\n');

    // Get all tenant schemas
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%'
      ORDER BY schema_name
    `);

    const schemas = schemasResult.rows.map((row) => row.schema_name);

    console.log(`📋 Found ${schemas.length} tenant schemas\n`);

    // Read SQL file
    const sqlFile = path.join(
      __dirname,
      '../migrations/create-medical-records-schema.sql'
    );
    const sql = fs.readFileSync(sqlFile, 'utf8');

    for (const schema of schemas) {
      console.log(`📦 Applying to: ${schema}`);

      await client.query(`SET search_path TO "${schema}"`);
      await client.query(sql);

      // Verify tables created
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = '${schema}' 
        AND table_name IN ('medical_records', 'diagnoses', 'treatments', 'prescriptions')
        ORDER BY table_name
      `);

      const tables = tablesResult.rows.map((row) => row.table_name);
      console.log(`   ✅ Created: ${tables.join(', ')}\n`);
    }

    console.log('🎉 Medical records schema applied successfully!\n');
  } catch (error) {
    console.error('❌ Error applying schema:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

applyMedicalRecordsSchema()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
