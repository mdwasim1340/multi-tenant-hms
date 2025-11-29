const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function createCustomFieldValuesTables() {
  try {
    console.log('🚀 Creating custom_field_values tables in all tenant schemas...');

    // Get all tenant schemas
    const tenantSchemas = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%'
      ORDER BY schema_name
    `);

    console.log(`Found ${tenantSchemas.rows.length} tenant schemas:`, tenantSchemas.rows.map(r => r.schema_name));

    for (const { schema_name } of tenantSchemas.rows) {
      console.log(`\n📋 Processing schema: ${schema_name}`);

      // Set search path to tenant schema
      await pool.query(`SET search_path TO "${schema_name}"`);

      // Create custom_field_values table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS custom_field_values (
          id SERIAL PRIMARY KEY,
          field_id INTEGER NOT NULL,
          entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('patients', 'appointments', 'medical_records')),
          entity_id INTEGER NOT NULL,
          field_value JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log(`  ✅ Created custom_field_values table in ${schema_name}`);

      // Create indexes
      const indexes = [
        'CREATE INDEX IF NOT EXISTS custom_field_values_field_id_idx ON custom_field_values(field_id)',
        'CREATE INDEX IF NOT EXISTS custom_field_values_entity_type_idx ON custom_field_values(entity_type)',
        'CREATE INDEX IF NOT EXISTS custom_field_values_entity_id_idx ON custom_field_values(entity_id)',
        'CREATE INDEX IF NOT EXISTS custom_field_values_entity_idx ON custom_field_values(entity_type, entity_id)',
        'CREATE INDEX IF NOT EXISTS custom_field_values_field_entity_idx ON custom_field_values(field_id, entity_type, entity_id)'
      ];

      for (const indexSQL of indexes) {
        await pool.query(indexSQL);
      }
      console.log(`  ✅ Created indexes in ${schema_name}`);

      // Create unique constraint
      await pool.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'unique_field_value_per_entity'
            AND connamespace = (SELECT oid FROM pg_namespace WHERE nspname = '${schema_name}')
          ) THEN
            ALTER TABLE custom_field_values 
            ADD CONSTRAINT unique_field_value_per_entity 
            UNIQUE(field_id, entity_type, entity_id);
          END IF;
        END $$;
      `);
      console.log(`  ✅ Created unique constraint in ${schema_name}`);
    }

    // Reset search path
    await pool.query('SET search_path TO public');

    console.log('\n🎉 Custom field values tables created in all tenant schemas!');

  } catch (error) {
    console.error('❌ Error creating custom field values tables:', error);
  } finally {
    await pool.end();
  }
}

createCustomFieldValuesTables();