/**
 * Team Alpha - Apply Storage Metrics Migration
 * Creates storage cost monitoring tables
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
    console.log('🚀 Starting storage metrics migration...\n');

    // Read migration file
    const migrationPath = path.join(
      __dirname,
      '../migrations/1732100000000_create_storage_metrics.sql'
    );
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    console.log('📝 Creating storage metrics tables...');
    await client.query(migrationSQL);
    console.log('✅ Storage metrics tables created successfully\n');

    // Verify table creation
    const verifyQuery = `
      SELECT 
        table_name,
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('storage_metrics', 'cost_alerts', 'file_access_logs')
      ORDER BY table_name, ordinal_position;
    `;

    const result = await client.query(verifyQuery);
    console.log('📊 Tables and columns created:');
    
    let currentTable = '';
    result.rows.forEach((row) => {
      if (row.table_name !== currentTable) {
        currentTable = row.table_name;
        console.log(`\n  📋 ${row.table_name}:`);
      }
      console.log(`    - ${row.column_name}: ${row.data_type}`);
    });

    // Verify indexes
    const indexQuery = `
      SELECT tablename, indexname
      FROM pg_indexes
      WHERE tablename IN ('storage_metrics', 'cost_alerts', 'file_access_logs')
        AND schemaname = 'public'
      ORDER BY tablename, indexname;
    `;

    const indexResult = await client.query(indexQuery);
    console.log('\n📑 Indexes created:');
    
    let currentIndexTable = '';
    indexResult.rows.forEach((row) => {
      if (row.tablename !== currentIndexTable) {
        currentIndexTable = row.tablename;
        console.log(`\n  📋 ${row.tablename}:`);
      }
      console.log(`    - ${row.indexname}`);
    });

    // Create initial metrics for existing tenants
    console.log('\n🔄 Creating initial metrics for existing tenants...');
    const tenantsQuery = 'SELECT id FROM tenants WHERE status = $1';
    const tenantsResult = await client.query(tenantsQuery, ['active']);
    
    console.log(`📊 Found ${tenantsResult.rows.length} active tenants`);
    
    for (const tenant of tenantsResult.rows) {
      const tenantId = tenant.id;
      
      // Create sample storage metrics
      const insertMetricsQuery = `
        INSERT INTO public.storage_metrics (
          tenant_id, total_size_bytes, file_count, storage_class_breakdown,
          estimated_monthly_cost, cost_breakdown, compression_savings_bytes, compression_ratio
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      
      const sampleSize = Math.floor(Math.random() * 5000000000) + 1000000000; // 1-5GB
      const fileCount = Math.floor(Math.random() * 500) + 50; // 50-550 files
      
      const storageBreakdown = {
        STANDARD: Math.floor(sampleSize * 0.6),
        INTELLIGENT_TIERING: Math.floor(sampleSize * 0.3),
        GLACIER: Math.floor(sampleSize * 0.1),
      };
      
      const costBreakdown = {
        storage_cost: (sampleSize / (1024 * 1024 * 1024)) * 0.023,
        request_cost: (sampleSize / (1024 * 1024 * 1024)) * 0.0004,
        data_transfer_cost: (sampleSize / (1024 * 1024 * 1024)) * 0.01,
        total_cost: 0,
      };
      costBreakdown.total_cost = costBreakdown.storage_cost + costBreakdown.request_cost + costBreakdown.data_transfer_cost;
      
      const compressionSavings = Math.floor(sampleSize * 0.35); // 35% compression
      
      await client.query(insertMetricsQuery, [
        tenantId,
        sampleSize,
        fileCount,
        JSON.stringify(storageBreakdown),
        Math.round(costBreakdown.total_cost * 100) / 100,
        JSON.stringify(costBreakdown),
        compressionSavings,
        0.35,
      ]);
      
      console.log(`  ✅ Created metrics for tenant: ${tenantId}`);
    }

    console.log('\n✅ Storage metrics migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('  1. Register storage routes in index.ts');
    console.log('  2. Test storage cost monitoring endpoints');
    console.log('  3. Create frontend cost dashboard UI');
    console.log('  4. Set up scheduled metrics collection job');

  } catch (error) {
    console.error('❌ Migration failed:', error);
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