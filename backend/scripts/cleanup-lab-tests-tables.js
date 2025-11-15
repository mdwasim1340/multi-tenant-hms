#!/usr/bin/env node

/**
 * Cleanup Lab Tests Tables
 * Drops all lab tests tables from tenant schemas for fresh migration
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function getTenantSchemas() {
  const result = await pool.query(`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name LIKE 'tenant_%' OR schema_name LIKE 'demo_%'
    ORDER BY schema_name
  `);
  return result.rows.map(row => row.schema_name);
}

async function cleanupSchema(schema) {
  console.log(`\n🧹 Cleaning schema: ${schema}`);
  
  try {
    await pool.query(`SET search_path TO "${schema}"`);
    
    // Drop tables in reverse order (respecting foreign keys)
    const tables = [
      'lab_results',
      'lab_order_items',
      'lab_orders',
      'lab_tests',
      'lab_test_categories'
    ];
    
    for (const table of tables) {
      await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      console.log(`  ✅ Dropped ${table}`);
    }
    
    return true;
  } catch (error) {
    console.error(`  ❌ Error:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🧹 Lab Tests Cleanup Script');
  console.log('================================\n');
  
  try {
    const schemas = await getTenantSchemas();
    console.log(`Found ${schemas.length} tenant schemas\n`);
    
    let successCount = 0;
    
    for (const schema of schemas) {
      const success = await cleanupSchema(schema);
      if (success) successCount++;
    }
    
    console.log('\n\n📊 Cleanup Summary');
    console.log('================================');
    console.log(`✅ Cleaned: ${successCount}/${schemas.length} schemas`);
    console.log('\n✅ Ready for fresh migration!');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
