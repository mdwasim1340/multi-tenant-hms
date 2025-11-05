const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function createSubscriptionTierTables() {
  console.log('🚀 Creating Subscription Tier System Tables...\n');

  try {
    // Create subscription_tiers table
    console.log('Creating subscription_tiers table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscription_tiers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        features JSONB NOT NULL,
        limits JSONB NOT NULL,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ subscription_tiers table created');

    // Create tenant_subscriptions table
    console.log('Creating tenant_subscriptions table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_subscriptions (
        id SERIAL PRIMARY KEY,
        tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        tier_id VARCHAR(50) NOT NULL REFERENCES subscription_tiers(id),
        status VARCHAR(50) DEFAULT 'active',
        billing_cycle VARCHAR(50) DEFAULT 'monthly',
        next_billing_date DATE,
        trial_ends_at TIMESTAMP,
        usage_limits JSONB,
        current_usage JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tenant_id)
      );
    `);
    console.log('✅ tenant_subscriptions table created');

    // Create indexes for performance
    console.log('Creating indexes...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tier ON tenant_subscriptions(tier_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON tenant_subscriptions(status);
    `);
    console.log('✅ Indexes created');

    // Insert seed data
    console.log('Inserting seed data...');
    await pool.query(`
      INSERT INTO subscription_tiers (id, name, price, features, limits) VALUES
      ('basic', 'Basic', 4999.00, 
        '{"patients": true, "appointments": true, "medical_records": false, "custom_fields": false, "file_storage": false, "mobile_app": false, "api_access": false, "custom_branding": false}',
        '{"max_patients": 500, "max_users": 5, "storage_gb": 0, "api_calls_per_day": 0}'
      ),
      ('advanced', 'Advanced', 14999.00,
        '{"patients": true, "appointments": true, "medical_records": true, "custom_fields": true, "file_storage": true, "mobile_app": true, "api_access": false, "custom_branding": false}',
        '{"max_patients": 2000, "max_users": 25, "storage_gb": 10, "api_calls_per_day": 10000}'
      ),
      ('premium', 'Premium', 29999.00,
        '{"patients": true, "appointments": true, "medical_records": true, "custom_fields": true, "file_storage": true, "mobile_app": true, "api_access": true, "custom_branding": true}',
        '{"max_patients": -1, "max_users": -1, "storage_gb": -1, "api_calls_per_day": -1}'
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        price = EXCLUDED.price,
        features = EXCLUDED.features,
        limits = EXCLUDED.limits,
        updated_at = CURRENT_TIMESTAMP;
    `);
    console.log('✅ Seed data inserted');

    // Verify tables and data
    console.log('\n📊 Verification:');
    const tiersResult = await pool.query('SELECT id, name, price FROM subscription_tiers ORDER BY display_order');
    console.log('Subscription Tiers:');
    tiersResult.rows.forEach(tier => {
      console.log(`  - ${tier.name}: Rs. ${tier.price}/month`);
    });

    const tablesResult = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE '%subscription%'
      ORDER BY table_name;
    `);
    console.log('\nTables created:');
    tablesResult.rows.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });

    console.log('\n🎉 Subscription Tier System database setup complete!');
    console.log('\nPricing Structure:');
    console.log('- Basic: Rs. 4,999/month (~$60) - Core features');
    console.log('- Advanced: Rs. 14,999/month (~$180) - Custom fields + mobile');
    console.log('- Premium: Rs. 29,999/month (~$360) - Unlimited + API access');

  } catch (error) {
    console.error('❌ Error creating subscription tier tables:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createSubscriptionTierTables();