/**
 * Check actual bed table columns after our fix
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkActualBedColumns() {
  console.log('🔍 Checking actual bed table structure...\n');

  try {
    // Set tenant context
    await pool.query('SET search_path TO "aajmin_polyclinic"');
    console.log('✅ Set tenant context to aajmin_polyclinic');

    // Check table structure
    console.log('\n1. Checking bed table columns...');
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'beds' 
      AND table_schema = 'aajmin_polyclinic'
      ORDER BY ordinal_position
    `);

    console.log(`📊 Bed table has ${columns.rows.length} columns:`);
    columns.rows.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
    });

    // Check a sample bed to see actual data
    console.log('\n2. Checking sample bed data...');
    const sampleBed = await pool.query(`
      SELECT * FROM beds LIMIT 1
    `);

    if (sampleBed.rows.length > 0) {
      console.log('📊 Sample bed data:');
      const bed = sampleBed.rows[0];
      Object.keys(bed).forEach(key => {
        console.log(`   ${key}: ${bed[key]}`);
      });
    }

    // Check if department_id and category_id exist and have values
    console.log('\n3. Checking department_id and category_id values...');
    const idCheck = await pool.query(`
      SELECT 
        bed_number,
        department_id,
        category_id,
        unit,
        bed_type,
        status
      FROM beds 
      WHERE category_id = 1 
      LIMIT 5
    `);

    console.log(`📊 General beds (category_id = 1):`);
    idCheck.rows.forEach(bed => {
      console.log(`   ${bed.bed_number}: Dept=${bed.department_id}, Cat=${bed.category_id}, Unit=${bed.unit || 'NULL'}`);
    });

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    await pool.end();
  }
}

checkActualBedColumns().catch(console.error);