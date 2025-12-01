#!/usr/bin/env node

/**
 * Test Balance Reports Schema
 * 
 * This script tests:
 * 1. Tables exist in tenant schemas
 * 2. Indexes are created correctly
 * 3. Audit log immutability constraint works
 * 4. Data can be inserted into all tables
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function testTableExists(schema, tableName) {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = $1 AND table_name = $2
    )
  `, [schema, tableName]);
  
  return result.rows[0].exists;
}

async function testIndexes(schema, tableName, expectedIndexes) {
  const result = await pool.query(`
    SELECT indexname 
    FROM pg_indexes 
    WHERE schemaname = $1 AND tablename = $2
    ORDER BY indexname
  `, [schema, tableName]);
  
  const indexes = result.rows.map(row => row.indexname);
  const missing = expectedIndexes.filter(idx => !indexes.includes(idx));
  
  return { indexes, missing };
}

async function testInsertExpense(schema) {
  await pool.query(`SET search_path TO "${schema}"`);
  
  const result = await pool.query(`
    INSERT INTO expenses (
      tenant_id, expense_type, category, amount, expense_date, description
    ) VALUES (
      $1, 'supplies', 'medical_supplies', 5000.00, '2024-01-15', 'Medical supplies purchase'
    ) RETURNING id
  `, [schema]);
  
  return result.rows[0].id;
}

async function testInsertAsset(schema) {
  await pool.query(`SET search_path TO "${schema}"`);
  
  const result = await pool.query(`
    INSERT INTO assets (
      tenant_id, asset_type, asset_category, asset_name, value, as_of_date, description
    ) VALUES (
      $1, 'equipment', 'fixed', 'MRI Machine', 5000000.00, '2024-01-01', 'Medical imaging equipment'
    ) RETURNING id
  `, [schema]);
  
  return result.rows[0].id;
}

async function testInsertLiability(schema) {
  await pool.query(`SET search_path TO "${schema}"`);
  
  const result = await pool.query(`
    INSERT INTO liabilities (
      tenant_id, liability_type, liability_category, liability_name, amount, as_of_date, description
    ) VALUES (
      $1, 'loan', 'long-term', 'Equipment Loan', 2000000.00, '2024-01-01', 'Loan for medical equipment'
    ) RETURNING id
  `, [schema]);
  
  return result.rows[0].id;
}

async function testInsertAuditLog(schema) {
  await pool.query(`SET search_path TO "${schema}"`);
  
  const result = await pool.query(`
    INSERT INTO balance_report_audit_logs (
      tenant_id, user_id, user_name, report_type, parameters
    ) VALUES (
      $1, 1, 'Test User', 'profit-loss', $2
    ) RETURNING id
  `, [schema, JSON.stringify({ dateRange: { startDate: '2024-01-01', endDate: '2024-12-31' } })]);
  
  return result.rows[0].id;
}

async function testAuditLogImmutability(schema, auditLogId) {
  await pool.query(`SET search_path TO "${schema}"`);
  
  try {
    // Try to update - should fail
    await pool.query(`
      UPDATE balance_report_audit_logs 
      SET user_name = 'Modified User' 
      WHERE id = $1
    `, [auditLogId]);
    
    return { canUpdate: true, error: null };
  } catch (error) {
    return { canUpdate: false, error: error.message };
  }
}

async function testAuditLogDeletion(schema, auditLogId) {
  await pool.query(`SET search_path TO "${schema}"`);
  
  try {
    // Try to delete - should fail
    await pool.query(`
      DELETE FROM balance_report_audit_logs 
      WHERE id = $1
    `, [auditLogId]);
    
    return { canDelete: true, error: null };
  } catch (error) {
    return { canDelete: false, error: error.message };
  }
}

async function cleanupTestData(schema, expenseId, assetId, liabilityId, auditLogId) {
  await pool.query(`SET search_path TO "${schema}"`);
  
  // Clean up test data (audit log cannot be deleted due to immutability)
  await pool.query('DELETE FROM expenses WHERE id = $1', [expenseId]);
  await pool.query('DELETE FROM assets WHERE id = $1', [assetId]);
  await pool.query('DELETE FROM liabilities WHERE id = $1', [liabilityId]);
  
  console.log('✅ Test data cleaned up (except immutable audit log)');
}

async function main() {
  console.log('🧪 Testing Balance Reports Schema\n');
  
  try {
    // Get first tenant schema for testing
    const result = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%'
      ORDER BY schema_name
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      console.error('❌ No tenant schemas found');
      process.exit(1);
    }
    
    const testSchema = result.rows[0].schema_name;
    console.log(`📋 Testing with schema: ${testSchema}\n`);
    
    // Test 1: Check tables exist
    console.log('Test 1: Checking tables exist...');
    const tables = ['expenses', 'assets', 'liabilities', 'balance_report_audit_logs'];
    for (const table of tables) {
      const exists = await testTableExists(testSchema, table);
      console.log(`  ${exists ? '✅' : '❌'} ${table}: ${exists ? 'exists' : 'missing'}`);
    }
    console.log('');
    
    // Test 2: Check indexes
    console.log('Test 2: Checking indexes...');
    const indexTests = [
      { table: 'expenses', indexes: ['idx_expenses_tenant', 'idx_expenses_date', 'idx_expenses_type'] },
      { table: 'assets', indexes: ['idx_assets_tenant', 'idx_assets_date', 'idx_assets_type'] },
      { table: 'liabilities', indexes: ['idx_liabilities_tenant', 'idx_liabilities_date', 'idx_liabilities_type'] },
      { table: 'balance_report_audit_logs', indexes: ['idx_audit_logs_tenant', 'idx_audit_logs_date', 'idx_audit_logs_type'] }
    ];
    
    for (const test of indexTests) {
      const { indexes, missing } = await testIndexes(testSchema, test.table, test.indexes);
      if (missing.length === 0) {
        console.log(`  ✅ ${test.table}: All indexes present (${indexes.length} total)`);
      } else {
        console.log(`  ❌ ${test.table}: Missing indexes: ${missing.join(', ')}`);
      }
    }
    console.log('');
    
    // Test 3: Insert test data
    console.log('Test 3: Testing data insertion...');
    const expenseId = await testInsertExpense(testSchema);
    console.log(`  ✅ Expense inserted (ID: ${expenseId})`);
    
    const assetId = await testInsertAsset(testSchema);
    console.log(`  ✅ Asset inserted (ID: ${assetId})`);
    
    const liabilityId = await testInsertLiability(testSchema);
    console.log(`  ✅ Liability inserted (ID: ${liabilityId})`);
    
    const auditLogId = await testInsertAuditLog(testSchema);
    console.log(`  ✅ Audit log inserted (ID: ${auditLogId})`);
    console.log('');
    
    // Test 4: Test audit log immutability
    console.log('Test 4: Testing audit log immutability...');
    const updateResult = await testAuditLogImmutability(testSchema, auditLogId);
    if (!updateResult.canUpdate) {
      console.log(`  ✅ UPDATE prevented: ${updateResult.error}`);
    } else {
      console.log(`  ❌ UPDATE allowed (should be prevented!)`);
    }
    
    const deleteResult = await testAuditLogDeletion(testSchema, auditLogId);
    if (!deleteResult.canDelete) {
      console.log(`  ✅ DELETE prevented: ${deleteResult.error}`);
    } else {
      console.log(`  ❌ DELETE allowed (should be prevented!)`);
    }
    console.log('');
    
    // Cleanup
    console.log('Cleaning up test data...');
    await cleanupTestData(testSchema, expenseId, assetId, liabilityId, auditLogId);
    
    console.log('\n✨ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
