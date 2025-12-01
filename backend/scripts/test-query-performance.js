/**
 * Query Performance Test Script
 * 
 * Tests database query performance with large datasets
 * Validates optimization effectiveness (indexes, caching, connection pooling)
 * 
 * Requirements: 13.1, 13.2, 13.3
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const TENANT_ID = process.env.TEST_TENANT_ID || 'tenant_1762083064503';

async function measureQuery(name, queryFn) {
  const startTime = Date.now();
  const result = await queryFn();
  const duration = Date.now() - startTime;
  
  return {
    name,
    duration,
    rowCount: result.rows?.length || 0,
    success: true
  };
}

async function testExpenseQueries(client) {
  console.log('\n📊 Testing Expense Queries');
  console.log('-'.repeat(60));
  
  const tests = [];
  
  // Test 1: Full table scan (no indexes)
  tests.push(await measureQuery(
    'Expenses - Full scan',
    () => client.query('SELECT * FROM expenses')
  ));
  
  // Test 2: Date range query (uses index)
  tests.push(await measureQuery(
    'Expenses - Date range (indexed)',
    () => client.query(`
      SELECT * FROM expenses 
      WHERE expense_date >= '2024-01-01' 
      AND expense_date <= '2024-12-31'
    `)
  ));
  
  // Test 3: Type filter (uses index)
  tests.push(await measureQuery(
    'Expenses - Type filter (indexed)',
    () => client.query(`
      SELECT * FROM expenses 
      WHERE expense_type = 'salary'
    `)
  ));
  
  // Test 4: Department filter (uses index)
  tests.push(await measureQuery(
    'Expenses - Department filter (indexed)',
    () => client.query(`
      SELECT * FROM expenses 
      WHERE department_id = 1
    `)
  ));
  
  // Test 5: Aggregation query
  tests.push(await measureQuery(
    'Expenses - Aggregation by type',
    () => client.query(`
      SELECT expense_type, SUM(amount) as total
      FROM expenses
      WHERE expense_date >= '2024-01-01' 
      AND expense_date <= '2024-12-31'
      GROUP BY expense_type
    `)
  ));
  
  // Test 6: Complex query with multiple filters
  tests.push(await measureQuery(
    'Expenses - Complex multi-filter',
    () => client.query(`
      SELECT expense_type, category, SUM(amount) as total, COUNT(*) as count
      FROM expenses
      WHERE expense_date >= '2024-01-01' 
      AND expense_date <= '2024-12-31'
      AND expense_type IN ('salary', 'supplies')
      AND department_id IN (1, 2, 3)
      GROUP BY expense_type, category
      ORDER BY total DESC
    `)
  ));
  
  return tests;
}

async function testAssetQueries(client) {
  console.log('\n📊 Testing Asset Queries');
  console.log('-'.repeat(60));
  
  const tests = [];
  
  // Test 1: Date range query
  tests.push(await measureQuery(
    'Assets - Date range (indexed)',
    () => client.query(`
      SELECT * FROM assets 
      WHERE as_of_date >= '2024-01-01' 
      AND as_of_date <= '2024-12-31'
    `)
  ));
  
  // Test 2: Category filter
  tests.push(await measureQuery(
    'Assets - Category filter (indexed)',
    () => client.query(`
      SELECT * FROM assets 
      WHERE asset_category = 'current'
    `)
  ));
  
  // Test 3: Aggregation by category
  tests.push(await measureQuery(
    'Assets - Aggregation by category',
    () => client.query(`
      SELECT asset_category, asset_type, SUM(value) as total_value
      FROM assets
      WHERE as_of_date = '2024-12-31'
      GROUP BY asset_category, asset_type
      ORDER BY total_value DESC
    `)
  ));
  
  return tests;
}

async function testLiabilityQueries(client) {
  console.log('\n📊 Testing Liability Queries');
  console.log('-'.repeat(60));
  
  const tests = [];
  
  // Test 1: Date range query
  tests.push(await measureQuery(
    'Liabilities - Date range (indexed)',
    () => client.query(`
      SELECT * FROM liabilities 
      WHERE as_of_date >= '2024-01-01' 
      AND as_of_date <= '2024-12-31'
    `)
  ));
  
  // Test 2: Category filter
  tests.push(await measureQuery(
    'Liabilities - Category filter (indexed)',
    () => client.query(`
      SELECT * FROM liabilities 
      WHERE liability_category = 'current'
    `)
  ));
  
  // Test 3: Aggregation by category
  tests.push(await measureQuery(
    'Liabilities - Aggregation by category',
    () => client.query(`
      SELECT liability_category, liability_type, SUM(amount) as total_amount
      FROM liabilities
      WHERE as_of_date = '2024-12-31'
      GROUP BY liability_category, liability_type
      ORDER BY total_amount DESC
    `)
  ));
  
  return tests;
}

async function testConcurrentQueries(client) {
  console.log('\n📊 Testing Concurrent Query Performance');
  console.log('-'.repeat(60));
  
  const startTime = Date.now();
  
  // Simulate 10 concurrent users running queries
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(
      client.query(`
        SELECT expense_type, SUM(amount) as total
        FROM expenses
        WHERE expense_date >= '2024-01-01' 
        AND expense_date <= '2024-12-31'
        GROUP BY expense_type
      `)
    );
  }
  
  await Promise.all(promises);
  const duration = Date.now() - startTime;
  
  return [{
    name: 'Concurrent queries (10 users)',
    duration,
    rowCount: 10,
    success: true
  }];
}

function printResults(tests) {
  tests.forEach(test => {
    const status = test.success ? '✓' : '✗';
    const durationColor = test.duration < 100 ? '\x1b[32m' : test.duration < 1000 ? '\x1b[33m' : '\x1b[31m';
    console.log(`  ${status} ${test.name}`);
    console.log(`    ${durationColor}${test.duration}ms\x1b[0m | ${test.rowCount} rows`);
  });
}

function printSummary(allTests) {
  console.log('\n' + '='.repeat(60));
  console.log('📈 Performance Summary');
  console.log('='.repeat(60));
  
  const durations = allTests.map(t => t.duration);
  const total = durations.reduce((a, b) => a + b, 0);
  const avg = total / durations.length;
  const min = Math.min(...durations);
  const max = Math.max(...durations);
  
  const fast = allTests.filter(t => t.duration < 100).length;
  const medium = allTests.filter(t => t.duration >= 100 && t.duration < 1000).length;
  const slow = allTests.filter(t => t.duration >= 1000).length;
  
  console.log(`Total queries: ${allTests.length}`);
  console.log(`Total time: ${total}ms`);
  console.log(`Average: ${avg.toFixed(2)}ms`);
  console.log(`Fastest: ${min}ms`);
  console.log(`Slowest: ${max}ms`);
  console.log('');
  console.log(`Performance breakdown:`);
  console.log(`  \x1b[32m✓ Fast (<100ms): ${fast}\x1b[0m`);
  console.log(`  \x1b[33m⚠ Medium (100-1000ms): ${medium}\x1b[0m`);
  console.log(`  \x1b[31m✗ Slow (>1000ms): ${slow}\x1b[0m`);
  
  if (slow > 0) {
    console.log('\n⚠️  Warning: Some queries are slow. Consider:');
    console.log('  - Adding more indexes');
    console.log('  - Optimizing query structure');
    console.log('  - Implementing caching');
  } else if (medium > allTests.length / 2) {
    console.log('\n✓ Performance is acceptable but could be improved with caching');
  } else {
    console.log('\n✓ Excellent query performance!');
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Balance Reports - Query Performance Test');
  console.log('='.repeat(60));
  console.log(`Tenant ID: ${TENANT_ID}`);
  console.log(`Connection pool: max ${pool.options.max} connections`);
  console.log('='.repeat(60));

  const client = await pool.connect();
  
  try {
    // Set schema context
    await client.query(`SET search_path TO "${TENANT_ID}"`);
    
    // Check data exists
    const expenseCount = await client.query('SELECT COUNT(*) FROM expenses');
    const assetCount = await client.query('SELECT COUNT(*) FROM assets');
    const liabilityCount = await client.query('SELECT COUNT(*) FROM liabilities');
    
    console.log('\nData summary:');
    console.log(`  Expenses: ${expenseCount.rows[0].count}`);
    console.log(`  Assets: ${assetCount.rows[0].count}`);
    console.log(`  Liabilities: ${liabilityCount.rows[0].count}`);
    
    if (parseInt(expenseCount.rows[0].count) < 1000) {
      console.log('\n⚠️  Warning: Low record count. Run generate-test-data-balance-reports.js first');
      console.log('   for meaningful performance testing.');
    }
    
    // Run tests
    const allTests = [];
    
    allTests.push(...await testExpenseQueries(client));
    printResults(allTests.slice(-6));
    
    allTests.push(...await testAssetQueries(client));
    printResults(allTests.slice(-3));
    
    allTests.push(...await testLiabilityQueries(client));
    printResults(allTests.slice(-3));
    
    allTests.push(...await testConcurrentQueries(client));
    printResults(allTests.slice(-1));
    
    // Print summary
    printSummary(allTests);
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Error running performance tests:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
