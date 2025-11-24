/**
 * Check Beds Table Schema
 * Shows the exact column types in the beds table
 */

require('dotenv').config();
const pool = require('./dist/database').default;

async function checkBedsTableSchema() {
  console.log('\n🔍 CHECKING BEDS TABLE SCHEMA\n');
  console.log('='.repeat(60));

  try {
    const tenantId = 'aajmin_polyclinic';
    
    console.log(`\nTenant: ${tenantId}\n`);

    // Get table schema
    const schemaResult = await pool.query(`
      SELECT 
        column_name,
        data_type,
        udt_name,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = $1
      AND table_name = 'beds'
      ORDER BY ordinal_position
    `, [tenantId]);

    console.log('Beds Table Columns:\n');
    schemaResult.rows.forEach(col => {
      console.log(`  ${col.column_name}:`);
      console.log(`    Type: ${col.data_type} (${col.udt_name})`);
      console.log(`    Nullable: ${col.is_nullable}`);
      if (col.column_default) {
        console.log(`    Default: ${col.column_default}`);
      }
      console.log('');
    });

    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkBedsTableSchema();
