/**
 * Seed Balance Reports Test Data
 * 
 * This script generates sample data for testing the Balance Reports feature:
 * - Expenses (revenue and expense tracking)
 * - Assets (asset management)
 * - Liabilities (liability tracking)
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Sample tenant ID - replace with your actual tenant ID
const TENANT_ID = 'tenant_1762083064503';

async function seedBalanceReportsData() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting Balance Reports data seeding...\n');

    // Set schema context for tenant
    await client.query(`SET search_path TO "${TENANT_ID}"`);

    // 1. Seed Expenses (Revenue and Expense tracking)
    console.log('📊 Seeding expenses data...');
    
    const expenses = [
      // Revenue items (negative amounts represent income)
      { expense_type: 'revenue', category: 'consultations', amount: -150000, expense_date: '2024-11-01', description: 'Consultation fees - November' },
      { expense_type: 'revenue', category: 'procedures', amount: -250000, expense_date: '2024-11-05', description: 'Surgical procedures' },
      { expense_type: 'revenue', category: 'medications', amount: -80000, expense_date: '2024-11-10', description: 'Pharmacy sales' },
      { expense_type: 'revenue', category: 'lab_tests', amount: -120000, expense_date: '2024-11-15', description: 'Laboratory tests' },
      { expense_type: 'revenue', category: 'other', amount: -50000, expense_date: '2024-11-20', description: 'Other services' },
      
      // Expense items (positive amounts)
      { expense_type: 'expense', category: 'salaries', amount: 200000, expense_date: '2024-11-01', description: 'Staff salaries - November' },
      { expense_type: 'expense', category: 'supplies', amount: 80000, expense_date: '2024-11-05', description: 'Medical supplies' },
      { expense_type: 'expense', category: 'utilities', amount: 30000, expense_date: '2024-11-10', description: 'Electricity and water' },
      { expense_type: 'expense', category: 'maintenance', amount: 25000, expense_date: '2024-11-15', description: 'Equipment maintenance' },
      { expense_type: 'expense', category: 'other', amount: 15000, expense_date: '2024-11-20', description: 'Miscellaneous expenses' },
      
      // Previous month data for comparison
      { expense_type: 'revenue', category: 'consultations', amount: -140000, expense_date: '2024-10-01', description: 'Consultation fees - October' },
      { expense_type: 'revenue', category: 'procedures', amount: -230000, expense_date: '2024-10-05', description: 'Surgical procedures' },
      { expense_type: 'expense', category: 'salaries', amount: 200000, expense_date: '2024-10-01', description: 'Staff salaries - October' },
      { expense_type: 'expense', category: 'supplies', amount: 75000, expense_date: '2024-10-05', description: 'Medical supplies' },
    ];

    for (const expense of expenses) {
      await client.query(
        `INSERT INTO expenses (expense_type, category, amount, expense_date, description, tenant_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT DO NOTHING`,
        [expense.expense_type, expense.category, expense.amount, expense.expense_date, expense.description, TENANT_ID]
      );
    }
    console.log(`✅ Seeded ${expenses.length} expense records\n`);

    // 2. Seed Assets
    console.log('💰 Seeding assets data...');
    
    const assets = [
      // Current Assets
      { asset_type: 'current', asset_category: 'cash', amount: 500000, as_of_date: '2024-11-30', description: 'Cash in bank' },
      { asset_type: 'current', asset_category: 'accounts_receivable', amount: 300000, as_of_date: '2024-11-30', description: 'Outstanding patient bills' },
      { asset_type: 'current', asset_category: 'inventory', amount: 150000, as_of_date: '2024-11-30', description: 'Medical supplies inventory' },
      
      // Fixed Assets
      { asset_type: 'fixed', asset_category: 'equipment', amount: 2000000, as_of_date: '2024-11-30', description: 'Medical equipment' },
      { asset_type: 'fixed', asset_category: 'buildings', amount: 5000000, as_of_date: '2024-11-30', description: 'Hospital building' },
      { asset_type: 'fixed', asset_category: 'land', amount: 3000000, as_of_date: '2024-11-30', description: 'Land' },
      { asset_type: 'fixed', asset_category: 'vehicles', amount: 500000, as_of_date: '2024-11-30', description: 'Ambulances and vehicles' },
    ];

    for (const asset of assets) {
      await client.query(
        `INSERT INTO assets (asset_type, asset_category, amount, as_of_date, description, tenant_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT DO NOTHING`,
        [asset.asset_type, asset.asset_category, asset.amount, asset.as_of_date, asset.description, TENANT_ID]
      );
    }
    console.log(`✅ Seeded ${assets.length} asset records\n`);

    // 3. Seed Liabilities
    console.log('📉 Seeding liabilities data...');
    
    const liabilities = [
      // Current Liabilities
      { liability_type: 'current', liability_category: 'accounts_payable', amount: 200000, as_of_date: '2024-11-30', description: 'Supplier payments due' },
      { liability_type: 'current', liability_category: 'accrued_expenses', amount: 100000, as_of_date: '2024-11-30', description: 'Accrued salaries and expenses' },
      
      // Long-term Liabilities
      { liability_type: 'long_term', liability_category: 'loans', amount: 1500000, as_of_date: '2024-11-30', description: 'Bank loan' },
      { liability_type: 'long_term', liability_category: 'mortgages', amount: 2000000, as_of_date: '2024-11-30', description: 'Building mortgage' },
    ];

    for (const liability of liabilities) {
      await client.query(
        `INSERT INTO liabilities (liability_type, liability_category, amount, as_of_date, description, tenant_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT DO NOTHING`,
        [liability.liability_type, liability.liability_category, liability.amount, liability.as_of_date, liability.description, TENANT_ID]
      );
    }
    console.log(`✅ Seeded ${liabilities.length} liability records\n`);

    // Summary
    console.log('📊 Data Summary:');
    console.log('================');
    
    const expenseCount = await client.query(`SELECT COUNT(*) FROM expenses WHERE tenant_id = $1`, [TENANT_ID]);
    const assetCount = await client.query(`SELECT COUNT(*) FROM assets WHERE tenant_id = $1`, [TENANT_ID]);
    const liabilityCount = await client.query(`SELECT COUNT(*) FROM liabilities WHERE tenant_id = $1`, [TENANT_ID]);
    
    console.log(`Expenses: ${expenseCount.rows[0].count} records`);
    console.log(`Assets: ${assetCount.rows[0].count} records`);
    console.log(`Liabilities: ${liabilityCount.rows[0].count} records`);
    
    // Calculate totals
    const revenueTotal = await client.query(
      `SELECT SUM(ABS(amount)) as total FROM expenses 
       WHERE tenant_id = $1 AND expense_type = 'revenue' AND expense_date >= '2024-11-01'`,
      [TENANT_ID]
    );
    const expenseTotal = await client.query(
      `SELECT SUM(amount) as total FROM expenses 
       WHERE tenant_id = $1 AND expense_type = 'expense' AND expense_date >= '2024-11-01'`,
      [TENANT_ID]
    );
    const assetTotal = await client.query(
      `SELECT SUM(amount) as total FROM assets WHERE tenant_id = $1`,
      [TENANT_ID]
    );
    const liabilityTotal = await client.query(
      `SELECT SUM(amount) as total FROM liabilities WHERE tenant_id = $1`,
      [TENANT_ID]
    );
    
    console.log(`\n💰 Financial Summary (November 2024):`);
    console.log(`Total Revenue: ₹${Number(revenueTotal.rows[0].total || 0).toLocaleString('en-IN')}`);
    console.log(`Total Expenses: ₹${Number(expenseTotal.rows[0].total || 0).toLocaleString('en-IN')}`);
    console.log(`Net Profit: ₹${(Number(revenueTotal.rows[0].total || 0) - Number(expenseTotal.rows[0].total || 0)).toLocaleString('en-IN')}`);
    console.log(`\n🏦 Balance Sheet:`);
    console.log(`Total Assets: ₹${Number(assetTotal.rows[0].total || 0).toLocaleString('en-IN')}`);
    console.log(`Total Liabilities: ₹${Number(liabilityTotal.rows[0].total || 0).toLocaleString('en-IN')}`);
    console.log(`Equity: ₹${(Number(assetTotal.rows[0].total || 0) - Number(liabilityTotal.rows[0].total || 0)).toLocaleString('en-IN')}`);
    
    console.log('\n✅ Balance Reports data seeding completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Navigate to /billing/balance-reports');
    console.log('2. Select "Profit & Loss" report');
    console.log('3. Set date range: 2024-11-01 to 2024-11-30');
    console.log('4. Click "Generate Report"');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seeding
seedBalanceReportsData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
