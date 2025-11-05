const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function createCustomFieldsTables() {
  try {
    console.log('🚀 Creating custom fields tables...');

    // Create custom_fields table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS custom_fields (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        label VARCHAR(255) NOT NULL,
        field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('text', 'textarea', 'number', 'date', 'datetime', 'boolean', 'dropdown', 'multi_select', 'file_upload', 'rich_text')),
        applies_to VARCHAR(50) NOT NULL CHECK (applies_to IN ('patients', 'appointments', 'medical_records')),
        validation_rules JSONB DEFAULT '{}',
        conditional_logic JSONB DEFAULT '{}',
        display_order INTEGER DEFAULT 0,
        is_required BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        default_value TEXT,
        help_text TEXT,
        tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created custom_fields table');

    // Create custom_field_options table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS custom_field_options (
        id SERIAL PRIMARY KEY,
        field_id INTEGER NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
        option_value VARCHAR(255) NOT NULL,
        option_label VARCHAR(255) NOT NULL,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created custom_field_options table');

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS custom_fields_tenant_id_idx ON custom_fields(tenant_id)',
      'CREATE INDEX IF NOT EXISTS custom_fields_applies_to_idx ON custom_fields(applies_to)',
      'CREATE INDEX IF NOT EXISTS custom_fields_is_active_idx ON custom_fields(is_active)',
      'CREATE INDEX IF NOT EXISTS custom_fields_tenant_applies_active_idx ON custom_fields(tenant_id, applies_to, is_active)',
      'CREATE INDEX IF NOT EXISTS custom_field_options_field_id_idx ON custom_field_options(field_id)',
      'CREATE INDEX IF NOT EXISTS custom_field_options_is_active_idx ON custom_field_options(is_active)'
    ];

    for (const indexSQL of indexes) {
      await pool.query(indexSQL);
    }
    console.log('✅ Created indexes');

    // Create unique constraint
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'unique_field_name_per_tenant_entity'
        ) THEN
          ALTER TABLE custom_fields 
          ADD CONSTRAINT unique_field_name_per_tenant_entity 
          UNIQUE(tenant_id, applies_to, name);
        END IF;
      END $$;
    `);
    console.log('✅ Created unique constraint');

    // Record migration
    await pool.query(`
      INSERT INTO pgmigrations (name, run_on) 
      VALUES ('005-create-custom-fields-tables', NOW()) 
      ON CONFLICT (name) DO NOTHING
    `);
    console.log('✅ Recorded migration');

    console.log('🎉 Custom fields tables created successfully!');

  } catch (error) {
    console.error('❌ Error creating custom fields tables:', error);
  } finally {
    await pool.end();
  }
}

createCustomFieldsTables();