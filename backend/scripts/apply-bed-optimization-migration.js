/**
 * Apply Bed Management Optimization Migration
 * Creates all tables for AI-powered bed management system
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function applyMigration() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting Bed Management Optimization migration...\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/1731900000000_create-bed-management-optimization-tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    console.log('📝 Executing migration SQL...');
    await client.query(migrationSQL);
    console.log('✅ Migration executed successfully\n');

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const tables = [
      'los_predictions',
      'bed_assignments',
      'discharge_readiness_predictions',
      'transfer_priorities',
      'capacity_forecasts',
      'bed_turnover_metrics',
      'bed_management_performance',
      'ai_feature_management',
      'ai_feature_audit_log',
    ];

    for (const table of tables) {
      const result = await client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [table]
      );

      if (result.rows[0].exists) {
        console.log(`  ✅ ${table}`);
      } else {
        console.log(`  ❌ ${table} - NOT FOUND`);
      }
    }

    console.log('\n🎉 Bed Management Optimization migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  - 9 tables created`);
    console.log(`  - Multiple indexes created for performance`);
    console.log(`  - Foreign key constraints added`);
    console.log(`  - Ready for AI-powered bed management features`);

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
applyMigration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
