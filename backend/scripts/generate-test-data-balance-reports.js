/**
 * Generate Test Data for Balance Reports
 * 
 * Creates large datasets (10k+ records) for performance testing
 * Tests database query optimization and caching effectiveness
 * 
 * Requirements: 13.1
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

// Configuration
const TENANT_ID = process.env.TEST_TENANT_ID || 'tenant_1762083064503';
const NUM_EXPENSES = 10000;
const NUM_ASSETS = 5000;
const NUM_LIABILITIES = 3000;

// Helper functions
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomAmount(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function generateExpenses(client) {
  console.log(`\nGenerating ${NUM_EXPENSES} expense records...`);
  
  const expenseTypes = ['salary', 'supplies', 'utilities', 'maintenance', 'other'];
  const categories = ['medical_supplies', 'office_supplies', 'equipment_maintenance', 'staff_salaries', 'utilities'];
  const paymentMethods = ['cash', 'cheque', 'bank_transfer', 'card'];
  
  const startDate = new Date('2023-01-01');
  const endDate = new Date('2024-12-31');
  
  const batchSize = 1000;
  let inserted = 0;
  
  for (let i = 0; i < NUM_EXPENSES; i += batchSize) {
    const values = [];
    const placeholders = [];
    
    const currentBatchSize = Math.min(batchSize, NUM_EXPENSES - i);
    
    for (let j = 0; j < currentBatchSize; j++) {
      const baseIndex = j * 10;
      placeholders.push(
        `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9}, $${baseIndex + 10})`
      );
      
      values.push(
        TENANT_ID,
        randomElement(expenseTypes),
        randomElement(categories),
        randomAmount(100, 50000),
        randomDate(startDate, endDate).toISOString().split('T')[0],
        Math.floor(Math.random() * 10) + 1, // department_id
        `Test expense ${i + j + 1}`,
        randomElement(paymentMethods),
        `Vendor ${Math.floor(Math.random() * 100) + 1}`,
        `INV-${i + j + 1}`
      );
    }
    
    const query = `
      INSERT INTO expenses (
        tenant_id, expense_type, category, amount, expense_date,
        department_id, description, payment_method, vendor_name, invoice_reference
      ) VALUES ${placeholders.join(', ')}
    `;
    
    await client.query(query, values);
    inserted += currentBatchSize;
    
    if (inserted % 1000 === 0) {
      console.log(`  Inserted ${inserted}/${NUM_EXPENSES} expenses...`);
    }
  }
  
  console.log(`✓ Generated ${NUM_EXPENSES} expense records`);
}

async function generateAssets(client) {
  console.log(`\nGenerating ${NUM_ASSETS} asset records...`);
  
  const assetTypes = ['cash', 'receivable', 'inventory', 'equipment', 'building', 'vehicle'];
  const assetCategories = ['current', 'fixed'];
  
  const startDate = new Date('2023-01-01');
  const endDate = new Date('2024-12-31');
  
  const batchSize = 1000;
  let inserted = 0;
  
  for (let i = 0; i < NUM_ASSETS; i += batchSize) {
    const values = [];
    const placeholders = [];
    
    const currentBatchSize = Math.min(batchSize, NUM_ASSETS - i);
    
    for (let j = 0; j < currentBatchSize; j++) {
      const baseIndex = j * 9;
      placeholders.push(
        `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9})`
      );
      
      const assetType = randomElement(assetTypes);
      const assetCategory = ['cash', 'receivable', 'inventory'].includes(assetType) ? 'current' : 'fixed';
      
      values.push(
        TENANT_ID,
        assetType,
        assetCategory,
        `Test Asset ${i + j + 1}`,
        randomAmount(1000, 500000),
        randomDate(startDate, endDate).toISOString().split('T')[0],
        Math.floor(Math.random() * 10) + 1, // department_id
        `Test asset description ${i + j + 1}`,
        randomDate(new Date('2020-01-01'), startDate).toISOString().split('T')[0] // acquisition_date
      );
    }
    
    const query = `
      INSERT INTO assets (
        tenant_id, asset_type, asset_category, asset_name, value,
        as_of_date, department_id, description, acquisition_date
      ) VALUES ${placeholders.join(', ')}
    `;
    
    await client.query(query, values);
    inserted += currentBatchSize;
    
    if (inserted % 1000 === 0) {
      console.log(`  Inserted ${inserted}/${NUM_ASSETS} assets...`);
    }
  }
  
  console.log(`✓ Generated ${NUM_ASSETS} asset records`);
}

async function generateLiabilities(client) {
  console.log(`\nGenerating ${NUM_LIABILITIES} liability records...`);
  
  const liabilityTypes = ['payable', 'accrued', 'loan', 'mortgage', 'lease', 'tax'];
  const liabilityCategories = ['current', 'long-term'];
  const paymentSchedules = ['monthly', 'quarterly', 'annually', 'one-time'];
  
  const startDate = new Date('2023-01-01');
  const endDate = new Date('2024-12-31');
  
  const batchSize = 1000;
  let inserted = 0;
  
  for (let i = 0; i < NUM_LIABILITIES; i += batchSize) {
    const values = [];
    const placeholders = [];
    
    const currentBatchSize = Math.min(batchSize, NUM_LIABILITIES - i);
    
    for (let j = 0; j < currentBatchSize; j++) {
      const baseIndex = j * 9;
      placeholders.push(
        `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9})`
      );
      
      const liabilityType = randomElement(liabilityTypes);
      const liabilityCategory = ['payable', 'accrued', 'tax'].includes(liabilityType) ? 'current' : 'long-term';
      
      values.push(
        TENANT_ID,
        liabilityType,
        liabilityCategory,
        `Test Liability ${i + j + 1}`,
        randomAmount(1000, 200000),
        randomDate(startDate, endDate).toISOString().split('T')[0],
        randomDate(endDate, new Date('2026-12-31')).toISOString().split('T')[0], // due_date
        `Creditor ${Math.floor(Math.random() * 50) + 1}`,
        randomElement(paymentSchedules)
      );
    }
    
    const query = `
      INSERT INTO liabilities (
        tenant_id, liability_type, liability_category, liability_name, amount,
        as_of_date, due_date, creditor_name, payment_schedule
      ) VALUES ${placeholders.join(', ')}
    `;
    
    await client.query(query, values);
    inserted += currentBatchSize;
    
    if (inserted % 1000 === 0) {
      console.log(`  Inserted ${inserted}/${NUM_LIABILITIES} liabilities...`);
    }
  }
  
  console.log(`✓ Generated ${NUM_LIABILITIES} liability records`);
}

async function main() {
  console.log('='.repeat(60));
  console.log('Balance Reports - Test Data Generator');
  console.log('='.repeat(60));
  console.log(`Tenant ID: ${TENANT_ID}`);
  console.log(`Target: ${NUM_EXPENSES} expenses, ${NUM_ASSETS} assets, ${NUM_LIABILITIES} liabilities`);
  console.log('='.repeat(60));

  const client = await pool.connect();
  
  try {
    // Set schema context
    await client.query(`SET search_path TO "${TENANT_ID}"`);
    
    // Check if tables exist
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1 
      AND table_name IN ('expenses', 'assets', 'liabilities')
    `, [TENANT_ID]);
    
    if (tablesCheck.rows.length < 3) {
      console.error('\n❌ Error: Required tables not found in tenant schema');
      console.error('Please run migrations first: node scripts/apply-balance-reports-migrations.js');
      process.exit(1);
    }
    
    // Clear existing test data
    console.log('\nClearing existing test data...');
    await client.query('DELETE FROM expenses WHERE description LIKE \'Test expense%\'');
    await client.query('DELETE FROM assets WHERE description LIKE \'Test asset%\'');
    await client.query('DELETE FROM liabilities WHERE liability_name LIKE \'Test Liability%\'');
    console.log('✓ Cleared existing test data');
    
    // Generate new data
    const startTime = Date.now();
    
    await generateExpenses(client);
    await generateAssets(client);
    await generateLiabilities(client);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log('✓ Test data generation complete!');
    console.log(`  Total time: ${duration}s`);
    console.log(`  Total records: ${NUM_EXPENSES + NUM_ASSETS + NUM_LIABILITIES}`);
    console.log('='.repeat(60));
    
    // Verify counts
    console.log('\nVerifying record counts...');
    const expenseCount = await client.query('SELECT COUNT(*) FROM expenses');
    const assetCount = await client.query('SELECT COUNT(*) FROM assets');
    const liabilityCount = await client.query('SELECT COUNT(*) FROM liabilities');
    
    console.log(`  Expenses: ${expenseCount.rows[0].count}`);
    console.log(`  Assets: ${assetCount.rows[0].count}`);
    console.log(`  Liabilities: ${liabilityCount.rows[0].count}`);
    
  } catch (error) {
    console.error('\n❌ Error generating test data:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
