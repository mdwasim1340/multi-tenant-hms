const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

async function createSubscriptionTables() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Creating subscription tier system tables...\n');

    // Create subscription_tiers table
    console.log('Creating subscription_tiers table...');
    await client.query(`
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
    await client.query(`
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
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tier ON tenant_subscriptions(tier_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON tenant_subscriptions(status);
    `);
    console.log('✅ Indexes created');

    // Insert seed data for subscription tiers
    console.log('Inserting subscription tier seed data...');
    await client.query(`
      INSERT INTO subscription_tiers (id, name, price, features, limits, display_order) VALUES
      ('basic', 'Basic', 4999.00, 
        '{"patients": true, "appointments": true, "medical_records": false, "custom_fields": false, "file_storage": false, "mobile_app": false, "api_access": false, "custom_branding": false}',
        '{"max_patients": 500, "max_users": 5, "storage_gb": 0, "api_calls_per_day": 0}',
        1
      ),
      ('advanced', 'Advanced', 14999.00,
        '{"patients": true, "appointments": true, "medical_records": true, "custom_fields": true, "file_storage": true, "mobile_app": true, "api_access": false, "custom_branding": false}',
        '{"max_patients": 2000, "max_users": 25, "storage_gb": 10, "api_calls_per_day": 10000}',
        2
      ),
      ('premium', 'Premium', 29999.00,
        '{"patients": true, "appointments": true, "medical_records": true, "custom_fields": true, "file_storage": true, "mobile_app": true, "api_access": true, "custom_branding": true}',
        '{"max_patients": -1, "max_users": -1, "storage_gb": -1, "api_calls_per_day": -1}',
        3
      )
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Subscription tiers seeded');

    // Assign default subscriptions to existing tenants
    console.log('Assigning default subscriptions to existing tenants...');
    const existingTenants = await client.query('SELECT id FROM tenants');
    
    for (const tenant of existingTenants.rows) {
      await client.query(`
        INSERT INTO tenant_subscriptions (tenant_id, tier_id, usage_limits)
        VALUES ($1, $2, $3)
        ON CONFLICT (tenant_id) DO NOTHING;
      `, [tenant.id, 'basic', JSON.stringify({"max_patients": 500, "max_users": 5, "storage_gb": 0, "api_calls_per_day": 0})]);
    }
    console.log(`✅ Default subscriptions assigned to ${existingTenants.rows.length} tenants`);

    console.log('\n🎉 Subscription tier system setup complete!');
    
    // Verify the setup
    const tiersCount = await client.query('SELECT COUNT(*) FROM subscription_tiers');
    const subscriptionsCount = await client.query('SELECT COUNT(*) FROM tenant_subscriptions');
    
    console.log(`📊 Summary:`);
    console.log(`   - Subscription tiers: ${tiersCount.rows[0].count}`);
    console.log(`   - Tenant subscriptions: ${subscriptionsCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error creating subscription tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the setup
createSubscriptionTables().catch(console.error);