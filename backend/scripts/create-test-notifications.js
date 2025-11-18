/**
 * Create Test Notifications via Database
 * Team: Epsilon
 * Purpose: Create sample notifications for frontend testing
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

const notificationTypes = [
  {
    type: 'critical_alert',
    priority: 'critical',
    title: 'Critical: Patient Emergency',
    message: 'Patient John Doe (Room 305) requires immediate attention. Vital signs unstable.',
    data: { patient_id: 123, room: '305', vital_signs: 'unstable' }
  },
  {
    type: 'appointment_reminder',
    priority: 'high',
    title: 'Appointment Reminder',
    message: 'You have an appointment with Dr. Smith at 2:00 PM today.',
    data: { appointment_id: 456, doctor: 'Dr. Smith', time: '14:00' }
  },
  {
    type: 'lab_result',
    priority: 'medium',
    title: 'Lab Results Available',
    message: 'Blood test results for Patient Jane Smith are now available for review.',
    data: { patient_id: 789, test_type: 'blood_test' }
  },
  {
    type: 'billing_update',
    priority: 'low',
    title: 'Billing Update',
    message: 'Invoice #12345 has been paid. Thank you!',
    data: { invoice_id: 12345, amount: 500.00, status: 'paid' }
  },
  {
    type: 'staff_schedule',
    priority: 'medium',
    title: 'Schedule Change',
    message: 'Your shift on Friday has been moved from 9 AM to 11 AM.',
    data: { shift_date: '2025-11-22', old_time: '09:00', new_time: '11:00' }
  },
  {
    type: 'inventory_alert',
    priority: 'high',
    title: 'Low Stock Alert',
    message: 'Surgical masks are running low. Current stock: 50 units.',
    data: { item: 'surgical_masks', current_stock: 50, threshold: 100 }
  },
  {
    type: 'system_maintenance',
    priority: 'medium',
    title: 'Scheduled Maintenance',
    message: 'System maintenance scheduled for Sunday 2 AM - 4 AM. Please save your work.',
    data: { start_time: '2025-11-17T02:00:00Z', end_time: '2025-11-17T04:00:00Z' }
  },
  {
    type: 'general_info',
    priority: 'low',
    title: 'New Feature Available',
    message: 'Check out the new patient analytics dashboard in the Reports section!',
    data: { feature: 'analytics_dashboard', url: '/analytics' }
  }
];

async function createTestNotifications() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Creating Test Notifications\n');
    console.log('='.repeat(60));

    // Get all users
    const usersResult = await client.query(`
      SELECT id, name, email, tenant_id 
      FROM users 
      ORDER BY id
    `);

    if (usersResult.rows.length === 0) {
      console.error('❌ No users found');
      return;
    }

    console.log(`\n📋 Found ${usersResult.rows.length} users`);

    let totalCreated = 0;

    // Create notifications for each user
    for (const user of usersResult.rows) {
      console.log(`\n👤 Creating notifications for: ${user.name} (${user.email})`);
      console.log(`   Tenant: ${user.tenant_id}`);

      // Map tenant_id to schema name
      // tenant_id format: "aajmin_polyclinic" or "tenant_1762083064503"
      // schema format: "tenant_aajmin_polyclinic" or "tenant_1762083064503"
      let tenantSchema = user.tenant_id;
      if (!tenantSchema.startsWith('tenant_') && !tenantSchema.startsWith('demo_')) {
        tenantSchema = 'tenant_' + tenantSchema;
      }

      // Verify schema exists
      const schemaResult = await client.query(`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name = $1
      `, [tenantSchema]);

      if (schemaResult.rows.length === 0) {
        console.log(`   ⚠️  Schema ${tenantSchema} not found`);
        continue;
      }
      console.log(`   📦 Using schema: ${tenantSchema}`);

      // Set search path
      await client.query(`SET search_path TO "${tenantSchema}"`);

      // Create 3-5 random notifications for this user
      const numNotifications = Math.floor(Math.random() * 3) + 3; // 3-5 notifications
      const selectedNotifications = [];
      
      // Randomly select notifications
      const shuffled = [...notificationTypes].sort(() => 0.5 - Math.random());
      for (let i = 0; i < numNotifications && i < shuffled.length; i++) {
        selectedNotifications.push(shuffled[i]);
      }

      for (const notif of selectedNotifications) {
        try {
          const result = await client.query(`
            INSERT INTO notifications (
              user_id, type, priority, title, message, data, created_by, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '${Math.floor(Math.random() * 24)} hours')
            RETURNING id, title, type, priority
          `, [
            user.id,
            notif.type,
            notif.priority,
            notif.title,
            notif.message,
            JSON.stringify(notif.data),
            user.id
          ]);

          console.log(`   ✅ Created: ${result.rows[0].title} (${result.rows[0].type})`);
          totalCreated++;
        } catch (error) {
          console.error(`   ❌ Failed to create notification: ${error.message}`);
        }
      }

      // Mark some as read (50% chance)
      if (Math.random() > 0.5) {
        await client.query(`
          UPDATE notifications 
          SET read_at = NOW() - INTERVAL '${Math.floor(Math.random() * 12)} hours'
          WHERE user_id = $1 
          AND read_at IS NULL 
          AND random() < 0.5
        `, [user.id]);
        console.log(`   📖 Marked some notifications as read`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log(`✅ Created ${totalCreated} test notifications`);
    console.log(`📊 Distributed across ${usersResult.rows.length} users`);
    console.log('='.repeat(60));
    console.log('\n🎉 Test notifications created successfully!\n');
    console.log('📱 You can now test the frontend at:');
    console.log('   http://localhost:3001/notifications\n');

  } catch (error) {
    console.error('\n❌ Failed:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run
createTestNotifications()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Failed:', error);
    process.exit(1);
  });
