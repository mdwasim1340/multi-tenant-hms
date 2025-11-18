/**
 * Migration: Create Notifications Tables
 * Team: Epsilon
 * Purpose: Create notification system tables for multi-tenant notification delivery
 * 
 * Tables Created:
 * - notification_templates (global) - Notification templates with variables
 * - notification_channels (global) - Available notification channels
 * - notifications (tenant-specific) - User notifications
 * - notification_settings (tenant-specific) - User notification preferences
 * - notification_history (tenant-specific) - Notification delivery tracking
 */

exports.up = async (pgm) => {
  // ============================================================================
  // GLOBAL TABLES (public schema)
  // ============================================================================

  // notification_templates - Global notification templates
  pgm.createTable('notification_templates', {
    id: { type: 'serial', primaryKey: true },
    template_key: { type: 'varchar(100)', notNull: true, unique: true },
    name: { type: 'varchar(255)', notNull: true },
    description: { type: 'text' },
    subject_template: { type: 'text' },
    body_template: { type: 'text' },
    sms_template: { type: 'text' },
    push_template: { type: 'text' },
    variables: { type: 'jsonb', comment: 'List of available template variables' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // notification_channels - Available notification channels
  pgm.createTable('notification_channels', {
    id: { type: 'serial', primaryKey: true },
    channel_name: { type: 'varchar(50)', notNull: true, unique: true },
    enabled: { type: 'boolean', notNull: true, default: true },
    config: { type: 'jsonb', comment: 'Channel-specific configuration' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // Insert default notification channels
  pgm.sql(`
    INSERT INTO notification_channels (channel_name, enabled, config) VALUES
    ('in_app', true, '{"priority": 1, "always_enabled": true}'::jsonb),
    ('email', true, '{"priority": 2, "provider": "aws_ses"}'::jsonb),
    ('sms', false, '{"priority": 3, "provider": "aws_sns"}'::jsonb),
    ('push', true, '{"priority": 4, "provider": "web_push"}'::jsonb);
  `);

  // Insert default notification templates
  pgm.sql(`
    INSERT INTO notification_templates (template_key, name, description, subject_template, body_template, sms_template, push_template, variables) VALUES
    (
      'appointment_reminder',
      'Appointment Reminder',
      'Reminder for upcoming appointment',
      'Appointment Reminder - {{appointment_date}}',
      'Hello {{patient_name}}, this is a reminder for your appointment with {{doctor_name}} on {{appointment_date}} at {{appointment_time}}.',
      'Appointment reminder: {{appointment_date}} at {{appointment_time}} with {{doctor_name}}',
      'Appointment with {{doctor_name}} on {{appointment_date}}',
      '["patient_name", "doctor_name", "appointment_date", "appointment_time"]'::jsonb
    ),
    (
      'critical_alert',
      'Critical Alert',
      'Critical alert requiring immediate attention',
      'CRITICAL: {{alert_title}}',
      'CRITICAL ALERT: {{alert_message}}. Immediate action required. Patient: {{patient_name}}, Department: {{department}}.',
      'CRITICAL: {{alert_message}}',
      'CRITICAL: {{alert_title}}',
      '["alert_title", "alert_message", "patient_name", "department"]'::jsonb
    ),
    (
      'lab_result_ready',
      'Lab Result Ready',
      'Notification when lab results are available',
      'Lab Results Available - {{patient_name}}',
      'Lab results for {{patient_name}} are now available. Test: {{test_name}}, Status: {{status}}.',
      'Lab results ready for {{patient_name}}',
      'Lab results available',
      '["patient_name", "test_name", "status"]'::jsonb
    ),
    (
      'system_maintenance',
      'System Maintenance',
      'System maintenance notification',
      'System Maintenance Scheduled - {{maintenance_date}}',
      'System maintenance is scheduled for {{maintenance_date}} from {{start_time}} to {{end_time}}. {{description}}',
      'System maintenance: {{maintenance_date}} {{start_time}}-{{end_time}}',
      'System maintenance scheduled',
      '["maintenance_date", "start_time", "end_time", "description"]'::jsonb
    );
  `);

  // ============================================================================
  // TENANT-SPECIFIC TABLES (to be created in each tenant schema)
  // ============================================================================

  // Get all tenant schemas
  const tenantSchemas = await pgm.db.select(`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%'
  `);

  // Create tables in each tenant schema
  for (const { schema_name } of tenantSchemas) {
    // Set search path to tenant schema
    pgm.sql(`SET search_path TO "${schema_name}"`);

    // notifications - User notifications
    pgm.createTable({ schema: schema_name, name: 'notifications' }, {
      id: { type: 'serial', primaryKey: true },
      user_id: { type: 'integer', notNull: true, references: 'public.users(id)', onDelete: 'CASCADE' },
      type: { 
        type: 'varchar(50)', 
        notNull: true,
        comment: 'critical_alert, appointment_reminder, lab_result, billing_update, staff_schedule, inventory_alert, system_maintenance, general_info'
      },
      priority: { 
        type: 'varchar(20)', 
        notNull: true, 
        default: "'medium'",
        comment: 'critical, high, medium, low'
      },
      title: { type: 'varchar(255)', notNull: true },
      message: { type: 'text', notNull: true },
      data: { type: 'jsonb', comment: 'Additional structured data' },
      read_at: { type: 'timestamp' },
      archived_at: { type: 'timestamp' },
      deleted_at: { type: 'timestamp' },
      created_by: { type: 'integer', references: 'public.users(id)', onDelete: 'SET NULL' },
      created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
      updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
    });

    // notification_settings - User notification preferences
    pgm.createTable({ schema: schema_name, name: 'notification_settings' }, {
      id: { type: 'serial', primaryKey: true },
      user_id: { type: 'integer', notNull: true, references: 'public.users(id)', onDelete: 'CASCADE' },
      notification_type: { type: 'varchar(50)', notNull: true },
      email_enabled: { type: 'boolean', notNull: true, default: true },
      sms_enabled: { type: 'boolean', notNull: true, default: false },
      push_enabled: { type: 'boolean', notNull: true, default: true },
      in_app_enabled: { type: 'boolean', notNull: true, default: true },
      quiet_hours_start: { type: 'time' },
      quiet_hours_end: { type: 'time' },
      digest_mode: { type: 'boolean', notNull: true, default: false },
      digest_frequency: { 
        type: 'varchar(20)',
        comment: 'hourly, daily, weekly'
      },
      created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
      updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
    });

    // notification_history - Notification delivery tracking
    pgm.createTable({ schema: schema_name, name: 'notification_history' }, {
      id: { type: 'serial', primaryKey: true },
      notification_id: { 
        type: 'integer', 
        notNull: true, 
        references: `"${schema_name}".notifications(id)`,
        onDelete: 'CASCADE'
      },
      channel: { 
        type: 'varchar(20)', 
        notNull: true,
        comment: 'email, sms, push, in_app'
      },
      status: { 
        type: 'varchar(20)', 
        notNull: true,
        comment: 'sent, delivered, failed, pending'
      },
      delivery_attempt: { type: 'integer', notNull: true, default: 1 },
      error_message: { type: 'text' },
      delivered_at: { type: 'timestamp' },
      created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
    });

    // ============================================================================
    // INDEXES for Performance
    // ============================================================================

    // notifications indexes
    pgm.createIndex({ schema: schema_name, name: 'notifications' }, 'user_id', { name: `${schema_name}_notifications_user_id_idx` });
    pgm.createIndex({ schema: schema_name, name: 'notifications' }, 'type', { name: `${schema_name}_notifications_type_idx` });
    pgm.createIndex({ schema: schema_name, name: 'notifications' }, 'priority', { name: `${schema_name}_notifications_priority_idx` });
    pgm.createIndex({ schema: schema_name, name: 'notifications' }, 'created_at', { name: `${schema_name}_notifications_created_at_idx` });
    pgm.createIndex({ schema: schema_name, name: 'notifications' }, 'read_at', { name: `${schema_name}_notifications_read_at_idx` });
    pgm.createIndex({ schema: schema_name, name: 'notifications' }, ['user_id', 'read_at'], { 
      name: `${schema_name}_notifications_user_unread_idx`,
      where: 'read_at IS NULL'
    });

    // notification_settings indexes
    pgm.createIndex({ schema: schema_name, name: 'notification_settings' }, 'user_id', { name: `${schema_name}_notification_settings_user_id_idx` });
    pgm.createIndex({ schema: schema_name, name: 'notification_settings' }, ['user_id', 'notification_type'], { 
      name: `${schema_name}_notification_settings_user_type_idx`,
      unique: true
    });

    // notification_history indexes
    pgm.createIndex({ schema: schema_name, name: 'notification_history' }, 'notification_id', { name: `${schema_name}_notification_history_notification_id_idx` });
    pgm.createIndex({ schema: schema_name, name: 'notification_history' }, 'channel', { name: `${schema_name}_notification_history_channel_idx` });
    pgm.createIndex({ schema: schema_name, name: 'notification_history' }, 'status', { name: `${schema_name}_notification_history_status_idx` });
    pgm.createIndex({ schema: schema_name, name: 'notification_history' }, 'created_at', { name: `${schema_name}_notification_history_created_at_idx` });
  }

  // Reset search path
  pgm.sql('SET search_path TO public');

  console.log('✅ Notifications tables created successfully in all tenant schemas');
};

exports.down = async (pgm) => {
  // Get all tenant schemas
  const tenantSchemas = await pgm.db.select(`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%'
  `);

  // Drop tables from each tenant schema
  for (const { schema_name } of tenantSchemas) {
    pgm.sql(`SET search_path TO "${schema_name}"`);
    
    pgm.dropTable({ schema: schema_name, name: 'notification_history' }, { ifExists: true, cascade: true });
    pgm.dropTable({ schema: schema_name, name: 'notification_settings' }, { ifExists: true, cascade: true });
    pgm.dropTable({ schema: schema_name, name: 'notifications' }, { ifExists: true, cascade: true });
  }

  // Reset search path
  pgm.sql('SET search_path TO public');

  // Drop global tables
  pgm.dropTable('notification_channels', { ifExists: true, cascade: true });
  pgm.dropTable('notification_templates', { ifExists: true, cascade: true });

  console.log('✅ Notifications tables dropped successfully');
};
