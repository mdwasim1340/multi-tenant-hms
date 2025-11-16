#!/usr/bin/env node

/**
 * Apply Subscription Tables Migration
 * Creates tenant_subscriptions, subscription_tiers, and usage_tracking tables
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function applyMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Creating subscription tables...\n');
    
    // Create subscription_tiers table
    console.log('Creating subscription_tiers table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscription_tiers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        display_name VARCHAR(100) NOT NULL,
        description TEXT,
        price_monthly DECIMAL(10,2),
        price_yearly DECIMAL(10,2),
        features JSONB,
        limits JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ subscription_tiers table created\n');
    
    // Create tenant_subscriptions table
    console.log('Creating tenant_subscriptions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenant_subscriptions (
        id SERIAL PRIMARY KEY,
        tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        tier_id INTEGER REFERENCES subscription_tiers(id),
        status VARCHAR(50) DEFAULT 'active',
        start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_date TIMESTAMP,
        auto_renew BOOLEAN DEFAULT true,
        payment_method VARCHAR(50),
        billing_cycle VARCHAR(20) DEFAULT 'monthly',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tenant_id)
      );
    `);
    console.log('✅ tenant_subscriptions table created\n');
    
    // Create usage_tracking table
    console.log('Creating usage_tracking table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS usage_tracking (
        id SERIAL PRIMARY KEY,
        tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        metric_type VARCHAR(50) NOT NULL,
        metric_value INTEGER DEFAULT 0,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB
      );
    `);
    console.log('✅ usage_tracking table created\n');
    
    // Create indexes
    console.log('Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tier ON tenant_subscriptions(tier_id);
      CREATE INDEX IF NOT EXISTS idx_usage_tracking_tenant ON usage_tracking(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_usage_tracking_metric ON usage_tracking(metric_type);
      CREATE INDEX IF NOT EXISTS idx_usage_tracking_date ON usage_tracking(recorded_at);
    `);
    console.log('✅ Indexes created\n');
    
    // Insert default subscription tiers
    console.log('Inserting default subscription tiers...');
    await client.query(`
      INSERT INTO subscription_tiers (name, display_name, description, price_monthly, price_yearly, features, limits)
      VALUES 
        ('basic', 'Basic', 'Basic plan for small clinics', 29.99, 299.99, 
         '{"appointments": true, "patients": true, "records": true}'::jsonb,
         '{"users": 5, "patients": 100, "storage_gb": 10}'::jsonb),
        ('premium', 'Premium', 'Premium plan for growing practices', 79.99, 799.99,
         '{"appointments": true, "patients": true, "records": true, "lab_tests": true, "analytics": true}'::jsonb,
         '{"users": 20, "patients": 1000, "storage_gb": 100}'::jsonb),
        ('enterprise', 'Enterprise', 'Enterprise plan for large hospitals', 199.99, 1999.99,
         '{"appointments": true, "patients": true, "records": true, "lab_tests": true, "analytics": true, "custom_fields": true, "api_access": true}'::jsonb,
         '{"users": -1, "patients": -1, "storage_gb": -1}'::jsonb)
      ON CONFLICT (name) DO NOTHING;
    `);
    console.log('✅ Default subscription tiers inserted\n');
    
    // Create default subscriptions for existing tenants
    console.log('Creating default subscriptions for existing tenants...');
    const tenantsResult = await client.query('SELECT id FROM tenants');
    const basicTierResult = await client.query("SELECT id FROM subscription_tiers WHERE name = 'basic'");
    const basicTierId = basicTierResult.rows[0]?.id;
    
    if (basicTierId) {
      for (const tenant of tenantsResult.rows) {
        await client.query(`
          INSERT INTO tenant_subscriptions (tenant_id, tier_id, status)
          VALUES ($1, $2, 'active')
          ON CONFLICT (tenant_id) DO NOTHING
        `, [tenant.id, basicTierId]);
      }
      console.log(`✅ Created subscriptions for ${tenantsResult.rows.length} tenants\n`);
    }
    
    console.log('🎉 All subscription tables created successfully!');
    console.log('\nYou can now:');
    console.log('1. Restart your backend server');
    console.log('2. Test staff creation');
    console.log('3. Check subscription features\n');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    console.error('\nFull error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
applyMigration()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
