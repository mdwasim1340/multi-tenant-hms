const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

async function createUsageTrackingTables() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Creating usage tracking system tables...\n');

    // Create usage_tracking table
    console.log('Creating usage_tracking table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS usage_tracking (
        id SERIAL PRIMARY KEY,
        tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        metric_type VARCHAR(100) NOT NULL,
        metric_value DECIMAL(15,2) NOT NULL,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        billing_period VARCHAR(20) NOT NULL,
        metadata JSONB DEFAULT '{}'
      );
    `);
    console.log('✅ usage_tracking table created');

    // Create usage_summary table
    console.log('Creating usage_summary table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS usage_summary (
        id SERIAL PRIMARY KEY,
        tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        patients_count INTEGER DEFAULT 0,
        users_count INTEGER DEFAULT 0,
        storage_used_gb DECIMAL(10,2) DEFAULT 0,
        api_calls_count INTEGER DEFAULT 0,
        file_uploads_count INTEGER DEFAULT 0,
        appointments_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tenant_id, period_start)
      );
    `);
    console.log('✅ usage_summary table created');

    // Create indexes for performance
    console.log('Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_usage_tracking_tenant ON usage_tracking(tenant_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_usage_tracking_recorded ON usage_tracking(recorded_at);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_usage_tracking_period ON usage_tracking(billing_period);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_usage_tracking_metric ON usage_tracking(metric_type);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_usage_summary_tenant ON usage_summary(tenant_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_usage_summary_period ON usage_summary(period_start, period_end);
    `);
    console.log('✅ Indexes created');

    // Initialize usage summaries for existing tenants
    console.log('Initializing usage summaries for existing tenants...');
    const existingTenants = await client.query('SELECT id FROM tenants');
    
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    for (const tenant of existingTenants.rows) {
      await client.query(`
        INSERT INTO usage_summary (
          tenant_id, period_start, period_end,
          patients_count, users_count, storage_used_gb,
          api_calls_count, file_uploads_count, appointments_count
        )
        VALUES ($1, $2, $3, 0, 0, 0, 0, 0, 0)
        ON CONFLICT (tenant_id, period_start) DO NOTHING;
      `, [tenant.id, periodStart, periodEnd]);
    }
    console.log(`✅ Usage summaries initialized for ${existingTenants.rows.length} tenants`);

    console.log('\n🎉 Usage tracking system setup complete!');
    
    // Verify the setup
    const trackingCount = await client.query('SELECT COUNT(*) FROM usage_tracking');
    const summaryCount = await client.query('SELECT COUNT(*) FROM usage_summary');
    const indexCount = await client.query(`
      SELECT COUNT(*) FROM pg_indexes 
      WHERE tablename IN ('usage_tracking', 'usage_summary')
      AND indexname LIKE 'idx_%'
    `);
    
    console.log(`📊 Summary:`);
    console.log(`   - Usage tracking records: ${trackingCount.rows[0].count}`);
    console.log(`   - Usage summaries: ${summaryCount.rows[0].count}`);
    console.log(`   - Performance indexes: ${indexCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error creating usage tracking tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the setup
createUsageTrackingTables().catch(console.error);