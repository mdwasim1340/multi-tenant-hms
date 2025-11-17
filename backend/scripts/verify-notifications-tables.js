/**
 * Verification Script: Notifications Tables
 * Team: Epsilon
 * Purpose: Verify notification system tables exist in all tenant schemas
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function verifyNotificationsTables() {
  console.log('🔍 Verifying Notifications Tables...\n');

  try {
    // Check global tables
    console.log('📊 Checking Global Tables (public schema)...');
    const globalTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('notification_templates', 'notification_channels')
      ORDER BY table_name
    `);

    console.log(`✅ Found ${globalTables.rows.length}/2 global tables:`);
    globalTables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Check notification channels
    const channels = await pool.query('SELECT * FROM notification_channels ORDER BY id');
    console.log(`\n📡 Notification Channels (${channels.rows.length}):`);
    channels.rows.forEach(channel => {
      console.log(`   - ${channel.channel_name}: ${channel.enabled ? '✅ Enabled' : '❌ Disabled'}`);
    });

    // Check notification templates
    const templates = await pool.query('SELECT * FROM notification_templates ORDER BY id');
    console.log(`\n📝 Notification Templates (${templates.rows.length}):`);
    templates.rows.forEach(template => {
      console.log(`   - ${template.template_key}: ${template.name}`);
    });

    // Get all tenant schemas
    const tenantSchemas = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%'
      ORDER BY schema_name
    `);

    console.log(`\n🏥 Checking Tenant Schemas (${tenantSchemas.rows.length})...\n`);

    let allTenantsValid = true;

    for (const { schema_name } of tenantSchemas.rows) {
      // Check tenant tables
      const tenantTables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = $1 
        AND table_name IN ('notifications', 'notification_settings', 'notification_history')
        ORDER BY table_name
      `, [schema_name]);

      const hasAllTables = tenantTables.rows.length === 3;
      const status = hasAllTables ? '✅' : '❌';
      
      console.log(`${status} ${schema_name}: ${tenantTables.rows.length}/3 tables`);
      
      if (hasAllTables) {
        // Check indexes
        const indexes = await pool.query(`
          SELECT indexname 
          FROM pg_indexes 
          WHERE schemaname = $1 
          AND tablename IN ('notifications', 'notification_settings', 'notification_history')
        `, [schema_name]);
        
        console.log(`   📊 Indexes: ${indexes.rows.length}`);
        
        // Check notification count
        const notificationCount = await pool.query(`
          SELECT COUNT(*) as count FROM "${schema_name}".notifications
        `);
        console.log(`   📬 Notifications: ${notificationCount.rows[0].count}`);
      } else {
        allTenantsValid = false;
        console.log(`   ⚠️  Missing tables:`, tenantTables.rows.map(r => r.table_name));
      }
    }

    console.log('\n' + '='.repeat(60));
    if (allTenantsValid && globalTables.rows.length === 2) {
      console.log('✅ All notification tables verified successfully!');
      console.log('✅ System ready for notification API implementation');
    } else {
      console.log('❌ Some tables are missing. Please run migrations.');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error verifying tables:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifyNotificationsTables();
