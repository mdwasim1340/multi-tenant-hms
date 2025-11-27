const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'multitenant_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function checkBedStructure() {
  try {
    console.log('🛏️ Checking bed table structure...');
    
    // Set tenant schema
    const tenantId = 'tenant_1762083064503';
    await pool.query(`SET search_path TO "${tenantId}"`);
    
    // Check bed table columns
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'beds'
      ORDER BY ordinal_position
    `);
    
    console.log(`\n📋 Bed table columns:`);
    columnsResult.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check actual bed data
    const bedsResult = await pool.query('SELECT * FROM beds LIMIT 3');
    console.log(`\n🛏️ Sample bed data:`);
    bedsResult.rows.forEach((bed, index) => {
      console.log(`   Bed ${index + 1}:`, JSON.stringify(bed, null, 2));
    });
    
    await pool.end();
    console.log('\n✅ Bed structure check complete');
  } catch (error) {
    console.error('❌ Error checking bed structure:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkBedStructure();