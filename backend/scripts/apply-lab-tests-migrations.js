#!/usr/bin/env node

/**
 * Apply Lab Tests Migrations to All Tenant Schemas
 * 
 * This script applies the lab tests database migrations to all tenant schemas.
 * It creates the following tables:
 * - lab_test_categories
 * - lab_tests
 * - lab_orders
 * - lab_order_items
 * - lab_results
 * 
 * Usage: node scripts/apply-lab-tests-migrations.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

// Migration files in order
const migrations = [
  '1731960000000_create_lab_test_categories.sql',
  '1731960100000_create_lab_tests.sql',
  '1731960200000_create_lab_orders.sql',
  '1731960300000_create_lab_order_items.sql',
  '1731960400000_create_lab_results.sql'
];

async function getTenantSchemas() {
  const result = await pool.query(`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%'
    ORDER BY schema_name
  `);
  return result.rows.map(row => row.schema_name);
}

async function applyMigration(schema, migrationFile) {
  const migrationPath = path.join(__dirname, '..', 'migrations', migrationFile);
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  console.log(`  Applying ${migrationFile}...`);
  
  try {
    // Set search path to tenant schema
    await pool.query(`SET search_path TO "${schema}"`);
    
    // Execute migration
    await pool.query(sql);
    
    console.log(`  ✅ ${migrationFile} applied successfully`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error applying ${migrationFile}:`, error.message);
    return false;
  }
}

async function verifyTables(schema) {
  await pool.query(`SET search_path TO "${schema}"`);
  
  const result = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = $1 
    AND table_name IN (
      'lab_test_categories',
      'lab_tests',
      'lab_orders',
      'lab_order_items',
      'lab_results'
    )
    ORDER BY table_name
  `, [schema]);
  
  return result.rows.map(row => row.table_name);
}

async function main() {
  console.log('🔬 Lab Tests Migration Script');
  console.log('================================\n');
  
  try {
    // Get all tenant schemas
    console.log('📋 Finding tenant schemas...');
    const schemas = await getTenantSchemas();
    console.log(`Found ${schemas.length} tenant schemas:\n`);
    schemas.forEach(schema => console.log(`  - ${schema}`));
    console.log('');
    
    if (schemas.length === 0) {
      console.log('⚠️  No tenant schemas found. Please create tenants first.');
      process.exit(1);
    }
    
    // Apply migrations to each schema
    let successCount = 0;
    let failCount = 0;
    
    for (const schema of schemas) {
      console.log(`\n🏥 Processing schema: ${schema}`);
      console.log('─'.repeat(50));
      
      let schemaSuccess = true;
      
      for (const migration of migrations) {
        const success = await applyMigration(schema, migration);
        if (!success) {
          schemaSuccess = false;
          break;
        }
      }
      
      if (schemaSuccess) {
        // Verify tables were created
        const tables = await verifyTables(schema);
        console.log(`\n  📊 Verification: ${tables.length}/5 tables created`);
        tables.forEach(table => console.log(`    ✅ ${table}`));
        
        if (tables.length === 5) {
          successCount++;
          console.log(`\n  ✅ Schema ${schema} completed successfully`);
        } else {
          failCount++;
          console.log(`\n  ⚠️  Schema ${schema} incomplete (${tables.length}/5 tables)`);
        }
      } else {
        failCount++;
        console.log(`\n  ❌ Schema ${schema} failed`);
      }
    }
    
    // Summary
    console.log('\n\n📊 Migration Summary');
    console.log('================================');
    console.log(`Total schemas: ${schemas.length}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    
    if (successCount === schemas.length) {
      console.log('\n🎉 All migrations completed successfully!');
      console.log('\n📋 Next Steps:');
      console.log('  1. Create TypeScript types (backend/src/types/labTest.ts)');
      console.log('  2. Create services (backend/src/services/labOrder.service.ts)');
      console.log('  3. Create controllers (backend/src/controllers/labOrder.controller.ts)');
      console.log('  4. Create routes (backend/src/routes/labOrders.ts)');
    } else {
      console.log('\n⚠️  Some migrations failed. Please check errors above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
main();
