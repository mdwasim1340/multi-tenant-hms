exports.up = async (pgm) => {
  // This migration will be applied to each tenant schema
  // Custom field values table (tenant-specific)
  pgm.createTable('custom_field_values', {
    id: { type: 'serial', primaryKey: true },
    field_id: { type: 'integer', notNull: true }, // References public.custom_fields(id)
    entity_type: { 
      type: 'varchar(50)', 
      notNull: true,
      check: "entity_type IN ('patients', 'appointments', 'medical_records')"
    },
    entity_id: { type: 'integer', notNull: true }, // References the specific entity (patient_id, appointment_id, etc.)
    field_value: { type: 'jsonb' }, // Store any type of value as JSON
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  });

  // Indexes for performance
  pgm.createIndex('custom_field_values', 'field_id');
  pgm.createIndex('custom_field_values', 'entity_type');
  pgm.createIndex('custom_field_values', 'entity_id');
  pgm.createIndex('custom_field_values', ['entity_type', 'entity_id']);
  pgm.createIndex('custom_field_values', ['field_id', 'entity_type', 'entity_id']);

  // Unique constraint to prevent duplicate values for same field/entity
  pgm.createConstraint('custom_field_values', 'unique_field_value_per_entity', 
    'UNIQUE(field_id, entity_type, entity_id)');

  console.log('✅ Created custom_field_values table in tenant schema');
};

exports.down = async (pgm) => {
  pgm.dropTable('custom_field_values');
  console.log('✅ Dropped custom_field_values table from tenant schema');
};