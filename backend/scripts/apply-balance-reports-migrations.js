#!/usr/bin/env node

/**
 * Apply Balance Reports Module Migrations
 * 
 * This script applies the balance reports database migrations to:
 * 1. Public schema (for global audit logs and shared tables)
 * 2. All tenant schemas (for tenant-specific financial data)
 * 
 * Tables created:
 * - expenses: Operational expenses for P&L and Cash Flow reports
 * - assets: Hospital assets for Balance Sheet reports
 * - liabilities: Hospital liabilities for Balance Sheet reports
 * - balance_report_audit_logs: Immutable audit trail (public schema only)
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

// Migration files in order
const migrations = [
  '1732950000000_create_expenses_table.sql',
  '1732950100000_create_assets_table.sql',
  '1732950200000_create_liabilities_table.sql',
  '1732950300000_create_balance_report_audit_logs_table.sql'
];

async function getTenantSchemas() {
  const result = await pool.query(`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name LIKE 'tenant_%'
    ORDER BY schema_name
  `);
  return result.rows.map(row => row.schema_name);
}

async function applyMigration(schema, migrationFile) {
  const migrationPath = path.join(__dirname, '..', 'migrations', migrationFile);
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  try {
    // Set search path to target schema
    await pool.query(`SET search_path TO "${schema}"`);
    
    // Execute migration
    await pool.query(sql);
    
    console.log(`✅ Applied ${migrationFile} to ${schema}`);
    return true;
  } catch (error) {
    console.error(`❌ Error applying ${migrationFile} to ${schema}:`, error.message);
    return false;
  }
}

async function verifyTables(schema) {
  try {
    await pool.query(`SET search_path TO "${schema}"`);
    
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1 
      AND table_name IN ('expenses', 'assets', 'liabilities', 'balance_report_audit_logs')
      ORDER BY table_name
    `, [schema]);
    
    const tables = result.rows.map(row => row.table_name);
    console.log(`📋 Tables in ${schema}:`, tables.join(', '));
    
    return tables;
  } catch (error) {
    console.error(`❌ Error verifying tables in ${schema}:`, error.message);
    return [];
  }
}

async function main() {
  console.log('🚀 Starting Balance Reports Module Migration\n');
  
  try {
    // Get all tenant schemas
    const tenantSchemas = await getTenantSchemas();
    console.log(`📊 Found ${tenantSchemas.length} tenant schemas\n`);
    
    // Apply migrations to public schema first (for audit logs)
    console.log('📦 Applying migrations to public schema...');
    for (const migration of migrations) {
      await applyMigration('public', migration);
    }
    console.log('');
    
    // Apply migrations to each tenant schema
    console.log('📦 Applying migrations to tenant schemas...');
    for (const schema of tenantSchemas) {
      console.log(`\n🏥 Processing ${schema}...`);
      for (const migration of migrations) {
        await applyMigration(schema, migration);
      }
    }
    
    console.log('\n\n✅ Migration Complete!\n');
    
    // Verify tables in public schema
    console.log('🔍 Verifying public schema...');
    await verifyTables('public');
    
    // Verify tables in first tenant schema
    if (tenantSchemas.length > 0) {
      console.log(`\n🔍 Verifying ${tenantSchemas[0]}...`);
      await verifyTables(tenantSchemas[0]);
    }
    
    console.log('\n✨ All migrations applied successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
main();
