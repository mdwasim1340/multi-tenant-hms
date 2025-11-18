/**
 * Team Alpha - Apply Audit Logs Migration
 * Creates audit_logs table for HIPAA compliance
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
    console.log('🚀 Starting audit logs migration...\n');

    // Read migration file
    const migrationPath = path.join(
      __dirname,
      '../migrations/1732000000000_create_audit_logs.sql'
    );
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    console.log('📝 Creating audit_logs table...');
    await client.query(migrationSQL);
    console.log('✅ audit_logs table created successfully\n');

    // Verify table creation
    const verifyQuery = `
      SELECT 
        table_name,
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'audit_logs'
      ORDER BY ordinal_position;
    `;

    const result = await client.query(verifyQuery);
    console.log('📊 Table structure:');
    result.rows.forEach((row) => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    // Verify indexes
    const indexQuery = `
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'audit_logs'
        AND schemaname = 'public';
    `;

    const indexResult = await client.query(indexQuery);
    console.log('\n📑 Indexes created:');
    indexResult.rows.forEach((row) => {
      console.log(`  - ${row.indexname}`);
    });

    console.log('\n✅ Audit logs migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('  1. Register audit routes in index.ts');
    console.log('  2. Add audit middleware to medical records routes');
    console.log('  3. Test audit logging functionality');

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
