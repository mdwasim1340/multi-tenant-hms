const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function setupMedChatSubscriptions() {
  console.log('🚀 Setting up MedChat Mobile App Subscription Tiers...\n');

  try {
    // Add application_id column to subscription_tiers if it doesn't exist
    console.log('1. Updating subscription_tiers table schema...');
    await pool.query(`
      ALTER TABLE subscription_tiers 
      ADD COLUMN IF NOT EXISTS application_id VARCHAR(50) DEFAULT 'hospital-management';
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_subscription_tiers_application 
      ON subscription_tiers(application_id);
    `);
    console.log('✅ Schema updated with application_id column');

    // Update existing tiers to be hospital-management specific
    console.log('\n2. Updating existing tiers for hospital-management app...');
    await pool.query(`
      UPDATE subscription_tiers 
      SET application_id = 'hospital-management'
      WHERE application_id IS NULL OR application_id = 'hospital-management';
    `);
    console.log('✅ Existing tiers marked as hospital-management');

    // Insert MedChat subscription tiers
    console.log('\n3. Creating MedChat subscription tiers...');
    await pool.query(`
      INSERT INTO subscription_tiers (
        id, 
        name, 
        price, 
        currency, 
        features, 
        limits, 
        display_order, 
        is_active,
        application_id
      ) VALUES
      (
        'medchat_basic', 
        'MedChat Basic', 
        999.00, 
        'INR',
        '{
          "chat_support": true,
          "appointment_booking": true,
          "prescription_access": true,
          "medical_records_view": true,
          "video_consultation": false,
          "priority_support": false,
          "health_tracking": false,
          "family_accounts": false
        }',
        '{
          "max_consultations_per_month": 5,
          "max_family_members": 1,
          "storage_gb": 1,
          "video_minutes_per_month": 0
        }',
        1,
        true,
        'medchat-mobile'
      ),
      (
        'medchat_advance', 
        'MedChat Advance', 
        2999.00, 
        'INR',
        '{
          "chat_support": true,
          "appointment_booking": true,
          "prescription_access": true,
          "medical_records_view": true,
          "video_consultation": true,
          "priority_support": true,
          "health_tracking": true,
          "family_accounts": true
        }',
        '{
          "max_consultations_per_month": 20,
          "max_family_members": 4,
          "storage_gb": 5,
          "video_minutes_per_month": 300
        }',
        2,
        true,
        'medchat-mobile'
      ),
      (
        'medchat_premium', 
        'MedChat Premium', 
        9999.00, 
        'INR',
        '{
          "chat_support": true,
          "appointment_booking": true,
          "prescription_access": true,
          "medical_records_view": true,
          "video_consultation": true,
          "priority_support": true,
          "health_tracking": true,
          "family_accounts": true
        }',
        '{
          "max_consultations_per_month": -1,
          "max_family_members": 10,
          "storage_gb": 20,
          "video_minutes_per_month": -1
        }',
        3,
        true,
        'medchat-mobile'
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        price = EXCLUDED.price,
        features = EXCLUDED.features,
        limits = EXCLUDED.limits,
        application_id = EXCLUDED.application_id,
        updated_at = CURRENT_TIMESTAMP;
    `);
    console.log('✅ MedChat subscription tiers created');

    // Verify the setup
    console.log('\n📊 Verification:');
    
    // Hospital Management tiers
    const hospitalTiers = await pool.query(`
      SELECT id, name, price, application_id 
      FROM subscription_tiers 
      WHERE application_id = 'hospital-management'
      ORDER BY display_order
    `);
    console.log('\n🏥 Hospital Management System Tiers:');
    hospitalTiers.rows.forEach(tier => {
      console.log(`  - ${tier.name}: Rs. ${tier.price}/month`);
    });

    // MedChat tiers
    const medchatTiers = await pool.query(`
      SELECT id, name, price, application_id 
      FROM subscription_tiers 
      WHERE application_id = 'medchat-mobile'
      ORDER BY display_order
    `);
    console.log('\n📱 MedChat Mobile App Tiers:');
    medchatTiers.rows.forEach(tier => {
      console.log(`  - ${tier.name}: Rs. ${tier.price}/month`);
    });

    // Show feature comparison
    console.log('\n📋 MedChat Feature Comparison:');
    console.log('\n  Basic (Rs. 999/month):');
    console.log('    ✅ Chat support');
    console.log('    ✅ Appointment booking');
    console.log('    ✅ Prescription access');
    console.log('    ✅ Medical records view');
    console.log('    ✅ 5 consultations/month');
    console.log('    ✅ 1 GB storage');
    console.log('    ❌ Video consultation');
    console.log('    ❌ Priority support');
    console.log('    ❌ Health tracking');
    console.log('    ❌ Family accounts');

    console.log('\n  Advance (Rs. 2,999/month):');
    console.log('    ✅ All Basic features');
    console.log('    ✅ Video consultation (300 min/month)');
    console.log('    ✅ Priority support');
    console.log('    ✅ Health tracking');
    console.log('    ✅ Family accounts (up to 4 members)');
    console.log('    ✅ 20 consultations/month');
    console.log('    ✅ 5 GB storage');

    console.log('\n  Premium (Rs. 9,999/month):');
    console.log('    ✅ All Advance features');
    console.log('    ✅ Unlimited consultations');
    console.log('    ✅ Unlimited video minutes');
    console.log('    ✅ Family accounts (up to 10 members)');
    console.log('    ✅ 20 GB storage');

    console.log('\n🎉 MedChat subscription tiers setup complete!');
    console.log('\n📝 Next Steps:');
    console.log('1. Update subscription service to filter by application_id');
    console.log('2. Update API routes to accept application_id parameter');
    console.log('3. Integrate with MedChat mobile app signup flow');
    console.log('4. Set up Razorpay payment integration for mobile');

  } catch (error) {
    console.error('❌ Error setting up MedChat subscriptions:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

setupMedChatSubscriptions();
