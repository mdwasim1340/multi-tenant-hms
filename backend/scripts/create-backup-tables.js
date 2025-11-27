const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function createBackupTables() {
  console.log('🗃️  Creating Backup System Tables...\n');

  try {
    // Create backup_jobs table
    console.log('Creating backup_jobs table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS backup_jobs (
        id SERIAL PRIMARY KEY,
        tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        backup_type VARCHAR(50) NOT NULL, -- 'full', 'incremental'
        storage_tier VARCHAR(50) NOT NULL, -- 's3_standard', 's3_ia', 'b2_cold'
        backup_size_bytes BIGINT,
        backup_location TEXT NOT NULL DEFAULT '',
        status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        error_message TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ backup_jobs table created');

    // Create backup_schedules table
    console.log('Creating backup_schedules table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS backup_schedules (
        id SERIAL PRIMARY KEY,
        tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        schedule_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly'
        storage_tier VARCHAR(50) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        last_run_at TIMESTAMP,
        next_run_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tenant_id, schedule_type)
      );
    `);
    console.log('✅ backup_schedules table created');

    // Create backup_retention_policies table
    console.log('Creating backup_retention_policies table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS backup_retention_policies (
        id SERIAL PRIMARY KEY,
        tier_id VARCHAR(50) NOT NULL REFERENCES subscription_tiers(id),
        daily_retention_days INTEGER DEFAULT 0,
        weekly_retention_weeks INTEGER DEFAULT 0,
        monthly_retention_months INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tier_id)
      );
    `);
    console.log('✅ backup_retention_policies table created');

    // Create indexes
    console.log('Creating indexes...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_backup_jobs_tenant ON backup_jobs(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_backup_jobs_status ON backup_jobs(status);
      CREATE INDEX IF NOT EXISTS idx_backup_jobs_created ON backup_jobs(created_at);
      CREATE INDEX IF NOT EXISTS idx_backup_schedules_tenant ON backup_schedules(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_backup_schedules_next_run ON backup_schedules(next_run_at);
    `);
    console.log('✅ Indexes created');

    // Seed retention policies
    console.log('Seeding retention policies...');
    await pool.query(`
      INSERT INTO backup_retention_policies (tier_id, daily_retention_days, weekly_retention_weeks, monthly_retention_months) 
      VALUES 
        ('basic', 0, 0, 0),
        ('advanced', 0, 0, 12),
        ('premium', 7, 4, 12)
      ON CONFLICT (tier_id) DO UPDATE SET
        daily_retention_days = EXCLUDED.daily_retention_days,
        weekly_retention_weeks = EXCLUDED.weekly_retention_weeks,
        monthly_retention_months = EXCLUDED.monthly_retention_months,
        updated_at = CURRENT_TIMESTAMP;
    `);
    console.log('✅ Retention policies seeded');

    // Verify tables
    console.log('\nVerifying tables...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'backup_%'
      ORDER BY table_name;
    `);
    
    console.log('📋 Backup tables created:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Check retention policies
    const policiesResult = await pool.query('SELECT * FROM backup_retention_policies ORDER BY tier_id');
    console.log('\n📋 Retention policies:');
    policiesResult.rows.forEach(policy => {
      console.log(`   - ${policy.tier_id}: Daily ${policy.daily_retention_days}d, Weekly ${policy.weekly_retention_weeks}w, Monthly ${policy.monthly_retention_months}m`);
    });

    console.log('\n🎉 Backup system database setup complete!');

  } catch (error) {
    console.error('❌ Error creating backup tables:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createBackupTables();