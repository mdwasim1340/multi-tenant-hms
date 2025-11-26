const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const runBedMigrations = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running bed management migrations...\n');
    
    // Get all active tenants
    const { rows: tenants } = await client.query(
      "SELECT id, name FROM tenants WHERE status = 'active' ORDER BY id"
    );
    
    console.log(`Found ${tenants.length} active tenants\n`);
    
    // Migration files in order
    const migrationFiles = [
      '1731651000000_create_departments_table.sql',
      '1731651100000_create_beds_table.sql',
      '1731651200000_create_bed_assignments_table.sql',
      '1731651300000_create_bed_transfers_table.sql'
    ];
    
    // Run migrations for each tenant
    for (const tenant of tenants) {
      console.log(`📋 Processing tenant: ${tenant.name} (${tenant.id})`);
      
      // Set schema context
      await client.query(`SET search_path TO "${tenant.id}"`);
      
      // Check if patients table exists (required for bed_assignments foreign key)
      const { rows: patientTableCheck } = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = '${tenant.id}' 
          AND table_name = 'patients'
        );
      `);
      
      if (!patientTableCheck[0].exists) {
        console.log(`  ⚠️  Skipping - patients table not found (required for bed assignments)`);
        console.log('');
        continue;
      }
      
      for (const file of migrationFiles) {
        const filePath = path.join(__dirname, 'migrations', file);
        
        if (!fs.existsSync(filePath)) {
          console.log(`  ⚠️  Migration file not found: ${file}`);
          continue;
        }
        
        const sql = fs.readFileSync(filePath, 'utf8');
        
        try {
          await client.query(sql);
          console.log(`  ✅ ${file}`);
        } catch (error) {
          // Check if error is due to table already existing
          if (error.message.includes('already exists')) {
            console.log(`  ⏭️  ${file} (already exists)`);
          } else {
            console.error(`  ❌ ${file}: ${error.message}`);
            throw error;
          }
        }
      }
      
      console.log('');
    }
    
    console.log('✅ All bed management migrations completed successfully\n');
    
    // Verify tables created
    console.log('🔍 Verifying tables...');
    for (const tenant of tenants) {
      await client.query(`SET search_path TO "${tenant.id}"`);
      
      const { rows: tables } = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = '${tenant.id}' 
        AND table_name IN ('departments', 'beds', 'bed_assignments', 'bed_transfers')
        ORDER BY table_name
      `);
      
      console.log(`  ${tenant.name}: ${tables.map(t => t.table_name).join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

runBedMigrations()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
