/**
 * Direct Database Test for Notifications
 * Team: Epsilon
 * Purpose: Test notification tables directly via database
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function testNotificationsDirect() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing Notifications System (Direct Database)\n');
    console.log('='.repeat(60));

    // Get a test tenant and user
    console.log('\n📝 Step 1: Finding test tenant and user...');
    const tenantResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%'
      LIMIT 1
    `);
    
    if (tenantResult.rows.length === 0) {
      console.error('❌ No tenant schemas found');
      return;
    }

    const tenantSchema = tenantResult.rows[0].schema_name;
    console.log(`   ✅ Using tenant schema: ${tenantSchema}`);

    // Get a user from this tenant
    const userResult = await client.query(`
      SELECT id, name, email, tenant_id 
      FROM users 
      LIMIT 1
    `);

    if (userResult.rows.length === 0) {
      console.error('❌ No users found');
      return;
    }

    const testUser = userResult.rows[0];
    console.log(`   ✅ Using user: ${testUser.name} (${testUser.email})`);
    console.log(`   📋 User ID: ${testUser.id}`);
    console.log(`   📋 Tenant ID: ${testUser.tenant_id}`);

    // Set search path to tenant schema
    await client.query(`SET search_path TO "${tenantSchema}"`);
    console.log(`   ✅ Set search path to ${tenantSchema}`);

    // Step 2: Create a test notification
    console.log('\n📝 Step 2: Creating test notification...');
    const createResult = await client.query(`
      INSERT INTO notifications (
        user_id, type, priority, title, message, data, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      testUser.id,
      'general_info',
      'medium',
      'Test Notification',
      'This is a test notification created by the direct database test',
      JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
      testUser.id
    ]);

    const notification = createResult.rows[0];
    console.log(`   ✅ Created notification ID: ${notification.id}`);
    console.log(`   📄 Title: ${notification.title}`);
    console.log(`   📄 Type: ${notification.type}`);
    console.log(`   📄 Priority: ${notification.priority}`);

    // Step 3: List notifications
    console.log('\n📝 Step 3: Listing notifications...');
    const listResult = await client.query(`
      SELECT * FROM notifications 
      WHERE user_id = $1 
      AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 10
    `, [testUser.id]);

    console.log(`   ✅ Found ${listResult.rows.length} notifications`);

    // Step 4: Mark as read
    console.log('\n📝 Step 4: Marking notification as read...');
    const readResult = await client.query(`
      UPDATE notifications 
      SET read_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `, [notification.id]);

    console.log(`   ✅ Marked as read`);
    console.log(`   📄 Read at: ${readResult.rows[0].read_at}`);

    // Step 5: Get statistics
    console.log('\n📝 Step 5: Getting notification statistics...');
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE read_at IS NULL) as unread,
        COUNT(*) FILTER (WHERE priority = 'critical') as critical,
        COUNT(*) FILTER (WHERE archived_at IS NOT NULL) as archived
      FROM notifications
      WHERE user_id = $1 AND deleted_at IS NULL
    `, [testUser.id]);

    const stats = statsResult.rows[0];
    console.log(`   ✅ Statistics retrieved`);
    console.log(`   📊 Total: ${stats.total}`);
    console.log(`   📊 Unread: ${stats.unread}`);
    console.log(`   📊 Critical: ${stats.critical}`);
    console.log(`   📊 Archived: ${stats.archived}`);

    // Step 6: Create notification settings
    console.log('\n📝 Step 6: Creating notification settings...');
    const settingsResult = await client.query(`
      INSERT INTO notification_settings (
        user_id, notification_type, email_enabled, sms_enabled, push_enabled, in_app_enabled
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, notification_type) DO UPDATE
      SET email_enabled = EXCLUDED.email_enabled
      RETURNING *
    `, [testUser.id, 'general_info', true, false, true, true]);

    console.log(`   ✅ Settings created/updated`);
    console.log(`   📄 Email: ${settingsResult.rows[0].email_enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`   📄 SMS: ${settingsResult.rows[0].sms_enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`   📄 Push: ${settingsResult.rows[0].push_enabled ? 'Enabled' : 'Disabled'}`);

    // Step 7: Create notification history
    console.log('\n📝 Step 7: Creating notification history...');
    const historyResult = await client.query(`
      INSERT INTO notification_history (
        notification_id, channel, status, delivery_attempt
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [notification.id, 'in_app', 'delivered', 1]);

    console.log(`   ✅ History record created`);
    console.log(`   📄 Channel: ${historyResult.rows[0].channel}`);
    console.log(`   📄 Status: ${historyResult.rows[0].status}`);

    // Step 8: Archive notification
    console.log('\n📝 Step 8: Archiving notification...');
    const archiveResult = await client.query(`
      UPDATE notifications 
      SET archived_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `, [notification.id]);

    console.log(`   ✅ Archived`);
    console.log(`   📄 Archived at: ${archiveResult.rows[0].archived_at}`);

    // Step 9: Soft delete notification
    console.log('\n📝 Step 9: Soft deleting notification...');
    const deleteResult = await client.query(`
      UPDATE notifications 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `, [notification.id]);

    console.log(`   ✅ Soft deleted`);
    console.log(`   📄 Deleted at: ${deleteResult.rows[0].deleted_at}`);

    // Step 10: Verify indexes
    console.log('\n📝 Step 10: Verifying indexes...');
    const indexResult = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = $1 
      AND tablename LIKE '%notification%'
      ORDER BY indexname
    `, [tenantSchema]);

    console.log(`   ✅ Found ${indexResult.rows.length} indexes`);
    console.log(`   📊 Sample indexes:`);
    indexResult.rows.slice(0, 5).forEach(row => {
      console.log(`      - ${row.indexname}`);
    });

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ All database tests passed!');
    console.log('='.repeat(60));
    console.log('\n📊 Test Summary:');
    console.log('   ✅ Tenant and user found');
    console.log('   ✅ Notification created');
    console.log('   ✅ Notifications listed');
    console.log('   ✅ Marked as read');
    console.log('   ✅ Statistics retrieved');
    console.log('   ✅ Settings created');
    console.log('   ✅ History recorded');
    console.log('   ✅ Notification archived');
    console.log('   ✅ Notification deleted');
    console.log('   ✅ Indexes verified');
    console.log('\n🎉 Notification database schema is fully operational!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run tests
testNotificationsDirect()
  .then(() => {
    console.log('✅ Test suite completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });
