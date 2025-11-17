exports.up = async (pgm) => {
  // Custom fields definition table (global)
  pgm.createTable('custom_fields', {
    id: { type: 'serial', primaryKey: true },
    name: { type: 'varchar(100)', notNull: true },
    label: { type: 'varchar(255)', notNull: true },
    field_type: { 
      type: 'varchar(50)', 
      notNull: true,
      check: "field_type IN ('text', 'textarea', 'number', 'date', 'datetime', 'boolean', 'dropdown', 'multi_select', 'file_upload', 'rich_text')"
    },
    applies_to: { 
      type: 'varchar(50)', 
      notNull: true,
      check: "applies_to IN ('patients', 'appointments', 'medical_records')"
    },
    validation_rules: { type: 'jsonb', default: '{}' },
    conditional_logic: { type: 'jsonb', default: '{}' },
    display_order: { type: 'integer', default: 0 },
    is_required: { type: 'boolean', default: false },
    is_active: { type: 'boolean', default: true },
    default_value: { type: 'text' },
    help_text: { type: 'text' },
    tenant_id: { type: 'varchar(255)', notNull: true, references: 'tenants(id)', onDelete: 'CASCADE' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  });

  // Custom field options for dropdown/multi-select fields (global)
  pgm.createTable('custom_field_options', {
    id: { type: 'serial', primaryKey: true },
    field_id: { type: 'integer', notNull: true, references: 'custom_fields(id)', onDelete: 'CASCADE' },
    option_value: { type: 'varchar(255)', notNull: true },
    option_label: { type: 'varchar(255)', notNull: true },
    display_order: { type: 'integer', default: 0 },
    is_active: { type: 'boolean', default: true },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  });

  // Indexes for performance
  pgm.createIndex('custom_fields', 'tenant_id');
  pgm.createIndex('custom_fields', 'applies_to');
  pgm.createIndex('custom_fields', 'is_active');
  pgm.createIndex('custom_fields', ['tenant_id', 'applies_to', 'is_active']);
  pgm.createIndex('custom_field_options', 'field_id');
  pgm.createIndex('custom_field_options', 'is_active');

  // Unique constraint to prevent duplicate field names per tenant/entity
  pgm.createConstraint('custom_fields', 'unique_field_name_per_tenant_entity', 
    'UNIQUE(tenant_id, applies_to, name)');

  console.log('✅ Created custom fields tables with proper indexes and constraints');
};

exports.down = async (pgm) => {
  pgm.dropTable('custom_field_options');
  pgm.dropTable('custom_fields');
  console.log('✅ Dropped custom fields tables');
};