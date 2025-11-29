const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

async function createBillingTables() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Creating billing system tables...\n');

    // Create invoices table
    console.log('Creating invoices table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        billing_period_start DATE NOT NULL,
        billing_period_end DATE NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        status VARCHAR(50) DEFAULT 'pending',
        due_date DATE NOT NULL,
        paid_at TIMESTAMP,
        payment_method VARCHAR(50),
        razorpay_order_id VARCHAR(255),
        razorpay_payment_id VARCHAR(255),
        line_items JSONB DEFAULT '[]',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ invoices table created');

    // Create payments table
    console.log('Creating payments table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
        tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        payment_method VARCHAR(50) NOT NULL,
        razorpay_payment_id VARCHAR(255),
        razorpay_order_id VARCHAR(255),
        razorpay_signature VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        payment_date TIMESTAMP,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ payments table created');

    // Create indexes for performance
    console.log('Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment ON payments(razorpay_payment_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    `);
    console.log('✅ Indexes created');

    // Generate sample invoices for existing tenants (for demo purposes)
    console.log('Generating sample invoices for existing tenants...');
    const existingTenants = await client.query('SELECT id, name FROM tenants');
    
    const currentDate = new Date();
    const billingPeriodStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const billingPeriodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15);
    
    for (const tenant of existingTenants.rows) {
      const invoiceNumber = `INV-${Date.now()}-${tenant.id.slice(-6)}`;
      
      // Get tenant's subscription tier to determine amount
      const subResult = await client.query(
        'SELECT tier_id FROM tenant_subscriptions WHERE tenant_id = $1',
        [tenant.id]
      );
      
      let amount = 4999; // Default to basic tier
      if (subResult.rows.length > 0) {
        const tierResult = await client.query(
          'SELECT price FROM subscription_tiers WHERE id = $1',
          [subResult.rows[0].tier_id]
        );
        if (tierResult.rows.length > 0) {
          amount = parseFloat(tierResult.rows[0].price);
        }
      }
      
      const lineItems = [
        {
          description: 'Monthly Subscription',
          amount: amount,
          quantity: 1
        }
      ];
      
      await client.query(`
        INSERT INTO invoices (
          invoice_number, tenant_id, billing_period_start, billing_period_end,
          amount, currency, status, due_date, line_items
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (invoice_number) DO NOTHING
      `, [
        invoiceNumber,
        tenant.id,
        billingPeriodStart,
        billingPeriodEnd,
        amount,
        'INR',
        'pending',
        dueDate,
        JSON.stringify(lineItems)
      ]);
    }
    console.log(`✅ Sample invoices generated for ${existingTenants.rows.length} tenants`);

    console.log('\n🎉 Billing system setup complete!');
    
    // Verify the setup
    const invoicesCount = await client.query('SELECT COUNT(*) FROM invoices');
    const paymentsCount = await client.query('SELECT COUNT(*) FROM payments');
    const indexCount = await client.query(`
      SELECT COUNT(*) FROM pg_indexes 
      WHERE tablename IN ('invoices', 'payments')
      AND indexname LIKE 'idx_%'
    `);
    
    console.log(`📊 Summary:`);
    console.log(`   - Invoices: ${invoicesCount.rows[0].count}`);
    console.log(`   - Payments: ${paymentsCount.rows[0].count}`);
    console.log(`   - Performance indexes: ${indexCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error creating billing tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the setup
createBillingTables().catch(console.error);