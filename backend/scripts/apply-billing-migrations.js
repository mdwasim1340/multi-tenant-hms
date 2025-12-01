const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'multitenant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function applyBillingMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting billing system migrations...\n');
    
    // Migration files in order
    const migrations = [
      '1732900231000_create_payments_table.sql',
      '1732900232000_create_insurance_claims_table.sql',
      '1732900233000_create_payment_plans_table.sql',
      '1732900234000_create_billing_adjustments_table.sql',
      '1732900235000_create_tax_configurations_table.sql',
      '1732900236000_enhance_invoices_table.sql',
    ];
    
    for (const migrationFile of migrations) {
      console.log(`📄 Applying migration: ${migrationFile}`);
      
      const migrationPath = path.join(__dirname, '..', 'migrations', migrationFile);
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      try {
        await client.query(sql);
        console.log(`✅ Successfully applied: ${migrationFile}\n`);
      } catch (error) {
        console.error(`❌ Error applying ${migrationFile}:`, error.message);
        throw error;
      }
    }
    
    console.log('🎉 All billing migrations applied successfully!\n');
    
    // Verify tables were created
    console.log('🔍 Verifying tables...\n');
    
    const tables = [
      'payments',
      'insurance_claims',
      'payment_plans',
      'billing_adjustments',
      'tax_configurations'
    ];
    
    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      if (result.rows[0].exists) {
        console.log(`✅ Table '${table}' exists`);
      } else {
        console.log(`❌ Table '${table}' NOT found`);
      }
    }
    
    // Check enhanced invoices columns
    console.log('\n🔍 Verifying invoices table enhancements...\n');
    
    const newColumns = [
      'patient_name',
      'patient_number',
      'referring_doctor',
      'department',
      'service_type',
      'discount_amount',
      'tax_amount',
      'subtotal'
    ];
    
    for (const column of newColumns) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'invoices'
          AND column_name = $1
        );
      `, [column]);
      
      if (result.rows[0].exists) {
        console.log(`✅ Column 'invoices.${column}' exists`);
      } else {
        console.log(`❌ Column 'invoices.${column}' NOT found`);
      }
    }
    
    console.log('\n✨ Migration verification complete!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations
applyBillingMigrations()
  .then(() => {
    console.log('\n✅ Billing system database setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
